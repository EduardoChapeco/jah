import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAnonServerClient, getServerClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/server-access";

export interface HotpageDTO {
  id: string;
  slug: string;
  title: string;
  badge_label?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  icon_name?: string | null;
  filter_rules?: Record<string, any>;
  is_active: boolean;
  sort_order: number;
  show_title?: boolean;
  show_description?: boolean;
  show_overlay?: boolean;
  show_badge?: boolean;
}

export const listHotpages = createServerFn({ method: "GET" }).handler(
  async (): Promise<HotpageDTO[]> => {
    const supabase = getAnonServerClient();

    const { data, error } = await supabase
      .from("hotpages")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data) return [];
    return data as HotpageDTO[];
  },
);

export const getHotpageBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data: { slug } }): Promise<HotpageDTO | null> => {
    const supabase = getAnonServerClient();

    const { data, error } = await supabase
      .from("hotpages")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as HotpageDTO;
  });

export const saveUserPreferences = createServerFn({ method: "POST" })
  .validator(
    z.object({
      selected_niches: z.array(z.string()),
      default_city: z.string().optional(),
      default_lat: z.number().optional(),
      default_lng: z.number().optional(),
      onboarding_done: z.boolean().default(true),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, guest: true };
    }

    const { error } = await supabase.from("user_preferences").upsert({
      user_id: user.id,
      selected_niches: data.selected_niches,
      default_city: data.default_city,
      default_lat: data.default_lat,
      default_lng: data.default_lng,
      onboarding_done: data.onboarding_done,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[PREFERENCES] Failed to save user preferences:", error);
    }

    return { success: !error };
  });

export const getUserPreferences = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    selected_niches: string[];
    default_city: string;
    onboarding_done: boolean;
  } | null> => {
    const supabase = getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!data) return null;
    return {
      selected_niches: data.selected_niches || [],
      default_city: data.default_city || "Chapecó - SC",
      onboarding_done: data.onboarding_done || false,
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
