import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlPath = path.resolve(__dirname, "../supabase/migrations/20260904170000_destinations_cms_sections_enterprise.sql");
const sqlContent = fs.readFileSync(sqlPath, "utf8");

const password = "EEaR6399!@#2026";

const configs = [
  {
    host: "aws-0-sa-east-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    username: "postgres.jfuebqmltksyznovhlwa",
    password,
  },
  {
    host: "aws-0-sa-east-1.pooler.supabase.com",
    port: 5432,
    database: "postgres",
    username: "postgres.jfuebqmltksyznovhlwa",
    password,
  },
  {
    host: "db.jfuebqmltksyznovhlwa.supabase.co",
    port: 5432,
    database: "postgres",
    username: "postgres",
    password,
  },
];

async function run() {
  for (const cfg of configs) {
    console.log(`Tentando conectar em ${cfg.host}:${cfg.port} como ${cfg.username}...`);
    try {
      const sql = postgres({
        ...cfg,
        ssl: { rejectUnauthorized: false },
        connect_timeout: 10,
      });

      console.log("Conexão estabelecida! Testando query...");
      await sql`SELECT 1`;
      console.log("Query executada com sucesso! Aplicando migration SQL de Destinos CMS...");
      await sql.unsafe(sqlContent);
      console.log("MIGRATION DE DESTINOS APLICADA COM SUCESSO NO SUPABASE!");
      await sql.end();
      process.exit(0);
    } catch (e) {
      console.error(`Falha na conexao com ${cfg.host}:${cfg.port} - ${e.message}`);
    }
  }
  console.error("Nenhuma conexao funcionou.");
  process.exit(1);
}

run();
