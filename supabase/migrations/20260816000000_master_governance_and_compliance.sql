-- ============================================================================
-- JAH MASTER PLATFORM — GOVERNANCE, TRUST & SAFETY, KYC, LGPD & AUDIT SCHEMA
-- ============================================================================

-- 1. Sanções Granulares de Usuários (Punições & Bloqueios Parciais)
CREATE TABLE IF NOT EXISTS public.user_moderation_sanctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sanction_type TEXT NOT NULL CHECK (sanction_type IN ('warning', 'mute_comments', 'block_posts', 'block_classifieds', 'block_commerce', 'ban_temporary', 'ban_permanent')),
  reason TEXT NOT NULL,
  moderator_notes TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  applied_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_sanctions_user ON public.user_moderation_sanctions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_sanctions_type ON public.user_moderation_sanctions(sanction_type);

-- 2. Logs Forenses de Aceite de Termos Legais (LGPD & Prova de Consentimento)
CREATE TABLE IF NOT EXISTS public.legal_terms_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  term_type TEXT NOT NULL CHECK (term_type IN ('terms_of_service', 'privacy_policy', 'cookie_policy', 'seller_agreement', 'delivery_partner_terms')),
  version TEXT NOT NULL DEFAULT '1.0',
  ip_address_hash TEXT,
  user_agent TEXT,
  session_id TEXT,
  signature_hash TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_legal_terms_user ON public.legal_terms_acceptances(user_id, term_type);

-- 3. Verificação Facial & KYC Anti-Fraude (Selo de Perfil Verificado)
CREATE TABLE IF NOT EXISTS public.identity_kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('cnh', 'rg', 'passport', 'cnpj')),
  document_number TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  document_front_url TEXT NOT NULL,
  document_back_url TEXT,
  liveness_video_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'requires_resubmission')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  internal_notes TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_kyc_status ON public.identity_kyc_verifications(status);
CREATE INDEX IF NOT EXISTS idx_kyc_user ON public.identity_kyc_verifications(user_id);

-- 4. Suspensões e Intervenções em Lojas / Empresas
CREATE TABLE IF NOT EXISTS public.store_moderation_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  is_checkout_blocked BOOLEAN NOT NULL DEFAULT true,
  is_catalog_hidden BOOLEAN NOT NULL DEFAULT true,
  is_payout_frozen BOOLEAN NOT NULL DEFAULT true,
  suspended_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  suspended_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_store_suspensions_store ON public.store_moderation_suspensions(store_id, is_active);

-- 5. Logs Forenses Universais e Provas de Litígios (Dossiê Judicial)
CREATE TABLE IF NOT EXISTS public.forensic_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role TEXT,
  target_entity_type TEXT NOT NULL,
  target_entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  payload_snapshot JSONB DEFAULT '{}'::jsonb,
  checksum_sha256 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_forensic_target ON public.forensic_audit_events(target_entity_type, target_entity_id);
CREATE INDEX IF NOT EXISTS idx_forensic_actor ON public.forensic_audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_forensic_created ON public.forensic_audit_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_moderation_sanctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_terms_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_moderation_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forensic_audit_events ENABLE ROW LEVEL SECURITY;

-- Ensure profiles has role column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';

-- Platform Admins have full access to everything
CREATE POLICY "Platform Admins manage user sanctions" ON public.user_moderation_sanctions FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin'))
  OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.profile_id = auth.uid() AND wm.role IN ('owner', 'admin'))
);
CREATE POLICY "Platform Admins manage legal acceptances" ON public.legal_terms_acceptances FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin'))
  OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.profile_id = auth.uid() AND wm.role IN ('owner', 'admin'))
);
CREATE POLICY "Platform Admins manage kyc verifications" ON public.identity_kyc_verifications FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin'))
  OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.profile_id = auth.uid() AND wm.role IN ('owner', 'admin'))
);
CREATE POLICY "Platform Admins manage store suspensions" ON public.store_moderation_suspensions FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin'))
  OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.profile_id = auth.uid() AND wm.role IN ('owner', 'admin'))
);
CREATE POLICY "Platform Admins manage forensic audit" ON public.forensic_audit_events FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin'))
  OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.profile_id = auth.uid() AND wm.role IN ('owner', 'admin'))
);

-- Users can view their own KYC status and submit
CREATE POLICY "Users view own kyc" ON public.identity_kyc_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users submit own kyc" ON public.identity_kyc_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can submit their own legal acceptances
CREATE POLICY "Users insert legal acceptances" ON public.legal_terms_acceptances FOR INSERT WITH CHECK (true);
