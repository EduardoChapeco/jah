import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const DB_PASSWORD = process.env.DB_PASSWORD!;
const DB_URL = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.gnfhhvcgnswctzvjcefe.supabase.co:5432/postgres`;

const sql = postgres(DB_URL, { ssl: "require" });

async function runIdentityTest() {
  const storeA = "00000000-0000-0000-0000-aaaa00000000";
  const storeB = "00000000-0000-0000-0000-bbbb00000000";
  const workerId = "00000000-0000-0000-0000-123412341234";
  const orgId = "00000000-0000-0000-0000-333333333333";

  console.log("[SETUP] Criando cenários de Lojas Múltiplas e Identidade Cruzada...");

  // Setup Organization
  await sql`
    INSERT INTO public.organizations (id, name, slug)
    VALUES (${orgId}, 'Cross Tenant Org', 'cross-tenant-org')
    ON CONFLICT (id) DO NOTHING;
  `;

  // Setup Stores
  await sql`
    INSERT INTO public.stores (id, organization_id, name, slug)
    VALUES 
      (${storeA}, ${orgId}, 'Loja Matriz A', 'loja-a'),
      (${storeB}, ${orgId}, 'Filial B', 'loja-b')
    ON CONFLICT (id) DO NOTHING;
  `;

  // Setup User
  await sql`
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES 
      (${workerId}, 'operario@test.com', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Operario Multi-Tenant"}')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password, email_confirmed_at = EXCLUDED.email_confirmed_at;
  `;

  // Profile automatically created via trigger

  // Workspace memberships: Admin in Store A, Customer in Store B
  await sql`
    INSERT INTO public.workspace_members (profile_id, store_id, role)
    VALUES 
      (${workerId}, ${storeA}, 'admin'),
      (${workerId}, ${storeB}, 'customer')
    ON CONFLICT (profile_id, store_id) DO UPDATE SET role = EXCLUDED.role;
  `;

  const workerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await workerClient.auth.signInWithPassword({
    email: "operario@test.com",
    password: "password123",
  });

  console.log("\n--- INICIANDO TESTES DE IDENTIDADE ---");

  // Test 1: Simulating Context Resolution (getServerIdentity logic)
  console.log("\n[TEST 1] Leitura Canônica de Identidade e Memberships...");
  const { data: rawMemberships, error: memErr } = await workerClient
    .from("workspace_members")
    .select("store_id, role, stores(name, slug, logo_url)")
    .eq("profile_id", workerId);

  if (memErr) throw new Error("Failed to read memberships: " + memErr.message);

  const memberships = rawMemberships.map((m: any) => ({
    store_id: m.store_id,
    role: m.role,
    name: m.stores?.name,
  }));

  if (memberships.length < 2) {
    throw new Error(
      "Usuário deveria ter múltiplos contextos (Store A e Store B). Encontrou: " +
        memberships.length,
    );
  }

  const roleInA = memberships.find((m: any) => m.store_id === storeA)?.role;
  const roleInB = memberships.find((m: any) => m.store_id === storeB)?.role;

  if (roleInA === "admin" && roleInB === "customer") {
    console.log("✅ O contexto e os papéis foram resolvidos perfeitamente:");
    console.log(`   - Loja A: ${roleInA}`);
    console.log(`   - Loja B: ${roleInB}`);
  } else {
    throw new Error(
      "Falha na resolução condicional de papéis. Role A: " + roleInA + " Role B: " + roleInB,
    );
  }

  // Test 2: Validar Troca de Contexto e Proteção de Tenancy
  console.log(
    "\n[TEST 2] Tentativa de escrita RLS no contexto da Loja B com privilégios da Loja A...",
  );

  // Try to create a CMS page on Store B using the client
  const { data: pageB, error: pageBErr } = await workerClient
    .from("pages")
    .insert({
      store_id: storeB,
      title: "Página Ilícita na Loja B",
      slug: "pagina-ilicita",
      status: "draft",
    })
    .select()
    .single();

  if (pageBErr && pageBErr.code === "42501") {
    console.log("✅ Bloqueado corretamente pelo RLS! Operário não é admin na Loja B.");
  } else if (pageB) {
    throw new Error("FALHA DE SEGURANÇA CRÍTICA: RLS permitiu o operário criar dados na Loja B!");
  }

  // Try to create a CMS page on Store A using the client
  const { data: pageA, error: pageAErr } = await workerClient
    .from("pages")
    .insert({
      store_id: storeA,
      title: "Página Legítima na Loja A",
      slug: "pagina-legitima",
      status: "draft",
    })
    .select()
    .single();

  if (pageAErr) {
    throw new Error(
      "FALHA: O operário deveria conseguir criar a página na Loja A. Erro: " + pageAErr.message,
    );
  } else {
    console.log("✅ Página criada com sucesso na Loja A (Papel de Admin comprovado no RLS).");
  }

  console.log("\n=======================================");
  console.log("FIM DOS TESTES DE IDENTIDADE E CONTEXTO");
  console.log("=======================================");
  await sql.end();
}

runIdentityTest().catch(console.error);
