import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega .env.secrets se existir
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

const sqlPath = path.resolve(__dirname, "../supabase/migrations/20260930030000_crm_leads_commercial_enterprise_parity.sql");
const sqlContent = fs.readFileSync(sqlPath, "utf8");

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
  let success = false;
  for (const cfg of configs) {
    console.log(`Tentando conectar em ${cfg.host}:${cfg.port}...`);
    try {
      const sql = postgres({
        ...cfg,
        ssl: { rejectUnauthorized: false },
        connect_timeout: 15,
      });

      console.log("Conectado! Testando query...");
      await sql`SELECT 1`;
      console.log("Query OK! Aplicando migration CRM Enterprise Parity...");
      await sql.unsafe(sqlContent);
      console.log("✓ Migration 20260930030000 APLICADA COM SUCESSO!");

      try {
        await sql`NOTIFY pgrst, 'reload schema'`;
        console.log("✓ Schema cache recarregado com NOTIFY pgrst!");
      } catch (e) {
        console.warn("Aviso schema cache:", e.message);
      }

      await sql.end();
      success = true;
      break;
    } catch (err) {
      console.warn(`Falha na porta ${cfg.port}:`, err.message);
    }
  }

  if (!success) {
    console.error("Nenhuma conexão de banco de dados funcionou.");
    process.exit(1);
  }
}

run();
