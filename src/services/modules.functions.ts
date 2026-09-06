import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";
import { getIdentity } from "./identity.functions";
import { z } from "zod";

export interface PlatformModuleDTO {
  module_key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  is_public: boolean;
  badge: string | null;
  order_index: number;
  updated_at: string;
}

/**
 * Consulta pública de módulos ativos na plataforma Wider.
 */
export const getPublicPlatformModules = createServerFn({ method: "GET" }).handler(
  async (): Promise<PlatformModuleDTO[]> => {
    const supabase = getServerClient();
    try {
      const { data, error } = await supabase
        .from("platform_modules_config")
        .select("*")
        .eq("is_public", true)
        .order("order_index", { ascending: true });

      if (error || !data) {
        console.warn("[modules] Falha ao consultar módulos públicos:", error);
        return [];
      }

      return data as PlatformModuleDTO[];
    } catch (err) {
      console.error("[modules] Erro em getPublicPlatformModules:", err);
      return [];
    }
  },
);

/**
 * Consulta completa de governança para o Admin Master.
 */
export const adminListPlatformModules = createServerFn({ method: "GET" }).handler(
  async (): Promise<PlatformModuleDTO[]> => {
    const supabase = getServerClient();
    const identity = await getIdentity();

    if (!identity || !["admin", "master", "platform_admin"].includes(identity.role || "")) {
      throw new Error("Acesso restrito ao Painel Master.");
    }

    const { data, error } = await supabase
      .from("platform_modules_config")
      .select("*")
      .order("order_index", { ascending: true });

    if (error) {
      console.error("[modules] adminListPlatformModules error:", error);
      throw new Error("Erro ao listar módulos de governança.");
    }

    return (data || []) as PlatformModuleDTO[];
  },
);

/**
 * Ativa ou desativa um módulo da plataforma em tempo real.
 */
export const adminTogglePlatformModule = createServerFn({ method: "POST" })
  .validator(
    z.object({
      moduleKey: z.string().min(1),
      enabled: z.boolean(),
    }),
  )
  .handler(async ({ data: { moduleKey, enabled } }) => {
    const supabase = getServerClient();
    const identity = await getIdentity();

    if (!identity || !["admin", "master", "platform_admin"].includes(identity.role || "")) {
      throw new Error("Não autorizado.");
    }

    const { data, error } = await supabase
      .from("platform_modules_config")
      .update({
        enabled,
        updated_by: identity.id,
        updated_at: new Date().toISOString(),
      })
      .eq("module_key", moduleKey)
      .select()
      .single();

    if (error) {
      console.error("[modules] adminTogglePlatformModule error:", error);
      throw new Error("Erro ao alternar status do módulo.");
    }

    return { success: true, module: data };
  });

/**
 * Atualiza metadados do módulo (Nome, Descrição, Badge).
 */
export const adminUpdatePlatformModule = createServerFn({ method: "POST" })
  .validator(
    z.object({
      moduleKey: z.string().min(1),
      name: z.string().min(2),
      description: z.string().optional(),
      badge: z.string().optional(),
      orderIndex: z.number().int().optional(),
    }),
  )
  .handler(async ({ data: { moduleKey, name, description, badge, orderIndex } }) => {
    const supabase = getServerClient();
    const identity = await getIdentity();

    if (!identity || !["admin", "master", "platform_admin"].includes(identity.role || "")) {
      throw new Error("Não autorizado.");
    }

    const updatePayload: Record<string, any> = {
      name: name.trim(),
      description: description?.trim() || null,
      badge: badge?.trim() || null,
      updated_by: identity.id,
      updated_at: new Date().toISOString(),
    };

    if (orderIndex !== undefined) {
      updatePayload.order_index = orderIndex;
    }

    const { data, error } = await supabase
      .from("platform_modules_config")
      .update(updatePayload)
      .eq("module_key", moduleKey)
      .select()
      .single();

    if (error) {
      console.error("[modules] adminUpdatePlatformModule error:", error);
      throw new Error("Erro ao atualizar módulo.");
    }

    return { success: true, module: data };
  });
