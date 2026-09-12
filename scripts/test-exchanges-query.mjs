import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres.jfuebqmltksyznovhlwa:EEaR6399!%40%232026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres' });

async function run() {
  const res = await pool.query(`
    SELECT e.id, e.status, e.reason, e.created_at, e.total_value_cents, o.public_token, o.total_cents, o.customer_snapshot
    FROM exchanges e
    LEFT JOIN orders o ON o.id = e.original_order_id
    LIMIT 5
  `);
  console.log('Query success! Rows:', res.rows);
  await pool.end();
}
run().catch(console.error);
