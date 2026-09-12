import pg from 'pg';
import fs from 'fs';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres.jfuebqmltksyznovhlwa:EEaR6399!%40%232026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres' });

async function run() {
  const sql = fs.readFileSync('supabase/migrations/20261015000000_fix_exchanges_schema_and_rpc.sql', 'utf8');
  console.log('Applying migration 20261015000000_fix_exchanges_schema_and_rpc.sql...');
  await pool.query(sql);
  console.log('Migration applied successfully!');
  await pool.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
