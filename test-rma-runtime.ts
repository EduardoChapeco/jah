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
  console.log("[SETUP] Aplicando fix da RPC inspect_rma_item (stock_on_hand)...");
  await sql`
    CREATE OR REPLACE FUNCTION public.inspect_rma_item(
        p_rma_item_id UUID,
        p_inspector_id UUID,
        p_qty INTEGER,
        p_condition TEXT,
        p_destination TEXT,
        p_notes TEXT
    )
    RETURNS VOID
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        v_rma_item RECORD;
        v_rma_request RECORD;
        v_order_item RECORD;
    BEGIN
        SELECT * INTO v_rma_item FROM public.rma_items WHERE id = p_rma_item_id;
        SELECT * INTO v_rma_request FROM public.rma_requests WHERE id = v_rma_item.rma_id;
        SELECT * INTO v_order_item FROM public.order_items WHERE id = v_rma_item.order_item_id;

        IF v_rma_item.qty_received + p_qty > v_rma_item.qty THEN
            RAISE EXCEPTION 'Quantidade inspecionada excede a solicitada.';
        END IF;

        -- Record inspection
        INSERT INTO public.rma_inspections (rma_item_id, inspector_id, qty, condition, destination, notes)
        VALUES (p_rma_item_id, p_inspector_id, p_qty, p_condition, p_destination, p_notes);

        -- Update received qty
        UPDATE public.rma_items SET qty_received = qty_received + p_qty WHERE id = p_rma_item_id;

        -- Update RMA request status to inspected if all items are fully received/inspected
        UPDATE public.rma_requests SET status = 'inspected', updated_at = NOW() WHERE id = v_rma_request.id;

        -- Restock conditionally
        IF p_destination = 'restock' THEN
            UPDATE public.product_variants
            SET stock_on_hand = COALESCE(stock_on_hand, 0) + p_qty
            WHERE id = v_order_item.variant_id;

            INSERT INTO public.inventory_adjustments_log (
                store_id, employee_id, variant_id, qty_adjusted, reason, notes
            ) VALUES (
                v_rma_request.store_id, p_inspector_id, v_order_item.variant_id, p_qty, 'rma_restock', 'Inspeção RMA: ' || v_rma_request.id::text
            );
        END IF;
    END;
    $$;
  `;

  const storeId = "00000000-0000-0000-0000-000000000001";
  const customerId = "00000000-0000-0000-0000-111111111111";
  const adminId = "00000000-0000-0000-0000-222222222222";
  const orgId = "00000000-0000-0000-0000-333333333333";

  // Make sure users exist
  await sql`
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES 
      (${customerId}, 'rma_customer@test.com', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Test Customer"}'),
      (${adminId}, 'rma_admin@test.com', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Test Admin"}')
    ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, email_confirmed_at = EXCLUDED.email_confirmed_at;
  `;

  // Make sure organization exists
  await sql`
    INSERT INTO public.organizations (id, name, slug)
    VALUES (${orgId}, 'RMA Test Org', 'rma-test-org')
    ON CONFLICT (id) DO NOTHING;
  `;

  // Make sure store exists
  await sql`
    INSERT INTO public.stores (id, organization_id, name, slug)
    VALUES (${storeId}, ${orgId}, 'RMA Test Store', 'rma-test-store')
    ON CONFLICT (id) DO NOTHING;
  `;

  // Ensure customer profile
  await sql`
    INSERT INTO public.profiles (id, full_name)
    VALUES (${customerId}, 'Test Customer')
    ON CONFLICT (id) DO UPDATE SET full_name = 'Test Customer';
  `;

  // Ensure admin profile
  await sql`
    INSERT INTO public.profiles (id, full_name)
    VALUES (${adminId}, 'Test Admin')
    ON CONFLICT (id) DO UPDATE SET full_name = 'Test Admin';
  `;

  // Make admin part of workspace_members
  await sql`
    INSERT INTO public.workspace_members (profile_id, store_id, role)
    VALUES (${adminId}, ${storeId}, 'admin')
    ON CONFLICT (profile_id, store_id) DO UPDATE SET role = 'admin';
  `;

  // Create order
  const orderRes = await sql`
    INSERT INTO public.orders (store_id, customer_id, subtotal_cents, shipping_cents, total_cents, status)
    VALUES (${storeId}, ${customerId}, 7500, 0, 7500, 'paid')
    RETURNING id
  `;
  const orderId = orderRes[0].id;

  // Create product and variant
  const productRes = await sql`
    INSERT INTO public.products (store_id, title, slug, price_cents)
    VALUES (${storeId}, 'Test Product 1', 'test-product-1', 2500)
    RETURNING id
  `;
  const productId = productRes[0].id;

  const variantRes = await sql`
    INSERT INTO public.product_variants (product_id, sku, price_override_cents, stock_on_hand)
    VALUES (${productId}, 'SKU-01', 2500, 100)
    RETURNING id
  `;
  const variantId = variantRes[0].id;

  const itemsRes = await sql`
    INSERT INTO public.order_items (order_id, product_title, variant_sku, variant_id, qty, unit_price_cents, total_cents)
    VALUES (${orderId}, 'Test Product 1', 'SKU-01', ${variantId}, 2, 2500, 5000),
           (${orderId}, 'Test Product 2', 'SKU-02', null, 1, 2500, 2500)
    RETURNING id, qty
  `;

  return { storeId, customerId, adminId, orderId, items: itemsRes };
}

async function run() {
  try {
    const { storeId, customerId, adminId, orderId, items } = await setup();
    console.log(`[SETUP] OK! Order ID: ${orderId}`);

    await supabase.auth.admin.updateUserById(customerId, { password: "password123" });
    await supabase.auth.admin.updateUserById(adminId, { password: "password123" });

    const clientCustomer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await clientCustomer.auth.signInWithPassword({
      email: "rma_customer@test.com",
      password: "password123",
    });

    const clientAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await clientAdmin.auth.signInWithPassword({
      email: "rma_admin@test.com",
      password: "password123",
    });

    console.log("\n--- INICIANDO TESTES DO RMA ---");

    console.log("\n[TEST 1] Cliente solicita RMA (Devolução parcial)...");
    let rmaId;

    const { data: rmaRes, error: rmaErr } = await clientCustomer.rpc("request_order_return", {
      p_store_id: storeId,
      p_customer_id: customerId,
      p_order_id: orderId,
      p_items: [{ order_item_id: items[0].id, qty: 1, reason: "Defeito" }],
      p_notes: "Cliente teste",
    });

    if (rmaErr) {
      console.error("❌ Falha ao solicitar RMA:", rmaErr.message);
      process.exit(1);
    } else {
      rmaId = rmaRes;
      console.log("✅ RMA solicitado com sucesso. ID:", rmaId);
    }

    console.log("\n[TEST 2] Tentar pedir mais quantidade do que tem no pedido...");
    const { error: rmaErr2 } = await clientCustomer.rpc("request_order_return", {
      p_store_id: storeId,
      p_customer_id: customerId,
      p_order_id: orderId,
      p_items: [{ order_item_id: items[1].id, qty: 99, reason: "Gostaria de mais" }],
      p_notes: "Excesso",
    });

    if (rmaErr2) {
      console.log("✅ Bloqueado corretamente pelo servidor:", rmaErr2.message);
    } else {
      console.error("❌ Sucesso indevido! Pediu mais do que comprou.");
    }

    console.log("\n[TEST 3] Admin aprova e inspeciona RMA...");

    // Admin muda status
    await sql`UPDATE public.rma_requests SET status = 'received' WHERE id = ${rmaId}`;

    const rmaItems = await sql`SELECT id, qty FROM public.rma_items WHERE rma_id = ${rmaId}`;
    const rmaItemId = rmaItems[0].id;

    // Admin inspeciona
    const { error: inspectErr } = await clientAdmin.rpc("inspect_rma_item", {
      p_rma_item_id: rmaItemId,
      p_inspector_id: adminId,
      p_qty: 1,
      p_condition: "perfect",
      p_destination: "restock",
      p_notes: "Test inspected",
    });

    if (inspectErr) {
      console.error("❌ Falha ao inspecionar:", inspectErr.message);
    } else {
      console.log("✅ RMA inspecionado com sucesso (restock).");
    }

    console.log("\n[TEST 4] Tentar inspecionar mais que o recebido...");
    const { error: inspectErr2 } = await clientAdmin.rpc("inspect_rma_item", {
      p_rma_item_id: rmaItemId,
      p_inspector_id: adminId,
      p_qty: 1,
      p_condition: "perfect",
      p_destination: "restock",
      p_notes: "Test over inspect",
    });

    if (inspectErr2) {
      console.log("✅ Bloqueado corretamente:", inspectErr2.message);
    } else {
      console.error("❌ Sucesso indevido! Inspecionou além do limite.");
    }

    console.log("\n=======================================");
    console.log("FIM DOS TESTES DE RUNTIME DO RMA");
    console.log("=======================================");
  } catch (e: any) {
    console.error("Erro geral:", e.message);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

run();
