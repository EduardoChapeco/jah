import { createServerFn } from '@tanstack/react-start';
import { getServerClient } from '@/lib/supabase';
import { getServerIdentity, assertStoreAccess } from '@/lib/server-access';
import type { 
  ClaimProfile, 
  ClaimIntelligence, 
  ConsumerClaim, 
  ClaimStatus,
  ProofType,
  EntityType,
  ClaimCategory
} from '@/types/claim-intelligence';

export interface SubmitClaimInput {
  storeId: string;
  entityId: string;
  entityType: EntityType;
  requesterName: string;
  requesterEmail: string;
  requesterDocument?: string;
  proofType: ProofType;
  proofData: Record<string, any>;
  additionalNotes?: string;
}

export interface RespondClaimInput {
  claimId: string;
  storeId: string;
  response: string;
}

export interface EscalateLegalInput {
  claimId: string;
  storeId: string;
  notes?: string;
}

// 1. Submeter Reivindicação de Perfil / Empresa
export const submitClaimProfile = createServerFn({ method: 'POST' })
  .validator((data: SubmitClaimInput) => data)
  .handler(async ({ data }): Promise<{ success: boolean; claim: ClaimProfile }> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { data: inserted, error } = await db
      .from('claim_profiles')
      .insert({
        store_id: data.storeId,
        entity_id: data.entityId,
        entity_type: data.entityType,
        requester_name: data.requesterName,
        requester_email: data.requesterEmail,
        requester_document: data.requesterDocument || null,
        proof_type: data.proofType,
        proof_data: data.proofData,
        additional_notes: data.additionalNotes || null,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Erro ao registrar reivindicação de perfil: ${error.message}`);
    }
    return { success: true, claim: inserted as ClaimProfile };
  });

// 2. Listar Solicitações de Claim
export const listClaimRequests = createServerFn({ method: 'GET' })
  .validator((data: { storeId: string; status?: ClaimStatus }) => data)
  .handler(async ({ data }): Promise<ClaimProfile[]> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    let query = db
      .from('claim_profiles')
      .select('*')
      .eq('store_id', data.storeId)
      .order('created_at', { ascending: false });

    if (data.status) {
      query = query.eq('status', data.status);
    }

    const { data: rows, error } = await query;
    if (error) {
      throw new Error(`Erro ao listar reivindicações: ${error.message}`);
    }
    return (rows || []) as ClaimProfile[];
  });

// 3. Obter Inteligência de Mercado e Reputação
export const getClaimIntelligence = createServerFn({ method: 'GET' })
  .validator((data: { storeId: string; entityId: string }) => data)
  .handler(async ({ data }): Promise<ClaimIntelligence | null> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { data: row, error } = await db
      .from('claim_intelligence')
      .select('*')
      .eq('store_id', data.storeId)
      .eq('entity_id', data.entityId)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar inteligência de claim: ${error.message}`);
    }
    return (row as ClaimIntelligence) || null;
  });

// 4. Criar Reclamação Pública do Consumidor
export const createConsumerClaim = createServerFn({ method: 'POST' })
  .validator((data: {
    storeId: string;
    consumerName: string;
    consumerEmail: string;
    consumerDocument?: string;
    targetEntityName: string;
    targetCnpj?: string;
    category: ClaimCategory;
    title: string;
    description: string;
    incidentDate?: string;
    legalAdviseNeeded?: boolean;
  }) => data)
  .handler(async ({ data }): Promise<{ success: boolean; claim: ConsumerClaim }> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { data: inserted, error } = await db
      .from('consumer_claims')
      .insert({
        store_id: data.storeId,
        consumer_name: data.consumerName,
        consumer_email: data.consumerEmail,
        consumer_document: data.consumerDocument || null,
        target_entity_name: data.targetEntityName,
        target_cnpj: data.targetCnpj || null,
        category: data.category,
        title: data.title,
        description: data.description,
        incident_date: data.incidentDate || null,
        legal_advise_needed: Boolean(data.legalAdviseNeeded),
        status: 'open',
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Erro ao cadastrar reclamação do consumidor: ${error.message}`);
    }
    return { success: true, claim: inserted as ConsumerClaim };
  });

// 5. Listar Reclamações de Consumidores
export const listConsumerClaims = createServerFn({ method: 'GET' })
  .validator((data: { storeId: string; targetEntityName?: string; status?: string }) => data)
  .handler(async ({ data }): Promise<ConsumerClaim[]> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    let query = db
      .from('consumer_claims')
      .select('*')
      .eq('store_id', data.storeId)
      .order('created_at', { ascending: false });

    if (data.targetEntityName) {
      query = query.ilike('target_entity_name', `%${data.targetEntityName}%`);
    }
    if (data.status) {
      query = query.eq('status', data.status);
    }

    const { data: rows, error } = await query;
    if (error) {
      throw new Error(`Erro ao listar reclamações do consumidor: ${error.message}`);
    }
    return (rows || []) as ConsumerClaim[];
  });

// 6. Responder Reclamação
export const respondToConsumerClaim = createServerFn({ method: 'POST' })
  .validator((data: RespondClaimInput) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { error } = await db
      .from('consumer_claims')
      .update({
        company_response: data.response,
        replied_at: new Date().toISOString(),
        status: 'company_replied',
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.claimId)
      .eq('store_id', data.storeId);

    if (error) {
      throw new Error(`Erro ao responder reclamação: ${error.message}`);
    }
    return { success: true };
  });

// 7. Escalar para Mediação Jurídica (JUS 360°)
export const escalateClaimToLegal = createServerFn({ method: 'POST' })
  .validator((data: EscalateLegalInput) => data)
  .handler(async ({ data }): Promise<{ success: boolean; lawsuitId?: string }> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { data: claim, error: fetchErr } = await db
      .from('consumer_claims')
      .select('*')
      .eq('id', data.claimId)
      .eq('store_id', data.storeId)
      .single();

    if (fetchErr || !claim) {
      throw new Error('Reclamação não encontrada para mediação jurídica.');
    }

    const { error: updateErr } = await db
      .from('consumer_claims')
      .update({
        status: 'escalated_legal',
        legal_advise_needed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.claimId)
      .eq('store_id', data.storeId);

    if (updateErr) {
      throw new Error(`Erro ao encaminhar para jurídico: ${updateErr.message}`);
    }

    return { success: true };
  });
