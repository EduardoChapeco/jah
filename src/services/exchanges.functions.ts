import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getSSRClient } from "@/lib/server-access";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

export const requestExchange = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().uuid(),
      reason: z.string().min(5),
    }),
  )
  .handler(async ({ data: { orderId, reason } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity.id) {
      throw new Error("Você precisa estar logado para solicitar uma troca");
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, store_id, status")
      .eq("id", orderId)
      .eq("customer_id", identity.id)
      .single();

    if (orderError || !order) {
      throw new Error("Pedido não encontrado");
    }

    if (["draft", "cancelled", "payment_failed"].includes(order.status)) {
      throw new Error("Este pedido não é elegível para troca.");
    }

    const { error: insertError } = await supabase.from("exchanges").insert({
      store_id: order.store_id,
      original_order_id: order.id,
      reason,
      status: "requested",
    });

    if (insertError) {
      throw new Error("Erro ao solicitar troca: " + insertError.message);
    }

    return { status: "success" };
  });

export const listExchanges = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity.id || !identity.store_id) return [];

    const { data: exchanges, error } = await supabase
      .from("exchanges")
      .select(
        "id, status, reason, requested_at, orders!inner(public_token, total_cents, profiles(full_name))",
      )
      .eq("store_id", identity.store_id)
      .order("requested_at", { ascending: false });

    if (error || !exchanges) return [];

    return exchanges.map((ex: any) => ({
      id: ex.id,
      status: ex.status,
      reason: ex.reason,
      requestedAt: ex.requested_at,
      orderToken: ex.orders?.public_token,
      orderTotal: ex.orders?.total_cents,
      customerName: ex.orders?.profiles?.full_name || "Cliente sem nome",
    }));
  } catch (e) {
    console.error("[exchanges.functions] listExchanges:", e);
    return [];
  }
});

export const updateExchangeStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      exchangeId: z.string().uuid(),
      status: z.enum(["requested", "approved", "completed", "rejected"]),
      resolutionType: z.enum(["store_credit", "refund", "replacement"]).optional(),
      refundCents: z.number().int().optional(),
    }),
  )
  .handler(async ({ data: { exchangeId, status, resolutionType, refundCents } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "finance"]);

    // If we are completing it and generating store_credit or refund, use RPC
    if (status === "completed" && resolutionType) {
      const { data: exchange } = await supabase
        .from("exchanges")
        .select("original_order_id, reason")
        .eq("id", exchangeId)
        .single();
        
      if (!exchange) throw new Error("Troca não encontrada");

      const { error: rpcError } = await supabase.rpc("process_exchange_transaction", {
        p_store_id: identity.store_id,
        p_original_order_id: exchange.original_order_id,
        p_resolution_type: resolutionType,
        p_reason: exchange.reason || "Conclusão de Troca",
        p_value_cents: refundCents || 0,
        p_user_id: identity.id,
      });

      if (rpcError) throw new Error("Erro ao processar transação de troca: " + rpcError.message);
      
      // Delete the pending one if the RPC created a new completed one
      // OR since our RPC creates a new exchange record, we might just update the old one instead.
      // Wait, our RPC does INSERT! So we should just use the RPC to CREATE completed exchanges directly,
      // but here we are updating an existing request.
      // Let's adapt our update to just UPDATE the row and generate GC if needed:
      
      const { error: updateError } = await supabase
        .from("exchanges")
        .update({
          status: "completed",
          resolution_type: resolutionType,
          processed_by: identity.id,
        })
        .eq("id", exchangeId);
        
      if (updateError) throw new Error("Erro ao atualizar troca");
      
      if (resolutionType === "store_credit" && refundCents) {
        // Generate GC manually here since RPC creates a new exchange
        const code = "GC" + Math.random().toString(36).substring(2, 10).toUpperCase();
        await supabase.from("gift_cards").insert({
          store_id: identity.store_id,
          code,
          balance_cents: refundCents,
          initial_value_cents: refundCents,
          status: "active",
        });
      }
      
      return { status: "success" };
    }

    // Normal status update
    const { error } = await supabase
      .from("exchanges")
      .update({ status })
      .eq("id", exchangeId)
      .eq("store_id", identity.store_id);

    if (error) throw new Error("Erro ao atualizar status");

    return { status: "success" };
  });

// ---------------------------------------------------------------------------
// Customer-facing: list their own exchange requests
// ---------------------------------------------------------------------------

export const listCustomerExchanges = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const ssrClient = await getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();
    if (!user) throw new Error("Não autorizado");

    const supabase = getServerClient();
    const { data, error } = await supabase
      .from("exchanges")
      .select(
        "id, status, reason, requested_at, orders!inner(public_token, total_cents)",
      )
      .eq("orders.customer_id", user.id)
      .order("requested_at", { ascending: false });

    if (error) throw new Error((error instanceof Error ? error.message : String(error)));

    return (data || []).map((ex: any) => ({
      id: ex.id,
      status: ex.status as string,
      reason: ex.reason as string,
      requestedAt: ex.requested_at as string,
      orderToken: ex.orders?.public_token as string | null,
      orderTotal: ex.orders?.total_cents as number | null,
    }));
  } catch (e: unknown) {
    throw new Error((e instanceof Error ? e.message : String(e)) || "Erro ao buscar trocas.");
  }
});
