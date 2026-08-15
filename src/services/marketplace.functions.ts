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

const SEED_OFFERS: FlashOfferDTO[] = [
  {
    id: "prod-smash-burger",
    title: "Smash Burger Duplo Artesanal com Queijo Canastra",
    slug: "smash-burger-duplo",
    store_id: "store-burgers-chapecó",
    store_name: "La Brasa Gourmet",
    price_cents: 3490,
    original_price_cents: 4890,
    discount_percent: 29,
    mechanic_label: "29% OFF",
    ends_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    cover_image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
    selling_unit: "un",
    in_stock: true,
  },
  {
    id: "prod-cafe-especial",
    title: "Café Especial Moído na Hora (250g) - Notas Florais",
    slug: "cafe-especial-graos",
    store_id: "store-torrefacao",
    store_name: "Torrefação Autoral",
    price_cents: 2900,
    original_price_cents: 3800,
    discount_percent: 24,
    mechanic_label: "24% OFF",
    ends_at: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(),
    cover_image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80",
    selling_unit: "pct",
    in_stock: true,
  },
  {
    id: "prod-pizza-napoletana",
    title: "Pizza Napoletana de Fermentação Natural (48h)",
    slug: "pizza-napoletana",
    store_id: "store-pizzaria",
    store_name: "Napoletana D.O.C",
    price_cents: 5990,
    original_price_cents: 7500,
    discount_percent: 20,
    mechanic_label: "20% OFF",
    ends_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    cover_image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
    selling_unit: "un",
    in_stock: true,
  },
  {
    id: "prod-camiseta-autoral",
    title: "Camiseta Heavyweight 100% Algodão Streetwear",
    slug: "camiseta-heavyweight",
    store_id: "store-cultura",
    store_name: "Zine Apparel",
    price_cents: 8900,
    original_price_cents: 12900,
    discount_percent: 31,
    mechanic_label: "31% OFF",
    ends_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    cover_image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80",
    selling_unit: "un",
    in_stock: true,
  },
  {
    id: "prod-picanha-prime",
    title: "Picanha Bovina Prime Selecionada (Aprox. 1.1kg)",
    slug: "picanha-prime-bovina",
    store_id: "store-acougue",
    store_name: "Boutique de Carnes",
    price_cents: 9800,
    original_price_cents: 12500,
    discount_percent: 22,
    mechanic_label: "22% OFF",
    ends_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    cover_image: "https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80",
    selling_unit: "kg",
    in_stock: true,
  },
  {
    id: "prod-cerveja-artesanal",
    title: "Pack 4 Cervejas IPA Artesanal de Chapecó (473ml)",
    slug: "pack-ipa-artesanal",
    store_id: "store-cervejaria",
    store_name: "Cervejaria da Fronteira",
    price_cents: 4800,
    original_price_cents: 6400,
    discount_percent: 25,
    mechanic_label: "25% OFF",
    ends_at: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
    cover_image: "https://images.unsplash.com/photo-1608270199042-45e3f451000b?w=600&q=80",
    selling_unit: "pack",
    in_stock: true,
  },
];

const SEED_STORES: StoreCardDTO[] = [
  {
    id: "store-1",
    name: "La Brasa Burger House",
    slug: "la-brasa-burger",
    category: "Gastronomia & Lanches",
    rating: 4.9,
    review_count: 84,
    distance_km: 1.4,
    is_open: true,
    delivery_time_min: "25 - 40 min",
    banner_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
  },
  {
    id: "store-2",
    name: "Torrefação Autoral & Grãos",
    slug: "torrefacao-autoral",
    category: "Cafés Especiais & Grãos",
    rating: 4.8,
    review_count: 52,
    distance_km: 2.1,
    is_open: true,
    delivery_time_min: "30 - 45 min",
    banner_url: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80",
  },
  {
    id: "store-3",
    name: "Zine Streetwear & Culture",
    slug: "zine-apparel",
    category: "Moda, Arte & Vinil",
    rating: 5.0,
    review_count: 112,
    distance_km: 0.8,
    is_open: true,
    delivery_time_min: "Pronta Entrega",
    banner_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
  },
  {
    id: "store-4",
    name: "Boutique de Carnes & Hortifruti",
    slug: "boutique-carnes",
    category: "Mercado & Açougue",
    rating: 4.9,
    review_count: 67,
    distance_km: 3.2,
    is_open: true,
    delivery_time_min: "40 - 55 min",
    banner_url: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80",
  },
];

export const getMarketplaceFeed = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();

  // 1. Busca produtos reais publicados no Supabase
  const { data: productsData } = await supabase
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
      media:product_media(url, is_cover, position),
      store:stores(id, name, slug, avatar_url, banner_url, niche)
    `,
    )
    .eq("status", "published")
    .limit(30);

  let products: FlashOfferDTO[] = (productsData || []).map((p: any) => {
    const cover =
      p.media?.find((m: any) => m.is_cover)?.url || p.media?.[0]?.url || "/banner-placeholder.png";
    const originalPrice = p.original_price_cents || Math.round(p.price_cents * 1.25);
    const discount = Math.max(
      10,
      Math.round(((originalPrice - p.price_cents) / originalPrice) * 100),
    );

    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      store_id: p.store_id,
      store_name: p.store?.name || "Loja Parceira JAH",
      price_cents: p.price_cents,
      original_price_cents: originalPrice,
      discount_percent: discount,
      mechanic_label: `${discount}% OFF`,
      ends_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      cover_image: cover,
      selling_unit: "un",
      in_stock: true,
    };
  });

  // Se banco estiver em estado inicial, utiliza os produtos e ofertas canônicas de demonstração
  if (products.length === 0) {
    products = SEED_OFFERS;
  }

  // 2. Busca lojas ativas no Supabase
  const { data: storesData } = await supabase
    .from("stores")
    .select("id, name, slug, avatar_url, banner_url, niche")
    .limit(10);

  let stores: StoreCardDTO[] = (storesData || []).map((s: any, idx: number) => ({
    id: s.id,
    name: s.name,
    slug: s.slug || `loja-${s.id.slice(0, 6)}`,
    avatar_url: s.avatar_url,
    banner_url: s.banner_url,
    category: s.niche || "Comércio Local",
    rating: 4.8 + (idx % 3) * 0.1,
    review_count: 24 + idx * 8,
    distance_km: 1.2 + idx * 0.7,
    is_open: true,
    delivery_time_min: "30 - 45 min",
  }));

  if (stores.length === 0) {
    stores = SEED_STORES;
  }

  // 3. Monta as seções canônicas de descoberta
  const sections: MarketplaceSectionDTO[] = [
    {
      id: "sec-flash-deals",
      type: "flash_deal_rail",
      title: "⚡ Ofertas Relâmpago",
      subtitle: "Preços especiais com tempo e estoques limitados em Chapecó",
      layout_variant: "rail_standard",
      items: products.slice(0, 6),
    },
    {
      id: "sec-local-stores",
      type: "store_rail",
      title: "🏪 Lojas & Produtores da Comunidade",
      subtitle: "Negócios locais com entrega rápida e retirada na sua região",
      layout_variant: "rail_compact",
      items: stores,
    },
    {
      id: "sec-gastronomy",
      type: "product_rail",
      title: "🍔 Gastronomia & Sabores Autorais",
      subtitle: "Pratos especiais, cafés, lanches e doces artesanais",
      layout_variant: "rail_standard",
      items: products.slice(2, 6),
    },
    {
      id: "sec-trending",
      type: "product_rail",
      title: "✨ Mais Desejados da Comunidade",
      subtitle: "Os itens mais bem avaliados por quem consome local",
      layout_variant: "rail_standard",
      items: products.slice(0, 4),
    },
  ];

  return { sections, allProducts: products };
});
