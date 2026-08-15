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
    if (error) {
      console.error("[listActiveBanners] DB error:", error);
      return [];
    }

    return (data || []).filter((b) => !b.ends_at || b.ends_at > now) as BannerDTO[];
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
