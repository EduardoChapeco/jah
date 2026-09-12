import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getSSRClient } from "@/lib/server-access";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";
import { logSystemError } from "@/lib/logger";

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
      .select("id, store_id, status, total_cents")
      .eq("id", orderId)
      .eq("customer_id", identity.id)
      .single();

    if (orderError || !order) {
      throw new Error("Pedido não encontrado ou não pertence ao seu usuário");
    }

    if (["draft", "cancelled", "payment_failed"].includes(order.status)) {
      throw new Error("Este pedido não é elegível para troca.");
    }

    const { error: insertError } = await supabase.from("exchanges").insert({
      store_id: order.store_id,
      original_order_id: order.id,
      customer_id: identity.id,
      created_by: identity.id,
      total_value_cents: order.total_cents || 0,
      reason,
      status: "requested",
    });

    if (insertError) {
      await logSystemError({
        route: "requestExchange",
        page_url: "/workspace/pedidos/trocas",
        schema_name: "public",
        table_name: "exchanges",
        contract_name: "requestExchange",
        error_message: insertError.message,
      });
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
        "id, status, reason, created_at, total_value_cents, resolution_type, original_order_id, orders:original_order_id(id, public_token, total_cents, customer_snapshot)",
      )
      .eq("store_id", identity.store_id)
      .order("created_at", { ascending: false });

    if (error || !exchanges) {
      console.error("[exchanges.functions] listExchanges query error:", error);
      await logSystemError({
        route: "listExchanges",
        page_url: "/workspace/pedidos/trocas",
        schema_name: "public",
        table_name: "exchanges",
        contract_name: "listExchanges",
        error_message: error?.message || "Falha ao carregar trocas",
      });
      return [];
    }

    return exchanges.map((ex: any) => {
      const order = ex.orders;
      const custName =
        order?.customer_snapshot?.full_name ||
        order?.customer_snapshot?.name ||
        "Cliente";
      return {
        id: ex.id,
        status: ex.status,
        reason: ex.reason,
        requestedAt: ex.created_at,
        orderToken: order?.public_token || "N/A",
        orderTotal: ex.total_value_cents || order?.total_cents || 0,
        customerName: custName,
        resolutionType: ex.resolution_type,
      };
    });
  } catch (e: any) {
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

    // Se estiver concluindo com resolução, usa a RPC atômica idempotente
    if (status === "completed" && resolutionType) {
      const { data: exchange } = await supabase
        .from("exchanges")
        .select("original_order_id, reason, total_value_cents")
        .eq("id", exchangeId)
        .single();

      if (!exchange) throw new Error("Troca não encontrada");

      const { data: rpcResult, error: rpcError } = await supabase.rpc("process_exchange_transaction", {
        p_store_id: identity.store_id,
        p_original_order_id: exchange.original_order_id,
        p_resolution_type: resolutionType,
        p_reason: exchange.reason || "Conclusão de Troca",
        p_value_cents: refundCents ?? exchange.total_value_cents ?? 0,
        p_user_id: identity.id,
        p_exchange_id: exchangeId,
      });

      if (rpcError) {
        await logSystemError({
          route: "updateExchangeStatus.rpc",
          page_url: "/workspace/pedidos/trocas",
          schema_name: "public",
          table_name: "exchanges",
          contract_name: "process_exchange_transaction",
          error_message: rpcError.message,
        });
        throw new Error("Erro ao processar transação de troca: " + rpcError.message);
      }

      return { status: "success", rpcResult };
    }

    // Atualização normal de status (approved / rejected)
    const { error } = await supabase
      .from("exchanges")
      .update({
        status,
        processed_by: identity.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", exchangeId)
      .eq("store_id", identity.store_id);

    if (error) {
      await logSystemError({
        route: "updateExchangeStatus",
        page_url: "/workspace/pedidos/trocas",
        schema_name: "public",
        table_name: "exchanges",
        contract_name: "updateExchangeStatus",
        error_message: error.message,
      });
      throw new Error("Erro ao atualizar status: " + error.message);
    }

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
        "id, status, reason, created_at, total_value_cents, original_order_id, orders:original_order_id(public_token, total_cents)",
      )
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error instanceof Error ? error.message : String(error));

    return (data || []).map((ex: any) => ({
      id: ex.id,
      status: ex.status as string,
      reason: ex.reason as string,
      requestedAt: ex.created_at as string,
      orderToken: ex.orders?.public_token as string | null,
      orderTotal: ex.total_value_cents || (ex.orders?.total_cents as number | null) || 0,
    }));
  } catch (e: unknown) {
    throw new Error((e instanceof Error ? e.message : String(e)) || "Erro ao buscar trocas.");
  }
});
