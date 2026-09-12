import pg from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.jfuebqmltksyznovhlwa:EEaR6399!%40%232026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres'
});

async function main() {
  const sql = fs.readFileSync('supabase/migrations/20261019000000_store_promotional_flyers.sql', 'utf8');
  console.log('Applying 20261019000000_store_promotional_flyers.sql...');
  await pool.query(sql);
  console.log('✓ Migration successfully applied to Supabase!');
  await pool.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
