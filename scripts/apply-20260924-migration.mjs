import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlPath = path.resolve(__dirname, "../supabase/migrations/20260924000000_classifieds_digital_affiliates_and_modules.sql");
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
    console.log(`Tentando conectar em ${cfg.host}:${cfg.port}...`);
    try {
      const sql = postgres({
        ...cfg,
        max: 1,
        ssl: { rejectUnauthorized: false },
        connect_timeout: 15,
      });

      console.log("Executando migration...");
      await sql.unsafe(sqlContent);
      console.log("Migration 20260924000000 aplicada com sucesso total!");

      // Verifica tabelas criadas
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('affiliate_partners', 'affiliate_clicks', 'affiliate_commissions', 'platform_modules_config');
      `;
      console.log("Tabelas verificadas:", tables.map(t => t.table_name));

      await sql.end();
      process.exit(0);
    } catch (err) {
      console.error(`Falha ao conectar/executar com host ${cfg.host}:${cfg.port}:`, err.message);
    }
  }
  console.error("Nenhum host teve sucesso na aplicação da migration.");
  process.exit(1);
}

run();
