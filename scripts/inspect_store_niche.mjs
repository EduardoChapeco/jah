import postgres from "postgres";

const sql = postgres({
  host: "aws-0-sa-east-1.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  username: "postgres.jfuebqmltksyznovhlwa",
  password: process.env.SUPABASE_DB_PASSWORD || "",
  ssl: { rejectUnauthorized: false },
});

async function inspect() {
  const store = await sql`
    SELECT * FROM public.stores
    WHERE name ILIKE '%Excelência%' OR name ILIKE '%Tour%'
    LIMIT 1
  `;
  if (store.length > 0) {
    console.log("STORE COLUMNS AND DATA:", JSON.stringify(store[0], null, 2));
  } else {
    const anyStore = await sql`SELECT * FROM public.stores LIMIT 1`;
    console.log("ANY STORE:", JSON.stringify(anyStore[0], null, 2));
  }
  await sql.end();
}

inspect();
