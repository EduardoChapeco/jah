/**
 * whatsapp.ts — Utilitário Canônico de Telemetria e Redirecionamento de WhatsApp Rastreável
 */

import { recordWhatsAppLead } from "@/services/whatsapp-leads.functions";

export interface TrackWhatsAppLeadParams {
  phone: string;
  storeId?: string | null;
  entityType:
    | "store"
    | "product"
    | "classified"
    | "job"
    | "tourism"
    | "directory"
    | "event"
    | "quote"
    | "custom";
  entityId?: string | null;
  entityTitle?: string | null;
  customMessage?: string;
  niche?: string;
  metadata?: Record<string, any>;
}

/**
 * Sanitiza e formata o telefone garantindo DDI 55 (Brasil) caso não especificado
 */
export function sanitizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

/**
 * Gera mensagem contextual inteligente com injeção do código de lead rastreável
 */
export function buildTrackedWhatsAppMessage({
  entityType,
  entityTitle,
  customMessage,
  leadCode,
}: {
  entityType: string;
  entityTitle?: string | null;
  customMessage?: string;
  leadCode: string;
}): string {
  if (customMessage) {
    return `${customMessage.trim()}\n\nRef: #${leadCode}`;
  }

  switch (entityType) {
    case "product":
      return `Olá! Vi o produto "${entityTitle || "anunciado"}" no Wider e gostaria de mais informações sobre disponibilidade e entrega.\n\nRef: #${leadCode}`;
    case "classified":
      return `Olá! Vi seu anúncio "${entityTitle || "no Wider"}" e tenho interesse. Ainda está disponível?\n\nRef: #${leadCode}`;
    case "job":
      return `Olá! Vi a oportunidade "${entityTitle || "de emprego"}" no portal Wider e gostaria de me candidatar.\n\nRef: #${leadCode}`;
    case "tourism":
      return `Olá! Vi a atração/pousada "${entityTitle || "no Wider"}" e gostaria de consultar tarifas e reservas.\n\nRef: #${leadCode}`;
    case "directory":
    case "store":
      return `Olá! Encontrei o perfil de vocês no guia Wider e gostaria de fazer um orçamento.\n\nRef: #${leadCode}`;
    default:
      return `Olá! Vi o anúncio "${entityTitle || "no Wider"}" e gostaria de mais detalhes.\n\nRef: #${leadCode}`;
  }
}

/**
 * Dispara telemetria de conversão no banco de dados e abre o WhatsApp de forma instantânea
 */
export async function trackAndOpenWhatsApp(params: TrackWhatsAppLeadParams) {
  const cleanPhone = sanitizeWhatsAppPhone(params.phone);
  if (!cleanPhone) {
    console.warn("[whatsapp] Telefone não informado para abertura de WhatsApp");
    return;
  }

  // Gera código preliminar determinístico para não esperar a rede
  const tempLeadCode = `WDR-W${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const deviceType = isMobile ? "mobile" : "desktop";

  // Extrair UTMs da URL atual se existirem
  let utmSource: string | null = null;
  let utmMedium: string | null = null;
  let utmCampaign: string | null = null;
  let originUrl: string | null = null;

  if (typeof window !== "undefined") {
    originUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    utmSource = urlParams.get("utm_source");
    utmMedium = urlParams.get("utm_medium");
    utmCampaign = urlParams.get("utm_campaign");
  }

  // Dispara a telemetria em background para persistência real no Supabase
  let activeLeadCode = tempLeadCode;
  try {
    const res = await recordWhatsAppLead({
      data: {
        store_id: params.storeId || null,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        entity_title: params.entityTitle || null,
        phone_target: cleanPhone,
        origin_url: originUrl,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        device_type: deviceType as any,
        metadata: {
          niche: params.niche,
          ...(params.metadata || {}),
        },
      },
    });

    if (res?.lead_code) {
      activeLeadCode = res.lead_code;
    }
  } catch (err) {
    console.warn("[whatsapp-telemetry] Falha assíncrona ao registrar lead (seguindo com fallback):", err);
  }

  const finalMessage = buildTrackedWhatsAppMessage({
    entityType: params.entityType,
    entityTitle: params.entityTitle,
    customMessage: params.customMessage,
    leadCode: activeLeadCode,
  });

  const encodedText = encodeURIComponent(finalMessage);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  if (typeof window !== "undefined") {
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }
}

// ---------------------------------------------------------------------------
// Formatador Canônico de Recibos / Despacho de Pedidos para WhatsApp
// ---------------------------------------------------------------------------

export interface StructuredOrderItem {
  name: string;
  qty: number;
  unitPriceCents: number;
  selectedOptions?: string[];
}

export interface StructuredOrderWhatsAppParams {
  orderToken: string;
  customerName?: string;
  items: StructuredOrderItem[];
  subtotalCents?: number;
  shippingCents?: number;
  tipCents?: number;
  discountCents?: number;
  totalCents: number;
  paymentMethodText: string;
  deliveryAddress?: string;
  deliveryMethodText?: string;
  tableNumber?: string;
  storeName?: string;
}

export function buildStructuredOrderWhatsAppMessage(params: StructuredOrderWhatsAppParams): string {
  const formatMoney = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const lines: string[] = [];

  // Cabeçalho
  lines.push(`📦 *Novo Pedido #${params.orderToken.toUpperCase()}*`);
  if (params.storeName) lines.push(`🏪 ${params.storeName}`);
  if (params.customerName) lines.push(`👤 Cliente: ${params.customerName}`);
  if (params.tableNumber) lines.push(`🪑 Mesa / Comanda: ${params.tableNumber}`);
  if (params.deliveryMethodText) lines.push(`🚚 Tipo: ${params.deliveryMethodText}`);
  lines.push("");

  // Lista de Itens
  lines.push("*Itens do Pedido:*");
  for (const item of params.items) {
    const itemTotal = item.qty * item.unitPriceCents;
    lines.push(`• ${item.qty}x ${item.name} (${formatMoney(itemTotal)})`);
    if (item.selectedOptions && item.selectedOptions.length > 0) {
      lines.push(`  ↳ ${item.selectedOptions.join(", ")}`);
    }
  }
  lines.push("");

  // Detalhes Financeiros
  if (params.shippingCents && params.shippingCents > 0) {
    lines.push(`Entrega/Frete: ${formatMoney(params.shippingCents)}`);
  }
  if (params.tipCents && params.tipCents > 0) {
    lines.push(`Taxa de Serviço: ${formatMoney(params.tipCents)}`);
  }
  if (params.discountCents && params.discountCents > 0) {
    lines.push(`Desconto: -${formatMoney(params.discountCents)}`);
  }

  lines.push(`💳 *Método de Pagamento:* ${params.paymentMethodText}`);
  lines.push(`💰 *Total:* ${formatMoney(params.totalCents)}`);

  if (params.deliveryAddress) {
    lines.push("");
    lines.push(`📍 *Endereço de Entrega:* ${params.deliveryAddress}`);
  }

  return lines.join("\n");
}

