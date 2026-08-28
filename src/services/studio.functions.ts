/**
 * studio.functions.ts — BFF Server Functions para Wider Studio 3.0
 * Gestão de Projetos de Design Gráfico, Vídeo e Templates Oficiais.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, getAnonServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

// ============================================================
// Schemas & Types
// ============================================================

export const studioProjectTypeEnum = z.enum(["graphic", "video"]);
export type StudioProjectType = z.infer<typeof studioProjectTypeEnum>;

export interface StudioProjectDTO {
  id: string;
  store_id: string | null;
  user_id: string;
  title: string;
  project_type: StudioProjectType;
  aspect_ratio: string;
  canvas_data: Record<string, any>;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudioTemplateDTO {
  id: string;
  category: string;
  title: string;
  template_type: StudioProjectType;
  aspect_ratio: string;
  canvas_data: Record<string, any>;
  preview_url: string | null;
  is_featured: boolean;
  is_system: boolean;
  created_at: string;
}

// ============================================================
// Server Functions
// ============================================================

/**
 * 1. Lista todos os projetos salvos do usuário / loja
 */
export const listStudioProjects = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        store_id: z.string().uuid().optional(),
        project_type: studioProjectTypeEnum.optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    const supabase = getServerClient();

    let query = supabase
      .from("studio_projects")
      .select("*")
      .order("updated_at", { ascending: false });

    if (data?.store_id) {
      query = query.eq("store_id", data.store_id);
    } else if (identity.store_id) {
      query = query.or(`store_id.eq.${identity.store_id},user_id.eq.${identity.id}`);
    } else {
      query = query.eq("user_id", identity.id);
    }

    if (data?.project_type) {
      query = query.eq("project_type", data.project_type);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error("[studio.functions] Erro ao listar projetos:", error.message);
      return [] as StudioProjectDTO[];
    }

    return (projects || []) as StudioProjectDTO[];
  });

/**
 * 2. Carrega um projeto específico por ID
 */
export const getStudioProjectById = createServerFn({ method: "GET" })
  .validator(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();

    const { data: project, error } = await supabase
      .from("studio_projects")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();

    if (error || !project) {
      return null;
    }

    return project as StudioProjectDTO;
  });

/**
 * 3. Salva ou atualiza um projeto no banco
 */
export const saveStudioProject = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      title: z.string().min(1).default("Sem Título"),
      project_type: studioProjectTypeEnum.default("graphic"),
      aspect_ratio: z.string().default("1:1"),
      canvas_data: z.record(z.any()),
      thumbnail_url: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    const supabase = getServerClient();

    const payload = {
      title: data.title,
      project_type: data.project_type,
      aspect_ratio: data.aspect_ratio,
      canvas_data: data.canvas_data,
      thumbnail_url: data.thumbnail_url || null,
      store_id: identity.store_id || null,
      user_id: identity.id,
      updated_at: new Date().toISOString(),
    };

    if (data.id) {
      const { data: updated, error } = await supabase
        .from("studio_projects")
        .update(payload)
        .eq("id", data.id)
        .select("*")
        .single();

      if (error) {
        throw new Error("Erro ao atualizar projeto: " + error.message);
      }
      return updated as StudioProjectDTO;
    } else {
      const { data: created, error } = await supabase
        .from("studio_projects")
        .insert(payload)
        .select("*")
        .single();

      if (error) {
        throw new Error("Erro ao criar projeto: " + error.message);
      }
      return created as StudioProjectDTO;
    }
  });

/**
 * 4. Deleta um projeto
 */
export const deleteStudioProject = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    const supabase = getServerClient();

    const { error } = await supabase.from("studio_projects").delete().eq("id", data.id);

    if (error) {
      throw new Error("Erro ao excluir projeto: " + error.message);
    }

    return { success: true };
  });

/**
 * 5. Lista templates oficiais do sistema
 */
export const listStudioTemplates = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        category: z.string().optional(),
        template_type: studioProjectTypeEnum.optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const supabase = getAnonServerClient();

    let query = supabase
      .from("studio_templates")
      .select("*")
      .order("is_featured", { ascending: false });

    if (data?.category && data.category !== "all") {
      query = query.eq("category", data.category);
    }

    if (data?.template_type) {
      query = query.eq("template_type", data.template_type);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error("[studio.functions] Erro ao listar templates:", error.message);
      return [] as StudioTemplateDTO[];
    }

    return (templates || []) as StudioTemplateDTO[];
  });
