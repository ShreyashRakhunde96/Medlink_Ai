import { query, transaction, TransactionClient } from '../db/postgres';
import { cache } from '../db/redis';

export interface ReservationResult {
  success: boolean;
  reservationId?: string;
  error?: string;
  availableRemaining?: number;
}

export class ReservationService {
  /**
   * Concurrently-safe stock reservation using distributed locks, row-level locks, and atomic transactions.
   * Enforces: Available = OnHand - Reserved. Does NOT deduct physical on-hand stock.
   */
  static async reserveStock(
    supplierOrderId: string,
    distributorId: string,
    medicineId: string,
    batchId: string | null,
    quantity: number,
    ttlMinutes: number = 60
  ): Promise<ReservationResult> {
    if (quantity <= 0) {
      return { success: false, error: 'Requested quantity must be greater than zero.' };
    }

    const lockKey = `inv:${distributorId}:${medicineId}`;
    const acquired = await cache.acquireLock(lockKey, 10);
    if (!acquired) {
      return { success: false, error: 'Concurrent inventory operation in progress. Please retry.' };
    }

    try {
      return await transaction(async (tx: TransactionClient) => {
        // 1. Lock distributor inventory row
        const invRes = await tx.query(
          `SELECT id, on_hand_quantity, reserved_quantity, available_quantity
           FROM distributor_inventories
           WHERE distributor_id = $1 AND medicine_id = $2
           FOR UPDATE;`,
          [distributorId, medicineId]
        );

        if (invRes.rows.length === 0) {
          return { success: false, error: 'Product not found in distributor inventory.' };
        }

        const inv = invRes.rows[0];
        const onHand = parseInt(inv.on_hand_quantity, 10);
        const currentReserved = parseInt(inv.reserved_quantity, 10);
        const available = onHand - currentReserved;

        if (available < quantity) {
          return {
            success: false,
            error: `Insufficient available stock: requested ${quantity}, available ${available} (On-Hand: ${onHand}, Reserved: ${currentReserved}).`,
            availableRemaining: available,
          };
        }

        // 2. Multi-Batch FEFO Allocation & Reservation
        let remainingToReserve = quantity;
        const expiresAt = new Date(Date.now() + ttlMinutes * 60000).toISOString();
        let primaryReservationId = `res-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        if (batchId) {
          const batchRes = await tx.query(
            `SELECT id, on_hand_quantity, reserved_quantity, available_quantity
             FROM batches
             WHERE id = $1
             FOR UPDATE;`,
            [batchId]
          );

          if (batchRes.rows.length === 0) {
            return { success: false, error: 'Specified batch not found.' };
          }
          const b = batchRes.rows[0];
          const bAvail = parseInt(b.on_hand_quantity, 10) - parseInt(b.reserved_quantity, 10);
          if (bAvail < quantity) {
            return { success: false, error: `Batch stock exhausted. Available in batch: ${bAvail}.` };
          }

          await tx.query(
            `UPDATE batches
             SET reserved_quantity = reserved_quantity + $1,
                 available_quantity = on_hand_quantity - (reserved_quantity + $1),
                 updated_at = NOW()
             WHERE id = $2;`,
            [quantity, batchId]
          );

          await tx.query(
            `INSERT INTO stock_reservations (id, supplier_order_id, inventory_id, batch_id, reserved_quantity, status, expires_at)
             VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6);`,
            [primaryReservationId, supplierOrderId, inv.id, batchId, quantity, expiresAt]
          );
        } else {
          // FEFO multi-batch allocation
          const batchesRes = await tx.query(
            `SELECT id, batch_number, on_hand_quantity, reserved_quantity, available_quantity
             FROM batches
             WHERE distributor_id = $1 AND medicine_id = $2 AND available_quantity > 0
             ORDER BY expiry_date ASC
             FOR UPDATE;`,
            [distributorId, medicineId]
          );

          if (batchesRes.rows.length === 0) {
            return { success: false, error: 'No active batches available for this medicine.' };
          }

          for (const b of batchesRes.rows) {
            if (remainingToReserve <= 0) break;
            const bAvail = parseInt(b.available_quantity, 10);
            const qtyFromBatch = Math.min(remainingToReserve, bAvail);

            await tx.query(
              `UPDATE batches
               SET reserved_quantity = reserved_quantity + $1,
                   available_quantity = on_hand_quantity - (reserved_quantity + $1),
                   updated_at = NOW()
               WHERE id = $2;`,
              [qtyFromBatch, b.id]
            );

            const resId = `res-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            await tx.query(
              `INSERT INTO stock_reservations (id, supplier_order_id, inventory_id, batch_id, reserved_quantity, status, expires_at)
               VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6);`,
              [resId, supplierOrderId, inv.id, b.id, qtyFromBatch, expiresAt]
            );

            remainingToReserve -= qtyFromBatch;
          }
        }

        // 3. Atomically update inventory reservations
        const newReserved = currentReserved + quantity;
        const newAvailable = onHand - newReserved;

        await tx.query(
          `UPDATE distributor_inventories
           SET reserved_quantity = $1,
               available_quantity = $2,
               updated_at = NOW()
           WHERE id = $3;`,
          [newReserved, newAvailable, inv.id]
        );

        // 4. Record immutable stock movement
        await tx.query(
          `INSERT INTO stock_movements (id, distributor_id, inventory_id, batch_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes, created_by)
           VALUES ($1, $2, $3, $4, 'RESERVATION_HOLD', $5, $6, $7, 'SUPPLIER_ORDER', $8, $9, 'SYSTEM');`,
          [
            `mov-${Date.now()}`,
            distributorId,
            inv.id,
            batchId || null,
            quantity,
            available,
            newAvailable,
            supplierOrderId,
            `Reserved ${quantity} units for order ${supplierOrderId}. Expires at ${expiresAt}`,
          ]
        );

        return {
          success: true,
          reservationId: primaryReservationId,
          availableRemaining: newAvailable,
        };
      });
    } finally {
      await cache.releaseLock(lockKey);
    }
  }

  /**
   * Commit reservation on dispatch:
   * Deducts physical on-hand stock and releases the reservation.
   */
  static async commitReservationOnDispatch(supplierOrderId: string): Promise<{ success: boolean; error?: string }> {
    return await transaction(async (tx: TransactionClient) => {
      const res = await tx.query(
        `SELECT id, inventory_id, batch_id, reserved_quantity
         FROM stock_reservations
         WHERE supplier_order_id = $1 AND status = 'ACTIVE'
         FOR UPDATE;`,
        [supplierOrderId]
      );

      if (res.rows.length === 0) {
        return { success: false, error: 'No active reservation found for this order.' };
      }

      for (const row of res.rows) {
        const qty = parseInt(row.reserved_quantity, 10);

        // 1. Update distributor inventory (deduct on_hand and release reservation)
        const invRes = await tx.query(
          `SELECT id, distributor_id, on_hand_quantity, reserved_quantity
           FROM distributor_inventories
           WHERE id = $1
           FOR UPDATE;`,
          [row.inventory_id]
        );

        if (invRes.rows.length > 0) {
          const inv = invRes.rows[0];
          const prevOnHand = parseInt(inv.on_hand_quantity, 10);
          const newOnHand = Math.max(0, prevOnHand - qty);
          const newReserved = Math.max(0, parseInt(inv.reserved_quantity, 10) - qty);
          const newAvail = newOnHand - newReserved;

          await tx.query(
            `UPDATE distributor_inventories
             SET on_hand_quantity = $1,
                 reserved_quantity = $2,
                 available_quantity = $3,
                 updated_at = NOW()
             WHERE id = $4;`,
            [newOnHand, newReserved, newAvail, inv.id]
          );

          // 2. Update batch
          if (row.batch_id) {
            await tx.query(
              `UPDATE batches
               SET on_hand_quantity = GREATEST(0, on_hand_quantity - $1),
                   reserved_quantity = GREATEST(0, reserved_quantity - $1),
                   available_quantity = GREATEST(0, on_hand_quantity - $1 - (reserved_quantity - $1)),
                   updated_at = NOW()
               WHERE id = $2;`,
              [qty, row.batch_id]
            );
          }

          // 3. Mark reservation committed
          await tx.query(
            `UPDATE stock_reservations
             SET status = 'COMMITTED'
             WHERE id = $1;`,
            [row.id]
          );

          // 4. Log movement
          await tx.query(
            `INSERT INTO stock_movements (id, distributor_id, inventory_id, batch_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes, created_by)
             VALUES ($1, $2, $3, $4, 'ORDER_DISPATCH', $5, $6, $7, 'SUPPLIER_ORDER', $8, $9, 'SYSTEM');`,
            [
              `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              inv.distributor_id,
              inv.id,
              row.batch_id,
              qty,
              prevOnHand,
              newOnHand,
              supplierOrderId,
              `Physical stock deducted upon order dispatch (${qty} units).`,
            ]
          );
        }
      }

      return { success: true };
    });
  }

  /**
   * Release reservations on cancellation, rejection, or expiration.
   * Restores available quantity without touching on-hand quantity.
   */
  static async releaseReservation(supplierOrderId: string, reason: string): Promise<{ success: boolean; releasedCount: number }> {
    return await transaction(async (tx: TransactionClient) => {
      const res = await tx.query(
        `SELECT id, inventory_id, batch_id, reserved_quantity
         FROM stock_reservations
         WHERE supplier_order_id = $1 AND status = 'ACTIVE'
         FOR UPDATE;`,
        [supplierOrderId]
      );

      if (res.rows.length === 0) {
        return { success: true, releasedCount: 0 };
      }

      for (const row of res.rows) {
        const qty = parseInt(row.reserved_quantity, 10);

        const invRes = await tx.query(
          `SELECT id, distributor_id, on_hand_quantity, reserved_quantity
           FROM distributor_inventories
           WHERE id = $1
           FOR UPDATE;`,
          [row.inventory_id]
        );

        if (invRes.rows.length > 0) {
          const inv = invRes.rows[0];
          const onHand = parseInt(inv.on_hand_quantity, 10);
          const newReserved = Math.max(0, parseInt(inv.reserved_quantity, 10) - qty);
          const newAvail = onHand - newReserved;

          await tx.query(
            `UPDATE distributor_inventories
             SET reserved_quantity = $1,
                 available_quantity = $2,
                 updated_at = NOW()
             WHERE id = $3;`,
            [newReserved, newAvail, inv.id]
          );

          if (row.batch_id) {
            await tx.query(
              `UPDATE batches
               SET reserved_quantity = GREATEST(0, reserved_quantity - $1),
                   available_quantity = on_hand_quantity - GREATEST(0, reserved_quantity - $1),
                   updated_at = NOW()
               WHERE id = $2;`,
              [qty, row.batch_id]
            );
          }

          await tx.query(
            `UPDATE stock_reservations
             SET status = 'RELEASED',
                 released_at = NOW()
             WHERE id = $1;`,
            [row.id]
          );

          await tx.query(
            `INSERT INTO stock_movements (id, distributor_id, inventory_id, batch_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes, created_by)
             VALUES ($1, $2, $3, $4, 'RESERVATION_RELEASE', $5, $6, $7, 'SUPPLIER_ORDER', $8, $9, 'SYSTEM');`,
            [
              `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              inv.distributor_id,
              inv.id,
              row.batch_id,
              qty,
              onHand - parseInt(inv.reserved_quantity, 10),
              newAvail,
              supplierOrderId,
              `Reservation released: ${reason}`,
            ]
          );
        }
      }

      return { success: true, releasedCount: res.rows.length };
    });
  }

  /**
   * Sweeps expired reservations and restores inventory availability.
   */
  static async releaseExpiredReservations(): Promise<number> {
    const expiredRes = await query(
      `SELECT DISTINCT supplier_order_id
       FROM stock_reservations
       WHERE status = 'ACTIVE' AND expires_at < NOW();`
    );

    let totalReleased = 0;
    for (const row of expiredRes.rows) {
      const rel = await this.releaseReservation(row.supplier_order_id, 'Reservation expired before order confirmation');
      if (rel.success) totalReleased += rel.releasedCount;
    }
    return totalReleased;
  }
}
