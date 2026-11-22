import process from 'node:process';
import { query, initPostgres } from './src/db/postgres';
import bcrypt from 'bcryptjs';

async function migrate() {
  console.log('Initializing Postgres...');
  await initPostgres();
  console.log('Running store_terminals and retail_bills migration...');
  
  await query(`ALTER TABLE retail_bills ADD COLUMN IF NOT EXISTS billed_by TEXT DEFAULT 'Owner (Dr. Ramesh Patil)';`);
  await query(`ALTER TABLE retail_bills ADD COLUMN IF NOT EXISTS terminal_code TEXT DEFAULT 'COUNTER-01';`);

  await query(`
    CREATE TABLE IF NOT EXISTS store_terminals (
      id TEXT PRIMARY KEY,
      medical_store_id TEXT NOT NULL REFERENCES medical_stores(id) ON DELETE CASCADE,
      terminal_code TEXT NOT NULL,
      terminal_name TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      plain_password TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_login TIMESTAMPTZ
    );
  `);

  console.log('Table store_terminals created.');

  // Check if terminal2 exists
  const existing = await query(`SELECT id FROM store_terminals WHERE username = 'terminal2';`);
  if (existing.rows.length === 0) {
    const hash = await bcrypt.hash('terminal123', 10);
    await query(`
      INSERT INTO store_terminals (id, medical_store_id, terminal_code, terminal_name, operator_name, username, password_hash, plain_password)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `, [
      'term-apollo-02',
      'store-apollo-01',
      'COUNTER-02',
      'Billing Counter #2 (Express Counter)',
      'Suresh Kadam (Cashier)',
      'terminal2',
      hash,
      'terminal123'
    ]);
    console.log('Seeded terminal2 operator for Apollo Care Pharmacy.');
  }

  // Check if terminal3 exists
  const existing3 = await query(`SELECT id FROM store_terminals WHERE username = 'terminal3';`);
  if (existing3.rows.length === 0) {
    const hash = await bcrypt.hash('terminal123', 10);
    await query(`
      INSERT INTO store_terminals (id, medical_store_id, terminal_code, terminal_name, operator_name, username, password_hash, plain_password)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `, [
      'term-apollo-03',
      'store-apollo-01',
      'COUNTER-03',
      'Billing Counter #3 (Drive-Through / Night Counter)',
      'Pooja Sharma (Staff Pharmacist)',
      'terminal3',
      hash,
      'terminal123'
    ]);
    console.log('Seeded terminal3 operator for Apollo Care Pharmacy.');
  }

  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
