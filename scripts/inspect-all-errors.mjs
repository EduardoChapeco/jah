import pg from 'pg';

const connectionString = 'postgresql://postgres.jfuebqmltksyznovhlwa:EEaR6399!%40%232026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';
const pool = new pg.Pool({ connectionString });

async function main() {
  const res = await pool.query('SELECT * FROM public.system_error_logs ORDER BY created_at DESC');
  console.log(`TOTAL ERRORS FOUND: ${res.rows.length}`);
  res.rows.forEach((r, idx) => {
    console.log(`--- [${idx + 1}] ${r.route} (${r.created_at}) ---`);
    console.log(`Message: ${r.error_message}`);
    console.log(`Payload: ${JSON.stringify(r.payload)}`);
    console.log(`Stack: ${r.stack_trace?.split('\n').slice(0, 3).join('\n')}`);
  });
  await pool.end();
}

main().catch(console.error);
