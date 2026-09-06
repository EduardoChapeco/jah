import postgres from "postgres";

const password = "EEaR6399!@#2026";
const sql = postgres({
  host: "aws-0-sa-east-1.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  username: "postgres.jfuebqmltksyznovhlwa",
  password,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  for (const t of ['events', 'ticket_lots', 'tickets', 'event_subpanels', 'event_staff_allocations']) {
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = ${t} 
      ORDER BY ordinal_position;
    `;
    console.log('=== ' + t + ' ===');
    console.log(cols.map(c => c.column_name + ' (' + c.data_type + ')').join(', '));
  }
  await sql.end();
}

main().catch(console.error);
