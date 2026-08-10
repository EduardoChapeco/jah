import { config } from "dotenv";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.resolve(__dirname, ".env.local") });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

const dbPassword = process.env.DB_PASSWORD || "";
const encodedPassword = encodeURIComponent(dbPassword);
const DB_URL = `postgresql://postgres:${encodedPassword}@db.gnfhhvcgnswctzvjcefe.supabase.co:5432/postgres`;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !DB_URL) {
  throw new Error("Missing environment variables.");
}

const sql = postgres(DB_URL, { ssl: "require", max: 1 });
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setup() {
  console.log("[SETUP] Aplicando engine CMS (20260803160000_fix_cms_rls.sql)...");
  await sql.file(path.join(__dirname, "supabase/migrations/20260803160000_fix_cms_rls.sql"));

  console.log("[SETUP] Criando usuários de teste e tenant no banco...");

  const storeId = "00000000-0000-0000-0000-000000000001";
  const orgId = "00000000-0000-0000-0000-333333333333";
  const customerId = "00000000-0000-0000-0000-999999999999";
  const adminId = "00000000-0000-0000-0000-888888888888";

  // Auth Users
  await sql`
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES 
      (${customerId}, 'cms_test_customer@test.com', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Test Customer"}'),
      (${adminId}, 'cms_test_admin@test.com', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Test Admin"}')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password, email_confirmed_at = EXCLUDED.email_confirmed_at;
  `;

  // Organization
  await sql`
    INSERT INTO public.organizations (id, name, slug)
    VALUES (${orgId}, 'CMS Test Org', 'cms-test-org')
    ON CONFLICT (id) DO NOTHING;
  `;

  // Store
  await sql`
    INSERT INTO public.stores (id, organization_id, name, slug)
    VALUES (${storeId}, ${orgId}, 'CMS Test Store', 'cms-test-store')
    ON CONFLICT (id) DO NOTHING;
  `;

  // Profiles
  await sql`
    INSERT INTO public.profiles (id, full_name)
    VALUES (${customerId}, 'Test Customer'), (${adminId}, 'Test Admin')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
  `;

  // Workspace Members
  await sql`
    INSERT INTO public.workspace_members (profile_id, store_id, role)
    VALUES (${adminId}, ${storeId}, 'admin')
    ON CONFLICT (profile_id, store_id) DO UPDATE SET role = 'admin';
  `;

  // Product for dynamic section
  const productRes = await sql`
    INSERT INTO public.products (store_id, title, slug, price_cents)
    VALUES (${storeId}, 'Ticket Vip', 'ticket-vip', 15000)
    ON CONFLICT (store_id, slug) DO UPDATE SET title = 'Ticket Vip'
    RETURNING id
  `;
  const productId = productRes[0].id;

  return { storeId, customerId, adminId, productId };
}

async function run() {
  try {
    const { storeId, customerId, adminId, productId } = await setup();
    console.log(`[SETUP] OK! Store ID: ${storeId}`);

    const clientCustomer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await clientCustomer.auth.signInWithPassword({
      email: "cms_test_customer@test.com",
      password: "password123",
    });

    const clientAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await clientAdmin.auth.signInWithPassword({
      email: "cms_test_admin@test.com",
      password: "password123",
    });

    const clientPublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); // unauthenticated

    console.log("\n--- DEBUG RLS ---");
    const { data: wmAdmin, error: wmErr } = await clientAdmin.from("workspace_members").select("*");
    console.log("workspace_members for Admin:", wmAdmin, wmErr?.message);

    const { data: userAdmin, error: userErr } = await clientAdmin.auth.getUser();
    console.log("Admin UID:", userAdmin?.user?.id, "Expected:", adminId);

    console.log("\n--- INICIANDO TESTES DO CMS ---");

    console.log("\n[TEST 1] Admin cria uma página de CMS (Draft)...");

    // We'll use the supabase JS client to simulate the BFF queries since the BFF uses standard client
    const { data: pageData, error: pageErr } = await clientAdmin
      .from("pages")
      .insert({
        store_id: storeId,
        title: "Página Inicial Teste",
        slug: "home-teste-" + Date.now(),
        status: "draft",
      })
      .select()
      .single();

    if (pageErr) {
      console.error("❌ Falha ao criar página:", pageErr.message);
      process.exit(1);
    }
    const pageId = pageData.id;
    console.log("✅ Página criada com sucesso. ID:", pageId);

    console.log("\n[TEST 2] Admin insere Seções Dinâmicas (product_grid)...");
    const { data: sectionData, error: sectionErr } = await clientAdmin
      .from("page_sections")
      .insert({
        page_id: pageId,
        section_type: "product_grid",
        content: { title: "Destaques", productIds: [productId] },
        sort_order: 1,
      })
      .select()
      .single();

    if (sectionErr) {
      console.error("❌ Falha ao criar seção:", sectionErr.message);
      process.exit(1);
    }
    console.log("✅ Seção vinculada à página com sucesso.");

    console.log("\n[TEST 3] Cliente (sem permissão) tenta modificar a página (Isolamento RLS)...");
    const { error: hackErr } = await clientCustomer
      .from("pages")
      .update({ title: "Hacked Page" })
      .eq("id", pageId);

    // Supabase returns no error on empty update, but 0 rows affected. Let's check the title.
    const { data: checkData } = await clientAdmin
      .from("pages")
      .select("title")
      .eq("id", pageId)
      .single();

    if (checkData?.title === "Hacked Page") {
      console.error("❌ Falha de Segurança! RLS permitiu modificação.");
    } else {
      console.log("✅ Bloqueado corretamente pelo servidor via RLS (Nenhuma linha afetada).");
    }

    console.log("\n[TEST 4] Testar visibilidade pública de página em DRAFT (Deve Bloquear)...");
    const { data: publicDraft, error: publicDraftErr } = await clientPublic
      .from("pages")
      .select("*, page_sections(*)")
      .eq("id", pageId)
      .single();

    if (publicDraft || (publicDraftErr && publicDraftErr.code !== "PGRST116")) {
      console.error("❌ Falha! Página em draft visível publicamente.");
    } else {
      console.log("✅ Página oculta para anônimos (bloqueado por RLS).");
    }

    console.log("\n[TEST 5] Admin publica a página e verifica Renderer Público...");
    await clientAdmin.from("pages").update({ status: "published" }).eq("id", pageId);

    const { data: publicPub, error: publicPubErr } = await clientPublic
      .from("pages")
      .select("*, page_sections(*)")
      .eq("id", pageId)
      .single();

    if (publicPubErr) {
      console.error("❌ Erro ao buscar página publicada:", publicPubErr.message);
    } else if (publicPub.page_sections.length === 0) {
      console.error("❌ Falha RLS em page_sections públicas!");
    } else {
      console.log("✅ Página e seções renderizadas com sucesso via RLS público!");
      console.log("Dados da seção public: ", JSON.stringify(publicPub.page_sections[0].content));
    }

    console.log(
      "\n[TEST 6] Modificar nome do produto e verificar que Propaga Dinamicamente (Não é copiado p/ JSON)...",
    );

    // Admin muda nome do produto
    await clientAdmin
      .from("products")
      .update({ title: "Ticket VIP - Black Friday" })
      .eq("id", productId);

    // O renderer do frontend vai buscar o produto baseando-se no ID. A prova de que a seção não guardou texto é que `content` só tem o ID.
    const { data: sectionCheck } = await clientPublic
      .from("page_sections")
      .select("content")
      .eq("page_id", pageId)
      .single();
    if (
      sectionCheck?.content?.productIds?.includes(productId) &&
      !sectionCheck?.content?.product_title
    ) {
      console.log(
        "✅ A seção armazena apenas referência de ID do Produto. Renderer buscará dinamicamente.",
      );
    } else {
      console.error("❌ Falha: Dados operacionais (nome, preço) foram copiados para o JSON.");
    }

    console.log("\n=======================================");
    console.log("FIM DOS TESTES DE RUNTIME DO CMS");
    console.log("=======================================");
  } catch (e: any) {
    console.error("Erro geral:", e.message);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

run();
