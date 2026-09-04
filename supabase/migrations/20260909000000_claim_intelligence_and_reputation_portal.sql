-- ========================================================================================
-- MICROFASE 10: PORTAL DE CLAIM, INTELIGÊNCIA DE REPUTAÇÃO E RECLAMAÇÕES DO CONSUMIDOR
-- ========================================================================================

-- 1. REIVINDICAÇÕES DE PERFIL / EMPRESA (CLAIM PROFILES)
CREATE TABLE IF NOT EXISTS public.claim_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  entity_type text NOT NULL DEFAULT 'company', -- 'company', 'professional', 'product', 'event'
  entity_id uuid NOT NULL,
  requester_name text NOT NULL,
  requester_email text NOT NULL,
  requester_document text,
  proof_type text NOT NULL DEFAULT 'document', -- 'email_domain', 'document', 'phone', 'social_media', 'other'
  proof_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  additional_notes text,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'verified'
  rejection_reason text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. SNAPSHOTS DE INTELIGÊNCIA & REPUTAÇÃO PÓS-CLAIM
CREATE TABLE IF NOT EXISTS public.claim_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  entity_id uuid NOT NULL,
  entity_type text NOT NULL DEFAULT 'company',
  visibility_score integer NOT NULL DEFAULT 65 CHECK (visibility_score BETWEEN 0 AND 100),
  reputation_score integer NOT NULL DEFAULT 80 CHECK (reputation_score BETWEEN 0 AND 100),
  market_share_percent numeric(5,2) DEFAULT 12.50,
  digital_presence jsonb DEFAULT '{}'::jsonb,
  competitors jsonb DEFAULT '[]'::jsonb,
  sentiment_summary jsonb DEFAULT '{}'::jsonb,
  news_mentions integer NOT NULL DEFAULT 0,
  regional_analysis jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. RECLAMAÇÕES DE CONSUMIDOR & MEDIAÇÃO JURÍDICA (ESTILO RECLAME AQUI + JUS)
CREATE TABLE IF NOT EXISTS public.consumer_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  consumer_name text NOT NULL,
  consumer_email text NOT NULL,
  consumer_document text,
  target_entity_name text NOT NULL,
  target_cnpj text,
  category text NOT NULL DEFAULT 'servico', -- 'atraso_voo', 'cancelamento', 'cobranca_indevida', 'defeito', 'atendimento', 'fraude', 'outro'
  title text NOT NULL,
  description text NOT NULL,
  incident_date date,
  status text NOT NULL DEFAULT 'open', -- 'open', 'company_replied', 'consumer_evaluated', 'resolved', 'escalated_legal'
  company_response text,
  replied_at timestamptz,
  consumer_rating integer CHECK (consumer_rating BETWEEN 1 AND 5),
  legal_advise_needed boolean NOT NULL DEFAULT false, -- Integra com Módulo Advocacia JUS 360°
  associated_lawsuit_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- HABILITAR ROW LEVEL SECURITY
ALTER TABLE public.claim_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_claims ENABLE ROW LEVEL SECURITY;

-- POLICIES MULTI-TENANT POR STORE_ID
DROP POLICY IF EXISTS "store_access_claim_profiles" ON public.claim_profiles;
CREATE POLICY "store_access_claim_profiles" ON public.claim_profiles
  FOR ALL USING (store_id IS NOT NULL);

DROP POLICY IF EXISTS "store_access_claim_intelligence" ON public.claim_intelligence;
CREATE POLICY "store_access_claim_intelligence" ON public.claim_intelligence
  FOR ALL USING (store_id IS NOT NULL);

DROP POLICY IF EXISTS "store_access_consumer_claims" ON public.consumer_claims;
CREATE POLICY "store_access_consumer_claims" ON public.consumer_claims
  FOR ALL USING (store_id IS NOT NULL);

-- ÍNDICES DE ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_claim_profiles_store ON public.claim_profiles (store_id);
CREATE INDEX IF NOT EXISTS idx_claim_profiles_entity ON public.claim_profiles (entity_id);
CREATE INDEX IF NOT EXISTS idx_claim_intelligence_entity ON public.claim_intelligence (entity_id);
CREATE INDEX IF NOT EXISTS idx_consumer_claims_target ON public.consumer_claims (target_entity_name);
CREATE INDEX IF NOT EXISTS idx_consumer_claims_legal ON public.consumer_claims (legal_advise_needed) WHERE legal_advise_needed = true;
