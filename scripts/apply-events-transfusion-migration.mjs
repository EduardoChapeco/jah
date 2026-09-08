import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlPath = path.resolve(__dirname, "../supabase/migrations/20260905190000_eventos_enterprise_transfusion.sql");
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
  }
];

async function run() {
  let success = false;
  for (const cfg of configs) {
    console.log(`Tentando conectar em ${cfg.host}:${cfg.port}...`);
    try {
      const sql = postgres({
        ...cfg,
        ssl: { rejectUnauthorized: false },
        connect_timeout: 10,
      });

      console.log("Executando migration eventos_enterprise_transfusion.sql...");
      await sql.unsafe(sqlContent);
      console.log("Migration aplicada com SUCESSO via " + cfg.port + "!");
      await sql.end();
      success = true;
      break;
    } catch (err) {
      console.error(`Falha em ${cfg.host}:${cfg.port}:`, err.message);
    }
  }

  if (!success) {
    console.error("ERRO: Nenhuma conexão foi bem-sucedida.");
    process.exit(1);
  }
}

run();
