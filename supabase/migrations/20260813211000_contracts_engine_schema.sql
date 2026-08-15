CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('real_estate_rental', 'vehicle_sale', 'service_agreement', 'employment', 'general_deal')),
  description TEXT,
  default_clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general_deal',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'reviewing', 'sealed', 'signing', 'completed', 'cancelled')),
  current_version INT NOT NULL DEFAULT 1,
  verification_code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 16),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contract_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  version_number INT NOT NULL,
  title TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  hash_sha256 TEXT,
  is_sealed BOOLEAN NOT NULL DEFAULT false,
  sealed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contract_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.signature_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_version_id UUID REFERENCES public.contract_versions(id) ON DELETE CASCADE NOT NULL,
  signer_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signer_role TEXT NOT NULL DEFAULT 'party' CHECK (signer_role IN ('party', 'witness', 'guarantor')),
  auth_level TEXT NOT NULL DEFAULT 'basic' CHECK (auth_level IN ('basic', 'advanced', 'qualified')),
  signing_token TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 32),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'signed', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.signature_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envelope_id UUID REFERENCES public.signature_envelopes(id) ON DELETE CASCADE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  auth_method TEXT NOT NULL DEFAULT 'email_otp',
  consent_given BOOLEAN NOT NULL DEFAULT true,
  evidence_manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  signature_digest TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_evidence ENABLE ROW LEVEL SECURITY;

-- Templates: leitura pública para autenticados
CREATE POLICY "templates_select_all" ON public.contract_templates
  FOR SELECT USING (true);

-- Contratos: apenas criador ou signatários vinculados
CREATE POLICY "contracts_creator_all" ON public.contracts
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "contracts_signer_select" ON public.contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contract_versions cv
      JOIN public.signature_envelopes se ON se.contract_version_id = cv.id
      WHERE cv.contract_id = contracts.id
      AND se.signer_profile_id = auth.uid()
    )
  );

CREATE POLICY "contract_versions_policy" ON public.contract_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_versions.contract_id
      AND (c.creator_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.signature_envelopes se
        WHERE se.contract_version_id = contract_versions.id
        AND se.signer_profile_id = auth.uid()
      ))
    )
  );

CREATE POLICY "signature_envelopes_policy" ON public.signature_envelopes
  FOR ALL USING (
    signer_profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.contract_versions cv
      JOIN public.contracts c ON c.id = cv.contract_id
      WHERE cv.id = signature_envelopes.contract_version_id
      AND c.creator_id = auth.uid()
    )
  );

-- Verificação Pública (acesso por token do envelope ou verification_code do contrato)
CREATE POLICY "envelopes_token_access" ON public.signature_envelopes
  FOR SELECT USING (true);

CREATE POLICY "contracts_public_verify" ON public.contracts
  FOR SELECT USING (status IN ('sealed', 'completed'));
