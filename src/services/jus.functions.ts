/**
 * jus.functions.ts — BFF Server Functions para o Módulo JUS & Advocacia
 * Gestão de Processos Judiciais, Demandas de Cidadãos, Propostas de Honorários e Contratos.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, getAnonServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

// ============================================================
// Schemas
// ============================================================

export const createJusDemandSchema = z.object({
  title: z.string().min(3, "Título muito curto"),
  legal_area: z.string().min(2, "Área jurídica obrigatória"),
  description: z.string().min(10, "Descreva detalhadamente o caso"),
  estimated_value_cents: z.number().int().nonnegative().optional(),
  urgency: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  city: z.string().default("Regional"),
  state: z.string().default("SC"),
  documents: z.array(z.string().url()).default([]),
  is_anonymous: z.boolean().default(false),
});

export const sendJusProposalSchema = z.object({
  demand_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  fee_type: z.enum(["fixed", "success_percentage", "hybrid"]).default("fixed"),
  fixed_value_cents: z.number().int().nonnegative().default(0),
  success_percentage: z.number().min(0).max(100).default(0),
  proposal_details: z.string().min(10, "Detalhe sua proposta"),
  estimated_deadline_days: z.number().int().positive().default(30),
});

// ============================================================
// Server Functions
// ============================================================

/**
 * 1. Lista processos do cidadão (por CPF ou vinculação direta)
 */
export const listMyLawsuits = createServerFn({ method: "GET" })
  .validator(z.object({ cpf: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    if (!identity) throw new Error("Não autenticado");

    const supabase = getServerClient();
    let query = supabase
      .from("mined_lawsuits")
      .select("*, movements:lawsuit_movements(*)")
      .order("last_movement_date", { ascending: false, nullsFirst: false });

    if (data?.cpf) {
      const cleanCpf = data.cpf.replace(/\D/g, "");
      query = query.or(`linked_cpf.eq.${cleanCpf},linked_profile_id.eq.${identity.id}`);
    } else {
      query = query.eq("linked_profile_id", identity.id);
    }

    const { data: lawsuits, error } = await query;
    if (error) throw new Error(`Falha ao buscar processos: ${error.message}`);
    return lawsuits || [];
  });

/**
 * 2. Cidadão cria nova demanda jurídica
 */
export const createJusDemand = createServerFn({ method: "POST" })
  .validator(createJusDemandSchema)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    if (!identity) throw new Error("Não autenticado");

    const supabase = getServerClient();
    const { data: demand, error } = await supabase
      .from("jus_demands")
      .insert({
        profile_id: identity.id,
        title: data.title,
        legal_area: data.legal_area,
        description: data.description,
        estimated_value_cents: data.estimated_value_cents || 0,
        urgency: data.urgency,
        city: data.city,
        state: data.state,
        documents: data.documents,
        is_anonymous: data.is_anonymous,
        status: "open",
      })
      .select()
      .single();

    if (error) throw new Error(`Falha ao criar demanda: ${error.message}`);
    return demand;
  });

/**
 * 3. Lista demandas disponíveis no mural para advogados verificados
 */
export const listMarketplaceDemands = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        legal_area: z.string().optional(),
        city: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const supabase = getAnonServerClient();
    let query = supabase
      .from("jus_demands")
      .select("id, title, legal_area, description, urgency, city, state, created_at, status")
      .in("status", ["open", "proposals_received"])
      .order("created_at", { ascending: false });

    if (data?.legal_area && data.legal_area !== "all") {
      query = query.eq("legal_area", data.legal_area);
    }
    if (data?.city) {
      query = query.ilike("city", `%${data.city}%`);
    }

    const { data: demands, error } = await query;
    if (error) throw new Error(`Falha ao listar demandas: ${error.message}`);
    return demands || [];
  });

/**
 * 4. Advogado envia proposta de honorários
 */
export const sendJusProposal = createServerFn({ method: "POST" })
  .validator(sendJusProposalSchema)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    if (!identity) throw new Error("Não autenticado");

    const supabase = getServerClient();
    const { data: proposal, error } = await supabase
      .from("jus_proposals")
      .insert({
        demand_id: data.demand_id,
        lawyer_profile_id: identity.id,
        store_id: identity.store_id || null,
        fee_type: data.fee_type,
        fixed_value_cents: data.fixed_value_cents,
        success_percentage: data.success_percentage,
        proposal_details: data.proposal_details,
        estimated_deadline_days: data.estimated_deadline_days,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw new Error(`Falha ao enviar proposta: ${error.message}`);

    // Atualiza status da demanda para proposals_received
    await supabase
      .from("jus_demands")
      .update({ status: "proposals_received", updated_at: new Date().toISOString() })
      .eq("id", data.demand_id);

    return proposal;
  });

/**
 * 5. Cidadão aceita proposta de honorários e gera contrato
 */
export const acceptJusProposal = createServerFn({ method: "POST" })
  .validator(z.object({ proposal_id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    if (!identity) throw new Error("Não autenticado");

    const supabase = getServerClient();

    // Carrega proposta
    const { data: proposal, error: propErr } = await supabase
      .from("jus_proposals")
      .select("*, demand:jus_demands(*)")
      .eq("id", data.proposal_id)
      .single();

    if (propErr || !proposal) throw new Error("Proposta não encontrada");
    if (proposal.demand.profile_id !== identity.id) {
      throw new Error("Você não é o autor desta demanda");
    }

    // Marca proposta como aceita
    await supabase
      .from("jus_proposals")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", data.proposal_id);

    // Cria contrato formal
    const contractNumber = `JUS-${Date.now().toString().slice(-6)}`;
    const { data: contract, error: contractErr } = await supabase
      .from("jus_contracts")
      .insert({
        demand_id: proposal.demand_id,
        proposal_id: proposal.id,
        client_profile_id: identity.id,
        lawyer_profile_id: proposal.lawyer_profile_id,
        store_id: proposal.store_id,
        contract_number: contractNumber,
        terms_content: `Contrato de prestação de serviços advocatícios referente à demanda "${proposal.demand.title}". Honorários: ${proposal.fixed_value_cents ? `R$ ${(proposal.fixed_value_cents / 100).toFixed(2)}` : ""} + ${proposal.success_percentage}% de êxito.`,
        total_value_cents: proposal.fixed_value_cents || 0,
        status: "active",
      })
      .select()
      .single();

    if (contractErr) throw new Error(`Falha ao gerar contrato: ${contractErr.message}`);

    // Atualiza demanda
    await supabase
      .from("jus_demands")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", proposal.demand_id);

    return contract;
  });

/**
 * 6. Lista demandas abertas pelo próprio cidadão logado
 */
export const getMyDemands = createServerFn({ method: "GET" }).handler(async () => {
  const identity = await getServerIdentity();
  if (!identity) return [];

  const supabase = getServerClient();
  const { data: demands, error } = await supabase
    .from("jus_demands")
    .select("*, proposals:jus_proposals(*)")
    .eq("profile_id", identity.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[JUS] Erro ao buscar minhas demandas:", error);
    return [];
  }
  return demands || [];
});

