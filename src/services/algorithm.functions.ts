import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity } from "@/lib/server-access";

export const AlgorithmParametersSchema = z.object({
  weight_geo: z.number().min(0).max(1),
  weight_open_status: z.number().min(0).max(1),
  weight_user_affinity: z.number().min(0).max(1),
  weight_freshness: z.number().min(0).max(1),
  weight_store_quality: z.number().min(0).max(1),
  weight_token_boost: z.number().min(0).max(1),
  max_radius_km: z.number().min(1).max(100).default(15),
  decay_half_life_days: z.number().min(1).max(30).default(7),
});

export type AlgorithmParameters = z.infer<typeof AlgorithmParametersSchema>;

// ============================================================
// 1. OBTER PARÂMETROS ATUAIS DO ALGORITMO
// ============================================================
export const getAlgorithmParameters = createServerFn({ method: "GET" }).handler(async () => {
  const db = getServerClient();

  const { data, error } = await db
    .from("platform_algorithm_parameters")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) {
    // Fallback canônico seguro
    return {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Algoritmo Canônico Wider Pulse v1",
      weight_geo: 0.25,
      weight_open_status: 0.20,
      weight_user_affinity: 0.20,
      weight_freshness: 0.15,
      weight_store_quality: 0.10,
      weight_token_boost: 0.10,
      max_radius_km: 15,
      decay_half_life_days: 7,
      updated_at: new Date().toISOString(),
    };
  }

  return {
    id: data.id,
    name: data.name,
    weight_geo: Number(data.weight_geo) || 0.25,
    weight_open_status: Number(data.weight_open_status) || 0.20,
    weight_user_affinity: Number(data.weight_user_affinity) || 0.20,
    weight_freshness: Number(data.weight_freshness) || 0.15,
    weight_store_quality: Number(data.weight_store_quality) || 0.10,
    weight_token_boost: Number(data.weight_token_boost) || 0.10,
    max_radius_km: Number(data.max_radius_km) || 15,
    decay_half_life_days: Number(data.decay_half_life_days) || 7,
    updated_at: data.updated_at,
  };
});

// ============================================================
// 2. ATUALIZAR PESOS DO ALGORITMO (RESTRITO AO ADMIN MASTER)
// ============================================================
export const updateAlgorithmParameters = createServerFn({ method: "POST" })
  .validator(AlgorithmParametersSchema)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    if (identity.role !== "platform_admin" && identity.role !== "master") {
      throw new Error("Acesso negado: Apenas o Admin Master pode calibrar os pesos do algoritmo.");
    }

    const db = getServerClient();

    const { error } = await db
      .from("platform_algorithm_parameters")
      .update({
        weight_geo: data.weight_geo,
        weight_open_status: data.weight_open_status,
        weight_user_affinity: data.weight_user_affinity,
        weight_freshness: data.weight_freshness,
        weight_store_quality: data.weight_store_quality,
        weight_token_boost: data.weight_token_boost,
        max_radius_km: data.max_radius_km,
        decay_half_life_days: data.decay_half_life_days,
        updated_at: new Date().toISOString(),
        updated_by: identity.id,
      })
      .eq("id", "00000000-0000-0000-0000-000000000001");

    if (error) {
      console.error("[updateAlgorithmParameters] db error:", error);
      throw new Error("Falha ao salvar novos pesos do algoritmo.");
    }

    return {
      success: true,
      message: "Pesos do algoritmo calibrados com sucesso.",
    };
  });
