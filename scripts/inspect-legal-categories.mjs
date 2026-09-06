import postgres from "postgres";

const sql = postgres({
  host: "aws-0-sa-east-1.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  username: "postgres.jfuebqmltksyznovhlwa",
  password: "EEaR6399!@#2026",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const rows = await sql`SELECT slug, category FROM legal_documents LIMIT 5;`;
  console.log("Categories:", rows);
  const cons = await sql`
    SELECT pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = 'legal_documents'::regclass AND conname = 'legal_documents_category_check';
  `;
  console.log("Constraint:", cons);
  await sql.end();
}

run().catch(console.error);
