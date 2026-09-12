import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";
import { logSystemError } from "@/lib/logger";

export type ChannelOrigin =
  | "mercadolivre"
  | "amazon"
  | "magalu"
  | "shopee"
  | "ifood"
  | "rappi"
  | "amodelivery"
  | "correios"
  | "balcao_pos"
  | "vitrine_online"
  | "outros";

export interface ChannelDRESummaryDTO {
  channel: ChannelOrigin;
  channel_label: string;
  order_count: number;
  gross_revenue_cents: number;
  platform_fees_cents: number;
  gateway_fees_cents: number;
  shipping_costs_cents: number;
  net_revenue_cents: number;
  gross_margin_percent: number;
}

export interface ChannelFeeLineDTO {
  id: string;
  order_id: string | null;
  external_order_id: string | null;
  platform: string;
  fee_type: string;
  description: string;
  amount_cents: number;
  occurred_at: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  mercadolivre: "Mercado Livre",
  amazon: "Amazon",
  magalu: "Magazine Luiza",
  shopee: "Shopee",
  ifood: "iFood",
  rappi: "Rappi",
  amodelivery: "Amo Delivery",
  correios: "Correios",
  balcao_pos: "Balcão / PDV",
  vitrine_online: "Vitrine Online",
  outros: "Outros",
};

/**
 * Retorna o DRE (Demonstração de Resultado) consolidado por canal de venda.
 * Todos os valores são em centavos (integer) para precisão máxima.
 */
export const getChannelDRE = createServerFn({ method: "GET" })
  .validator(
    z.object({
      storeId: z.string().uuid().optional(),
      startDate: z.string().date().optional(),
      endDate: z.string().date().optional(),
    }).optional()
  )
  .handler(async ({ data }): Promise<ChannelDRESummaryDTO[]> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager"]);

    const targetStoreId = data?.storeId || identity.store_id;
    if (!targetStoreId) throw new Error("Loja não identificada.");

    // Busca pedidos externos com dados financeiros por canal
    let externalQuery = supabase
      .from("marketplace_external_orders")
      .select(
        "platform, total_amount_cents, marketplace_fee_cents, net_payout_cents, shipping_cost_cents"
      )
      .eq("store_id", targetStoreId);

    if (data?.startDate) {
      externalQuery = externalQuery.gte("imported_at", data.startDate);
    }
    if (data?.endDate) {
      externalQuery = externalQuery.lte("imported_at", data.endDate + "T23:59:59Z");
    }

    const { data: externalOrders } = await externalQuery;

    // Busca pedidos da vitrine online com channel_origin
    let ownQuery = supabase
      .from("orders")
      .select("channel_origin, total_amount_cents, shipping_cost_cents")
      .eq("store_id", targetStoreId)
      .in("status", ["completed", "delivered", "paid"]);

    if (data?.startDate) {
      ownQuery = ownQuery.gte("created_at", data.startDate);
    }
    if (data?.endDate) {
      ownQuery = ownQuery.lte("created_at", data.endDate + "T23:59:59Z");
    }

    const { data: ownOrders } = await ownQuery;

    // Consolida por canal
    const summaryMap = new Map<string, ChannelDRESummaryDTO>();

    // Processa pedidos externos (marketplaces)
    for (const order of externalOrders || []) {
      const channel = (order.platform || "outros") as ChannelOrigin;
      const current = summaryMap.get(channel) || {
        channel,
        channel_label: CHANNEL_LABELS[channel] || channel,
        order_count: 0,
        gross_revenue_cents: 0,
        platform_fees_cents: 0,
        gateway_fees_cents: 0,
        shipping_costs_cents: 0,
        net_revenue_cents: 0,
        gross_margin_percent: 0,
      };

      current.order_count += 1;
      current.gross_revenue_cents += order.total_amount_cents || 0;
      current.platform_fees_cents += order.marketplace_fee_cents || 0;
      current.shipping_costs_cents += order.shipping_cost_cents || 0;
      current.net_revenue_cents += order.net_payout_cents || 0;

      summaryMap.set(channel, current);
    }

    // Processa pedidos próprios (vitrine/PDV)
    for (const order of ownOrders || []) {
      const channel = ((order.channel_origin as ChannelOrigin) || "vitrine_online");
      const current = summaryMap.get(channel) || {
        channel,
        channel_label: CHANNEL_LABELS[channel] || channel,
        order_count: 0,
        gross_revenue_cents: 0,
        platform_fees_cents: 0,
        gateway_fees_cents: 0,
        shipping_costs_cents: 0,
        net_revenue_cents: 0,
        gross_margin_percent: 0,
      };

      current.order_count += 1;
      current.gross_revenue_cents += order.total_amount_cents || 0;
      current.shipping_costs_cents += order.shipping_cost_cents || 0;
      // Pedidos próprios: sem taxa de plataforma, net = gross
      current.net_revenue_cents += order.total_amount_cents || 0;

      summaryMap.set(channel, current);
    }

    // Calcula margem bruta
    const result = Array.from(summaryMap.values()).map((row) => ({
      ...row,
      gross_margin_percent:
        row.gross_revenue_cents > 0
          ? Math.round((row.net_revenue_cents / row.gross_revenue_cents) * 10000) / 100
          : 0,
    }));

    // Ordena por receita bruta descrescente
    result.sort((a, b) => b.gross_revenue_cents - a.gross_revenue_cents);

    return result;
  });

/**
 * Retorna linha a linha das taxas cobradas por uma plataforma específica.
 * Útil para o relatório "Taxas Mercado Livre", "Taxas iFood", etc.
 */
export const getChannelFeeReport = createServerFn({ method: "GET" })
  .validator(
    z.object({
      storeId: z.string().uuid().optional(),
      platform: z.string().min(1),
      startDate: z.string().date().optional(),
      endDate: z.string().date().optional(),
      limit: z.number().int().min(1).max(500).default(100),
    })
  )
  .handler(async ({ data }): Promise<ChannelFeeLineDTO[]> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager"]);

    const targetStoreId = data.storeId || identity.store_id;
    if (!targetStoreId) throw new Error("Loja não identificada.");

    let query = supabase
      .from("marketplace_external_orders")
      .select(
        "id, order_id, external_order_id, platform, marketplace_fee_cents, shipping_cost_cents, imported_at"
      )
      .eq("store_id", targetStoreId)
      .eq("platform", data.platform)
      .gt("marketplace_fee_cents", 0)
      .order("imported_at", { ascending: false })
      .limit(data.limit);

    if (data?.startDate) {
      query = query.gte("imported_at", data.startDate);
    }
    if (data?.endDate) {
      query = query.lte("imported_at", data.endDate + "T23:59:59Z");
    }

    const { data: rows, error } = await query;
    if (error) {
      await logSystemError({
        operation: "getChannelFeeReport",
        error,
        table_name: "marketplace_external_orders",
        contract_name: "getChannelFeeReport",
      });
      return [];
    }

    return (rows || []).map((r) => ({
      id: r.id,
      order_id: r.order_id,
      external_order_id: r.external_order_id,
      platform: r.platform,
      fee_type: "marketplace_commission",
      description: `Comissão ${CHANNEL_LABELS[r.platform] || r.platform}`,
      amount_cents: r.marketplace_fee_cents || 0,
      occurred_at: r.imported_at,
    }));
  });

/**
 * Exporta o relatório de DRE por canal em formato CSV.
 */
export const exportChannelDRECsv = createServerFn({ method: "GET" })
  .validator(
    z.object({
      storeId: z.string().uuid().optional(),
      startDate: z.string().date().optional(),
      endDate: z.string().date().optional(),
    }).optional()
  )
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin"]);

    // Reutiliza getChannelDRE internamente
    const rows = await getChannelDRE({ data: data || undefined });

    const headers = [
      "Canal",
      "Pedidos",
      "Receita Bruta (R$)",
      "Taxas Plataforma (R$)",
      "Frete (R$)",
      "Receita Líquida (R$)",
      "Margem (%)",
    ];

    const csvLines = [
      headers.join(";"),
      ...rows.map((row) =>
        [
          row.channel_label,
          row.order_count,
          (row.gross_revenue_cents / 100).toFixed(2).replace(".", ","),
          (row.platform_fees_cents / 100).toFixed(2).replace(".", ","),
          (row.shipping_costs_cents / 100).toFixed(2).replace(".", ","),
          (row.net_revenue_cents / 100).toFixed(2).replace(".", ","),
          row.gross_margin_percent.toFixed(2).replace(".", ","),
        ].join(";")
      ),
    ];

    return {
      csv: csvLines.join("\n"),
      filename: `dre-canais-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  });
