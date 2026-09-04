export type EntityType = 'company' | 'professional' | 'product' | 'event';
export type ProofType = 'email_domain' | 'document' | 'phone' | 'social_media' | 'other';
export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'verified';
export type ConsumerClaimStatus = 'open' | 'company_replied' | 'consumer_evaluated' | 'resolved' | 'escalated_legal';
export type ClaimCategory = 'atraso_voo' | 'cancelamento' | 'cobranca_indevida' | 'defeito' | 'atendimento' | 'fraude' | 'outro';

export interface ClaimProfile {
  id: string;
  store_id: string;
  entity_type: EntityType;
  entity_id: string;
  requester_name: string;
  requester_email: string;
  requester_document?: string | null;
  proof_type: ProofType;
  proof_data: Record<string, any>;
  additional_notes?: string | null;
  status: ClaimStatus;
  rejection_reason?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClaimIntelligence {
  id: string;
  store_id: string;
  entity_id: string;
  entity_type: EntityType;
  visibility_score: number;
  reputation_score: number;
  market_share_percent: number;
  digital_presence: {
    website?: boolean;
    social_channels?: string[];
    verified_reviews_count?: number;
  };
  competitors: Array<{
    name: string;
    visibility_score: number;
    reputation_score: number;
    market_share_est: number;
  }>;
  sentiment_summary: {
    positive_percent: number;
    neutral_percent: number;
    negative_percent: number;
  };
  news_mentions: number;
  regional_analysis: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ConsumerClaim {
  id: string;
  store_id: string;
  consumer_name: string;
  consumer_email: string;
  consumer_document?: string | null;
  target_entity_name: string;
  target_cnpj?: string | null;
  category: ClaimCategory;
  title: string;
  description: string;
  incident_date?: string | null;
  status: ConsumerClaimStatus;
  company_response?: string | null;
  replied_at?: string | null;
  consumer_rating?: number | null;
  legal_advise_needed: boolean;
  associated_lawsuit_id?: string | null;
  created_at: string;
  updated_at: string;
}
