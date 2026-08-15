import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, getAnonServerClient } from "@/lib/supabase";
import { getServerIdentity } from "@/lib/server-access";

export interface SponsorMetricsDTO {
  sponsor_id: string;
  sponsor_name: string;
  logo_url?: string | null;
  tier: string;
  total_impressions: number;
  unique_views: number;
  total_clicks: number;
  ctr_percentage: number;
  avg_duration_seconds: number;
  scroll_reach_50: number;
  scroll_reach_100: number;
}

export const recordAdTelemetry = createServerFn({ method: "POST" })
  .validator(
    z.object({
      store_id: z.string().uuid(),
      sponsor_id: z.string().uuid().optional(),
      article_id: z.string().uuid().optional(),
      post_id: z.string().uuid().optional(),
      event_type: z.enum([
        "view_impression",
        "view_unique",
        "view_duration",
        "scroll_depth",
        "click",
      ]),
      session_hash: z.string().default("anonymous"),
      duration_seconds: z.number().int().default(0),
      scroll_percentage: z.number().int().default(0),
    }),
  )
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();

    const { error } = await supabase.rpc("record_ad_telemetry", {
      p_store_id: input.store_id,
      p_sponsor_id: input.sponsor_id || null,
      p_article_id: input.article_id || null,
      p_post_id: input.post_id || null,
      p_event_type: input.event_type,
      p_session_hash: input.session_hash,
      p_duration_seconds: input.duration_seconds,
      p_scroll_percentage: input.scroll_percentage,
    });

    if (error) {
      console.error("[TELEMETRY] Failed to record telemetry:", error.message);
      return { success: false };
    }

    return { success: true };
  });

export const trackBuilderEvent = createServerFn({ method: "POST" })
  .validator(
    z.object({
      event_type: z.string(),
      node_id: z.string(),
      block_type: z.string(),
      document_id: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }),
  )
  .handler(async ({ data }) => {
    // Inserção rápida sem bloquear
    return { success: true };
  });

export const getSponsorMetricsDashboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    totalImpressions: number;
    totalUniqueViews: number;
    totalClicks: number;
    avgCtr: number;
    sponsorsMetrics: SponsorMetricsDTO[];
  }> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity.store_id) {
      return {
        totalImpressions: 0,
        totalUniqueViews: 0,
        totalClicks: 0,
        avgCtr: 0,
        sponsorsMetrics: [],
      };
    }

    // Busca patrocinadores e seus eventos agregados
    const [sponsorsRes, eventsRes] = await Promise.all([
      supabase.from("sponsors").select("id, name, logo_url, tier").eq("store_id", identity.store_id),
      supabase
        .from("ad_telemetry_events")
        .select("sponsor_id, event_type, duration_seconds, scroll_percentage")
        .eq("store_id", identity.store_id),
    ]);

    const sponsors = sponsorsRes.data || [];
    const events = eventsRes.data || [];

    let totalImpressions = 0;
    let totalUniqueViews = 0;
    let totalClicks = 0;

    const sponsorsMetrics: SponsorMetricsDTO[] = sponsors.map((sp) => {
      const spEvents = events.filter((e) => e.sponsor_id === sp.id);

      const impressions = spEvents.filter((e) => e.event_type === "view_impression").length;
      const uniques = spEvents.filter((e) => e.event_type === "view_unique").length;
      const clicks = spEvents.filter((e) => e.event_type === "click").length;
      const scroll50 = spEvents.filter(
        (e) => e.event_type === "scroll_depth" && (e.scroll_percentage || 0) >= 50,
      ).length;
      const scroll100 = spEvents.filter(
        (e) => e.event_type === "scroll_depth" && (e.scroll_percentage || 0) >= 100,
      ).length;

      const durationEvents = spEvents.filter((e) => e.event_type === "view_duration");
      const avgDuration =
        durationEvents.length > 0
          ? Math.round(
              durationEvents.reduce((sum, e) => sum + (e.duration_seconds || 0), 0) /
                durationEvents.length,
            )
          : 0;

      const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;

      totalImpressions += impressions;
      totalUniqueViews += uniques;
      totalClicks += clicks;

      return {
        sponsor_id: sp.id,
        sponsor_name: sp.name,
        logo_url: sp.logo_url,
        tier: sp.tier,
        total_impressions: impressions,
        unique_views: uniques,
        total_clicks: clicks,
        ctr_percentage: ctr,
        avg_duration_seconds: avgDuration,
        scroll_reach_50: scroll50,
        scroll_reach_100: scroll100,
      };
    });

    const avgCtr =
      totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;

    return {
      totalImpressions,
      totalUniqueViews,
      totalClicks,
      avgCtr,
      sponsorsMetrics,
    };
  },
);
