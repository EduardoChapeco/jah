import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres.jfuebqmltksyznovhlwa:EEaR6399!%40%232026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres' });

async function run() {
  const res = await pool.query(
    "SELECT routine_name FROM information_schema.routines WHERE routine_name ILIKE '%exchange%'"
  );
  console.log('Exchange routines:', res.rows);
  await pool.end();
}
run();
