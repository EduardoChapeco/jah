import postgres from "postgres";

const sql = postgres({
  host: "aws-0-sa-east-1.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  username: "postgres.jfuebqmltksyznovhlwa",
  password: process.env.SUPABASE_DB_PASSWORD || "",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  for (const t of ['token_ledger_transactions', 'user_token_wallets', 'store_token_wallets', 'store_token_billing_invoices']) {
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = ${t};
    `;
    console.log(`=== ${t} ===:`, cols.map(c => `${c.column_name} (${c.data_type})`));
  }
  await sql.end();
}

run().catch(console.error);
