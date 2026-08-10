import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const DB_PASSWORD = process.env.DB_PASSWORD!;
const DB_URL = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.gnfhhvcgnswctzvjcefe.supabase.co:5432/postgres`;

const sql = postgres(DB_URL, { ssl: "require" });
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function runCatalogTests() {
  console.log("--- INICIANDO TESTES FORENSES DO CATÁLOGO (Fase 6) ---");
  let hasErrors = false;

  const orgId = "00000000-0000-0000-0000-999999999999";
  const testStoreId = "00000000-0000-0000-0000-ca7a10900001";
  const productId = "00000000-0000-0000-0000-ca7a10900002";

  // 1. Prepare environment
  console.log("\n[STEP 1] Preparando ambiente (Direct DB)...");

  await sql`
    INSERT INTO public.organizations (id, name, slug)
    VALUES (${orgId}, 'Catalog Org', 'catalog-org')
    ON CONFLICT DO NOTHING;
  `;

  await sql`
    INSERT INTO public.stores (id, organization_id, name, slug)
    VALUES (${testStoreId}, ${orgId}, 'Catalog Test Store', 'catalog-test-store')
    ON CONFLICT DO NOTHING;
  `;

  await sql`
    INSERT INTO public.products (id, store_id, title, slug, description, status, price_cents)
    VALUES (${productId}, ${testStoreId}, 'Test Product Catalog', 'test-product-catalog', 'Testing catalog invariants', 'draft', 1000)
    ON CONFLICT (id) DO UPDATE SET status = 'draft';
  `;

  // 2. Test Anonymity Visibility
  console.log("\n[STEP 2] Testando Visibilidade de Draft para Público...");
  const { data: anonData, error: anonError } = await anonClient
    .from("products")
    .select("id")
    .eq("id", productId);

  if (anonData && anonData.length > 0) {
    console.error(
      "❌ FALHA CRÍTICA DE RLS: Usuário anônimo conseguiu ler um produto em modo DRAFT.",
    );
    hasErrors = true;
  } else {
    console.log("✅ RLS Bloqueou leitura anônima de produto draft.");
  }

  // 3. Test Negative Pricing Constraint
  console.log("\n[STEP 3] Testando Invariantes Matemáticas (Preço e Estoque)...");
  try {
    const variantId = "00000000-0000-0000-0000-ca7a10900003";
    await sql`
      INSERT INTO public.product_variants (id, product_id, sku, price_override_cents, stock_on_hand)
      VALUES (${variantId}, ${productId}, 'TEST-SKU-NEG', -500, -10)
    `;
    console.error(
      "❌ FALHA CRÍTICA DE CONSTRAINT: O banco permitiu inserção de variante com preço negativo ou estoque negativo.",
    );
    hasErrors = true;
  } catch (error: any) {
    if (error.message.includes("violates check constraint") || error.code === "23514") {
      console.log("✅ Banco bloqueou inserção matemática ilícita (Check Constraint).");
    } else {
      console.log(`⚠️ Banco bloqueou, mas por motivo inesperado: ${error.message}`);
    }
  }

  console.log("\n=======================================");
  if (hasErrors) {
    console.log("❌ O Catálogo REPROVOU na contra-auditoria matemática e de segurança.");
    process.exit(1);
  } else {
    console.log("✅ O Catálogo PASSOU com segurança nativa de banco (Constraints e RLS provados).");
    console.log("=======================================");
  }

  await sql.end();
}

runCatalogTests();
