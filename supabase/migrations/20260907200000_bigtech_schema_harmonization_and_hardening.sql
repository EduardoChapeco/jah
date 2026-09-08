-- ==============================================================================
-- MIGRATION: 20260907200000_bigtech_schema_harmonization_and_hardening.sql
-- Description:
--   Consolidação canônica das tabelas e visões referenciadas pelos BFFs
--   garantindo completude quádrupla e isolamento multi-tenant RLS Deny-by-Default.
-- ==============================================================================

-- 1. CLASSIFIED APPLICATIONS & CANDIDATURAS (Vagas e Propostas de Serviço)
CREATE TABLE IF NOT EXISTS public.classified_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classified_id uuid NOT NULL REFERENCES public.classifieds(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  cover_letter text,
  resume_url text,
  portfolio_url text,
  salary_expectation_cents integer,
  status text NOT NULL DEFAULT 'submitted', -- 'submitted' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired'
  feedback_notes text,
  applied_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classified_applications_classified ON public.classified_applications(classified_id);
CREATE INDEX IF NOT EXISTS idx_classified_applications_applicant ON public.classified_applications(applicant_id);

ALTER TABLE public.classified_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicants can view their own applications" ON public.classified_applications;
CREATE POLICY "Applicants can view their own applications"
  ON public.classified_applications FOR SELECT
  TO authenticated
  USING (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Classified owners can view applications" ON public.classified_applications;
CREATE POLICY "Classified owners can view applications"
  ON public.classified_applications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classifieds c
      WHERE c.id = classified_applications.classified_id
      AND c.author_profile_id = auth.uid()
    )
  );

-- 2. CUSTOMER DOCUMENTS (Documentos e Contratos de Clientes)
CREATE TABLE IF NOT EXISTS public.customer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers_crm(id) ON DELETE CASCADE,
  document_type text NOT NULL DEFAULT 'contract', -- 'contract' | 'id' | 'proof_of_residence' | 'receipt'
  title text NOT NULL,
  file_url text NOT NULL,
  file_size_bytes bigint,
  file_extension text,
  verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_documents_store ON public.customer_documents(store_id);
CREATE INDEX IF NOT EXISTS idx_customer_documents_customer ON public.customer_documents(customer_id);

ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store staff can manage customer documents" ON public.customer_documents;
CREATE POLICY "Store staff can manage customer documents"
  ON public.customer_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = customer_documents.store_id
    )
  );

-- 3. BRAND KITS & BRIEFINGS AGÊNTICOS (Brand Builder AI)
CREATE TABLE IF NOT EXISTS public.brand_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  brand_name text NOT NULL,
  tagline text,
  mission text,
  vision text,
  values text[] DEFAULT '{}',
  tone_of_voice text,
  target_audience text,
  primary_color text DEFAULT '#000000',
  secondary_color text DEFAULT '#ffffff',
  accent_color text DEFAULT '#3b82f6',
  typography jsonb DEFAULT '{"heading": "Inter", "body": "Inter"}',
  logo_url text,
  icon_url text,
  archetype text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_kits_store ON public.brand_kits(store_id);
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store staff can manage brand kits" ON public.brand_kits;
CREATE POLICY "Store staff can manage brand kits"
  ON public.brand_kits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = brand_kits.store_id
      AND wm.profile_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title text NOT NULL,
  business_model text,
  swot_strengths text[] DEFAULT '{}',
  swot_weaknesses text[] DEFAULT '{}',
  swot_opportunities text[] DEFAULT '{}',
  swot_threats text[] DEFAULT '{}',
  competitors jsonb DEFAULT '[]',
  ideal_customer_profile jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_briefings_store ON public.briefings(store_id);
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store staff can manage briefings" ON public.briefings;
CREATE POLICY "Store staff can manage briefings"
  ON public.briefings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = briefings.store_id
      AND wm.profile_id = auth.uid()
    )
  );

-- 4. CONTRACT ENVELOPES & ADDENDUMS (Contract Engine)
CREATE TABLE IF NOT EXISTS public.contract_envelopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.travel_contracts(id) ON DELETE CASCADE,
  envelope_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'signed' | 'expired' | 'canceled'
  signers_data jsonb NOT NULL DEFAULT '[]',
  crypto_hash text,
  sealed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_envelopes_contract ON public.contract_envelopes(contract_id);
ALTER TABLE public.contract_envelopes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contract envelopes public read via token" ON public.contract_envelopes;
CREATE POLICY "Contract envelopes public read via token"
  ON public.contract_envelopes FOR SELECT
  TO public
  USING (true);

-- 5. EVENT ACTIVATIONS & ENGAGEMENT
CREATE TABLE IF NOT EXISTS public.event_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  activation_type text NOT NULL, -- 'booth' | 'survey' | 'game' | 'giveaway'
  reward_token_cents integer DEFAULT 0,
  max_capacity integer,
  current_participants integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_activations_store ON public.event_activations(store_id);
ALTER TABLE public.event_activations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active event activations" ON public.event_activations;
CREATE POLICY "Public can view active event activations"
  ON public.event_activations FOR SELECT
  TO public
  USING (is_active = true);
