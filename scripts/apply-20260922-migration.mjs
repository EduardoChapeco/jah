import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega .env.secrets
const secretsPath = path.resolve(__dirname, "../.env.secrets");
let dbPassword = process.env.SUPABASE_DB_PASSWORD || "";
if (fs.existsSync(secretsPath)) {
  const content = fs.readFileSync(secretsPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("SUPABASE_DB_PASSWORD=")) {
      dbPassword = trimmed.replace("SUPABASE_DB_PASSWORD=", "").replace(/["']/g, "").trim();
    }
  }
}

const configs = [
  {
    host: "aws-0-sa-east-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    username: "postgres.jfuebqmltksyznovhlwa",
    password: dbPassword,
  },
  {
    host: "aws-0-sa-east-1.pooler.supabase.com",
    port: 5432,
    database: "postgres",
    username: "postgres.jfuebqmltksyznovhlwa",
    password: dbPassword,
  },
];

async function run() {
  const file = "20260922000000_press_consortium_and_sponsor_display_network.sql";
  const fullPath = path.resolve(__dirname, "../supabase/migrations", file);
  console.log(`Aplicando ${file}...`);
  const content = fs.readFileSync(fullPath, "utf8");

  let sql = null;
  for (const cfg of configs) {
    try {
      console.log(`Tentando porta ${cfg.port}...`);
      const client = postgres({
        ...cfg,
        ssl: { rejectUnauthorized: false },
        connect_timeout: 10,
      });
      await client`SELECT 1`;
      sql = client;
      console.log(`Conectado com sucesso na porta ${cfg.port}!`);
      break;
    } catch (e) {
      console.warn(`Falha na porta ${cfg.port}: ${e.message}`);
    }
  }

  if (!sql) {
    console.error("Não foi possível conectar ao Postgres.");
    process.exit(1);
  }

  try {
    await sql.unsafe(content);
    console.log(`✅ ${file} aplicada com sucesso no Supabase!`);
  } catch (err) {
    console.error(`❌ Erro ao aplicar ${file}:`, err.message);
    if (err.detail) console.error("Detalhes:", err.detail);
    if (err.hint) console.error("Dica:", err.hint);
  }

  // Verifica colunas adicionadas
  const cols = await sql`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND (
      (table_name = 'sponsors' AND column_name IN ('magic_token', 'video_url', 'sponsor_store_id')) OR
      (table_name = 'stores' AND column_name IN ('is_press_consortium', 'press_accreditation_status'))
    );
  `;
  console.log("Colunas confirmadas no banco:", cols);
  await sql.end();
}

run().catch(console.error);
