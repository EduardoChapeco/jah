import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres.jfuebqmltksyznovhlwa:EEaR6399!%40%232026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres' });

async function run() {
  try {
    await pool.query("BEGIN");
    const res = await pool.query(
      "SELECT process_exchange_transaction('a0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'replacement', 'test', 0, 'a0000000-0000-0000-0000-000000000003'::uuid)"
    );
    console.log('Result:', res.rows);
    await pool.query("ROLLBACK");
  } catch (err) {
    console.error('RPC failed:', err.message);
    await pool.query("ROLLBACK");
  } finally {
    await pool.end();
  }
}
run();
