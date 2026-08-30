import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import { getSSRClient, getServerIdentity, assertStoreAccess } from "@/lib/server-access";
import { requireAdmin } from "@/lib/server-access";

// ---------------------------------------------------------------------------
// Order status enum (shared between validator and domain logic)
// ---------------------------------------------------------------------------

export const ORDER_STATUS_VALUES = [
  "draft",
  "awaiting_shipping_quote",
  "awaiting_payment",
  "payment_processing",
  "paid",
  "processing",
  "ready_for_pickup",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "payment_failed",
  "return_requested",
  "returned",
  "refunded",
] as const;

// ---------------------------------------------------------------------------
// Handlers (decoupled for unit testing)
// ---------------------------------------------------------------------------

export async function _listOrders(store_id: string) {
  const db = getServerClient();

  const { data, error } = await db
    .from("orders")
    .select(
      `
        id, public_token, status, total_cents, customer_snapshot, created_at, shipping_method,
        order_items ( id, product_title, variant_sku, qty, unit_price_cents, total_cents, metadata, item_type, item_id, selected_options )
      `,
    )
    .eq("store_id", store_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function _getOrderById(orderId: string, store_id: string) {
  const db = getServerClient();

  const { data, error } = await db
    .from("orders")
    .select(
      `
      id, public_token, status, total_cents, subtotal_cents, shipping_cents, discount_cents,
      customer_snapshot, created_at, shipping_method, shipping_address,
      shipped_at, delivered_at,
      order_items ( id, product_title, variant_sku, qty, unit_price_cents, total_cents, metadata, item_type, item_id, selected_options ),
      shipments ( id, tracking_code, carrier_name, tracking_url, status, shipped_at, delivered_at )
    `,
    )
    .eq("id", orderId)
    .eq("store_id", store_id)
    .single();

  if (error) throw new Error("Pedido não encontrado");
  return data;
}

export async function _updateOrderStatus(
  orderId: string,
  status: (typeof ORDER_STATUS_VALUES)[number],
  store_id: string,
) {
  const db = getServerClient();

  const { data: order, error: orderError } = await db
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("store_id", store_id)
    .single();
  if (orderError || !order) throw new Error("Pedido não encontrado ou acesso negado.");

  if (status === "cancelled") {
    // Phase 4: Atomic cancellation with stock and commission reversals
    const { error: rpcError } = await db.rpc("cancel_order", {
      p_order_id: orderId,
      p_reason: "Cancelado pelo administrador.",
    });

    if (rpcError) {
      throw new Error("Erro ao cancelar o pedido: " + rpcError.message);
    }

    return { status: "ok" as const, message: "Pedido cancelado com sucesso." };
  }

  const updatePayload: Record<string, any> = { status };
  if (status === "paid") updatePayload.paid_at = new Date().toISOString();
  if (status === "shipped") updatePayload.shipped_at = new Date().toISOString();
  if (status === "delivered") updatePayload.delivered_at = new Date().toISOString();

  const { error } = await db.from("orders").update(updatePayload).eq("id", orderId);
  if (error) throw error;
  return { status: "ok" as const, message: "Status do pedido atualizado." };
}

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

export const listOrders = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);
    if (!identity.store_id) return [];

    const data = await _listOrders(identity.store_id);
    return data || [];
  } catch (e: unknown) {
    if (e instanceof SupabaseUnconfiguredError) throw e;
    console.error("[order.functions] listOrders:", e instanceof Error ? e.message : String(e));
    return [];
  }
});

export const getOrderById = createServerFn({ method: "GET" })
  .validator(z.object({ orderId: z.string().uuid() }))
  .handler(async ({ data: { orderId } }) => {
    try {
      const identity = await getServerIdentity();
      assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);
      if (!identity.store_id) throw new Error("Contexto de loja inválido");

      const data = await _getOrderById(orderId, identity.store_id);
      return data;
    } catch (e: unknown) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[order.functions] getOrderById:", e instanceof Error ? e.message : String(e));
      throw new Error((e instanceof Error ? e.message : String(e)) || "Pedido não encontrado.");
    }
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().uuid(),
      status: z.enum(ORDER_STATUS_VALUES),
    }),
  )
  .handler(async ({ data: params }) => {
    try {
      const identity = await getServerIdentity();
      assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);
      if (!identity.store_id) throw new Error("Contexto de loja inválido");

      return await _updateOrderStatus(params.orderId, params.status, identity.store_id);
    } catch (e: unknown) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error(
        "[order.functions] updateOrderStatus:",
        e instanceof Error ? e.message : String(e),
      );
      throw new Error("Erro ao atualizar pedido.");
    }
  });

export const listPayments = createServerFn({ method: "GET" }).handler(async () => {
  try {
    // SECURITY FIX: Enforce administrative authorization
    await requireAdmin();
    const identity = await getServerIdentity();
    if (!identity.store_id) throw new Error("Contexto de loja inválido");

    const db = getServerClient();

    const { data, error } = await db
      .from("orders")
      .select(
        `
          id, public_token, status, total_cents, customer_snapshot, created_at
        `,
      )
      .eq("store_id", identity.store_id)
      .in("status", ["awaiting_payment", "payment_processing", "paid"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (e: unknown) {
    if (e instanceof SupabaseUnconfiguredError) throw e;
    console.error("[order.functions] listPayments:", e instanceof Error ? e.message : String(e));
    throw new Error("Erro ao buscar pagamentos.");
  }
});

// ---------------------------------------------------------------------------
// Customer-facing: fetch orders for the logged-in customer
// ---------------------------------------------------------------------------

export const listCustomerOrders = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const ssrClient = await getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();

    if (!user) return [];

    const { data, error } = await ssrClient
      .from("orders")
      .select(
        `
        id, public_token, status, total_cents, created_at,
        order_items ( id, product_title, variant_sku, qty, unit_price_cents, total_cents, item_type, item_id, selected_options )
      `,
      )
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[order.functions] listCustomerOrders query error:", error);
      return [];
    }

    return (data || []).map((order: any) => ({
      ...order,
      order_items:
        order.order_items?.map((item: any) => ({
          ...item,
          unit_price_cents: item.unit_price_cents ?? item.price_snapshot_cents ?? 0,
          total_cents:
            item.total_cents ??
            (item.unit_price_cents ?? item.price_snapshot_cents ?? 0) * (item.qty ?? 1),
        })) || [],
    }));
  } catch (e: unknown) {
    console.warn(
      "[order.functions] listCustomerOrders fallback:",
      e instanceof Error ? e.message : String(e),
    );
    return [];
  }
});

export const getCustomerOrder = createServerFn({ method: "GET" })
  .validator(z.object({ orderId: z.string().uuid() }))
  .handler(async ({ data: { orderId } }) => {
    try {
      const ssrClient = await getSSRClient();
      const {
        data: { user },
      } = await ssrClient.auth.getUser();

      if (!user) throw new Error("Não autenticado");

      const { data: order, error } = await ssrClient
        .from("orders")
        .select(
          `
          id, public_token, status, total_cents, subtotal_cents, shipping_cents, discount_cents,
          customer_snapshot, shipping_method, shipping_address, created_at,
          order_items ( id, product_title, variant_sku, qty, unit_price_cents, total_cents, item_type, item_id, selected_options ),
          payments ( id, method, status, amount_cents, receipt_url, receipt_status )
        `,
        )
        .eq("id", orderId)
        .eq("customer_id", user.id)
        .single();

      if (error) throw error;

      return {
        ...order,
        order_items:
          order.order_items?.map((item: any) => ({
            ...item,
            unit_price_cents: item.unit_price_cents ?? item.price_snapshot_cents ?? 0,
            total_cents:
              item.total_cents ??
              (item.unit_price_cents ?? item.price_snapshot_cents ?? 0) * (item.qty ?? 1),
          })) || [],
      };
    } catch (e: unknown) {
      console.error(
        "[order.functions] getCustomerOrder:",
        e instanceof Error ? e.message : String(e),
      );
      throw new Error(
        (e instanceof Error ? e.message : String(e)) || "Erro ao buscar detalhes do pedido.",
      );
    }
  });

export const listOrdersAwaitingShippingQuote = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      await requireAdmin();
      const identity = await getServerIdentity();
      if (!identity.store_id) throw new Error("Contexto de loja inválido");

      const db = getServerClient();
      const { data, error } = await db
        .from("orders")
        .select(
          `
            id, public_token, status, subtotal_cents, discount_cents, total_cents,
            customer_snapshot, shipping_address, created_at, shipping_method
          `,
        )
        .eq("store_id", identity.store_id)
        .eq("status", "awaiting_shipping_quote")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (e: unknown) {
      console.error("[order.functions] listOrdersAwaitingShippingQuote error:", e);
      throw new Error(
        (e instanceof Error ? e.message : String(e)) || "Erro ao buscar solicitações de frete.",
      );
    }
  },
);

export const updateOrderShippingQuote = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().uuid(),
      shippingCents: z.number().int().min(0),
    }),
  )
  .handler(async ({ data: { orderId, shippingCents } }) => {
    try {
      await requireAdmin();
      const identity = await getServerIdentity();
      if (!identity.store_id) throw new Error("Contexto de loja inválido");

      const db = getServerClient();

      // Load current order
      const { data: order, error: orderError } = await db
        .from("orders")
        .select("id, subtotal_cents, discount_cents")
        .eq("id", orderId)
        .eq("store_id", identity.store_id)
        .single();

      if (orderError || !order) throw new Error("Pedido não encontrado");

      // Recalculate total
      const newTotal = order.subtotal_cents + shippingCents - order.discount_cents;

      // Update order status to awaiting_payment, set shipping_cents and total_cents
      const { error: updateError } = await db
        .from("orders")
        .update({
          shipping_cents: shippingCents,
          total_cents: newTotal >= 0 ? newTotal : 0,
          status: "awaiting_payment",
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // Update associated payment amount
      const { error: payError } = await db
        .from("payments")
        .update({
          amount_cents: newTotal >= 0 ? newTotal : 0,
        })
        .eq("order_id", orderId);

      if (payError) throw payError;

      return { status: "success" as const };
    } catch (e: unknown) {
      console.error("[order.functions] updateOrderShippingQuote error:", e);
      throw new Error(
        (e instanceof Error ? e.message : String(e)) || "Erro ao atualizar frete do pedido.",
      );
    }
  });

// ---------------------------------------------------------------------------
// Customer-facing: get payment instructions (PIX key, instructions) for order
// Tenant-safe: reads store_id from the order, then fetches store config via
// service role. Customers cannot read the stores table directly via RLS.
// ---------------------------------------------------------------------------

export const getOrderPaymentInstructions = createServerFn({ method: "GET" })
  .validator(z.object({ orderId: z.string().uuid() }))
  .handler(async ({ data: { orderId } }) => {
    try {
      const ssrClient = await getSSRClient();
      const {
        data: { user },
      } = await ssrClient.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const db = getServerClient();

      // Verify ownership via SSR client (RLS enforces customer_id = user.id)
      const { data: order, error: orderError } = await ssrClient
        .from("orders")
        .select("id, store_id")
        .eq("id", orderId)
        .eq("customer_id", user.id)
        .single();

      if (orderError || !order) throw new Error("Pedido não encontrado");

      // Fetch store payment config via service role (stores table not exposed to customer RLS)
      const { data: store } = await db
        .from("stores")
        .select("pix_key, payment_instructions")
        .eq("id", order.store_id)
        .single();

      return {
        status: "ok" as const,
        data: {
          pix_key: store?.pix_key ?? null,
          payment_instructions: store?.payment_instructions ?? null,
        },
      };
    } catch (e: unknown) {
      console.error("[order.functions] getOrderPaymentInstructions:", e);
      throw new Error(
        (e instanceof Error ? e.message : String(e)) || "Erro ao buscar instruções de pagamento.",
      );
    }
  });
export const requestOrderReturn = createServerFn({ method: "POST" })
  .validator(
    z.object({ orderId: z.string().uuid(), reason: z.string().min(5, "Motivo muito curto") }),
  )
  .handler(async ({ data: { orderId, reason } }) => {
    try {
      const ssrClient = await getSSRClient();
      const {
        data: { user },
      } = await ssrClient.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Verify ownership and status
      const { data: order, error: orderError } = await ssrClient
        .from("orders")
        .select("id, status, store_id")
        .eq("id", orderId)
        .eq("customer_id", user.id)
        .single();

      if (orderError || !order) throw new Error("Pedido não encontrado");
      if (order.status !== "delivered")
        throw new Error("Apenas pedidos entregues podem ser devolvidos/trocados.");

      const db = getServerClient();
      const { error: updateError } = await db
        .from("orders")
        .update({ status: "return_requested" })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // Optionally create a note for the admin
      await db.from("customer_notes").insert({
        store_id: order.store_id,
        customer_id: user.id,
        content: "Solicitação de Devolução/Troca (Pedido: " + orderId + ") - Motivo: " + reason,
      });

      return { status: "success" as const };
    } catch (e: unknown) {
      console.error("[order.functions] requestOrderReturn:", e);
      throw new Error(
        (e instanceof Error ? e.message : String(e)) || "Erro ao solicitar devolução.",
      );
    }
  });

export const updateOrderShipment = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().uuid(),
      trackingCode: z.string().min(1, "Código de rastreamento é obrigatório"),
      carrierName: z.string().optional(),
      trackingUrl: z.string().optional(),
      newStatus: z.enum(["shipped", "delivered"]).optional(),
    }),
  )
  .handler(async ({ data: { orderId, trackingCode, carrierName, trackingUrl, newStatus } }) => {
    try {
      const ssrClient = await getSSRClient();
      const {
        data: { user },
      } = await ssrClient.auth.getUser();
      if (!user) throw new Error("Não autorizado");

      const { getServerIdentity } = await import("@/lib/server-access");
      const identity = await getServerIdentity();
      const db = getServerClient();

      if (
        !identity.store_id ||
        !["owner", "admin", "manager", "logistics"].includes(identity.role)
      ) {
        throw new Error("Acesso negado");
      }

      const statusToApply = newStatus || "shipped";
      const shipmentStatus = statusToApply === "delivered" ? "delivered" : "in_transit";

      // 1. Insert into shipments table
      const { data: shipment, error: shipmentError } = await db
        .from("shipments")
        .insert({
          store_id: identity.store_id,
          order_id: orderId,
          tracking_code: trackingCode,
          carrier_name: carrierName || "Transportadora",
          tracking_url: trackingUrl || "",
          status: shipmentStatus,
          shipped_at: new Date().toISOString(),
          delivered_at: statusToApply === "delivered" ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (shipmentError) throw shipmentError;

      // 2. Update order status
      const updateData: Record<string, any> = {
        status: statusToApply,
        updated_at: new Date().toISOString(),
      };
      if (statusToApply === "shipped") updateData.shipped_at = new Date().toISOString();
      if (statusToApply === "delivered") updateData.delivered_at = new Date().toISOString();

      const { data, error } = await db
        .from("orders")
        .update(updateData)
        .eq("id", orderId)
        .eq("store_id", identity.store_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (e: unknown) {
      console.error("[order.functions] updateOrderShipment error:", e);
      throw new Error(
        (e instanceof Error ? e.message : String(e)) || "Erro ao atualizar rastreamento do pedido.",
      );
    }
  });

export const editOrderItems = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().uuid(),
      newItems: z.array(
        z.object({
          variant_id: z.string().uuid(),
          product_title: z.string(),
          qty: z.number().int().min(1),
        }),
      ),
    }),
  )
  .handler(async ({ data: { orderId, newItems } }) => {
    try {
      const ssrClient = await getSSRClient();
      const {
        data: { user },
      } = await ssrClient.auth.getUser();
      if (!user) throw new Error("Não autorizado");

      const { getServerIdentity } = await import("@/lib/server-access");
      const identity = await getServerIdentity();
      const db = getServerClient();

      if (!identity.store_id || !["owner", "admin", "manager"].includes(identity.role)) {
        throw new Error("Acesso negado");
      }

      const { data, error } = await db.rpc("admin_modify_order_items", {
        p_order_id: orderId,
        p_new_items: newItems,
      });

      if (error) throw error;
      return data;
    } catch (e: unknown) {
      console.error("[order.functions] editOrderItems error:", e);
      throw new Error(
        (e instanceof Error ? e.message : String(e)) || "Erro ao editar itens do pedido.",
      );
    }
  });

// ---------------------------------------------------------------------------
// Recibos (Receipt)
// ---------------------------------------------------------------------------

export const getOrderForReceipt = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    try {
      const identity = await getServerIdentity();
      assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

      const db = getServerClient();
      const { data, error } = await db
        .from("orders")
        .select(
          `
          id, public_token, status, total_cents, subtotal_cents, shipping_cents, discount_cents,
          customer_snapshot, created_at, shipping_method,
          order_items ( id, product_title, variant_sku, qty, unit_price_cents, total_cents, item_type, item_id, selected_options )
        `,
        )
        .eq("id", id)
        .eq("store_id", identity.store_id)
        .single();
      if (error) throw new Error("Pedido não encontrado");
      return data;
    } catch (e: unknown) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[order.functions] getOrderForReceipt error:", e);
      throw new Error(
        (e instanceof Error ? e.message : String(e)) || "Erro ao carregar recibo do pedido.",
      );
    }
  });

export const assignDriverToOrder = createServerFn({ method: "POST" })
  .validator(z.object({ orderId: z.string().uuid(), driverId: z.string().uuid() }))
  .handler(async ({ data: { orderId, driverId } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "logistics"]);

    // 1. Create the dispatch log
    const { error: dispatchErr } = await supabase.from("delivery_dispatches").insert({
      store_id: identity.store_id,
      order_id: orderId,
      driver_id: driverId,
      status: "assigned",
    });

    if (dispatchErr) throw new Error("Erro ao criar tentativa de despacho: " + dispatchErr.message);

    // 2. Update the order
    const { error: orderErr } = await supabase
      .from("orders")
      .update({ driver_id: driverId, status: "shipped", updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("store_id", identity.store_id);

    if (orderErr) throw new Error("Erro ao atualizar o status do pedido: " + orderErr.message);

    return { success: true };
  });

export const respondToDispatch = createServerFn({ method: "POST" })
  .validator(
    z.object({
      dispatchId: z.string().uuid(),
      response: z.enum(["accepted", "rejected", "failed", "delivered"]),
      reason: z.string().optional(),
    }),
  )
  .handler(async ({ data: { dispatchId, response, reason } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "logistics"]);

    const payload: any = {
      status: response,
      updated_at: new Date().toISOString(),
    };

    if (response === "accepted" || response === "rejected") {
      payload.responded_at = payload.updated_at;
    }
    if (response === "failed" || response === "delivered") {
      payload.completed_at = payload.updated_at;
    }
    if (reason) payload.failure_reason = reason;

    const { error } = await supabase
      .from("delivery_dispatches")
      .update(payload)
      .eq("id", dispatchId)
      .eq("store_id", identity.store_id);

    if (error) throw new Error("Erro ao registrar resposta do entregador: " + error.message);

    return { success: true };
  });

export const closePdvComanda = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().uuid(),
      paymentMethod: z.enum(["cash", "pix", "card", "token"]),
    }),
  )
  .handler(async ({ data: { orderId, paymentMethod } }) => {
    try {
      const identity = await getServerIdentity();
      assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

      const db = getServerClient();

      // 1. Fetch order
      const { data: order, error: orderError } = await db
        .from("orders")
        .select("id, total_cents, table_identifier, store_id")
        .eq("id", orderId)
        .eq("store_id", identity.store_id)
        .single();

      if (orderError || !order) throw new Error("Comanda não encontrada.");

      // 2. Update order status to 'paid'
      const { error: updateError } = await db
        .from("orders")
        .update({
          status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // 3. If paid in cash, automatically inject entry into active cash register if open
      if (paymentMethod === "cash") {
        const { data: activeRegister } = await db
          .from("cash_registers")
          .select("id")
          .eq("store_id", identity.store_id)
          .eq("status", "open")
          .maybeSingle();

        if (activeRegister) {
          await db.from("cash_register_entries").insert({
            cash_register_id: activeRegister.id,
            order_id: orderId,
            amount_cents: order.total_cents,
            entry_type: "cash",
            notes: `Pagamento de Comanda #${order.table_identifier || orderId.slice(0, 8)}`,
            created_by: identity.id,
          });
        }
      }

      return { success: true };
    } catch (e: unknown) {
      console.error("[order.functions] closePdvComanda error:", e);
      throw new Error(
        (e instanceof Error ? e.message : String(e)) || "Erro ao liquidar comanda.",
      );
    }
  });

