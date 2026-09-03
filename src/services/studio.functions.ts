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

    if (!error && templates && templates.length > 0) {
      return templates as StudioTemplateDTO[];
    }

    // Templates Canônicos Oficiais (Presets Universais de Nicho para Studio 3.0)
    const canonicals: StudioTemplateDTO[] = [
      {
        id: "tpl-veiculo-oferta",
        category: "veiculos",
        title: "Ficha Seminovos — Oferta & Parcelamento",
        template_type: "graphic",
        aspect_ratio: "1:1",
        preview_url: null,
        is_featured: true,
        is_system: true,
        created_at: new Date().toISOString(),
        canvas_data: {
          aspectRatio: "1:1",
          background: { type: "color", value: "#0B1120" },
          elements: [
            {
              id: "el-header-badge",
              type: "shape",
              layer: 2,
              zIndex: 1,
              position: { x: 50, y: 12 },
              size: { width: 88, height: 6 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: { shapeType: "badge", fill: "#1E293B", borderRadius: 8 },
            },
            {
              id: "el-category-text",
              type: "text",
              layer: 7,
              zIndex: 2,
              position: { x: 50, y: 12 },
              size: { width: 80, height: 5 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: {
                content: "VEÍCULO SELECIONADO • PRONTA ENTREGA",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: 800,
                color: "#38BDF8",
                textAlign: "center",
                lineHeight: 1,
                letterSpacing: 2,
              },
            },
            {
              id: "el-title-vehicle",
              type: "text",
              layer: 7,
              zIndex: 3,
              position: { x: 50, y: 28 },
              size: { width: 90, height: 14 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: {
                content: "JEEP COMPASS 2.0 LIMITED 4X4",
                fontFamily: "Inter",
                fontSize: 32,
                fontWeight: 900,
                color: "#FFFFFF",
                textAlign: "center",
                lineHeight: 1.1,
                letterSpacing: -1,
              },
            },
            {
              id: "el-specs-vehicle",
              type: "text",
              layer: 7,
              zIndex: 4,
              position: { x: 50, y: 46 },
              size: { width: 85, height: 8 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: {
                content: "ANO 2022 • 38.000 KM • CÂMBIO AUTOMÁTICO • TETO SOLAR",
                fontFamily: "Inter",
                fontSize: 16,
                fontWeight: 600,
                color: "#94A3B8",
                textAlign: "center",
                lineHeight: 1.2,
                letterSpacing: 0.5,
              },
            },
            {
              id: "el-price-box",
              type: "shape",
              layer: 2,
              zIndex: 5,
              position: { x: 50, y: 72 },
              size: { width: 88, height: 22 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: { shapeType: "rectangle", fill: "#1E293B", borderRadius: 16 },
            },
            {
              id: "el-price-val",
              type: "text",
              layer: 7,
              zIndex: 6,
              position: { x: 50, y: 68 },
              size: { width: 80, height: 10 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: {
                content: "R$ 142.900",
                fontFamily: "Inter",
                fontSize: 40,
                fontWeight: 900,
                color: "#10B981",
                textAlign: "center",
                lineHeight: 1,
                letterSpacing: -1,
              },
            },
            {
              id: "el-installment-val",
              type: "text",
              layer: 7,
              zIndex: 7,
              position: { x: 50, y: 78 },
              size: { width: 80, height: 6 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: {
                content: "Entrada sugerida + Parcelas a partir de R$ 1.890",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: 700,
                color: "#F8FAFC",
                textAlign: "center",
                lineHeight: 1,
                letterSpacing: 0,
              },
            },
          ],
        },
      },
      {
        id: "tpl-imovel-story",
        category: "imoveis",
        title: "Ficha Imobiliária — Story 9:16",
        template_type: "graphic",
        aspect_ratio: "9:16",
        preview_url: null,
        is_featured: true,
        is_system: true,
        created_at: new Date().toISOString(),
        canvas_data: {
          aspectRatio: "9:16",
          background: { type: "color", value: "#0F172A" },
          elements: [
            {
              id: "el-imovel-badge",
              type: "text",
              layer: 7,
              zIndex: 1,
              position: { x: 50, y: 8 },
              size: { width: 85, height: 4 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: {
                content: "OPORTUNIDADE EXCLUSIVA DE VENDA",
                fontFamily: "Inter",
                fontSize: 13,
                fontWeight: 800,
                color: "#F59E0B",
                textAlign: "center",
                lineHeight: 1,
                letterSpacing: 2,
              },
            },
            {
              id: "el-imovel-title",
              type: "text",
              layer: 7,
              zIndex: 2,
              position: { x: 50, y: 22 },
              size: { width: 88, height: 12 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: {
                content: "APARTAMENTO ALTO PADRÃO COM VISTA",
                fontFamily: "Inter",
                fontSize: 32,
                fontWeight: 900,
                color: "#FFFFFF",
                textAlign: "center",
                lineHeight: 1.1,
                letterSpacing: -0.5,
              },
            },
            {
              id: "el-imovel-specs",
              type: "text",
              layer: 7,
              zIndex: 3,
              position: { x: 50, y: 40 },
              size: { width: 85, height: 14 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: {
                content: "📐 145m² de Área Privativa\n🛏️ 3 Suítes com Varanda\n🚗 2 Vagas de Garagem Cobertas\n🏊‍♂️ Lazer Completo no Condomínio",
                fontFamily: "Inter",
                fontSize: 16,
                fontWeight: 600,
                color: "#E2E8F0",
                textAlign: "left",
                lineHeight: 1.6,
                letterSpacing: 0,
              },
            },
            {
              id: "el-imovel-price",
              type: "text",
              layer: 7,
              zIndex: 4,
              position: { x: 50, y: 80 },
              size: { width: 85, height: 8 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: {
                content: "R$ 980.000",
                fontFamily: "Inter",
                fontSize: 36,
                fontWeight: 900,
                color: "#10B981",
                textAlign: "center",
                lineHeight: 1,
                letterSpacing: -1,
              },
            },
          ],
        },
      },
      {
        id: "tpl-gastro-prato",
        category: "gastronomia",
        title: "Cardápio do Dia & Prato do Chef",
        template_type: "graphic",
        aspect_ratio: "1:1",
        preview_url: null,
        is_featured: true,
        is_system: true,
        created_at: new Date().toISOString(),
        canvas_data: {
          aspectRatio: "1:1",
          background: { type: "color", value: "#1C1917" },
          elements: [
            {
              id: "el-gastro-badge",
              type: "text",
              layer: 7,
              zIndex: 1,
              position: { x: 50, y: 15 },
              size: { width: 85, height: 5 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: {
                content: "ESPECIAL DO ALMOÇO • 11H30 ÀS 14H",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: 800,
                color: "#EA580C",
                textAlign: "center",
                lineHeight: 1,
                letterSpacing: 2,
              },
            },
            {
              id: "el-gastro-title",
              type: "text",
              layer: 7,
              zIndex: 2,
              position: { x: 50, y: 35 },
              size: { width: 88, height: 16 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: {
                content: "PARMEGIANA DE FILÉ MIGNON",
                fontFamily: "Inter",
                fontSize: 34,
                fontWeight: 900,
                color: "#FAFAF9",
                textAlign: "center",
                lineHeight: 1.1,
                letterSpacing: -1,
              },
            },
            {
              id: "el-gastro-desc",
              type: "text",
              layer: 7,
              zIndex: 3,
              position: { x: 50, y: 56 },
              size: { width: 85, height: 8 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: {
                content: "Acompanha arroz branco soltinho e fritas crocantes artesanais.",
                fontFamily: "Inter",
                fontSize: 16,
                fontWeight: 500,
                color: "#A8A29E",
                textAlign: "center",
                lineHeight: 1.3,
                letterSpacing: 0,
              },
            },
            {
              id: "el-gastro-price",
              type: "text",
              layer: 7,
              zIndex: 4,
              position: { x: 50, y: 78 },
              size: { width: 85, height: 10 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: {
                content: "R$ 44,90",
                fontFamily: "Inter",
                fontSize: 42,
                fontWeight: 900,
                color: "#F97316",
                textAlign: "center",
                lineHeight: 1,
                letterSpacing: -1,
              },
            },
          ],
        },
      },
      {
        id: "tpl-turismo-story",
        category: "turismo",
        title: "Lâmina de Viagem — Story 9:16",
        template_type: "graphic",
        aspect_ratio: "9:16",
        preview_url: null,
        is_featured: true,
        is_system: true,
        created_at: new Date().toISOString(),
        canvas_data: {
          aspectRatio: "9:16",
          background: { type: "color", value: "#0C4A6E" },
          elements: [
            {
              id: "el-turismo-badge",
              type: "text",
              layer: 7,
              zIndex: 1,
              position: { x: 50, y: 10 },
              size: { width: 85, height: 5 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: {
                content: "PACOTE COMPLETO COM AÉREO",
                fontFamily: "Inter",
                fontSize: 13,
                fontWeight: 800,
                color: "#38BDF8",
                textAlign: "center",
                lineHeight: 1,
                letterSpacing: 2,
              },
            },
            {
              id: "el-turismo-dest",
              type: "text",
              layer: 7,
              zIndex: 2,
              position: { x: 50, y: 26 },
              size: { width: 88, height: 14 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: {
                content: "PATAGÔNIA & BARILOCHE",
                fontFamily: "Inter",
                fontSize: 34,
                fontWeight: 900,
                color: "#FFFFFF",
                textAlign: "center",
                lineHeight: 1.1,
                letterSpacing: -1,
              },
            },
            {
              id: "el-turismo-details",
              type: "text",
              layer: 7,
              zIndex: 3,
              position: { x: 50, y: 48 },
              size: { width: 85, height: 14 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: {
                content: "✈️ Voo Ida e Volta Incluso\n🏨 6 Noites em Hotel 4 Estrelas\n🚐 Traslados e Seguro Viagem\n❄️ Tour Circuito Chico e Cerro Catedral",
                fontFamily: "Inter",
                fontSize: 16,
                fontWeight: 600,
                color: "#E0F2FE",
                textAlign: "left",
                lineHeight: 1.6,
                letterSpacing: 0,
              },
            },
            {
              id: "el-turismo-parcelas",
              type: "text",
              layer: 7,
              zIndex: 4,
              position: { x: 50, y: 80 },
              size: { width: 85, height: 10 },
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
              properties: {
                content: "10x de R$ 489 sem juros",
                fontFamily: "Inter",
                fontSize: 26,
                fontWeight: 900,
                color: "#34D399",
                textAlign: "center",
                lineHeight: 1,
                letterSpacing: -0.5,
              },
            },
          ],
        },
      },
    ];

    if (data?.category && data.category !== "all") {
      return canonicals.filter((t) => t.category === data.category);
    }

    return canonicals;
  });
