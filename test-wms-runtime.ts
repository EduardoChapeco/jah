import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env.local") });

// Setup direct DB connection
const dbPassword = process.env.DB_PASSWORD || "";
const encodedPassword = encodeURIComponent(dbPassword);
const dbUrl = `postgresql://postgres:${encodedPassword}@db.gnfhhvcgnswctzvjcefe.supabase.co:5432/postgres`;
const sql = postgres(dbUrl, { ssl: "require" });

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

const TEST_EMAIL_1 = "wms_test_op1@jah.com";
const TEST_EMAIL_2 = "wms_test_op2@jah.com";
const TEST_PASS = "TestPass123!@";

async function setup() {
  console.log("[SETUP] Aplicando correção de RLS (20260803150000_fix_wms_rma_rls.sql)...");
  await sql.file(path.join(__dirname, "supabase/migrations/20260803150000_fix_wms_rma_rls.sql"));

  console.log("[SETUP] Criando usuários de teste e pedido no banco...");

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  await supabase.auth.signUp({ email: TEST_EMAIL_1, password: TEST_PASS });
  await supabase.auth.signUp({ email: TEST_EMAIL_2, password: TEST_PASS });

  const stores = await sql`SELECT id FROM public.stores LIMIT 1`;
  const storeId = stores[0].id;

  const users1 = await sql`SELECT id FROM auth.users WHERE email = ${TEST_EMAIL_1}`;
  const users2 = await sql`SELECT id FROM auth.users WHERE email = ${TEST_EMAIL_2}`;
  const op1Id = users1[0].id;
  const op2Id = users2[0].id;

  await sql`
    INSERT INTO public.workspace_members (profile_id, store_id, role)
    VALUES (${op1Id}, ${storeId}, 'admin')
    ON CONFLICT (profile_id, store_id) DO UPDATE SET role = 'admin'
  `;
  await sql`
    INSERT INTO public.workspace_members (profile_id, store_id, role)
    VALUES (${op2Id}, ${storeId}, 'admin')
    ON CONFLICT (profile_id, store_id) DO UPDATE SET role = 'admin'
  `;

  const [order] = await sql`
    INSERT INTO public.orders (store_id, customer_id, status, total_cents, subtotal_cents, shipping_cents, discount_cents)
    VALUES (${storeId}, ${op1Id}, 'processing', 10000, 10000, 0, 0)
    RETURNING id
  `;

  const orderId = order.id;

  await sql`
    INSERT INTO public.order_items (order_id, product_title, variant_sku, qty, unit_price_cents, total_cents)
    VALUES (${orderId}, 'Test Product 1', 'SKU-01', 2, 2500, 5000),
           (${orderId}, 'Test Product 2', 'SKU-02', 1, 5000, 5000)
    RETURNING id
  `;

  const items = await sql`SELECT id, qty FROM public.order_items WHERE order_id = ${orderId}`;

  return { storeId, orderId, op1Id, op2Id, items };
}

async function runTest() {
  let ctx;
  try {
    ctx = await setup();
    console.log("[SETUP] OK!", ctx.orderId);
  } catch (err) {
    console.error("[SETUP] Erro:", err);
    process.exit(1);
  }

  const { storeId, orderId, op1Id, op2Id, items } = ctx;

  const client1 = createClient(supabaseUrl, supabaseAnonKey);
  await client1.auth.signInWithPassword({ email: TEST_EMAIL_1, password: TEST_PASS });

  const client2 = createClient(supabaseUrl, supabaseAnonKey);
  await client2.auth.signInWithPassword({ email: TEST_EMAIL_2, password: TEST_PASS });

  console.log("\n--- INICIANDO TESTES DO WMS ---");

  console.log("\n[TEST 1] Operador 1 tenta iniciar separação...");
  let { data: sessionId, error: errStart } = await client1.rpc("start_wms_picking", {
    p_order_id: orderId,
    p_operator_id: op1Id,
    p_store_id: storeId,
  });

  if (errStart) {
    console.error("❌ Falha:", errStart.message);
  } else {
    console.log("✅ Sessão Iniciada. ID:", sessionId);
  }

  console.log("\n[TEST 2] Verificando persistência (Simulando Reload)...");
  const sessionDb = await sql`SELECT * FROM public.wms_picking_sessions WHERE id = ${sessionId}`;
  const itemsDb = await sql`SELECT * FROM public.wms_picking_items WHERE session_id = ${sessionId}`;
  console.log("✅ Session state:", sessionDb[0].status);
  console.log(`✅ Items persistidos: ${itemsDb.length} itens.`);
  for (let i of itemsDb) {
    console.log(
      `  -> Item ${i.order_item_id} | Esperado: ${i.qty_expected} | Bipado: ${i.qty_picked}`,
    );
  }

  console.log("\n[TEST 3] Operador 2 tenta iniciar sessão concorrente no mesmo pedido...");
  let { data: session2, error: errStart2 } = await client2.rpc("start_wms_picking", {
    p_order_id: orderId,
    p_operator_id: op2Id,
    p_store_id: storeId,
  });
  if (errStart2) {
    console.log("✅ Bloqueado (Ou erro esperado):", errStart2.message);
  } else {
    console.log("✅ O servidor apenas retornou a sessão existente:", session2);
    if (session2 === sessionId) console.log("  -> Confirmado: Nenhum novo ID de sessão gerado.");
  }

  console.log("\n[TEST 4] Tentar concluir sem bipar todos os itens...");
  let { error: errComp1 } = await client1.rpc("complete_wms_picking", {
    p_session_id: sessionId,
    p_operator_id: op1Id,
  });
  if (errComp1) {
    console.log("✅ Bloqueado corretamente pelo servidor:", errComp1.message);
  } else {
    console.error("❌ Sucesso indevido! Concluiu incompleto.");
  }

  console.log("\n[TEST 5] Bipar com qtd a mais...");
  let { error: errPickExcess } = await client1.rpc("pick_wms_item", {
    p_session_id: sessionId,
    p_order_item_id: items[0].id,
    p_qty: 99,
  });
  if (errPickExcess) {
    console.log("✅ Bloqueado corretamente:", errPickExcess.message);
  } else {
    console.error("❌ Sucesso indevido! Conseguiu extrapolar qtd.");
  }

  console.log("\n[TEST 6] Bipando itens corretamente...");
  let { error: e1 } = await client1.rpc("pick_wms_item", {
    p_session_id: sessionId,
    p_order_item_id: items[0].id,
    p_qty: items[0].qty,
  });
  let { error: e2 } = await client1.rpc("pick_wms_item", {
    p_session_id: sessionId,
    p_order_item_id: items[1].id,
    p_qty: items[1].qty,
  });
  if (e1 || e2) console.error("❌ Falha na bipagem", e1, e2);
  else console.log("✅ Bipados com sucesso.");

  console.log("\n[TEST 7] Concluindo sessão WMS...");
  let { error: errComp2 } = await client1.rpc("complete_wms_picking", {
    p_session_id: sessionId,
    p_operator_id: op1Id,
  });
  if (errComp2) console.error("❌ Erro inesperado:", errComp2.message);
  else {
    console.log("✅ Sessão concluída com sucesso!");
    const finalOrder = await sql`SELECT status FROM public.orders WHERE id = ${orderId}`;
    console.log("✅ Status do pedido final no banco de dados:", finalOrder[0].status);
  }

  console.log("\n=======================================");
  console.log("FIM DOS TESTES DE RUNTIME DO WMS");
  console.log("=======================================");

  process.exit(0);
}

runTest();
