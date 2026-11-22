import process from 'node:process';
import { query, initPostgres } from './src/db/postgres';

async function run() {
  await initPostgres();
  console.log('Altering store_terminals to add email column...');
  await query(`ALTER TABLE store_terminals ADD COLUMN IF NOT EXISTS email TEXT;`);
  
  await query(`
    UPDATE store_terminals 
    SET email = 'terminal2@apollocare.com' 
    WHERE username = 'terminal2' AND (email IS NULL OR email = '');
  `);

  await query(`
    UPDATE store_terminals 
    SET email = 'terminal3@apollocare.com' 
    WHERE username = 'terminal3' AND (email IS NULL OR email = '');
  `);

  const res = await query(`SELECT id, terminal_code, operator_name, username, email FROM store_terminals;`);
  console.log('Updated store_terminals:', res.rows);
}

run().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});

