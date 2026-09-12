import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";
import { addRegisterEntry } from "./cash.functions";

// ---------------------------------------------------------------------------
// TYPES & SCHEMAS
// ---------------------------------------------------------------------------

export const inboundWebhookPayloadSchema = z.object({
  platform: z.enum(["mercadolivre", "ifood", "focus_nfe", "nuvem_fiscal", "shopee", "melhorenvio", "correios"]),
  eventId: z.string().optional(),
  topic: z.string().optional(),
  resourceId: z.string().optional(),
  storeId: z.string().uuid().optional(),
  payload: z.record(z.any()).default({}),
});

export type InboundWebhookPayload = z.infer<typeof inboundWebhookPayloadSchema>;

// ---------------------------------------------------------------------------
// WEBHOOK INBOX & IDEMPOTENCY HANDLER
// ---------------------------------------------------------------------------

/**
 * Processa um webhook de entrada de forma idempotente:
 * 1. Verifica se o eventId já foi gravado.
 * 2. Registra na tabela marketplace_webhook_events com status 'received'.
 * 3. Encaminha para a rotina específica do provedor.
 * 4. Atualiza o status para 'processed' ou 'failed'.
 */
export async function handleInboundWebhook(data: InboundWebhookPayload): Promise<{
  status: "processed" | "ignored" | "duplicate";
  eventId: string;
  message?: string;
}> {
  const supabase = getServerClient();

  // 1. Verificação de idempotência se eventId estiver presente
  if (data.eventId) {
    const { data: existing } = await supabase
      .from("marketplace_webhook_events")
      .select("id, status")
      .eq("platform", data.platform)
      .eq("event_id", data.eventId)
      .maybeSingle();

    if (existing) {
      return {
        status: "duplicate",
        eventId: existing.id,
        message: "Evento já recebido e registrado anteriormente.",
      };
    }
  }

  // 2. Gravação no Transactional Inbox
  const { data: eventRecord, error: insertErr } = await supabase
    .from("marketplace_webhook_events")
    .insert({
      platform: data.platform,
      event_id: data.eventId || null,
      topic: data.topic || null,
      resource_id: data.resourceId || null,
      payload: data.payload,
      store_id: data.storeId || null,
      status: "received",
    })
    .select("id")
    .single();

  if (insertErr || !eventRecord) {
    console.error("[webhooks] Erro ao gravar webhook event:", insertErr);
    throw new Error("Falha ao registrar webhook event no transactional inbox.");
  }

  const recordId = eventRecord.id;

  try {
    // 3. Roteamento por Provedor
    switch (data.platform) {
      case "mercadolivre":
        await processMercadoLivreEvent(data.resourceId, data.payload, data.storeId);
        break;
      case "ifood":
        await processIfoodEvent(data.resourceId, data.payload, data.storeId);
        break;
      case "focus_nfe":
      case "nuvem_fiscal":
        await processFiscalEvent(data.resourceId, data.payload, data.storeId);
        break;
      default:
        // Plataforma sem processador específico automático, fica gravado no log
        break;
    }

    // 4. Marca como processado com sucesso
    await supabase
      .from("marketplace_webhook_events")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", recordId);

    return { status: "processed", eventId: recordId };
  } catch (procErr: any) {
    console.error(`[webhooks:${data.platform}] Erro no processamento:`, procErr);
    await supabase
      .from("marketplace_webhook_events")
      .update({
        status: "failed",
        error_message: procErr?.message || "Erro desconhecido",
        processed_at: new Date().toISOString(),
      })
      .eq("id", recordId);

    return {
      status: "ignored",
      eventId: recordId,
      message: procErr?.message || "Erro no processamento interno",
    };
  }
}

// ---------------------------------------------------------------------------
// PROCESSADORES ESPECÍFICOS POR PLATAFORMA
// ---------------------------------------------------------------------------

/**
 * Processa notificação de pedido do Mercado Livre
 */
async function processMercadoLivreEvent(resourceId?: string, payload: any = {}, storeId?: string) {
  const supabase = getServerClient();
  const orderId = resourceId || payload.resource || payload.id;
  if (!orderId) return;

  const targetStoreId = storeId || payload.store_id;
  if (!targetStoreId) return;

  const totalAmountCents = Math.round((Number(payload.total_amount || payload.order_amount || 0)) * 100);
  const feeCents = Math.round((Number(payload.fee || payload.marketplace_fee || (totalAmountCents * 0.16 / 100))) * 100);
  const netCents = Math.max(0, totalAmountCents - feeCents);

  // Ingestão na tabela de pedidos externos
  await supabase
    .from("marketplace_external_orders")
    .upsert(
      {
        store_id: targetStoreId,
        platform: "mercadolivre",
        external_order_id: String(orderId),
        external_status: payload.status === "paid" ? "paid" : "created",
        buyer_name: payload.buyer?.nickname || payload.customer_name || "Cliente Mercado Livre",
        total_amount_cents: totalAmountCents,
        marketplace_fee_cents: feeCents,
        net_payout_cents: netCents,
        import_status: "imported",
        raw_data: payload,
      },
      { onConflict: "store_id, platform, external_order_id" }
    );

  // Se o pedido for pago, registra no fluxo de caixa com o canal correspondente
  if (payload.status === "paid" && totalAmountCents > 0) {
    try {
      await addRegisterEntry({
        data: {
          storeId: targetStoreId,
          type: "INCOME",
          category: "Venda Externa (Mercado Livre)",
          amountCents: totalAmountCents,
          description: `Venda Externa Mercado Livre #${orderId}`,
          paymentMethod: "OTHER",
          channelSource: "mercadolivre",
          marketplaceFeeCents: feeCents,
          netPayoutCents: netCents,
          externalReferenceId: String(orderId),
        },
      });
    } catch (cashErr) {
      console.warn("[webhooks:mercadolivre] Falha ao registrar fluxo de caixa:", cashErr);
    }
  }
}

/**
 * Processa evento de pedido do iFood (Padrão OpenDelivery v1.0)
 */
async function processIfoodEvent(resourceId?: string, payload: any = {}, storeId?: string) {
  const supabase = getServerClient();
  const orderId = resourceId || payload.orderId || payload.id;
  if (!orderId) return;

  const targetStoreId = storeId || payload.store_id;
  if (!targetStoreId) return;

  const code = payload.code || payload.status;
  const statusMap: Record<string, string> = {
    PLACED: "created",
    CONFIRMED: "confirmed",
    READY_FOR_PICKUP: "ready",
    DISPATCHED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
  };
  const normalizedStatus = statusMap[code] || "created";

  const totalAmountCents = Math.round((Number(payload.total?.orderAmount || payload.orderAmount || 0)) * 100);
  const feeCents = Math.round((Number(payload.total?.fees || (totalAmountCents * 0.12 / 100))) * 100);
  const netCents = Math.max(0, totalAmountCents - feeCents);

  await supabase
    .from("marketplace_external_orders")
    .upsert(
      {
        store_id: targetStoreId,
        platform: "ifood",
        external_order_id: String(orderId),
        external_status: normalizedStatus,
        buyer_name: payload.customer?.name || "Cliente iFood",
        total_amount_cents: totalAmountCents,
        marketplace_fee_cents: feeCents,
        net_payout_cents: netCents,
        import_status: "imported",
        raw_data: payload,
      },
      { onConflict: "store_id, platform, external_order_id" }
    );
}

/**
 * Processa callback de autorização fiscal (Focus NFe / Nuvem Fiscal)
 */
async function processFiscalEvent(resourceId?: string, payload: any = {}, storeId?: string) {
  const supabase = getServerClient();
  const referenceId = resourceId || payload.ref || payload.id;
  if (!referenceId) return;

  const status = String(payload.status || payload.situacao || "").toLowerCase();
  let normalizedStatus: "pending" | "processing" | "issued" | "cancelled" | "error" = "processing";

  if (status.includes("autorizad") || status === "issued") {
    normalizedStatus = "issued";
  } else if (status.includes("cancelad")) {
    normalizedStatus = "cancelled";
  } else if (status.includes("rejeit") || status.includes("erro")) {
    normalizedStatus = "error";
  }

  const accessKey = payload.chave_nfe || payload.chave_acesso || null;
  const danfeUrl = payload.caminho_danfe || payload.danfe_url || payload.danfe_pdf_url || null;
  const xmlUrl = payload.caminho_xml_nota_fiscal || payload.xml_url || null;

  const updateData: Record<string, any> = {
    status: normalizedStatus,
    nfe_key: accessKey,
    danfe_pdf_url: danfeUrl,
    xml_url: xmlUrl,
    updated_at: new Date().toISOString(),
  };

  if (normalizedStatus === "issued") {
    updateData.issued_at = new Date().toISOString();
  } else if (normalizedStatus === "cancelled") {
    updateData.cancelled_at = new Date().toISOString();
  }

  await supabase
    .from("store_nfe_invoices")
    .update(updateData)
    .or(`id.eq.${referenceId},nfe_key.eq.${referenceId}`);
}

// ---------------------------------------------------------------------------
// SERVER FUNCTIONS PARA CONSULTA E GESTÃO
// ---------------------------------------------------------------------------

/**
 * Lista os eventos de webhooks recebidos para auditoria do lojista no Workspace
 */
export const listStoreWebhookEvents = createServerFn({ method: "GET" })
  .validator(
    z.object({
      platform: z.string().optional(),
      status: z.enum(["all", "received", "processed", "ignored", "failed"]).default("all"),
      limit: z.number().int().min(1).max(100).default(30),
    }).default({ status: "all", limit: 30 })
  )
  .handler(async ({ data: { platform, status, limit } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin"]);

    let query = supabase
      .from("marketplace_webhook_events")
      .select("id, platform, event_id, topic, resource_id, status, error_message, processed_at, created_at")
      .eq("store_id", identity.store_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (platform && platform !== "all") {
      query = query.eq("platform", platform);
    }
    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("[listStoreWebhookEvents] Erro ao listar eventos:", error);
      return [];
    }

    return data || [];
  });
