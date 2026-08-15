import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, getAnonServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

export interface BannerDTO {
  id: string;
  store_id?: string | null;
  title: string;
  subtitle?: string | null;
  badge_text?: string | null;
  media_url: string;
  media_type: "image" | "video" | "gif";
  target_type: "product" | "category" | "hotpage" | "store" | "external_url";
  target_id?: string | null;
  target_url?: string | null;
  cta_label?: string | null;
  placement: "home" | "marketplace" | "events" | "classifieds" | "all";
  city_filter?: string | null;
  starts_at: string;
  ends_at?: string | null;
  is_active: boolean;
  sort_order: number;
  show_title?: boolean;
  show_description?: boolean;
  show_overlay?: boolean;
  show_badge?: boolean;
  show_cta?: boolean;
}

const SEED_BANNERS: BannerDTO[] = [
  {
    id: "e0000000-0000-0000-0000-000000000001",
    title: "Festival Gastronômico da Comunidade JAH",
    subtitle: "Pratos autorais, hambúrgueres artesanais e cafés especiais com até 30% OFF nesta semana.",
    badge_text: "Destaque da Cidade",
    media_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=85",
    media_type: "image",
    target_type: "hotpage",
    target_url: "/mercado?niche=gastronomia",
    cta_label: "Explorar Gastronomia",
    placement: "all",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 1,
    show_title: true,
    show_description: true,
    show_overlay: true,
    show_badge: true,
    show_cta: true,
  },
  {
    id: "e0000000-0000-0000-0000-000000000002",
    title: "Entrega Grátis nos Produtores Locais",
    subtitle: "Apoie o comércio da sua região com frete cortesia para pedidos participantes.",
    badge_text: "Frete Cortesia",
    media_url: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=1600&q=85",
    media_type: "image",
    target_type: "hotpage",
    target_url: "/mercado",
    cta_label: "Ver Lojas",
    placement: "home",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 2,
    show_title: true,
    show_description: true,
    show_overlay: true,
    show_badge: true,
    show_cta: true,
  },
  {
    id: "e0000000-0000-0000-0000-000000000003",
    title: "Agenda Cultural & Shows ao Vivo",
    subtitle: "Garanta seus ingressos para feiras de artesanato, festivais e shows da cena autoral.",
    badge_text: "Eventos em Alta",
    media_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&q=85",
    media_type: "image",
    target_type: "hotpage",
    target_url: "/agenda",
    cta_label: "Ver Agenda",
    placement: "events",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 3,
    show_title: true,
    show_description: true,
    show_overlay: true,
    show_badge: true,
    show_cta: true,
  },
  {
    id: "e0000000-0000-0000-0000-000000000004",
    title: "Moda Autoral, Brechós & Estilo Urbano",
    subtitle: "Peças exclusivas de marcas locais, coleções autorais e desapegos selecionados.",
    badge_text: "Moda & Estilo",
    media_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=85",
    media_type: "image",
    target_type: "hotpage",
    target_url: "/mercado?niche=moda",
    cta_label: "Conferir Coleção",
    placement: "marketplace",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 4,
    show_title: true,
    show_description: true,
    show_overlay: true,
    show_badge: true,
    show_cta: true,
  },
];

export const listActiveBanners = createServerFn({ method: "GET" })
  .validator(
    z.object({
      placement: z.enum(["home", "marketplace", "events", "classifieds", "all"]).optional(),
      city: z.string().optional(),
    }),
  )
  .handler(async ({ data: { placement, city } }): Promise<BannerDTO[]> => {
    const supabase = getAnonServerClient();
    const now = new Date().toISOString();

    let query = supabase
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .lte("starts_at", now)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (placement && placement !== "all") {
      query = query.or(`placement.eq.${placement},placement.eq.all`);
    }

    if (city) {
      query = query.or(`city_filter.eq.${city},city_filter.is.null`);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      // Retorna banners curados seed caso o DB ainda não tenha banners
      const filtered = SEED_BANNERS.filter((b) => {
        if (!placement || placement === "all") return true;
        return b.placement === placement || b.placement === "all";
      });
      return filtered;
    }

    const active = (data || []).filter((b) => !b.ends_at || b.ends_at > now) as BannerDTO[];
    if (active.length === 0) {
      return SEED_BANNERS.filter((b) => !placement || placement === "all" || b.placement === placement || b.placement === "all");
    }
    return active;
  });

export const createBanner = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().min(1),
      subtitle: z.string().optional(),
      badge_text: z.string().optional(),
      media_url: z.string().url(),
      media_type: z.enum(["image", "video", "gif"]).default("image"),
      target_type: z
        .enum(["product", "category", "hotpage", "store", "external_url"])
        .default("hotpage"),
      target_id: z.string().optional(),
      target_url: z.string().optional(),
      cta_label: z.string().optional(),
      placement: z.enum(["home", "marketplace", "events", "classifieds", "all"]).default("home"),
      city_filter: z.string().optional(),
      starts_at: z.string().optional(),
      ends_at: z.string().optional(),
      is_active: z.boolean().optional(),
      sort_order: z.number().int().default(0),
      show_title: z.boolean().optional(),
      show_description: z.boolean().optional(),
      show_overlay: z.boolean().optional(),
      show_badge: z.boolean().optional(),
      show_cta: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "content"]);
    const supabase = getServerClient();

    const { data: banner, error } = await supabase
      .from("banners")
      .insert({
        ...data,
        store_id: identity.store_id || null,
        starts_at: data.starts_at || new Date().toISOString(),
        is_active: data.is_active !== undefined ? data.is_active : true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar banner: ${error.message}`);
    }

    return banner as BannerDTO;
  });

export const deleteBanner = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "content"]);
    const supabase = getServerClient();

    let query = supabase.from("banners").delete().eq("id", id);
    if (identity.store_id) {
      query = query.eq("store_id", identity.store_id);
    }

    const { error } = await query;
    if (error) {
      throw new Error(`Falha ao excluir banner: ${error.message}`);
    }
    return { success: true };
  });
