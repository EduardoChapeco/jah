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
