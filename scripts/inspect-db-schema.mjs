import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres.jfuebqmltksyznovhlwa:EEaR6399!%40%232026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres' });

async function run() {
  const res = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'integration_credentials'
  `);
  console.log('integration_credentials columns:', res.rows.map(r => r.column_name));
  await pool.end();
}

run().catch(console.error);
