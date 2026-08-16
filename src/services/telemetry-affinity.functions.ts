/**
 * telemetry-affinity.functions.ts — BFF para Telemetria Comportamental e Algoritmo de Afinidade
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getCurrentIdentity } from "@/services/cart-helpers";

export interface UserAffinityDTO {
  niche: string;
  total_score: number;
  interaction_count: number;
  last_interacted_at: string;
}

export const recordUserBehavior = createServerFn({ method: "POST" })
  .validator(
    z.object({
      sessionId: z.string().optional(),
      eventType: z.enum([
        "view_item",
        "search",
        "click_banner",
        "click_whatsapp",
        "add_to_cart",
        "quote_request",
        "booking_complete",
        "order_complete",
      ]),
      entityType: z.enum([
        "product",
        "store",
        "classified",
        "job",
        "tourism",
        "directory",
        "service",
      ]),
      entityId: z.string().uuid().optional(),
      categorySlug: z.string().optional(),
      niche: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity().catch(() => null);

    const userId = identity?.customer_id || null;
    const sessionId = data.sessionId || (userId ? null : "anon_session");

    const { data: res, error } = await supabase.rpc("record_user_behavior_event", {
      p_user_id: userId,
      p_session_id: sessionId,
      p_event_type: data.eventType,
      p_entity_type: data.entityType,
      p_entity_id: data.entityId || null,
      p_category_slug: data.categorySlug || null,
      p_niche: data.niche || "geral",
      p_metadata: data.metadata || {},
    });

    if (error) {
      console.warn("[telemetry] Erro ao registrar telemetria comportamental:", error);
      return { success: false };
    }

    return { success: true, result: res };
  });

export const getUserTopAffinities = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        sessionId: z.string().optional(),
        limit: z.number().int().min(1).max(10).optional().default(3),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity().catch(() => null);

    const userId = identity?.customer_id || null;
    const sessionId = data?.sessionId || (userId ? null : "anon_session");

    const { data: rows, error } = await supabase.rpc("get_user_top_affinities", {
      p_user_id: userId,
      p_session_id: sessionId,
      p_limit: data?.limit || 3,
    });

    if (error) {
      console.warn("[telemetry] Erro ao buscar afinidades do usuário:", error);
      return [];
    }

    return (rows || []).map((r: any) => ({
      niche: r.niche,
      total_score: Number(r.total_score || 0),
      interaction_count: Number(r.interaction_count || 0),
      last_interacted_at: r.last_interacted_at,
    })) as UserAffinityDTO[];
  });
