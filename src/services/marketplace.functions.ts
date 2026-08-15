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

  // 3. Monta as seções apenas se houver dados reais
  const sections: MarketplaceSectionDTO[] = [];

  const flashDeals = products.filter((p) => p.has_flash_offer);
  if (flashDeals.length > 0) {
    sections.push({
      id: "sec-flash-deals",
      type: "flash_deal_rail",
      title: "Ofertas Relâmpago",
      subtitle: "Preços especiais com tempo e estoques limitados",
      layout_variant: "rail_standard",
      items: flashDeals,
    });
  }

  if (stores.length > 0) {
    sections.push({
      id: "sec-local-stores",
      type: "store_rail",
      title: "Lojas & Negócios Locais",
      subtitle: "Negócios cadastrados com entrega e retirada na sua região",
      layout_variant: "rail_compact",
      items: stores,
    });
  }

  if (products.length > 0) {
    sections.push({
      id: "sec-trending",
      type: "product_rail",
      title: "Destaques do Catálogo",
      subtitle: "Produtos disponíveis para compra imediata",
      layout_variant: "rail_standard",
      items: products,
    });
  }

  return { sections, allProducts: products };
});
