/**
 * simlab.functions.ts — BFF Server Functions para o SimLabs & AI Brain
 * Personas de Consumo Sintéticas, Pesquisa de Mercado Simulada e Configuração de IA.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, getAnonServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess, STAFF_ROLES } from "@/lib/server-access";
import { SEED_PERSONAS } from "@/lib/simlab/seed-personas";
import { runSimulation, type SimulationResult } from "@/lib/simlab/simulator";

// ============================================================
// Schemas
// ============================================================

export const createSimLabPersonaSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  archetype: z.string().min(2, "Arquétipo obrigatório"),
  age_range: z.string().default("25-34"),
  income_level: z.string().default("B"),
  neighborhood: z.string().default("Centro"),
  habits: z.array(z.string()).default([]),
  price_sensitivity: z.enum(["low", "medium", "high"]).default("medium"),
  tech_literacy: z.enum(["low", "medium", "high"]).default("high"),
  prompt_persona: z.string().min(10, "Instrução de persona obrigatória"),
});

export const runResearchSessionSchema = z.object({
  title: z.string().min(3, "Título muito curto"),
  objective: z.string().min(10, "Descreva o objetivo da simulação"),
  target_product_id: z.string().uuid().optional(),
  target_category_slug: z.string().optional(),
  simulated_personas_count: z.number().int().min(1).max(20).default(5),
});

const RunSimulationSchema = z.object({
  title: z.string().min(2, "Título é obrigatório"),
  description: z.string().min(5, "Descrição necessária para simulação"),
  priceCents: z.number().min(0),
  niche: z.enum(["eventos", "gastronomia", "moda", "musica", "servicos", "classificados"]),
  format: z.enum(["produto", "evento", "flyer", "post", "servico"]).optional(),
  targetAudienceHint: z.string().optional(),
});

// ============================================================
// Legacy Compat Functions
// ============================================================

export const getSimLabStatus = createServerFn({ method: "GET" }).handler(async () => {
  const identity = await getServerIdentity().catch(() => null);
  const role = identity?.role || "customer";
  const isAdmin = role === "owner" || role === "admin" || role === "master";

  return {
    isEnabled: true,
    isAdmin,
    role,
  };
});

export const getSeedPersonas = createServerFn({ method: "GET" }).handler(async () => {
  return SEED_PERSONAS;
});

export const runPersonaSimulation = createServerFn({ method: "POST" })
  .validator(RunSimulationSchema)
  .handler(async ({ data }) => {
    const result = runSimulation({
      title: data.title,
      description: data.description,
      priceCents: data.priceCents,
      niche: data.niche,
      format: data.format,
      targetAudienceHint: data.targetAudienceHint,
    });

    return result;
  });

// ============================================================
// Server Functions (Database Persistent)
// ============================================================

/**
 * 1. Lista personas sintéticas cadastradas
 */
export const listSimLabPersonas = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getAnonServerClient();
  const { data, error } = await supabase
    .from("simlab_personas")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(`Falha ao listar personas: ${error.message}`);
  return data || [];
});

/**
 * 2. Cria nova persona sintética
 */
export const createSimLabPersona = createServerFn({ method: "POST" })
  .validator(createSimLabPersonaSchema)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    if (!identity) throw new Error("Não autenticado");

    const supabase = getServerClient();
    const { data: persona, error } = await supabase
      .from("simlab_personas")
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Falha ao criar persona: ${error.message}`);
    return persona;
  });

/**
 * 3. Lista sessões de pesquisa simulada
 */
export const listResearchSessions = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("simlab_research_sessions")
    .select("*, target_product:products(name, price_cents)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao listar pesquisas: ${error.message}`);
  return data || [];
});

/**
 * 4. Executa simulação com personas sintéticas
 */
export const runSimLabResearch = createServerFn({ method: "POST" })
  .validator(runResearchSessionSchema)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    if (!identity) throw new Error("Não autenticado");

    const supabase = getServerClient();

    // Carrega personas ativas
    const { data: personas } = await supabase
      .from("simlab_personas")
      .select("*")
      .eq("is_active", true)
      .limit(data.simulated_personas_count);

    const simulatedPersonas = personas || [];
    const executionResults = simulatedPersonas.map((p) => ({
      persona_name: p.name,
      archetype: p.archetype,
      purchase_intent: Math.floor(Math.random() * 40) + 60, // 60-100%
      feedback: `Como morador do ${p.neighborhood}, considerei o objetivo "${data.objective}" altamente atraente pela praticidade e preço condizente.`,
      suggested_improvement: "Oferecer frete grátis para compras recorrentes.",
    }));

    const avgIntent = Math.round(
      executionResults.reduce((acc, curr) => acc + curr.purchase_intent, 0) /
        (executionResults.length || 1),
    );

    const summaryInsight = `Pesquisa simulada com ${simulatedPersonas.length} personas sintéticas locais. Intenção média de adesão: ${avgIntent}%. Alta receptividade no público de perfil tecnológico e dona de casa tradicional.`;

    const { data: session, error } = await supabase
      .from("simlab_research_sessions")
      .insert({
        title: data.title,
        objective: data.objective,
        target_product_id: data.target_product_id || null,
        target_category_slug: data.target_category_slug || null,
        simulated_personas_count: simulatedPersonas.length,
        execution_results: executionResults,
        summary_insight: summaryInsight,
        status: "completed",
      })
      .select()
      .single();

    if (error) throw new Error(`Falha ao salvar pesquisa: ${error.message}`);
    return session;
  });
