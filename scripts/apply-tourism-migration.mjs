import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlPath = path.resolve(__dirname, "../supabase/migrations/20260904120000_tourism_trips_contracts_vouchers_pipeline.sql");
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
        ssl: { rejectUnauthorized: false },
        connect_timeout: 10,
      });

      console.log("Conexao estabelecida! Testando query...");
      await sql`SELECT 1`;
      console.log("Query executada com sucesso! Aplicando migration SQL...");
      await sql.unsafe(sqlContent);
      console.log("✓ Migration 20260904120000_tourism_trips_contracts_vouchers_pipeline.sql APLICADA COM SUCESSO!");

      // Notificar PostgREST
      try {
        await sql`NOTIFY pgrst, 'reload schema'`;
        console.log("✓ Schema cache recarregado com NOTIFY pgrst!");
      } catch (e) {
        console.warn("Aviso schema cache:", e.message);
      }

      await sql.end();
      return;
    } catch (err) {
      console.warn(`Falha na conexao (${err.message}). Tentando proxima...`);
    }
  }

  console.error("Todas as tentativas falharam.");
  process.exit(1);
}

run();
