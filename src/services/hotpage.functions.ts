import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAnonServerClient, getServerClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/server-access";

export type HotpageModule =
  | "home"
  | "mercado"
  | "marketplace"
  | "noticias"
  | "agenda"
  | "events"
  | "diretorio"
  | "turismo"
  | "empregos"
  | "classificados"
  | "mobilidade"
  | "gastronomia"
  | "moda"
  | "pet"
  | "livros"
  | "imoveis"
  | "limpeza"
  | "beleza"
  | "servicos"
  | "acougue"
  | "bebidas"
  | "farmacia"
  | "construcao"
  | "casa"
  | "eletronicos"
  | "doacoes"
  | "ofertas"
  | "all";

export const HotpageModuleSchema = z.enum([
  "home",
  "mercado",
  "marketplace",
  "noticias",
  "agenda",
  "events",
  "diretorio",
  "turismo",
  "empregos",
  "classificados",
  "mobilidade",
  "gastronomia",
  "moda",
  "pet",
  "livros",
  "imoveis",
  "limpeza",
  "beleza",
  "servicos",
  "acougue",
  "bebidas",
  "farmacia",
  "construcao",
  "casa",
  "eletronicos",
  "doacoes",
  "ofertas",
  "all",
]);

export type HotpageBgMediaType = "none" | "image" | "video" | "gif";
export type HotpageBgTexture = "none" | "noise" | "dots" | "grid" | "mesh" | "glass";

export type HotpageTemplateType = "turbo" | "hits" | "bogo" | "market" | "travel" | "services" | "custom";
export type HotpageRulePreset = "all" | "free_shipping" | "turbo_express" | "bogo" | "discount_only" | "top_rated" | "under_20" | "custom";

export interface HotpageDTO {
  id: string;
  slug: string;
  title: string;
  badge_label?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  icon_name?: string | null;
  icon_url?: string | null;
  custom_icon_url?: string | null;
  target_route?: string | null;
  bg_media_type?: HotpageBgMediaType | null;
  bg_media_url?: string | null;
  bg_color?: string | null;
  bg_overlay_opacity?: number | null;
  bg_texture?: HotpageBgTexture | null;
  filter_rules?: Record<string, any>;
  module?: HotpageModule;
  is_active: boolean;
  sort_order: number;
  show_title?: boolean;
  show_description?: boolean;
  show_overlay?: boolean;
  show_badge?: boolean;
  template_type?: HotpageTemplateType;
  rule_preset?: HotpageRulePreset;
  hero_stat_badge?: string | null;
  hero_secondary_badge?: string | null;
  hero_floating_render_url?: string | null;
  featured_rail_title?: string | null;
}

export const listHotpages = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        module: HotpageModuleSchema.optional(),
      })
      .optional(),
  )
  .handler(async ({ data }): Promise<HotpageDTO[]> => {
    const supabase = getAnonServerClient();
    const reqModule = data?.module;
    const normalizedModule =
      reqModule === "marketplace" ? "mercado" : reqModule === "events" ? "agenda" : reqModule;

    let query = supabase
      .from("hotpages")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (normalizedModule && normalizedModule !== "all") {
      query = query.eq("module", normalizedModule);
    }

    const { data: records, error } = await query;
    if (error || !records) {
      return [];
    }

    return records.map((h: any) => ({
      ...h,
      show_title: h.show_title !== false,
      show_description: h.show_description !== false,
      show_overlay: h.show_overlay !== false,
      show_badge: h.show_badge !== false,
    })) as HotpageDTO[];
  });

export const listActiveHotpages = listHotpages;

export const getHotpageBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data: { slug } }): Promise<HotpageDTO | null> => {
    const supabase = getAnonServerClient();
    const { data, error } = await supabase
      .from("hotpages")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      ...data,
      show_title: data.show_title !== false,
      show_description: data.show_description !== false,
      show_overlay: data.show_overlay !== false,
      show_badge: data.show_badge !== false,
    } as HotpageDTO;
  });

export const saveUserPreferences = createServerFn({ method: "POST" })
  .validator(
    z.object({
      selected_niches: z.array(z.string()),
      default_city: z.string().optional(),
      onboarding_done: z.boolean().default(true),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const { getCurrentIdentity } = await import("@/services/cart-helpers");
    const identity = await getCurrentIdentity().catch(() => null);
    const userId = identity?.customer_id || null;

    if (userId) {
      const { error } = await supabase.from("user_preferences").upsert(
        {
          user_id: userId,
          selected_niches: data.selected_niches,
          default_city: data.default_city || "Chapecó - SC",
          onboarding_done: data.onboarding_done,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (error) {
        console.error("[PREFERENCES] Falha ao salvar preferências no Supabase:", error);
      }
    }

    // 2. Alimenta o motor de afinidade preditiva para os nichos selecionados
    for (const niche of data.selected_niches) {
      if (niche !== "all") {
        try {
          await supabase.rpc("record_user_behavior_event", {
            p_user_id: userId,
            p_session_id: userId ? null : "anon_session",
            p_event_type: "search",
            p_entity_type: "product",
            p_entity_id: null,
            p_category_slug: niche,
            p_niche: niche,
            p_metadata: { source: "onboarding_picker", weight_boost: 10 },
          });
        } catch {
          // rpc telemetry optional
        }
      }
    }

    return { success: true };
  });

export const getUserPreferences = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    selected_niches: string[];
    default_city: string;
    onboarding_done: boolean;
  } | null> => {
    const supabase = getServerClient();
    const { getCurrentIdentity } = await import("@/services/cart-helpers");
    const identity = await getCurrentIdentity().catch(() => null);
    const userId = identity?.customer_id || null;

    if (!userId) return null;

    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return {
      selected_niches: data.selected_niches || [],
      default_city: data.default_city || "Chapecó - SC",
      onboarding_done: !!data.onboarding_done,
    };
  },
);

export const createHotpage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      slug: z.string().min(2),
      title: z.string().min(2),
      badge_label: z.string().optional(),
      description: z.string().optional(),
      cover_image_url: z.string().url().optional(),
      icon_name: z.string().optional(),
      icon_url: z.string().optional(),
      custom_icon_url: z.string().optional(),
      target_route: z.string().optional(),
      bg_media_type: z.enum(["none", "image", "video", "gif"]).default("none"),
      bg_media_url: z.string().optional(),
      bg_color: z.string().optional(),
      bg_overlay_opacity: z.number().min(0).max(100).default(30),
      bg_texture: z.enum(["none", "noise", "dots", "grid", "mesh", "glass"]).default("none"),
      filter_rules: z.record(z.any()).optional(),
      module: HotpageModuleSchema.default("home"),
      sort_order: z.number().int().default(0),
      show_title: z.boolean().default(true),
      show_description: z.boolean().default(true),
      show_overlay: z.boolean().default(true),
      show_badge: z.boolean().default(true),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const { data: created, error } = await supabase
      .from("hotpages")
      .insert({
        slug: data.slug,
        title: data.title,
        badge_label: data.badge_label || null,
        description: data.description || null,
        cover_image_url: data.cover_image_url || null,
        icon_name: data.icon_name || null,
        icon_url: data.icon_url || data.custom_icon_url || null,
        custom_icon_url: data.custom_icon_url || data.icon_url || null,
        target_route: data.target_route || null,
        bg_media_type: data.bg_media_type || "none",
        bg_media_url: data.bg_media_url || null,
        bg_color: data.bg_color || null,
        bg_overlay_opacity: data.bg_overlay_opacity ?? 30,
        bg_texture: data.bg_texture || "none",
        filter_rules: data.filter_rules || {},
        module: data.module || "home",
        sort_order: data.sort_order,
        show_title: data.show_title,
        show_description: data.show_description,
        show_overlay: data.show_overlay,
        show_badge: data.show_badge,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as HotpageDTO;
  });

export const updateHotpage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      slug: z.string().min(2).optional(),
      title: z.string().min(2).optional(),
      badge_label: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      cover_image_url: z.string().nullable().optional(),
      icon_name: z.string().nullable().optional(),
      icon_url: z.string().nullable().optional(),
      custom_icon_url: z.string().nullable().optional(),
      target_route: z.string().nullable().optional(),
      bg_media_type: z.enum(["none", "image", "video", "gif"]).optional(),
      bg_media_url: z.string().nullable().optional(),
      bg_color: z.string().nullable().optional(),
      bg_overlay_opacity: z.number().min(0).max(100).optional(),
      bg_texture: z.enum(["none", "noise", "dots", "grid", "mesh", "glass"]).optional(),
      filter_rules: z.record(z.any()).nullable().optional(),
      module: HotpageModuleSchema.optional(),
      sort_order: z.number().int().optional(),
      show_title: z.boolean().optional(),
      show_description: z.boolean().optional(),
      show_overlay: z.boolean().optional(),
      show_badge: z.boolean().optional(),
      is_active: z.boolean().optional(),
    }),
  )
  .handler(async ({ data: { id, ...patch } }) => {
    const supabase = getServerClient();
    const { data: updated, error } = await supabase
      .from("hotpages")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as HotpageDTO;
  });

export const deleteHotpage = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    const supabase = getServerClient();
    const { error } = await supabase.from("hotpages").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const saveHotpage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      slug: z.string().min(2),
      title: z.string().min(2),
      badge_label: z.string().optional(),
      description: z.string().optional(),
      cover_image_url: z.string().optional(),
      icon_name: z.string().optional(),
      icon_url: z.string().optional(),
      custom_icon_url: z.string().optional(),
      target_route: z.string().optional(),
      bg_media_type: z.enum(["none", "image", "video", "gif"]).optional(),
      bg_media_url: z.string().optional(),
      bg_color: z.string().optional(),
      bg_overlay_opacity: z.number().min(0).max(100).optional(),
      bg_texture: z.enum(["none", "noise", "dots", "grid", "mesh", "glass"]).optional(),
      filter_rules: z.record(z.any()).optional(),
      module: HotpageModuleSchema.optional(),
      sort_order: z.number().int().default(0),
      show_title: z.boolean().default(true),
      show_description: z.boolean().default(true),
      show_overlay: z.boolean().default(true),
      show_badge: z.boolean().default(true),
      is_active: z.boolean().default(true),
    }),
  )
  .handler(async ({ data }) => {
    if (data.id) {
      return updateHotpage({ data: { id: data.id, ...data } });
    } else {
      return createHotpage({ data: { ...data, sort_order: data.sort_order ?? 0 } });
    }
  });
