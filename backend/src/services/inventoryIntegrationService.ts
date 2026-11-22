import { query, transaction, TransactionClient } from '../db/postgres';
import { cache } from '../db/redis';
import { parse } from 'csv-parse/sync';

export interface IngestStockItem {
  medicineId?: string;
  brandName?: string;
  genericName?: string;
  barcode?: string;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate: string;
  onHandQuantity: number;
  unitCost: number;
  sellingPrice: number;
  mrp: number;
  minThreshold?: number;
  notes?: string;
}

export interface IngestionResult {
  success: boolean;
  inventoryId?: string;
  batchId?: string;
  error?: string;
  actionTaken?: 'INSERTED' | 'UPDATED';
}

export interface CsvPreviewReport {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  previewItems: Array<{
    rowNumber: number;
    medicineName: string;
    batchNumber: string;
    quantity: number;
    sellingPrice: number;
    mrp: number;
    expiryDate: string;
    matchedMedicineId: string | null;
    status: 'VALID' | 'INVALID' | 'DUPLICATE';
    error?: string;
  }>;
}

export class InventoryIntegrationService {
  /**
   * COMMON INVENTORY PROCESSING PIPELINE
   * Used by Manual Entry, CSV Import, and API Synchronization.
   * Never allows raw unvalidated database writes.
   */
  static async processStockEvent(
    distributorId: string,
    item: IngestStockItem,
    syncType: 'MANUAL' | 'CSV_IMPORT' | 'API_SNAPSHOT' | 'API_INCREMENTAL',
    referenceId?: string
  ): Promise<IngestionResult> {
    // 1. Validation
    if (!item.batchNumber || item.batchNumber.trim() === '') {
      return { success: false, error: 'Batch number is mandatory.' };
    }
    if (!item.expiryDate) {
      return { success: false, error: 'Expiry date is mandatory.' };
    }
    const expiry = new Date(item.expiryDate);
    if (isNaN(expiry.getTime()) || expiry < new Date()) {
      return { success: false, error: `Invalid or expired date (${item.expiryDate}). Expired pharmaceuticals cannot be ingested.` };
    }
    if (item.onHandQuantity < 0) {
      return { success: false, error: 'Quantity cannot be negative.' };
    }
    if (item.unitCost < 0 || item.sellingPrice < 0 || item.mrp < 0) {
      return { success: false, error: 'Prices cannot be negative.' };
    }
    if (item.sellingPrice > item.mrp) {
      return { success: false, error: `Selling price (₹${item.sellingPrice}) cannot exceed statutory MRP (₹${item.mrp}).` };
    }

    // 2. Product Identity Matching
    let matchedMedId = item.medicineId;
    if (!matchedMedId) {
      if (item.barcode) {
        const idRes = await query(
          `SELECT medicine_id FROM medicine_identifiers WHERE code_value = $1;`,
          [item.barcode.trim()]
        );
        if (idRes.rows.length > 0) {
          matchedMedId = idRes.rows[0].medicine_id;
        }
      }

      if (!matchedMedId && item.brandName) {
        const medRes = await query(
          `SELECT id FROM medicines WHERE LOWER(brand_name) = LOWER($1);`,
          [item.brandName.trim()]
        );
        if (medRes.rows.length > 0) {
          matchedMedId = medRes.rows[0].id;
        }
      }
    }

    if (!matchedMedId) {
      return {
        success: false,
        error: `Medicine "${item.brandName || item.barcode || 'Unknown'}" could not be mapped to master catalogue. Only verified catalogue products are eligible.`,
      };
    }

    // 3. Concurrency Protection & Transactional Ingestion
    const lockKey = `inv:${distributorId}:${matchedMedId}`;
    await cache.acquireLock(lockKey, 10);

    try {
      return await transaction(async (tx: TransactionClient) => {
        let actionTaken: 'INSERTED' | 'UPDATED' = 'INSERTED';

        // Check if distributor_inventory exists
        const invRes = await tx.query(
          `SELECT id, on_hand_quantity, reserved_quantity, available_quantity
           FROM distributor_inventories
           WHERE distributor_id = $1 AND medicine_id = $2
           FOR UPDATE;`,
          [distributorId, matchedMedId]
        );

        let invId: string;
        let prevInvOnHand = 0;

        if (invRes.rows.length === 0) {
          invId = `inv-${distributorId.substring(0, 5)}-${matchedMedId}`;
          const initialAvail = item.onHandQuantity;
          await tx.query(
            `INSERT INTO distributor_inventories (id, distributor_id, medicine_id, on_hand_quantity, reserved_quantity, available_quantity, unit_cost, selling_price, mrp, min_threshold, is_low_stock)
             VALUES ($1, $2, $3, $4, 0, $5, $6, $7, $8, $9, $10);`,
            [
              invId,
              distributorId,
              matchedMedId,
              item.onHandQuantity,
              initialAvail,
              item.unitCost,
              item.sellingPrice,
              item.mrp,
              item.minThreshold || 40,
              initialAvail <= (item.minThreshold || 40),
            ]
          );
        } else {
          invId = invRes.rows[0].id;
          prevInvOnHand = parseInt(invRes.rows[0].on_hand_quantity, 10);
          actionTaken = 'UPDATED';
        }

        // Upsert Batch
        const batchRes = await tx.query(
          `SELECT id, on_hand_quantity, reserved_quantity, available_quantity
           FROM batches
           WHERE distributor_id = $1 AND medicine_id = $2 AND batch_number = $3
           FOR UPDATE;`,
          [distributorId, matchedMedId, item.batchNumber]
        );

        let batchId: string;
        let qtyDiff = item.onHandQuantity;

        if (batchRes.rows.length === 0) {
          batchId = `bth-${distributorId.substring(0, 4)}-${item.batchNumber}`;
          await tx.query(
            `INSERT INTO batches (id, inventory_id, distributor_id, medicine_id, batch_number, manufacturing_date, expiry_date, on_hand_quantity, reserved_quantity, available_quantity, mrp, unit_cost, selling_price)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, $11, $12);`,
            [
              batchId,
              invId,
              distributorId,
              matchedMedId,
              item.batchNumber,
              item.manufacturingDate || new Date().toISOString().split('T')[0],
              item.expiryDate,
              item.onHandQuantity,
              item.onHandQuantity,
              item.mrp,
              item.unitCost,
              item.sellingPrice,
            ]
          );
        } else {
          batchId = batchRes.rows[0].id;
          const oldBatchOnHand = parseInt(batchRes.rows[0].on_hand_quantity, 10);
          const oldBatchReserved = parseInt(batchRes.rows[0].reserved_quantity, 10);

          if (syncType === 'API_INCREMENTAL') {
            qtyDiff = item.onHandQuantity; // incremental delta
          } else {
            qtyDiff = item.onHandQuantity - oldBatchOnHand; // full snapshot absolute difference
          }

          const newBatchOnHand = Math.max(0, oldBatchOnHand + qtyDiff);
          const newBatchAvail = Math.max(0, newBatchOnHand - oldBatchReserved);

          await tx.query(
            `UPDATE batches
             SET on_hand_quantity = $1,
                 available_quantity = $2,
                 mrp = $3,
                 unit_cost = $4,
                 selling_price = $5,
                 updated_at = NOW()
             WHERE id = $6;`,
            [newBatchOnHand, newBatchAvail, item.mrp, item.unitCost, item.sellingPrice, batchId]
          );
        }

        // Recompute parent inventory totals from all its active batches
        const allBatches = await tx.query(
          `SELECT COALESCE(SUM(on_hand_quantity), 0) as total_on_hand,
                  COALESCE(SUM(reserved_quantity), 0) as total_reserved,
                  COALESCE(SUM(available_quantity), 0) as total_available
           FROM batches
           WHERE inventory_id = $1;`,
          [invId]
        );

        const totalOnHand = parseInt(allBatches.rows[0].total_on_hand, 10);
        const totalReserved = parseInt(allBatches.rows[0].total_reserved, 10);
        const totalAvail = parseInt(allBatches.rows[0].total_available, 10);

        await tx.query(
          `UPDATE distributor_inventories
           SET on_hand_quantity = $1,
               reserved_quantity = $2,
               available_quantity = $3,
               selling_price = $4,
               unit_cost = $5,
               mrp = $6,
               is_low_stock = ($3 <= min_threshold),
               last_restocked_at = NOW(),
               updated_at = NOW()
           WHERE id = $7;`,
          [totalOnHand, totalReserved, totalAvail, item.sellingPrice, item.unitCost, item.mrp, invId]
        );

        // Record stock movement
        await tx.query(
          `INSERT INTO stock_movements (id, distributor_id, inventory_id, batch_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes, created_by)
           VALUES ($1, $2, $3, $4, 'INWARD_PURCHASE', $5, $6, $7, $8, $9, $10, 'SYSTEM');`,
          [
            `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            distributorId,
            invId,
            batchId,
            qtyDiff,
            prevInvOnHand,
            totalOnHand,
            syncType,
            referenceId || 'N/A',
            item.notes || `Stock inwarding via ${syncType}`,
          ]
        );

        return {
          success: true,
          inventoryId: invId,
          batchId,
          actionTaken,
        };
      });
    } finally {
      await cache.releaseLock(lockKey);
    }
  }

  /**
   * METHOD B: Parse & Validate CSV/Excel Buffer
   */
  static parseCsv(csvBuffer: Buffer): any[] {
    const records = parse(csvBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    return records;
  }

  static async previewCsvImport(distributorId: string, rawRows: any[]): Promise<CsvPreviewReport> {
    const previewItems: CsvPreviewReport['previewItems'] = [];
    const seenBatches = new Set<string>();
    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 1;
      const brandName = row['brand_name'] || row['Brand Name'] || row['Medicine Name'] || '';
      const batchNumber = row['batch_number'] || row['Batch Number'] || row['Batch'] || '';
      const qty = parseInt(row['quantity'] || row['Quantity'] || row['Stock'] || '0', 10);
      const cost = parseFloat(row['unit_cost'] || row['Cost'] || '0');
      const selling = parseFloat(row['selling_price'] || row['Price'] || '0');
      const mrp = parseFloat(row['mrp'] || row['MRP'] || '0');
      const expiry = row['expiry_date'] || row['Expiry Date'] || row['Exp'] || '';

      // Check Duplicates in file
      const batchKey = `${brandName.toLowerCase()}::${batchNumber.toLowerCase()}`;
      if (seenBatches.has(batchKey)) {
        duplicateCount++;
        previewItems.push({
          rowNumber: rowNum,
          medicineName: brandName,
          batchNumber,
          quantity: qty,
          sellingPrice: selling,
          mrp,
          expiryDate: expiry,
          matchedMedicineId: null,
          status: 'DUPLICATE',
          error: 'Duplicate batch entry detected within import file.',
        });
        continue;
      }
      seenBatches.add(batchKey);

      // Match master catalogue
      const medRes = await query(
        `SELECT id FROM medicines WHERE LOWER(brand_name) = LOWER($1);`,
        [brandName.trim()]
      );

      if (medRes.rows.length === 0) {
        invalidCount++;
        previewItems.push({
          rowNumber: rowNum,
          medicineName: brandName,
          batchNumber,
          quantity: qty,
          sellingPrice: selling,
          mrp,
          expiryDate: expiry,
          matchedMedicineId: null,
          status: 'INVALID',
          error: `Medicine "${brandName}" not found in verified master catalogue.`,
        });
        continue;
      }

      const expDate = new Date(expiry);
      if (!expiry || isNaN(expDate.getTime()) || expDate < new Date()) {
        invalidCount++;
        previewItems.push({
          rowNumber: rowNum,
          medicineName: brandName,
          batchNumber,
          quantity: qty,
          sellingPrice: selling,
          mrp,
          expiryDate: expiry,
          matchedMedicineId: medRes.rows[0].id,
          status: 'INVALID',
          error: `Expiry date "${expiry}" is invalid or expired.`,
        });
        continue;
      }

      if (selling > mrp) {
        invalidCount++;
        previewItems.push({
          rowNumber: rowNum,
          medicineName: brandName,
          batchNumber,
          quantity: qty,
          sellingPrice: selling,
          mrp,
          expiryDate: expiry,
          matchedMedicineId: medRes.rows[0].id,
          status: 'INVALID',
          error: `Selling price (₹${selling}) exceeds MRP (₹${mrp}).`,
        });
        continue;
      }

      validCount++;
      previewItems.push({
        rowNumber: rowNum,
        medicineName: brandName,
        batchNumber,
        quantity: qty,
        sellingPrice: selling,
        mrp,
        expiryDate: expiry,
        matchedMedicineId: medRes.rows[0].id,
        status: 'VALID',
      });
    }

    return {
      totalRows: rawRows.length,
      validCount,
      invalidCount,
      duplicateCount,
      previewItems,
    };
  }

  /**
   * Commit verified CSV rows into inventory through the common ingestion pipeline.
   */
  static async commitCsvImport(distributorId: string, validItems: IngestStockItem[], importId: string): Promise<any> {
    let successCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    for (const item of validItems) {
      const res = await this.processStockEvent(distributorId, item, 'CSV_IMPORT', importId);
      if (res.success) {
        successCount++;
      } else {
        failedCount++;
        errors.push({ batch: item.batchNumber, error: res.error });
      }
    }

    await query(
      `INSERT INTO inventory_sync_logs (id, distributor_id, sync_type, idempotency_key, records_processed, records_inserted, records_failed, error_details, status)
       VALUES ($1, $2, 'CSV_IMPORT', $3, $4, $5, $6, $7, $8);`,
      [
        importId,
        distributorId,
        importId,
        validItems.length,
        successCount,
        failedCount,
        JSON.stringify(errors),
        failedCount === 0 ? 'SUCCESS' : failedCount < validItems.length ? 'PARTIAL_FAILURE' : 'FAILED',
      ]
    );

    return {
      importId,
      totalProcessed: validItems.length,
      successCount,
      failedCount,
      errors,
    };
  }

  /**
   * METHOD C: External Distributor API Synchronization with Idempotency
   */
  static async processApiSync(
    distributorId: string,
    items: IngestStockItem[],
    syncType: 'API_SNAPSHOT' | 'API_INCREMENTAL',
    idempotencyKey: string
  ): Promise<any> {
    // 1. Check Idempotency via Redis & Database
    const existingSync = await query(
      `SELECT id, status, records_processed FROM inventory_sync_logs WHERE idempotency_key = $1;`,
      [idempotencyKey]
    );

    if (existingSync.rows.length > 0) {
      return {
        isIdempotentReplay: true,
        message: 'Sync payload with this Idempotency-Key was already processed.',
        syncId: existingSync.rows[0].id,
        status: existingSync.rows[0].status,
        recordsProcessed: existingSync.rows[0].records_processed,
      };
    }

    const syncId = `sync-${Date.now()}`;
    let inserted = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const item of items) {
      const res = await this.processStockEvent(distributorId, item, syncType, syncId);
      if (res.success) {
        inserted++;
      } else {
        failed++;
        errors.push({ item, error: res.error });
      }
    }

    await query(
      `INSERT INTO inventory_sync_logs (id, distributor_id, sync_type, idempotency_key, records_processed, records_inserted, records_failed, error_details, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
      [
        syncId,
        distributorId,
        syncType,
        idempotencyKey,
        items.length,
        inserted,
        failed,
        JSON.stringify(errors),
        failed === 0 ? 'SUCCESS' : failed < items.length ? 'PARTIAL_FAILURE' : 'FAILED',
      ]
    );

    return {
      syncId,
      syncType,
      recordsProcessed: items.length,
      recordsUpdated: inserted,
      recordsFailed: failed,
      errors,
    };
  }

  /**
   * Reconciliation: Compare external snapshot vs central inventory
   */
  static async reconcileInventory(distributorId: string, externalSnapshot: IngestStockItem[]): Promise<any> {
    const currentBatches = await query(
      `SELECT b.id, b.batch_number, m.brand_name, b.on_hand_quantity, b.available_quantity
       FROM batches b
       JOIN medicines m ON b.medicine_id = m.id
       WHERE b.distributor_id = $1;`,
      [distributorId]
    );

    const externalMap = new Map<string, IngestStockItem>();
    for (const ext of externalSnapshot) {
      externalMap.set(ext.batchNumber.toLowerCase(), ext);
    }

    const discrepancies: any[] = [];

    for (const b of currentBatches.rows) {
      const ext = externalMap.get(b.batch_number.toLowerCase());
      if (!ext) {
        discrepancies.push({
          batchNumber: b.batch_number,
          brandName: b.brand_name,
          issue: 'BATCH_MISSING_IN_EXTERNAL_FEED',
          centralOnHand: b.on_hand_quantity,
          externalOnHand: 0,
        });
      } else if (ext.onHandQuantity !== parseInt(b.on_hand_quantity, 10)) {
        discrepancies.push({
          batchNumber: b.batch_number,
          brandName: b.brand_name,
          issue: 'STOCK_QUANTITY_MISMATCH',
          centralOnHand: b.on_hand_quantity,
          externalOnHand: ext.onHandQuantity,
          delta: ext.onHandQuantity - parseInt(b.on_hand_quantity, 10),
        });
      }
    }

    return {
      distributorId,
      totalCentralBatches: currentBatches.rows.length,
      totalExternalBatches: externalSnapshot.length,
      discrepancyCount: discrepancies.length,
      discrepancies,
    };
  }
}

