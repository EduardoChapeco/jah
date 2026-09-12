import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const secretsPath = path.resolve(__dirname, "../.env.secrets");
let password = "";
if (fs.existsSync(secretsPath)) {
  const lines = fs.readFileSync(secretsPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("SUPABASE_DB_PASSWORD=")) {
      password = trimmed.replace("SUPABASE_DB_PASSWORD=", "").replace(/["'\r]/g, "").trim();
      break;
    }
  }
}

async function main() {
  const sql = postgres({
    host: "aws-0-sa-east-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    username: "postgres.jfuebqmltksyznovhlwa",
    password,
    ssl: { rejectUnauthorized: false },
  });

  const buckets = await sql`SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets`;
  console.log("=== STORAGE BUCKETS NO SUPABASE ===");
  console.table(buckets);

  // Check columns of profiles and creators
  const profileCols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name IN ('avatar_url', 'cover_url', 'banner_url')
  `;
  console.log("=== COLUNAS DE PROFILES ===");
  console.table(profileCols);

  const creatorTables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE '%creator%'
  `;
  console.log("=== TABELAS DE CREATOR ===");
  console.table(creatorTables);

  for (const t of creatorTables) {
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = ${t.table_name} AND column_name IN ('avatar_url', 'cover_url', 'banner_url', 'user_id', 'id')
    `;
    console.log(`Colunas de ${t.table_name}:`, cols);
  }

  await sql.end();
}

main().catch(console.error);
