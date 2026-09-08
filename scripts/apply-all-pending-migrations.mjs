import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sql = postgres({
  host: "aws-0-sa-east-1.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  username: "postgres.jfuebqmltksyznovhlwa",
  password: process.env.SUPABASE_DB_PASSWORD || "",
  ssl: { rejectUnauthorized: false },
  connect_timeout: 30,
});

const migrationFiles = [
  "20260925000000_personal_finance_system.sql",
  "20260926000000_telemetry_ledger_cashback_contracts.sql",
  "20260927000000_carne_digital_installments_system.sql",
  "20260928000000_courier_fraud_prevention_private_stores_and_tokenized_ledger.sql",
];

async function run() {
  for (const file of migrationFiles) {
    const fullPath = path.resolve(__dirname, "../supabase/migrations", file);
    if (!fs.existsSync(fullPath)) {
      console.log(`Arquivo não encontrado: ${file}`);
      continue;
    }
    console.log(`Aplicando ${file}...`);
    const content = fs.readFileSync(fullPath, "utf8");
    try {
      await sql.unsafe(content);
      console.log(`✅ ${file} aplicada com sucesso!`);
    } catch (err) {
      console.error(`❌ Erro ao aplicar ${file}:`, err.message);
      // Let's print details
      if (err.detail) console.error("Detalhes:", err.detail);
      if (err.hint) console.error("Dica:", err.hint);
      break;
    }
  }

  // Verifica tabelas resultantes
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
      'personal_financial_entries',
      'personal_financial_categories',
      'receivables',
      'receivable_installments',
      'courier_onboarding_applications',
      'fraud_investigation_logs'
    );
  `;
  console.log("Tabelas confirmadas no banco:", tables.map(t => t.table_name));

  await sql.end();
}

run().catch(console.error);
