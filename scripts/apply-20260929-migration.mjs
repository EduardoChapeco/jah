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
  password: "EEaR6399!@#2026",
  ssl: { rejectUnauthorized: false },
  connect_timeout: 30,
});

async function run() {
  const file = "20260929000000_affiliate_tokens_vesting_and_creator_profiles.sql";
  const fullPath = path.resolve(__dirname, "../supabase/migrations", file);
  console.log(`Aplicando ${file}...`);
  const content = fs.readFileSync(fullPath, "utf8");
  try {
    await sql.unsafe(content);
    console.log(`✅ ${file} aplicada com sucesso!`);
  } catch (err) {
    console.error(`❌ Erro ao aplicar ${file}:`, err.message);
    if (err.detail) console.error("Detalhes:", err.detail);
    if (err.hint) console.error("Dica:", err.hint);
  }

  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('creator_profiles', 'affiliate_reward_rules', 'affiliate_referrals');
  `;
  console.log("Tabelas confirmadas no banco:", tables.map(t => t.table_name));

  const procs = await sql`
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('award_referral_tokens_with_vesting', 'request_invoice_token_discount', 'approve_invoice_token_discount');
  `;
  console.log("Procedures confirmadas no banco:", procs.map(p => p.routine_name));
  await sql.end();
}

run().catch(console.error);
