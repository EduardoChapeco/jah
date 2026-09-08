import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlPath = path.resolve(__dirname, "../supabase/migrations/20260904180000_builder_settings_theme_pages.sql");
const sqlContent = fs.readFileSync(sqlPath, "utf8");

const password = process.env.SUPABASE_DB_PASSWORD || "";

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
        max: 1,
        ssl: { rejectUnauthorized: false },
        connect_timeout: 10,
      });

      console.log("Conexão estabelecida! Testando query...");
      await sql`SELECT 1`;
      console.log("Query executada com sucesso! Aplicando migration SQL de Builder Settings...");
      await sql.unsafe(sqlContent);
      console.log("MIGRATION DE BUILDER SETTINGS APLICADA COM SUCESSO NO SUPABASE!");
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
