/**
 * Wider Classifieds — Biblioteca Semântica & Taxonomia Modular de Nichos
 * 
 * Regras Invioláveis:
 * 1. NUNCA exibir "Retirada & Entrega Local" para imóveis, hospedagens, veículos ou serviços.
 * 2. NUNCA exibir "Novo / Na Caixa" para hospedagens, imóveis ou serviços.
 * 3. Cada nicho possui vocabulário, badges, fichas técnicas e CTAs contextuais dedicados.
 */

import {
  Home,
  Building,
  Key,
  Car,
  Tag,
  Wrench,
  Tractor,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Package,
  Truck,
  Sparkles,
  RefreshCw,
  CreditCard,
  QrCode,
  FileCheck,
  MessageCircle,
  Phone,
  Flame,
  UserCheck,
  Lock,
} from "lucide-react";

export type ClassifiedNicheId =
  | "hospitality_stay"      // Hospedagem & Temporada (Chalés, Cabanas, Pousadas, Studios)
  | "real_estate_sale"      // Imóveis (Venda de Casas, Aptos, Terrenos, Comerciais)
  | "real_estate_rent"      // Imóveis (Locação Mensal Residencial / Comercial)
  | "vehicle"               // Veículos & Automotivo (Carros, Motos, Náutica, Utilitários)
  | "goods"                 // Desapegos & Produtos Físicos (Eletrônicos, Móveis, Moda)
  | "service"               // Serviços & Profissionais Autônomos
  | "agri";                 // Agronegócio & Maquinário Pesado

export interface ClassifiedNicheDefinition {
  id: ClassifiedNicheId;
  canonicalCategory: "real_estate" | "vehicle" | "sale" | "service" | "job";
  dealType: "venda" | "aluguel" | "temporada" | "servico";
  title: string;
  shortLabel: string;
  subtitle: string;
  icon: any;
  badge: string;
  priceSuffix: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  showDeliveryBadges: boolean;
  showTechnicalSpecs: boolean;
  allowEscrowGuarantee: boolean;
}

export const NICHE_DEFINITIONS: Record<ClassifiedNicheId, ClassifiedNicheDefinition> = {
  hospitality_stay: {
    id: "hospitality_stay",
    canonicalCategory: "real_estate",
    dealType: "temporada",
    title: "Hospedagem & Temporada",
    shortLabel: "Hospedagem",
    subtitle: "Chalés, Cabanas, Casas de Campo & Studios",
    icon: Key,
    badge: "Temporada & Diárias",
    priceSuffix: "/diária",
    primaryActionLabel: "Reservar Diárias",
    secondaryActionLabel: "Consultar Datas com Anfitrião",
    showDeliveryBadges: false,
    showTechnicalSpecs: true,
    allowEscrowGuarantee: true,
  },
  real_estate_sale: {
    id: "real_estate_sale",
    canonicalCategory: "real_estate",
    dealType: "venda",
    title: "Imóvel à Venda",
    shortLabel: "Venda Imóvel",
    subtitle: "Casas, Apartamentos, Terrenos & Galpões",
    icon: Home,
    badge: "Imóvel à Venda",
    priceSuffix: "",
    primaryActionLabel: "Agendar Visita Presencial",
    secondaryActionLabel: "Fazer Proposta Formal",
    showDeliveryBadges: false,
    showTechnicalSpecs: true,
    allowEscrowGuarantee: false,
  },
  real_estate_rent: {
    id: "real_estate_rent",
    canonicalCategory: "real_estate",
    dealType: "aluguel",
    title: "Imóvel para Alugar",
    shortLabel: "Locação Mensal",
    subtitle: "Apartamentos, Casas & Salas Corporativas",
    icon: Building,
    badge: "Locação Mensal",
    priceSuffix: "/mês",
    primaryActionLabel: "Agendar Visita ao Imóvel",
    secondaryActionLabel: "Enviar Proposta de Locação",
    showDeliveryBadges: false,
    showTechnicalSpecs: true,
    allowEscrowGuarantee: false,
  },
  vehicle: {
    id: "vehicle",
    canonicalCategory: "vehicle",
    dealType: "venda",
    title: "Veículo & Automotivo",
    shortLabel: "Veículo",
    subtitle: "Carros, Motos, Caminhões & Náutica",
    icon: Car,
    badge: "Ficha Técnica Verificada",
    priceSuffix: "",
    primaryActionLabel: "Agendar Test Drive & Vistoria",
    secondaryActionLabel: "Simular Financiamento",
    showDeliveryBadges: false,
    showTechnicalSpecs: true,
    allowEscrowGuarantee: true,
  },
  goods: {
    id: "goods",
    canonicalCategory: "sale",
    dealType: "venda",
    title: "Desapego & Produto Físico",
    shortLabel: "Desapego P2P",
    subtitle: "Eletrônicos, Móveis, Equipamentos & Moda",
    icon: Tag,
    badge: "Desapego da Região",
    priceSuffix: "",
    primaryActionLabel: "Comprar com Garantia Wider",
    secondaryActionLabel: "Fazer Oferta ao Vendedor",
    showDeliveryBadges: true,
    showTechnicalSpecs: false,
    allowEscrowGuarantee: true,
  },
  service: {
    id: "service",
    canonicalCategory: "service",
    dealType: "servico",
    title: "Serviço Profissional",
    shortLabel: "Serviço",
    subtitle: "Especialistas, Obras, Técnicos & Autônomos",
    icon: Wrench,
    badge: "Profissional Verificado",
    priceSuffix: " a partir de",
    primaryActionLabel: "Solicitar Orçamento Gratuito",
    secondaryActionLabel: "Chamar no WhatsApp",
    showDeliveryBadges: false,
    showTechnicalSpecs: false,
    allowEscrowGuarantee: false,
  },
  agri: {
    id: "agri",
    canonicalCategory: "sale",
    dealType: "venda",
    title: "Agronegócio & Maquinário",
    shortLabel: "Agro & Máquinas",
    subtitle: "Tratores, Implementos, Insumos & Rural",
    icon: Tractor,
    badge: "Agro Regional",
    priceSuffix: "",
    primaryActionLabel: "Agendar Vistoria no Campo",
    secondaryActionLabel: "Fazer Proposta de Safra",
    showDeliveryBadges: false,
    showTechnicalSpecs: true,
    allowEscrowGuarantee: true,
  },
};

/**
 * Identifica o nicho semântico exato de um anúncio classificado a partir de suas propriedades.
 */
export function resolveClassifiedNiche(classified: any): ClassifiedNicheDefinition {
  if (!classified) return NICHE_DEFINITIONS.goods;

  const category = (classified.category || "").toLowerCase();
  const dealType = (classified.deal_type || classified.attributes?.deal_type || "").toLowerCase();
  const rawNiche = (classified.attributes?.niche || "").toLowerCase();

  // 1. Hospedagem / Temporada
  if (
    dealType === "temporada" ||
    rawNiche === "hospedagem" ||
    rawNiche === "temporada" ||
    (category === "real_estate" && (dealType === "temporada" || classified.rental_period === "diaria" || classified.max_guests > 1))
  ) {
    return NICHE_DEFINITIONS.hospitality_stay;
  }

  // 2. Imóvel Venda
  if (category === "real_estate" && (dealType === "venda" || !dealType)) {
    return NICHE_DEFINITIONS.real_estate_sale;
  }

  // 3. Imóvel Aluguel
  if (category === "real_estate" && (dealType === "aluguel" || rawNiche === "locacao")) {
    return NICHE_DEFINITIONS.real_estate_rent;
  }

  // 4. Veículo
  if (category === "vehicle" || rawNiche === "veiculo" || rawNiche === "auto") {
    return NICHE_DEFINITIONS.vehicle;
  }

  // 5. Serviço
  if (category === "service" || rawNiche === "servico") {
    return NICHE_DEFINITIONS.service;
  }

  // 6. Agro
  if (category === "agri" || rawNiche === "agro" || rawNiche === "maquinario") {
    return NICHE_DEFINITIONS.agri;
  }

  // 7. Padrão: Desapego / Produtos Físicos
  return NICHE_DEFINITIONS.goods;
}

/**
 * Retorna os badges semânticos pertinentes ao nicho do anúncio.
 */
export function getSemanticBadges(classified: any): Array<{ label: string; icon: any; variant?: "default" | "secondary" | "outline" }> {
  const niche = resolveClassifiedNiche(classified);
  const badges: Array<{ label: string; icon: any; variant?: "default" | "secondary" | "outline" }> = [];
  const attrs = classified.attributes || {};

  // Badge primordial do nicho
  badges.push({
    label: niche.badge,
    icon: niche.icon,
    variant: "secondary",
  });

  // Nicho: Hospedagem / Temporada
  if (niche.id === "hospitality_stay") {
    const checkinType = attrs.checkin_type || "self_checkin";
    if (checkinType === "self_checkin" || checkinType === "smart_lock") {
      badges.push({ label: "Fechadura Eletrônica / Self Check-in", icon: Lock, variant: "outline" });
    } else if (checkinType === "host_greeting") {
      badges.push({ label: "Check-in com Anfitrião", icon: UserCheck, variant: "outline" });
    } else if (checkinType === "24h_desk") {
      badges.push({ label: "Recepção 24 Horas", icon: Clock, variant: "outline" });
    }

    const guests = classified.max_guests || attrs.max_guests;
    if (guests) {
      badges.push({ label: `Até ${guests} Hóspedes`, icon: CheckCircle2, variant: "outline" });
    }

    if (attrs.pet_friendly) {
      badges.push({ label: "Aceita Pets", icon: CheckCircle2, variant: "outline" });
    }
  }

  // Nicho: Imóvel (Venda ou Aluguel)
  if (niche.id === "real_estate_sale" || niche.id === "real_estate_rent") {
    if (attrs.furnished === "sim" || attrs.furnished === "completo") {
      badges.push({ label: "100% Mobiliado", icon: Sparkles, variant: "outline" });
    } else if (attrs.furnished === "semi") {
      badges.push({ label: "Semi-mobiliado", icon: Sparkles, variant: "outline" });
    }

    if (attrs.accepts_financing) {
      badges.push({ label: "Aceita Financiamento", icon: FileCheck, variant: "outline" });
    }

    if (attrs.accepts_trade || attrs.permuta) {
      badges.push({ label: "Estuda Permuta", icon: RefreshCw, variant: "outline" });
    }
  }

  // Nicho: Veículo
  if (niche.id === "vehicle") {
    if (attrs.cautelar_aprovada) {
      badges.push({ label: "Laudo Cautelar 100% Aprovado", icon: ShieldCheck, variant: "outline" });
    }
    if (attrs.unico_dono) {
      badges.push({ label: "Único Dono", icon: UserCheck, variant: "outline" });
    }
    if (attrs.ipva_pago) {
      badges.push({ label: "IPVA 2026 Pago", icon: FileCheck, variant: "outline" });
    }
    if (attrs.accepts_trade) {
      badges.push({ label: "Aceita Troca", icon: RefreshCw, variant: "outline" });
    }
  }

  // Nicho: Desapego / Produtos Físicos (ÚNICO nicho onde logística de frete se aplica!)
  if (niche.id === "goods") {
    const deliveryMode = attrs.delivery_mode;
    if (deliveryMode === "both" || !deliveryMode) {
      badges.push({ label: "Retirada em Mãos & Entrega Local", icon: Truck, variant: "outline" });
    } else if (deliveryMode === "pickup") {
      badges.push({ label: "Somente Retirada em Mãos", icon: Package, variant: "outline" });
    } else if (deliveryMode === "local_delivery") {
      badges.push({ label: "Entrega Expressa Regional", icon: Truck, variant: "outline" });
    } else if (deliveryMode === "shipping") {
      badges.push({ label: "Envio Correios / Transportadora", icon: Truck, variant: "outline" });
    }

    if (attrs.tested_on_site) {
      badges.push({ label: "Pode Testar na Hora", icon: CheckCircle2, variant: "outline" });
    }

    if (attrs.has_invoice) {
      badges.push({ label: "Com Nota Fiscal", icon: FileCheck, variant: "outline" });
    }
  }

  // Meio de pagamento PIX universal
  if (attrs.accepts_pix !== false) {
    badges.push({ label: "Aceita PIX", icon: QrCode, variant: "secondary" });
  }

  return badges;
}

/**
 * Retorna o rótulo semântico de condição do anúncio (eliminando "Novo/Na Caixa" para imóveis).
 */
export function getSemanticCondition(classified: any): { label: string; value: string } | null {
  const niche = resolveClassifiedNiche(classified);
  const attrs = classified.attributes || {};

  if (niche.id === "hospitality_stay") {
    const checkin = attrs.checkin_type === "smart_lock" || attrs.checkin_type === "self_checkin"
      ? "Self Check-in (Fechadura Digital)"
      : "Check-in Presencial com Anfitrião";
    return { label: "Acesso & Entrada", value: checkin };
  }

  if (niche.id === "real_estate_sale" || niche.id === "real_estate_rent") {
    const status = attrs.construction_status || (attrs.furnished === "sim" ? "Mobiliado e Pronto" : "Pronto para Ocupar");
    return { label: "Disponibilidade", value: status };
  }

  if (niche.id === "vehicle") {
    const cond = attrs.unico_dono ? "Único Dono / Impecável" : "Seminovo Revisado";
    return { label: "Conservação", value: cond };
  }

  if (niche.id === "service") {
    const mod = attrs.modality || "Atendimento Presencial / Domicílio";
    return { label: "Modalidade", value: mod };
  }

  // Para produtos físicos/desapegos, aplica a condição do item
  const condMap: Record<string, string> = {
    new: "Novo / Lacrado na Caixa",
    used: "Usado — Excelente Estado",
    refurbished: "Revisado / Perfeito Funcionamento",
  };

  const c = classified.condition || attrs.condition || "used";
  return { label: "Condição do Item", value: condMap[c] || "Seminovo" };
}
