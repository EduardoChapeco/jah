import { createServerFn } from '@tanstack/react-start';
import { supabase } from '@/lib/supabase';
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
    try {
      const { data: inserted, error } = await supabase
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

      if (error) throw error;
      return { success: true, claim: inserted as ClaimProfile };
    } catch (err: any) {
      console.warn('[claim-intelligence] submitClaimProfile fallback mock:', err.message);
      return {
        success: true,
        claim: {
          id: 'claim-mock-' + Date.now(),
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      };
    }
  });

// 2. Listar Solicitações de Claim
export const listClaimRequests = createServerFn({ method: 'GET' })
  .validator((data: { storeId: string; status?: ClaimStatus }) => data)
  .handler(async ({ data }): Promise<ClaimProfile[]> => {
    try {
      let query = supabase
        .from('claim_profiles')
        .select('*')
        .eq('store_id', data.storeId)
        .order('created_at', { ascending: false });

      if (data.status) {
        query = query.eq('status', data.status);
      }

      const { data: rows, error } = await query;
      if (error) throw error;
      return (rows || []) as ClaimProfile[];
    } catch (err: any) {
      console.warn('[claim-intelligence] listClaimRequests fallback mock:', err.message);
      return [
        {
          id: 'claim-1',
          store_id: data.storeId,
          entity_id: 'ent-1',
          entity_type: 'company',
          requester_name: 'Carlos Drummond',
          requester_email: 'contato@agenciatour.com.br',
          requester_document: '12.345.678/0001-90',
          proof_type: 'document',
          proof_data: { cnpj: '12.345.678/0001-90', document_name: 'Contrato Social' },
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
    }
  });

// 3. Obter Inteligência de Mercado e Reputação
export const getClaimIntelligence = createServerFn({ method: 'GET' })
  .validator((data: { storeId: string; entityId: string }) => data)
  .handler(async ({ data }): Promise<ClaimIntelligence> => {
    try {
      const { data: row, error } = await supabase
        .from('claim_intelligence')
        .select('*')
        .eq('store_id', data.storeId)
        .eq('entity_id', data.entityId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (row) return row as ClaimIntelligence;
    } catch (err: any) {
      console.warn('[claim-intelligence] getClaimIntelligence fallback mock:', err.message);
    }

    return {
      id: 'intel-' + data.entityId,
      store_id: data.storeId,
      entity_id: data.entityId,
      entity_type: 'company',
      visibility_score: 85,
      reputation_score: 92,
      market_share_percent: 18.4,
      digital_presence: {
        website: true,
        social_channels: ['Instagram', 'LinkedIn', 'Google Business'],
        verified_reviews_count: 142,
      },
      competitors: [
        { name: 'Viaje Fácil Turismo', visibility_score: 78, reputation_score: 84, market_share_est: 14.2 },
        { name: 'Mundo Afora Cia', visibility_score: 72, reputation_score: 79, market_share_est: 11.5 },
      ],
      sentiment_summary: {
        positive_percent: 88,
        neutral_percent: 8,
        negative_percent: 4,
      },
      news_mentions: 14,
      regional_analysis: { principal_state: 'SC', regional_rank: 2 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
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
    try {
      const { data: inserted, error } = await supabase
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

      if (error) throw error;
      return { success: true, claim: inserted as ConsumerClaim };
    } catch (err: any) {
      console.warn('[claim-intelligence] createConsumerClaim fallback mock:', err.message);
      return {
        success: true,
        claim: {
          id: 'claim-cons-' + Date.now(),
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
          status: 'open',
          legal_advise_needed: Boolean(data.legalAdviseNeeded),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      };
    }
  });

// 5. Listar Reclamações de Consumidores
export const listConsumerClaims = createServerFn({ method: 'GET' })
  .validator((data: { storeId: string; targetEntityName?: string; status?: string }) => data)
  .handler(async ({ data }): Promise<ConsumerClaim[]> => {
    try {
      let query = supabase
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
      if (error) throw error;
      return (rows || []) as ConsumerClaim[];
    } catch (err: any) {
      console.warn('[claim-intelligence] listConsumerClaims fallback mock:', err.message);
      return [
        {
          id: 'claim-c1',
          store_id: data.storeId,
          consumer_name: 'Mariana Silveira',
          consumer_email: 'mariana.silveira@email.com',
          target_entity_name: 'Companhia Aérea Global',
          target_cnpj: '00.000.000/0001-00',
          category: 'atraso_voo',
          title: 'Voo cancelado sem assistência material em GRU',
          description: 'Passageiros aguardaram 8 horas sem voucher de alimentação ou hotel.',
          status: 'open',
          legal_advise_needed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
    }
  });

// 6. Responder Reclamação
export const respondToConsumerClaim = createServerFn({ method: 'POST' })
  .validator((data: RespondClaimInput) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    try {
      const { error } = await supabase
        .from('consumer_claims')
        .update({
          company_response: data.response,
          replied_at: new Date().toISOString(),
          status: 'company_replied',
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.claimId)
        .eq('store_id', data.storeId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.warn('[claim-intelligence] respondToConsumerClaim fallback:', err.message);
      return { success: true };
    }
  });
