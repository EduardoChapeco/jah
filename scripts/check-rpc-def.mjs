import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres.jfuebqmltksyznovhlwa:EEaR6399!%40%232026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres' });

async function run() {
  const res = await pool.query(`
    SELECT p.proname, pg_get_functiondef(p.oid) as def
    FROM pg_proc p
    WHERE p.proname = 'process_exchange_transaction'
  `);
  console.log(res.rows[0]?.def);
  await pool.end();
}
run();
