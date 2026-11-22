import mongoose from 'mongoose';
import { connectDB } from '../db';
import { query } from '../db/postgres';

interface MongoSyncStatus {
  connected: boolean;
  host: string;
  database: string;
  collections: Record<string, number>;
  lastSyncedAt: string | null;
  error?: string;
}

let syncStatus: MongoSyncStatus = {
  connected: false,
  host: '',
  database: 'medlink_ai',
  collections: {},
  lastSyncedAt: null,
};

/**
 * Synchronizes a specific PostgreSQL table to a corresponding MongoDB collection.
 * Uses bulkWrite with upsert on `_id: row.id` or natural key so data is never duplicated.
 */
async function syncTable(tableName: string, mongoCollectionName: string, idField = 'id'): Promise<number> {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    return 0;
  }

  try {
    const pgRes = await query(`SELECT * FROM ${tableName}`);
    const rows = pgRes.rows || [];
    if (rows.length === 0) {
      return 0;
    }

    const collection = mongoose.connection.collection(mongoCollectionName);

    const operations: any[] = rows.map((row: any) => {
      const docId = String(row[idField] || row.id || row.order_number || row.batch_number);
      const doc = {
        ...row,
        _id: docId,
        _synced_at: new Date(),
        _source: 'postgres_mirror',
      };
      return {
        updateOne: {
          filter: { _id: docId },
          update: { $set: doc },
          upsert: true,
        },
      };
    });

    if (operations.length > 0) {
      await collection.bulkWrite(operations as any, { ordered: false });
    }

    const count = await collection.countDocuments();
    syncStatus.collections[mongoCollectionName] = count;
    return count;
  } catch (err: any) {
    console.warn(`[MongoSync] Error syncing table ${tableName}:`, err.message);
    return 0;
  }
}

/**
 * Full synchronization of all core healthcare & supply chain entities to MongoDB Atlas
 */
export async function syncAllTables(): Promise<MongoSyncStatus> {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    const conn = await connectDB();
    if (!conn) {
      syncStatus.connected = false;
      syncStatus.error = 'Could not connect to MongoDB Atlas';
      return syncStatus;
    }
  }

  syncStatus.connected = true;
  syncStatus.host = mongoose.connection.host || '';
  syncStatus.database = mongoose.connection.name || 'medlink_ai';

  console.log('🔄 [MongoSync] Mirroring PostgreSQL database to MongoDB Atlas (medlink_ai)...');

  try {
    await syncTable('medicines', 'medicines');
    await syncTable('medical_stores', 'medical_stores');
    await syncTable('distributors', 'distributors');
    await syncTable('batches', 'batches');
    await syncTable('store_inventories', 'store_inventories');
    await syncTable('distributor_inventories', 'distributor_inventories');
    await syncTable('supplier_orders', 'supplier_orders');
    await syncTable('medicine_indent_requests', 'medicine_indent_requests');
    await syncTable('retail_bills', 'retail_bills');

    syncStatus.lastSyncedAt = new Date().toISOString();
    console.log('✅ [MongoSync] PostgreSQL -> MongoDB Atlas sync completed successfully:', syncStatus.collections);
  } catch (err: any) {
    console.error('❌ [MongoSync] Sync failed:', err);
    syncStatus.error = err.message;
  }

  return syncStatus;
}

/**
 * Real-time event hook: sync single order to MongoDB
 */
export async function syncOrderToMongo(orderIdOrNumber: string): Promise<void> {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) return;
    const res = await query(`SELECT * FROM supplier_orders WHERE id = $1 OR order_number = $1`, [orderIdOrNumber]);
    if (res.rows.length > 0) {
      const ord = res.rows[0];
      const collection = mongoose.connection.collection('supplier_orders');
      await collection.updateOne(
        { _id: ord.id as any },
        { $set: { ...ord, _id: ord.id, _synced_at: new Date() } },
        { upsert: true }
      );
    }
  } catch (e: any) {
    console.warn('[MongoSync] Failed to mirror single order:', e.message);
  }
}

/**
 * Real-time event hook: sync single POS bill to MongoDB
 */
export async function syncBillToMongo(billIdOrNumber: string): Promise<void> {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) return;
    const res = await query(`SELECT * FROM retail_bills WHERE id = $1 OR bill_number = $1`, [billIdOrNumber]);
    if (res.rows.length > 0) {
      const bill = res.rows[0];
      const collection = mongoose.connection.collection('retail_bills');
      await collection.updateOne(
        { _id: bill.id as any },
        { $set: { ...bill, _id: bill.id, _synced_at: new Date() } },
        { upsert: true }
      );
    }
  } catch (e: any) {
    console.warn('[MongoSync] Failed to mirror single bill:', e.message);
  }
}

/**
 * Real-time event hook: sync single chemist indent to MongoDB
 */
export async function syncIndentToMongo(indentId: string): Promise<void> {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) return;
    const res = await query(`SELECT * FROM medicine_indent_requests WHERE id = $1`, [indentId]);
    if (res.rows.length > 0) {
      const indent = res.rows[0];
      const collection = mongoose.connection.collection('medicine_indent_requests');
      await collection.updateOne(
        { _id: indent.id as any },
        { $set: { ...indent, _id: indent.id, _synced_at: new Date() } },
        { upsert: true }
      );
    }
  } catch (e: any) {
    console.warn('[MongoSync] Failed to mirror single indent:', e.message);
  }
}

/**
 * Returns current MongoDB sync telemetry status
 */
export function getMongoSyncStatus(): MongoSyncStatus {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    syncStatus.connected = true;
    syncStatus.host = mongoose.connection.host || '';
    syncStatus.database = mongoose.connection.name || 'medlink_ai';
  } else {
    syncStatus.connected = false;
  }
  return syncStatus;
}

/**
 * Initialize MongoDB connection and launch background sync
 */
export async function initMongoSync(): Promise<void> {
  try {
    const conn = await connectDB();
    if (conn) {
      syncStatus.connected = true;
      syncStatus.host = conn.connection.host;
      syncStatus.database = conn.connection.name;
      // Perform initial sync
      await syncAllTables();
    }
  } catch (e: any) {
    console.warn('[MongoSync] MongoDB init error:', e.message);
  }
}
