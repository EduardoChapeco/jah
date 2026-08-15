import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

export type AdCampaign = {
  id: string;
  store_id: string;
  title: string;
  format: "post_patrocinado" | "banner_destaque" | "story_patrocinado" | "busca_topo";
  target_location: string;
  target_radius_km: number;
  daily_budget_cents: number;
  total_budget_cents: number;
  status: "active" | "paused" | "completed" | "draft";
  impressions_count: number;
  clicks_count: number;
  spent_cents: number;
  created_at: string;
};

export const listAdCampaigns = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "content"]);

  const { data: campaigns, error } = await supabase
    .from("ad_campaigns")
    .select(
      "id, store_id, title, type, budget_cents, status, created_at, starts_at, ends_at, placements",
    )
    .eq("store_id", identity.store_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[ads] Error listing campaigns:", error);
    return [];
  }

  // Busca contagem de eventos por campanha
  const campaignIds = (campaigns || []).map((c) => c.id);
  const { data: events } = await supabase
    .from("ad_events")
    .select("campaign_id, event_type")
    .in(
      "campaign_id",
      campaignIds.length > 0 ? campaignIds : ["00000000-0000-0000-0000-000000000000"],
    );

  const eventsCount = new Map<string, { views: number; clicks: number }>();
  (events || []).forEach((e) => {
    const curr = eventsCount.get(e.campaign_id) || { views: 0, clicks: 0 };
    if (e.event_type === "view") curr.views++;
    if (e.event_type === "click") curr.clicks++;
    eventsCount.set(e.campaign_id, curr);
  });

  return (campaigns || []).map((c: any) => {
    const stats = eventsCount.get(c.id) || { views: 0, clicks: 0 };
    const placements = c.placements || ["feed"];
    const format = placements.includes("search")
      ? "busca_topo"
      : placements.includes("banner")
        ? "banner_destaque"
        : placements.includes("story")
          ? "story_patrocinado"
          : "post_patrocinado";

    return {
      id: c.id,
      store_id: c.store_id,
      title: c.title || "Campanha Promocional",
      format,
      target_location: "Chapecó / SC e Região",
      target_radius_km: 15,
      daily_budget_cents: Math.round(c.budget_cents / 5),
      total_budget_cents: c.budget_cents,
      status: c.status,
      impressions_count: stats.views,
      clicks_count: stats.clicks,
      spent_cents: Math.min(c.budget_cents, stats.clicks * 45),
      created_at: c.created_at,
    } as AdCampaign;
  });
});

export const createAdCampaign = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().min(2),
      format: z.enum(["post_patrocinado", "banner_destaque", "story_patrocinado", "busca_topo"]),
      target_location: z.string().min(2),
      target_radius_km: z.number().min(1).max(100),
      daily_budget_cents: z.number().int().min(500),
      total_budget_cents: z.number().int().min(500),
    }),
  )
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "content"]);

    const placementMap: Record<string, string[]> = {
      post_patrocinado: ["feed"],
      banner_destaque: ["banner", "market"],
      story_patrocinado: ["story"],
      busca_topo: ["search"],
    };

    const { data: campaign, error } = await supabase
      .from("ad_campaigns")
      .insert({
        store_id: identity.store_id,
        title: input.title,
        type: input.format === "banner_destaque" ? "fixed_banner" : "dynamic_boost",
        budget_cents: input.total_budget_cents,
        placements: placementMap[input.format] || ["feed"],
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("[ads] Error creating campaign:", error);
      throw new Error("Erro ao criar campanha de anúncio no banco de dados.");
    }

    return campaign;
  });

export const toggleAdCampaignStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      campaignId: z.string().uuid(),
      status: z.enum(["active", "paused"]),
    }),
  )
  .handler(async ({ data: { campaignId, status } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "content"]);

    const { data: updated, error } = await supabase
      .from("ad_campaigns")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", campaignId)
      .eq("store_id", identity.store_id)
      .select()
      .single();

    if (error) {
      console.error("[ads] Error updating campaign status:", error);
      throw new Error("Erro ao atualizar status da campanha.");
    }

    return updated;
  });
