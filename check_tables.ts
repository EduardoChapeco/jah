import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const DB_PASSWORD = process.env.DB_PASSWORD!;
const DB_URL = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.gnfhhvcgnswctzvjcefe.supabase.co:5432/postgres?sslmode=require`;
const sql = postgres(DB_URL);

async function check() {
  const cols = await sql`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_name IN ('events', 'classifieds')
    ORDER BY table_name, column_name;
  `;
  console.log(cols);
  await sql.end();
}
check();
