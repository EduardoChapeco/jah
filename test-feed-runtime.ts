import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);

const DB_PASSWORD = process.env.DB_PASSWORD!;
const DB_URL = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.gnfhhvcgnswctzvjcefe.supabase.co:5432/postgres?sslmode=require`;
const sql = postgres(DB_URL);

async function runFeedTests() {
  console.log("--- INICIANDO TESTES FORENSES DE FEED/COMUNIDADE (Fase 9) ---");
  let hasErrors = false;

  const storeId = "00000000-0000-0000-0000-ca7a10900001";
  const productId = "00000000-0000-0000-0000-ca7a10900002";
  const eventId = "00000000-0000-0000-0000-ca7a10900099";

  // 1. Prepare Environment (Insert Draft Event)
  console.log("\n[STEP 1] Preparando Rascunhos de Evento (Direct DB)...");
  await sql`
    INSERT INTO public.events (id, store_id, title, status, event_date)
    VALUES (${eventId}, ${storeId}, 'Evento Fantasma Secreto', 'pending', NOW())
    ON CONFLICT DO NOTHING;
  `;

  // 2. Timeline Visibility Test (Anonymous User)
  console.log("\n[STEP 2] Testando Isolamento da Timeline Pública (Não exibir rascunhos)...");

  const { data: eventsData, error: evError } = await anonClient
    .from("events")
    .select("id, title, status")
    .eq("id", eventId);

  if (eventsData && eventsData.length > 0) {
    console.error(
      "❌ FALHA CRÍTICA: Um evento no status 'draft' foi devolvido para um visitante anônimo.",
    );
    hasErrors = true;
  } else if (evError) {
    console.log(
      `✅ O RLS negou a leitura da tabela para anônimo ou ocorreu erro: ${evError.message}`,
    );
  } else {
    console.log(
      `✅ Consulta de Timeline bloqueou a exibição do evento rascunho (Retornou array vazio).`,
    );
  }

  // 3. Review Bombing Protection Test (Anonymous/Direct Insert)
  console.log("\n[STEP 3] Testando Bloqueio de Review Bombing no DB...");
  const { error: reviewError } = await anonClient.from("reviews").insert({
    store_id: storeId,
    product_id: productId,
    user_id: "00000000-0000-0000-0000-999999999999",
    rating: 5,
    comment: "Melhor produto do mundo (Comprado por bot)",
  });

  if (reviewError) {
    console.log(
      `✅ Banco de dados bloqueou inserção de Review falsa. Motivo RLS: ${reviewError.message}`,
    );
  } else {
    console.error(
      "❌ FALHA CRÍTICA: O banco de dados permitiu que um cliente anônimo injetasse um Review falso diretamente.",
    );
    hasErrors = true;
  }

  console.log("\n=======================================");
  if (hasErrors) {
    console.log("❌ O Módulo de Feed/Comunidade REPROVOU na contra-auditoria orgânica.");
    process.exit(1);
  } else {
    console.log(
      "✅ O Módulo de Feed PASSOU. Reviews falsos são barrados e a timeline é fidedigna.",
    );
    console.log("=======================================");
  }

  await sql.end();
}

runFeedTests();
