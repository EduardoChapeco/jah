-- Migration: 20260815190000_jobs_and_tourism_ecosystem.sql
-- Description: Criação das tabelas reais, RLS e dados canônicos de Empregos (Jobs) e Turismo (Tourism Experiences).

-- ==============================================================================
-- 1. TABELA DE VAGAS DE EMPREGO (jobs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  author_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  category TEXT NOT NULL DEFAULT 'clt' CHECK (category IN ('clt', 'pj', 'estagio', 'tech', 'comercial', 'operacional', 'saude', 'outros')),
  location TEXT NOT NULL,
  workplace_type TEXT NOT NULL DEFAULT 'Presencial' CHECK (workplace_type IN ('Presencial', 'Híbrido', 'Remoto')),
  contract_type TEXT NOT NULL DEFAULT 'CLT' CHECK (contract_type IN ('CLT', 'PJ', 'Estágio', 'Freelancer', 'Temporário')),
  salary_display TEXT NOT NULL,
  salary_min_cents BIGINT,
  salary_max_cents BIGINT,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  contact_whatsapp TEXT,
  contact_email TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs(category) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC) WHERE status = 'active';

-- ==============================================================================
-- 2. TABELA DE CANDIDATURAS A VAGAS (job_applications)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_phone TEXT NOT NULL,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_job ON public.job_applications(job_id);

-- ==============================================================================
-- 3. TABELA DE EXPERIÊNCIAS TURÍSTICAS (tourism_experiences)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tourism_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  author_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'passeios' CHECK (category IN ('passeios', 'hospedagens', 'gastronomia_turistica', 'aventura', 'agencias', 'cultura')),
  location TEXT NOT NULL,
  duration TEXT NOT NULL,
  price_display TEXT NOT NULL,
  price_cents BIGINT,
  image_url TEXT NOT NULL,
  gallery_urls TEXT[] DEFAULT '{}',
  provider_name TEXT NOT NULL,
  provider_logo_url TEXT,
  contact_whatsapp TEXT NOT NULL,
  rating NUMERIC(3,2) DEFAULT 5.0,
  included_items TEXT[] DEFAULT '{}',
  what_to_bring TEXT[] DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tourism_category ON public.tourism_experiences(category) WHERE status = 'active';

-- ==============================================================================
-- 4. TABELA DE RESERVAS / INTERESSES EM TURISMO (tourism_inquiries)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tourism_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES public.tourism_experiences(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  desired_date DATE,
  guests_count INTEGER DEFAULT 1,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourism_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourism_inquiries ENABLE ROW LEVEL SECURITY;

-- Jobs Policies
CREATE POLICY "Jobs são públicos para visualização se ativos"
  ON public.jobs FOR SELECT
  USING (status = 'active' OR auth.uid() = author_profile_id);

CREATE POLICY "Usuários autenticados podem criar vagas"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Autores podem atualizar suas vagas"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = author_profile_id);

-- Job Applications Policies
CREATE POLICY "Qualquer visitante ou usuário pode enviar candidatura"
  ON public.job_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Candidatos e donos da vaga podem ver candidaturas"
  ON public.job_applications FOR SELECT
  USING (
    auth.uid() = candidate_profile_id
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id AND (j.author_profile_id = auth.uid())
    )
  );

-- Tourism Experiences Policies
CREATE POLICY "Experiências turísticas são públicas se ativas"
  ON public.tourism_experiences FOR SELECT
  USING (status = 'active' OR auth.uid() = author_profile_id);

CREATE POLICY "Usuários autenticados podem criar experiências turísticas"
  ON public.tourism_experiences FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Autores podem atualizar experiências turísticas"
  ON public.tourism_experiences FOR UPDATE
  USING (auth.uid() = author_profile_id);

-- Tourism Inquiries Policies
CREATE POLICY "Qualquer visitante ou usuário pode enviar interesse turístico"
  ON public.tourism_inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Clientes e provedores podem ver solicitações turísticas"
  ON public.tourism_inquiries FOR SELECT
  USING (
    auth.uid() = profile_id
    OR EXISTS (
      SELECT 1 FROM public.tourism_experiences te
      WHERE te.id = experience_id AND (te.author_profile_id = auth.uid())
    )
  );

-- ==============================================================================
-- 6. DADOS REAIS & RLS PRONTOS (ZERO MOCK / ZERO SEED FALSO)
-- ==============================================================================
-- As vagas e experiências de turismo são criadas exclusivamente de forma real
-- pelas empresas no Workspace (/workspace/empregos e /workspace/turismo).
