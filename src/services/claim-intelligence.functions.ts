import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
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

export const SubmitClaimInputSchema = z.object({
  storeId: z.string().uuid(),
  entityId: z.string().min(1),
  entityType: z.enum(['company', 'professional', 'product', 'event']),
  requesterName: z.string().min(2),
  requesterEmail: z.string().email(),
  requesterDocument: z.string().optional().nullable(),
  proofType: z.enum(['email_domain', 'document', 'phone', 'social_media', 'other']),
  proofData: z.record(z.any()).default({}),
  additionalNotes: z.string().optional().nullable(),
});
export type SubmitClaimInput = z.infer<typeof SubmitClaimInputSchema>;

export const ListClaimRequestsSchema = z.object({
  storeId: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'rejected', 'verified']).optional(),
});

export const GetClaimIntelligenceSchema = z.object({
  storeId: z.string().uuid(),
  entityId: z.string().min(1),
});

export const CreateConsumerClaimSchema = z.object({
  storeId: z.string().uuid(),
  consumerName: z.string().min(2),
  consumerEmail: z.string().email(),
  consumerDocument: z.string().optional().nullable(),
  targetEntityName: z.string().min(2),
  targetCnpj: z.string().optional().nullable(),
  category: z.enum(['atraso_voo', 'cancelamento', 'cobranca_indevida', 'defeito', 'atendimento', 'fraude', 'outro']),
  title: z.string().min(3),
  description: z.string().min(10),
  incidentDate: z.string().optional().nullable(),
  legalAdviseNeeded: z.boolean().optional(),
});

export const ListConsumerClaimsSchema = z.object({
  storeId: z.string().uuid(),
  targetEntityName: z.string().optional(),
  status: z.string().optional(),
});

export const RespondClaimInputSchema = z.object({
  claimId: z.string().uuid(),
  storeId: z.string().uuid(),
  response: z.string().min(5),
});
export type RespondClaimInput = z.infer<typeof RespondClaimInputSchema>;

export const EscalateLegalInputSchema = z.object({
  claimId: z.string().uuid(),
  storeId: z.string().uuid(),
  notes: z.string().optional(),
});
export type EscalateLegalInput = z.infer<typeof EscalateLegalInputSchema>;

// 1. Submeter Reivindicação de Perfil / Empresa
export const submitClaimProfile = createServerFn({ method: 'POST' })
  .validator(SubmitClaimInputSchema)
  .handler(async ({ data }): Promise<{ success: boolean; claim: ClaimProfile }> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);
    if (data.storeId !== identity.storeId && !identity.isPlatformAdmin) {
      throw new Error('Acesso não autorizado para esta organização.');
    }

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
  .validator(ListClaimRequestsSchema)
  .handler(async ({ data }): Promise<ClaimProfile[]> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);
    if (data.storeId !== identity.storeId && !identity.isPlatformAdmin) {
      throw new Error('Acesso não autorizado para esta organização.');
    }

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
  .validator(GetClaimIntelligenceSchema)
  .handler(async ({ data }): Promise<ClaimIntelligence | null> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);
    if (data.storeId !== identity.storeId && !identity.isPlatformAdmin) {
      throw new Error('Acesso não autorizado para esta organização.');
    }

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
  .validator(CreateConsumerClaimSchema)
  .handler(async ({ data }): Promise<{ success: boolean; claim: ConsumerClaim }> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);
    if (data.storeId !== identity.storeId && !identity.isPlatformAdmin) {
      throw new Error('Acesso não autorizado para esta organização.');
    }

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
  .validator(ListConsumerClaimsSchema)
  .handler(async ({ data }): Promise<ConsumerClaim[]> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);
    if (data.storeId !== identity.storeId && !identity.isPlatformAdmin) {
      throw new Error('Acesso não autorizado para esta organização.');
    }

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
  .validator(RespondClaimInputSchema)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);
    if (data.storeId !== identity.storeId && !identity.isPlatformAdmin) {
      throw new Error('Acesso não autorizado para esta organização.');
    }

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
  .validator(EscalateLegalInputSchema)
  .handler(async ({ data }): Promise<{ success: boolean; lawsuitId?: string }> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);
    if (data.storeId !== identity.storeId && !identity.isPlatformAdmin) {
      throw new Error('Acesso não autorizado para esta organização.');
    }

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
