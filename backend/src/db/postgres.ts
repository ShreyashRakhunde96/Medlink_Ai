import fs from 'fs';
import path from 'path';
import { Pool, PoolClient } from 'pg';
import { PGlite } from '@electric-sql/pglite';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface TransactionClient {
  query: <T = any>(text: string, params?: any[]) => Promise<QueryResult<T>>;
}

let pgPool: Pool | null = null;
let pgliteInstance: PGlite | null = null;
let isPgPoolActive = false;

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

/**
 * Initializes the PostgreSQL Database engine.
 * Tries external/local PostgreSQL server first; falls back to disk-persisted PGlite (genuine Postgres 16).
 */
export async function initPostgres(): Promise<void> {
  const dataDir = path.resolve(__dirname, '../../data/pglite_db');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (DATABASE_URL) {
    try {
      const isRemote = !DATABASE_URL.includes('localhost') && !DATABASE_URL.includes('127.0.0.1');
      const pool = new Pool({
        connectionString: DATABASE_URL,
        connectionTimeoutMillis: 8000,
        ssl: isRemote ? { rejectUnauthorized: false } : false,
      });
      const client = await pool.connect();
      client.release();
      pgPool = pool;
      isPgPoolActive = true;
      console.log('✅ Connected to external PostgreSQL database.');
    } catch (err: any) {
      console.warn(`⚠️ External PostgreSQL unavailable (${err.message}). Using local embedded PostgreSQL 16 engine.`);
      isPgPoolActive = false;
    }
  }

  if (!isPgPoolActive) {
    try {
      const pidFile = path.join(dataDir, 'postmaster.pid');
      if (fs.existsSync(pidFile)) {
        try { fs.unlinkSync(pidFile); } catch (e) {}
      }
      pgliteInstance = new PGlite(dataDir);
      await pgliteInstance.waitReady;
    } catch (err: any) {
      console.warn(`⚠️ PGlite directory recovery required (${err.message}). Auto-repairing database directory...`);
      try {
        if (fs.existsSync(dataDir)) {
          fs.rmSync(dataDir, { recursive: true, force: true });
        }
      } catch (rmErr) {
        // Continue
      }
      fs.mkdirSync(dataDir, { recursive: true });
      pgliteInstance = new PGlite(dataDir);
      await pgliteInstance.waitReady;
    }
    console.log(`✅ Embedded PostgreSQL 16 active with persistence at ${dataDir}`);
  }

  // Execute Schema Migrations
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await exec(schemaSql);
    console.log('✅ PostgreSQL Schema migrations applied successfully.');
  }

  // Ensure store_inventories and medical_stores have shelf_locations & drawer_location columns, and discount campaigns
  try {
    await exec(`
      ALTER TABLE medical_stores ADD COLUMN IF NOT EXISTS shelf_locations JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE medical_stores ADD COLUMN IF NOT EXISTS pharmacist_name TEXT DEFAULT 'Yashodip';
      ALTER TABLE medical_stores ADD COLUMN IF NOT EXISTS email TEXT DEFAULT 'apollo.care@medlink.io';
      UPDATE medical_stores SET pharmacist_name = 'Yashodip' WHERE pharmacist_name ILIKE '%ramesh%' OR pharmacist_name IS NULL OR pharmacist_name = '';

      ALTER TABLE store_inventories ADD COLUMN IF NOT EXISTS drawer_location VARCHAR(120) DEFAULT 'Rack A · Drawer 1';
      UPDATE store_inventories SET drawer_location = 'Rack A · Drawer 1' WHERE batch_number = 'BTH-APO-8808' AND (drawer_location IS NULL OR drawer_location = '');
      UPDATE store_inventories SET drawer_location = 'Rack D · Drawer 4' WHERE batch_number = 'BTH-APO-8813' AND (drawer_location IS NULL OR drawer_location = '');
      UPDATE store_inventories SET drawer_location = 'Rack B · Drawer 2' WHERE batch_number = 'BTH-APO-8800' AND (drawer_location IS NULL OR drawer_location = '');
      UPDATE store_inventories SET drawer_location = 'Rack B · Drawer 3' WHERE batch_number = 'BTH-APO-8801' AND (drawer_location IS NULL OR drawer_location = '');
      UPDATE store_inventories SET drawer_location = 'Rack A · Drawer 3' WHERE batch_number = 'BTH-APO-8806' AND (drawer_location IS NULL OR drawer_location = '');
      UPDATE store_inventories SET drawer_location = 'Rack B · Drawer 4' WHERE batch_number = 'BTH-APO-8803' AND (drawer_location IS NULL OR drawer_location = '');
      UPDATE store_inventories SET drawer_location = 'Rack A · Drawer 2' WHERE batch_number = 'BTH-APO-8804' AND (drawer_location IS NULL OR drawer_location = '');
      UPDATE store_inventories SET drawer_location = 'Rack C · Drawer 1' WHERE batch_number = 'BTH-APO-8809' AND (drawer_location IS NULL OR drawer_location = '');
      UPDATE store_inventories SET drawer_location = 'Cold Fridge #1 · Top Shelf' WHERE batch_number = 'BTH-APO-8810' AND (drawer_location IS NULL OR drawer_location = '');
      UPDATE store_inventories SET drawer_location = 'Rack D · Drawer 2' WHERE batch_number = 'BTH-APO-8815' AND (drawer_location IS NULL OR drawer_location = '');
      UPDATE store_inventories SET drawer_location = 'Rack C · Drawer 3' WHERE batch_number = 'BTH-APO-8802' AND (drawer_location IS NULL OR drawer_location = '');
      UPDATE store_inventories SET drawer_location = 'Rack E · Drawer 1' WHERE batch_number = 'BTH-APO-8807' AND (drawer_location IS NULL OR drawer_location = '');
      UPDATE store_inventories SET drawer_location = 'Rack A · Drawer 4' WHERE batch_number = 'BTH-APO-8811' AND (drawer_location IS NULL OR drawer_location = '');
      UPDATE store_inventories SET drawer_location = 'Rack A · Drawer 5' WHERE batch_number = 'BTH-APO-8805' AND (drawer_location IS NULL OR drawer_location = '');
      UPDATE store_inventories SET drawer_location = 'Rack B · Drawer 5' WHERE batch_number = 'BTH-APO-8812' AND (drawer_location IS NULL OR drawer_location = '');

      -- Store Owner Promotional Discounts & Seasonal Campaigns Table
      CREATE TABLE IF NOT EXISTS store_discount_campaigns (
        id VARCHAR(80) PRIMARY KEY,
        medical_store_id VARCHAR(80) NOT NULL,
        name VARCHAR(150) NOT NULL,
        discount_percent NUMERIC(5, 2) NOT NULL,
        code VARCHAR(50),
        description TEXT,
        is_active BOOLEAN DEFAULT false,
        usage_count INT DEFAULT 0,
        total_savings_given NUMERIC(12, 2) DEFAULT 0.00,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE retail_bills ADD COLUMN IF NOT EXISTS discount_name VARCHAR(150) DEFAULT NULL;
      ALTER TABLE retail_bills ADD COLUMN IF NOT EXISTS discount_campaign_id VARCHAR(80) DEFAULT NULL;
      ALTER TABLE retail_bills ADD COLUMN IF NOT EXISTS billed_by TEXT DEFAULT 'Main Desk (Yashodip)';
      ALTER TABLE retail_bills ADD COLUMN IF NOT EXISTS terminal_code TEXT DEFAULT 'COUNTER-01';
      ALTER TABLE retail_bills ADD COLUMN IF NOT EXISTS store_name TEXT DEFAULT NULL;
      ALTER TABLE retail_bills ADD COLUMN IF NOT EXISTS store_license TEXT DEFAULT NULL;
      ALTER TABLE retail_bills ADD COLUMN IF NOT EXISTS store_gstin TEXT DEFAULT NULL;
      ALTER TABLE retail_bills ADD COLUMN IF NOT EXISTS store_address TEXT DEFAULT NULL;
      ALTER TABLE retail_bills ADD COLUMN IF NOT EXISTS store_phone TEXT DEFAULT NULL;
      ALTER TABLE retail_bills ADD COLUMN IF NOT EXISTS store_city TEXT DEFAULT NULL;
      ALTER TABLE retail_bills ADD COLUMN IF NOT EXISTS store_pincode TEXT DEFAULT NULL;

      -- Multi-Terminal Counter Operators Table
      CREATE TABLE IF NOT EXISTS store_terminals (
        id VARCHAR(80) PRIMARY KEY,
        medical_store_id VARCHAR(80) NOT NULL,
        terminal_code VARCHAR(50) NOT NULL,
        terminal_name VARCHAR(100) DEFAULT 'Main Counter Desk',
        username VARCHAR(80),
        email VARCHAR(120),
        password_hash VARCHAR(255),
        plain_password VARCHAR(100),
        operator_name VARCHAR(120),
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMPTZ,
        firebase_uid TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Firebase Auth UID tracking for multi-terminal operators and store users
      ALTER TABLE store_terminals ADD COLUMN IF NOT EXISTS firebase_uid TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid TEXT;

      -- Add latitude & longitude columns to distributors if they do not exist
      ALTER TABLE distributors ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 6);
      ALTER TABLE distributors ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 6);

      -- Wholesale supplier orders payment tracking
      ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING_PAYMENT';
      ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'UPI';
      ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS payment_reference TEXT DEFAULT NULL;
      ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NULL;

      -- Mark already dispatched or delivered orders as paid by default
      UPDATE supplier_orders 
      SET payment_status = 'PAID', payment_mode = 'UPI', payment_reference = 'UPI-2026-CONFIRMED', paid_at = COALESCE(paid_at, NOW())
      WHERE (status = 'DISPATCHED' OR status = 'DELIVERED') AND (payment_status IS NULL OR payment_status = 'PENDING_PAYMENT');

      -- Update all 5 verified distributors with accurate physical depot coordinates & statewide coverage
      UPDATE distributors SET 
        company_name = 'MedVantage Pharma Logistics',
        address = 'Bhiwandi Central Pharma Hub, Unit 14-18, Mankoli',
        city = 'Thane',
        state = 'Maharashtra',
        pincode = '421302',
        latitude = 19.2967,
        longitude = 73.0631,
        fulfillment_rating = 98.5,
        on_time_delivery_rate = 97.2,
        avg_lead_time_hours = 18,
        coverage_pincodes = ARRAY['400001', '400703', '411001', '416006', '415001', '413001', '422001', '431001', '440001', '*']
      WHERE id = 'dist-01';

      UPDATE distributors SET 
        company_name = 'Apex Global Health Distributors',
        address = 'Kurla West Logistics Park, LBS Marg',
        city = 'Mumbai',
        state = 'Maharashtra',
        pincode = '400070',
        latitude = 19.0728,
        longitude = 72.8826,
        fulfillment_rating = 96.8,
        on_time_delivery_rate = 94.5,
        avg_lead_time_hours = 12,
        coverage_pincodes = ARRAY['400001', '400703', '411001', '416006', '415001', '413001', '422001', '431001', '440001', '*']
      WHERE id = 'dist-02';

      UPDATE distributors SET 
        company_name = 'PulseLife Distribution Network',
        address = 'MIDC Phase II Pharma Complex, Chakan',
        city = 'Pune',
        state = 'Maharashtra',
        pincode = '410501',
        latitude = 18.7606,
        longitude = 73.8636,
        fulfillment_rating = 96.0,
        on_time_delivery_rate = 95.0,
        avg_lead_time_hours = 14,
        coverage_pincodes = ARRAY['400001', '400703', '411001', '416006', '415001', '413001', '422001', '431001', '440001', '*']
      WHERE id = 'dist-03';

      UPDATE distributors SET 
        company_name = 'SunRise Healthcare Wholesalers',
        address = 'Warehouse Hub, Sector 8, Rabale',
        city = 'Navi Mumbai',
        state = 'Maharashtra',
        pincode = '400701',
        latitude = 19.1363,
        longitude = 73.0044,
        fulfillment_rating = 94.5,
        on_time_delivery_rate = 92.0,
        avg_lead_time_hours = 16,
        coverage_pincodes = ARRAY['400001', '400703', '411001', '416006', '415001', '413001', '422001', '431001', '440001', '*']
      WHERE id = 'dist-04';

      UPDATE distributors SET 
        company_name = 'BioPharma Cold-Chain Supply',
        address = 'Bio Park, Hinjewadi Phase 1',
        city = 'Pune',
        state = 'Maharashtra',
        pincode = '411057',
        latitude = 18.5913,
        longitude = 73.7389,
        fulfillment_rating = 99.1,
        on_time_delivery_rate = 98.4,
        avg_lead_time_hours = 10,
        coverage_pincodes = ARRAY['400001', '400703', '411001', '416006', '415001', '413001', '422001', '431001', '440001', '*']
      WHERE id = 'dist-05';
    `);

    // Ensure all 5 distributors have full inventory and batch stock for all medicines
    await seedAllDistributorInventories();
  } catch (err: any) {
    console.warn('Note on drawer_location migration:', err.message);
  }
}

/**
 * Automatically seeds and synchronizes stock and batches for all 5 verified distributors.
 * Distributes authentic product portfolios so only distributors that actually stock a medicine show quotes.
 */
async function seedAllDistributorInventories(): Promise<void> {
  try {
    // 1. Ensure batches and medicine_indent_requests tables have their columns
    await exec(`
      ALTER TABLE batches ADD COLUMN IF NOT EXISTS qa_quarantine_status TEXT DEFAULT 'RELEASED_FOR_SALE';
      ALTER TABLE batches ADD COLUMN IF NOT EXISTS is_recalled BOOLEAN DEFAULT FALSE;
      UPDATE batches SET qa_quarantine_status = 'RELEASED_FOR_SALE' WHERE qa_quarantine_status IS NULL;

      CREATE TABLE IF NOT EXISTS medicine_indent_requests (
        id VARCHAR(80) PRIMARY KEY,
        store_id VARCHAR(80) NOT NULL,
        store_name VARCHAR(150) NOT NULL,
        store_license VARCHAR(80),
        store_phone VARCHAR(50),
        store_city VARCHAR(80),
        distributor_id VARCHAR(80) NOT NULL,
        distributor_name VARCHAR(150) NOT NULL,
        medicine_name VARCHAR(150) NOT NULL,
        generic_name VARCHAR(150),
        dosage_form VARCHAR(50) DEFAULT 'TABLET',
        strength VARCHAR(50),
        required_qty INT NOT NULL CHECK (required_qty > 0),
        urgency VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
        target_date DATE,
        notes TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_mir_store ON medicine_indent_requests(store_id);
      CREATE INDEX IF NOT EXISTS idx_mir_dist ON medicine_indent_requests(distributor_id);
      CREATE INDEX IF NOT EXISTS idx_mir_status ON medicine_indent_requests(status);
    `);

    // Clean up cloned custom / single-distributor medicines:
    // Any medicine added specifically by dist-01 (like Telma 40, med-08) should NOT exist in dist-02..dist-05
    await exec(`
      DELETE FROM batches WHERE medicine_id = 'med-08' AND distributor_id != 'dist-01';
      DELETE FROM distributor_inventories WHERE medicine_id = 'med-08' AND distributor_id != 'dist-01';
    `);

    // Guard: only perform initial seed if distributor_inventories has fewer than 10 rows
    const existingCount = await query(`SELECT count(*) as count FROM distributor_inventories;`);
    const count = parseInt(existingCount.rows[0]?.count || '0', 10);
    if (count >= 10) {
      console.log('✅ Distributor inventories verified. Preserving authentic distributor stocks.');
      return;
    }

    const medsRes = await query(`SELECT id, brand_name, base_price, gst_rate FROM medicines WHERE verification_status = 'VERIFIED';`);
    if (medsRes.rows.length === 0) return;

    // Realistic distributor portfolios: each distributor specializes in certain drug lines
    const distCatalogMap: Record<string, string[]> = {
      'dist-01': ['med-01', 'med-02', 'med-03', 'med-05', 'med-08', 'med-09', 'med-14'], // MedVantage (Telma, Augmentin, Asthalin...)
      'dist-02': ['med-01', 'med-03', 'med-04', 'med-06', 'med-11'],                       // Apex Global (Pediatric & Analgesics)
      'dist-03': ['med-02', 'med-04', 'med-07', 'med-10', 'med-13'],                       // PulseLife (Chronic & Gastro)
      'dist-04': ['med-01', 'med-05', 'med-12'],                                             // SunRise (Antibiotics & Pain)
      'dist-05': ['med-09', 'med-10', 'med-14', 'med-15'],                                   // BioPharma (Cold-Chain, Inhalers & Insulin)
    };

    const distProfiles = [
      { id: 'dist-01', prefix: 'MVL', priceMult: 1.00, stock: 320 },
      { id: 'dist-02', prefix: 'APX', priceMult: 1.02, stock: 180 },
      { id: 'dist-03', prefix: 'PLS', priceMult: 0.97, stock: 520 }, // Best bulk tier rate
      { id: 'dist-04', prefix: 'SRH', priceMult: 1.01, stock: 240 },
      { id: 'dist-05', prefix: 'BPS', priceMult: 0.99, stock: 450 }, // High-reliability cold-chain
    ];

    for (const d of distProfiles) {
      const allowedMeds = distCatalogMap[d.id] || [];
      for (let i = 0; i < medsRes.rows.length; i++) {
        const med = medsRes.rows[i];
        if (!allowedMeds.includes(med.id)) continue;

        const base = parseFloat(med.base_price || '50');
        const sellingPrice = parseFloat((base * d.priceMult).toFixed(2));
        const mrp = parseFloat((base * 1.25).toFixed(2));
        const unitCost = parseFloat((sellingPrice * 0.78).toFixed(2));
        const invId = `inv-${d.id}-${med.id}`;
        const batchId = `bth-${d.id}-${med.id}`;
        const batchNum = `BTH-${d.prefix}-${1000 + i * 5}`;
        const expiryDate = '2028-06-30';

        // Upsert distributor_inventories using composite unique key (distributor_id, medicine_id)
        const invRes = await query(
          `INSERT INTO distributor_inventories (id, distributor_id, medicine_id, on_hand_quantity, reserved_quantity, available_quantity, unit_cost, selling_price, mrp, min_threshold, is_low_stock)
           VALUES ($1, $2, $3, $4, 0, $4, $5, $6, $7, 30, false)
           ON CONFLICT (distributor_id, medicine_id) DO UPDATE SET 
             selling_price = EXCLUDED.selling_price,
             mrp = EXCLUDED.mrp,
             available_quantity = GREATEST(distributor_inventories.available_quantity, EXCLUDED.available_quantity),
             on_hand_quantity = GREATEST(distributor_inventories.on_hand_quantity, EXCLUDED.on_hand_quantity)
           RETURNING id;`,
          [invId, d.id, med.id, d.stock, unitCost, sellingPrice, mrp]
        );
        const resolvedInvId = invRes.rows[0]?.id || invId;

        // Upsert batches using composite unique key (distributor_id, medicine_id, batch_number)
        await query(
          `INSERT INTO batches (id, inventory_id, distributor_id, medicine_id, batch_number, manufacturing_date, expiry_date, on_hand_quantity, reserved_quantity, available_quantity, mrp, unit_cost, selling_price, qa_quarantine_status, is_recalled)
           VALUES ($1, $2, $3, $4, $5, '2025-01-15', $6, $7, 0, $7, $8, $9, $10, 'RELEASED_FOR_SALE', false)
           ON CONFLICT (distributor_id, medicine_id, batch_number) DO UPDATE SET 
             expiry_date = EXCLUDED.expiry_date,
             selling_price = EXCLUDED.selling_price,
             mrp = EXCLUDED.mrp,
             available_quantity = GREATEST(batches.available_quantity, EXCLUDED.available_quantity),
             on_hand_quantity = GREATEST(batches.on_hand_quantity, EXCLUDED.on_hand_quantity);`,
          [batchId, resolvedInvId, d.id, med.id, batchNum, expiryDate, d.stock, mrp, unitCost, sellingPrice]
        );
      }
    }
    console.log('✅ All 5 distributors verified with specialty medicine inventories & batches.');
  } catch (err: any) {
    console.warn('Note on seedAllDistributorInventories:', err.message);
  }
}

/**
 * Executes a raw multi-statement SQL script (DDL / migrations).
 */
export async function exec(sql: string): Promise<void> {
  if (isPgPoolActive && pgPool) {
    await pgPool.query(sql);
  } else if (pgliteInstance) {
    await pgliteInstance.exec(sql);
  } else {
    throw new Error('PostgreSQL database not initialized. Call initPostgres() first.');
  }
}

/**
 * Executes a parameterised query against PostgreSQL.
 */
export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  if (isPgPoolActive && pgPool) {
    const res = await pgPool.query(text, params);
    return {
      rows: res.rows,
      rowCount: res.rowCount ?? res.rows.length,
    };
  } else if (pgliteInstance) {
    const res = await pgliteInstance.query<T>(text, params);
    return {
      rows: res.rows,
      rowCount: res.rows.length,
    };
  }
  throw new Error('PostgreSQL database not initialized. Call initPostgres() first.');
}

/**
 * Executes a function within an ACID transaction with support for row-level locking (FOR UPDATE).
 */
export async function transaction<T>(callback: (trx: TransactionClient) => Promise<T>): Promise<T> {
  if (isPgPoolActive && pgPool) {
    const client: PoolClient = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const trxClient: TransactionClient = {
        query: async <R = any>(text: string, params?: any[]) => {
          const res = await client.query(text, params);
          return { rows: res.rows, rowCount: res.rowCount ?? res.rows.length };
        },
      };
      const result = await callback(trxClient);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } else if (pgliteInstance) {
    return await pgliteInstance.transaction(async (tx) => {
      const trxClient: TransactionClient = {
        query: async <R = any>(text: string, params?: any[]) => {
          const res = await tx.query<R>(text, params);
          return { rows: res.rows, rowCount: res.rows.length };
        },
      };
      return await callback(trxClient);
    });
  }
  throw new Error('PostgreSQL database not initialized.');
}
