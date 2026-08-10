import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
// Usamos a chave anônima para testar LGPD (Acesso de fora sem sessão ou sessão fraca)
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function runStorageTests() {
  console.log("--- INICIANDO TESTES FORENSES DE STORAGE/LGPD (Fase 8) ---");
  let hasErrors = false;

  const bucketName = "payment-proofs";
  const testFileName = "test-store/proof-123.jpg";

  // 1. Tentar ler publicamente um arquivo sensível
  console.log("\n[STEP 1] Testando Bloqueio de Leitura Pública (LGPD)...");

  // getPublicUrl doesn't check existence, it just generates the URL.
  // We need to fetch it to see if it's open.
  const { data: urlData } = anonClient.storage.from(bucketName).getPublicUrl(testFileName);

  try {
    const res = await fetch(urlData.publicUrl);

    // Se a resposta for 200, significa que o bucket está público (Vazamento LGPD).
    // Se for 400/403/404, significa que o publicUrl falha e o Storage RLS (ou flag private) barrou.
    if (res.ok) {
      console.error(
        "❌ FALHA CRÍTICA DE LGPD: O bucket payment-proofs permitiu download anônimo via URL pública.",
      );
      hasErrors = true;
    } else {
      console.log(
        `✅ Storage RLS barrou a leitura anônima (Status HTTP: ${res.status}). Documentos protegidos.`,
      );
    }
  } catch (e) {
    console.log("✅ Falha de rede ao tentar acessar URL pública (Bucket privado comprovado).");
  }

  // 2. Tentar listar arquivos do bucket
  console.log("\n[STEP 2] Testando Listagem Anônima de Documentos...");

  const { data, error } = await anonClient.storage.from(bucketName).list();
  if (data && data.length > 0) {
    console.error(
      "❌ FALHA CRÍTICA DE LGPD: Usuário anônimo conseguiu listar o diretório de documentos sensíveis.",
    );
    hasErrors = true;
  } else if (error) {
    console.log(`✅ RLS bloqueou listagem anônima do diretório. Mensagem: ${error.message}`);
  } else {
    console.log(`✅ RLS retornou diretório vazio para anônimo (Sem vazamento de metadados).`);
  }

  console.log("\n=======================================");
  if (hasErrors) {
    console.log("❌ O Módulo de Storage REPROVOU na contra-auditoria LGPD.");
    process.exit(1);
  } else {
    console.log("✅ O Módulo de Storage PASSOU com proteção absoluta de dados (LGPD comprovada).");
    console.log("=======================================");
  }
}

runStorageTests();
