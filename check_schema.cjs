const postgres = require("postgres");
require("dotenv").config({ path: ".env.local" });
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_URL = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.gnfhhvcgnswctzvjcefe.supabase.co:5432/postgres?sslmode=require`;
const sql = postgres(DB_URL);
sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'product_variants'`
  .then((res) => {
    console.log("Columns:", res.map((r) => r.column_name).join(", "));
    sql.end();
  })
  .catch((e) => {
    console.error(e);
    sql.end();
  });
