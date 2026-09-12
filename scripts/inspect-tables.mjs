import postgres from 'postgres';

const sql = postgres({
  host: 'aws-0-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  username: 'postgres.jfuebqmltksyznovhlwa',
  password: 'EEaR6399!@#2026',
  ssl: { rejectUnauthorized: false },
  connect_timeout: 15,
});

async function run() {
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name ILIKE '%store%' OR table_name ILIKE '%member%' OR table_name ILIKE '%user%')`;
  console.log('tables:', tables.map(t => t.table_name));
  await sql.end();
}
run();
