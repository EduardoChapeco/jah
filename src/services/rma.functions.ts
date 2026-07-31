import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";
import { logAuditAction } from "./audit.functions";

export const requestRma = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().uuid(),
      type: z.enum(["exchange", "return", "warranty"]),
      reason: z.string().min(5),
      items: z.array(
        z.object({
          orderItemId: z.string().uuid(),
          qty: z.number().int().positive(),
          reason: z.string().min(5),
          condition: z.string().optional(),
          photos: z.array(z.string()).optional(),
        })
      ),
    })
  )
  .handler(async ({ data: { orderId, type, reason, items } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity.id) {
      throw new Error("Você precisa estar logado para solicitar troca/devolução");
    }

    // 1. Fetch Order and check CDC eligibility (7 days for return, 30 for exchange)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, store_id, status, delivered_at")
      .eq("id", orderId)
      .eq("customer_id", identity.id)
      .single();

    if (orderError || !order) {
      throw new Error("Pedido não encontrado");
    }

    if (["draft", "cancelled", "payment_failed"].includes(order.status)) {
      throw new Error("Este pedido não é elegível para troca.");
    }

    if (order.delivered_at) {
      const daysSinceDelivery = (new Date().getTime() - new Date(order.delivered_at).getTime()) / (1000 * 3600 * 24);
      if (type === "return" && daysSinceDelivery > 7) {
        throw new Error("O prazo legal de 7 dias para arrependimento expirou.");
      }
      if (type === "exchange" && daysSinceDelivery > 30) {
        throw new Error("O prazo de 30 dias para troca expirou.");
      }
    }

    // 2. Create RMA Request
    const { data: rmaRequest, error: insertError } = await supabase
      .from("rma_requests")
      .insert({
        store_id: order.store_id,
        order_id: order.id,
        customer_id: identity.id,
        type,
        notes: reason,
        status: "pending",
        shipping_responsibility: "store", // By default store pays for first exchange or CDC return
      })
      .select("id")
      .single();

    if (insertError || !rmaRequest) {
      throw new Error("Erro ao solicitar troca: " + insertError?.message);
    }

    // 3. Insert RMA Items
    const rmaItems = items.map(item => ({
      rma_id: rmaRequest.id,
      order_item_id: item.orderItemId,
      qty: item.qty,
      reason: item.reason,
      condition: item.condition || null,
      photos_jsonb: item.photos || [],
    }));

    const { error: itemsError } = await supabase.from("rma_items").insert(rmaItems);
    if (itemsError) {
      throw new Error("Erro ao vincular itens à troca: " + itemsError.message);
    }

    // 4. Create an internal ticket for this RMA
    const { data: ticket } = await supabase.from("tickets").insert({
      store_id: order.store_id,
      customer_id: identity.id,
      context_type: "rma",
      context_id: rmaRequest.id,
      subject: `Solicitação de ${type === 'return' ? 'Devolução' : 'Troca'} #${rmaRequest.id.substring(0, 8)}`,
    }).select("id").single();

    if (ticket) {
      await supabase.from("ticket_messages").insert({
        ticket_id: ticket.id,
        sender_id: identity.id,
        content: `Solicitação aberta. Motivo geral: ${reason}`
      });
    }

    return { status: "success", rmaId: rmaRequest.id };
  });

export const listAdminRmas = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "finance"]);

  const { data: rmas, error } = await supabase
    .from("rma_requests")
    .select(
      "id, type, status, resolution, requested_at, orders(public_token, total_cents), profiles!rma_requests_customer_id_fkey(full_name)"
    )
    .eq("store_id", identity.store_id)
    .order("requested_at", { ascending: false });

  if (error || !rmas) return [];

  return rmas.map(rma => ({
      id: rma.id,
      type: rma.type,
      status: rma.status,
      resolution: rma.resolution,
      requestedAt: rma.requested_at,
      orderToken: (rma.orders as any)?.public_token,
      orderTotal: (rma.orders as any)?.total_cents,
      customerName: (rma.profiles as any)?.full_name || "Cliente Desconhecido",
  }));
});

export const approveRma = createServerFn({ method: "POST" })
  .validator(
    z.object({
      rmaId: z.string().uuid(),
      resolution: z.enum(["store_credit", "refund", "replacement"]),
      shippingCostCents: z.number().int().optional(),
    })
  )
  .handler(async ({ data: { rmaId, resolution, shippingCostCents } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

    const { error } = await supabase
      .from("rma_requests")
      .update({
        status: "authorized",
        resolution,
        shipping_cost_cents: shippingCostCents || 0,
      })
      .eq("id", rmaId)
      .eq("store_id", identity.store_id);

    if (error) {
      throw new Error("Erro ao aprovar RMA: " + error.message);
    }

    // Audit Log
    await logAuditAction(identity, "APPROVED_RMA", "rma_requests", rmaId, { resolution, shippingCostCents });

    return { status: "success" };
  });
