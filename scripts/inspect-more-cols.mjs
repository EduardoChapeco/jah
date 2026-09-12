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
  const tables = ['group_tours', 'company_documents', 'company_document_reads', 'sponsor_placements', 'squad_generated_posts', 'synthetic_agent_memories', 'synthetic_population_archetypes'];
  for (const t of tables) {
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = ${t}
      ORDER BY ordinal_position;
    `;
    console.log(`Table ${t} columns:`, cols.map(c => c.column_name).join(', '));
  }
  await sql.end();
}
run();
