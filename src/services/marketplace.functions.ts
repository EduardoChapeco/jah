import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import type { ProductDetailDTO } from "@/types/catalog";

export type MarketplaceSectionDTO = {
  id: string;
  type:
    | "offer_rail"
    | "store_rail"
    | "product_rail"
    | "category_rail"
    | "flash_deal_rail"
    | "curated_grid";
  title: string;
  subtitle?: string;
  layout_variant: string;
  items: any[];
};

export type FlashOfferDTO = {
  id: string;
  title: string;
  slug: string;
  store_id: string;
  store_name: string;
  price_cents: number;
  original_price_cents: number;
  discount_percent: number;
  mechanic_label: string;
  ends_at: string;
  cover_image: string;
  selling_unit?: string;
  in_stock: boolean;
  has_flash_offer?: boolean;
};

export type StoreCardDTO = {
  id: string;
  name: string;
  slug: string;
  avatar_url?: string;
  banner_url?: string;
  category: string;
  rating: number;
  review_count: number;
  distance_km: number;
  is_open: boolean;
  delivery_time_min: string;
};

export const getMarketplaceFeed = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        niche: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data: params }) => {
    const supabase = getServerClient();
    const nicheFilter = params?.niche && params.niche !== "ofertas" && params.niche !== "todos" ? params.niche : undefined;

    // 1. Busca produtos reais publicados no Supabase
    let productsQuery = supabase
      .from("products")
      .select(
        `
        id,
        title,
        slug,
        store_id,
        price_cents,
        original_price_cents,
        status,
        has_flash_offer,
        flash_offer_ends_at,
        flash_offer_stock_limit,
        flash_offer_sold_count,
        attributes,
        media:product_media(url, is_cover, position),
        store:stores!inner(id, name, slug, avatar_url, banner_url, niche)
      `,
      )
      .eq("status", "published");

    if (nicheFilter) {
      productsQuery = productsQuery.or(`attributes->>tipo.eq.${nicheFilter},store.niche.eq.${nicheFilter}`);
    }

    const { data: productsData } = await productsQuery.limit(40);

    const products: FlashOfferDTO[] = (productsData || []).map((p: any) => {
      const cover =
        p.media?.find((m: any) => m.is_cover)?.url || p.media?.[0]?.url || "";
      const originalPrice = p.original_price_cents || p.price_cents;
      const discount =
        originalPrice > p.price_cents
          ? Math.round(((originalPrice - p.price_cents) / originalPrice) * 100)
          : 0;

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        store_id: p.store_id,
        store_name: p.store?.name || "Loja da Comunidade",
        price_cents: p.price_cents,
        original_price_cents: originalPrice,
        discount_percent: discount,
        mechanic_label: discount > 0 ? `${discount}% OFF` : "OFERTA",
        ends_at: p.flash_offer_ends_at || "",
        cover_image: cover,
        selling_unit: "un",
        in_stock: true,
        has_flash_offer: !!p.has_flash_offer,
      };
    });

    // 2. Busca lojas ativas reais no Supabase com filtro de nicho
    let storesQuery = supabase
      .from("stores")
      .select("id, name, slug, avatar_url, banner_url, niche, is_verified, active")
      .eq("active", true);

    if (nicheFilter) {
      storesQuery = storesQuery.eq("niche", nicheFilter);
    }

    const { data: storesData } = await storesQuery.limit(20);

    const stores: StoreCardDTO[] = (storesData || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      slug: s.slug || `loja-${s.id.slice(0, 6)}`,
      avatar_url: s.avatar_url,
      banner_url: s.banner_url,
      category: s.niche || "Comércio Local",
      rating: 5.0,
      review_count: 0,
      distance_km: 1.0,
      is_open: true,
      delivery_time_min: "Disponível",
    }));

    // 3. Busca afinidade do usuário para personalização algorítmica
    let topAffinityNiche: string | null = null;
    try {
      const { data: affRows } = await supabase.rpc("get_user_top_affinities", {
        p_user_id: null,
        p_session_id: "anon_session",
        p_limit: 1,
      });
      if (affRows && affRows.length > 0 && affRows[0].total_score > 3) {
        topAffinityNiche = affRows[0].niche;
      }
    } catch {
      // Fallback silencioso
    }

    // 4. Monta as seções dinâmicas e personalizadas
    const sections: MarketplaceSectionDTO[] = [];

    // Se houver afinidade comportamental forte (ex: gastronomia ou moda)
    if (topAffinityNiche && !nicheFilter) {
      const affinityProducts = products.filter(
        (p: any) => p.store?.niche === topAffinityNiche || p.attributes?.tipo === topAffinityNiche,
      );
      if (affinityProducts.length > 0) {
        const nicheTitleMap: Record<string, string> = {
          gastronomia: "🍔 Recomendados para Você: Gastronomia & Lanches",
          moda: "👗 Baseado no Seu Perfil: Moda & Vestuário",
          mercado: "🛒 Seus Essenciais de Supermercado & Horti",
          farmacia: "💊 Saúde & Cuidados Pessoais Recomendados",
          pet: "🐾 Para o Seu Pet: Cuidados & Acessórios",
        };
        sections.push({
          id: "sec-personalized-affinity",
          type: "product_rail",
          title: nicheTitleMap[topAffinityNiche] || `✨ Sugestões em ${topAffinityNiche.toUpperCase()}`,
          subtitle: "Seleção algorítmica baseada no seu comportamento recente de navegação",
          layout_variant: "rail_standard",
          items: affinityProducts.slice(0, 10),
        });
      }
    }

    const flashDeals = products.filter((p) => p.has_flash_offer || p.discount_percent > 0);
    const bestDiscountDeals = [...products].sort((a, b) => b.discount_percent - a.discount_percent);
    const budgetDeals = products.filter((p) => p.price_cents <= 9900); // até R$ 99

  // Seção 1: Ofertas Relâmpago
  if (flashDeals.length > 0) {
    sections.push({
      id: "sec-flash-deals",
      type: "flash_deal_rail",
      title: "⚡️ Ofertas Relâmpago do Dia",
      subtitle: "Preços especiais com tempo e estoques limitados",
      layout_variant: "rail_standard",
      items: flashDeals,
    });
  } else if (products.length > 0) {
    sections.push({
      id: "sec-flash-deals",
      type: "flash_deal_rail",
      title: "⚡️ Ofertas em Destaque",
      subtitle: "Oportunidades com preço especial selecionadas para você",
      layout_variant: "rail_standard",
      items: products.slice(0, 8),
    });
  }

  // Seção 2: Super Descontos
  if (bestDiscountDeals.length > 0 && bestDiscountDeals.some((p) => p.discount_percent > 0)) {
    sections.push({
      id: "sec-super-discounts",
      type: "product_rail",
      title: "🔥 Queima de Estoque & Maiores Descontos",
      subtitle: "Itens com as maiores reduções de preço no catálogo",
      layout_variant: "rail_standard",
      items: bestDiscountDeals.slice(0, 10),
    });
  }

  // Seção 3: Lojas e Estabelecimentos
  if (stores.length > 0) {
    sections.push({
      id: "sec-local-stores",
      type: "store_rail",
      title: "🏪 Lojas & Negócios com Ofertas Ativas",
      subtitle: "Negócios cadastrados com entrega e retirada na sua região",
      layout_variant: "rail_compact",
      items: stores,
    });
  }

  // Seção 4: Achadinhos por menos de R$ 99
  if (budgetDeals.length > 0) {
    sections.push({
      id: "sec-budget-deals",
      type: "product_rail",
      title: "🏷️ Achadinhos por Menos de R$ 99",
      subtitle: "Economia garantida direto dos produtores e lojistas locais",
      layout_variant: "rail_standard",
      items: budgetDeals,
    });
  }

  // Seção 5: Destaques Gerais do Catálogo
  if (products.length > 0 && sections.length < 5) {
    sections.push({
      id: "sec-trending",
      type: "product_rail",
      title: "✨ Destaques do Catálogo",
      subtitle: "Produtos disponíveis para compra imediata",
      layout_variant: "rail_standard",
      items: products,
    });
  }

  return { sections, allProducts: products };
});
