-- 20260903160000_jobs_applications_and_employer_feedback.sql
-- Criação definitiva das tabelas de Empregos, ATS e Inteligência de Empregador Anterior

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
  salary_display TEXT NOT NULL DEFAULT 'A combinar',
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

CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_phone TEXT NOT NULL,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'interview_scheduled', 'approved', 'rejected', 'hired')),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  internal_notes TEXT,
  interview_at TIMESTAMPTZ,
  interview_meeting_url TEXT,
  hired_role TEXT,
  hired_salary_cents BIGINT,
  last_salary_cents BIGINT,
  salary_expectation_cents BIGINT,
  previous_company_name TEXT,
  reason_for_leaving TEXT,
  previous_company_rating INT CHECK (previous_company_rating >= 1 AND previous_company_rating <= 5),
  previous_company_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.classified_applications
  ADD COLUMN IF NOT EXISTS last_salary_cents BIGINT,
  ADD COLUMN IF NOT EXISTS salary_expectation_cents BIGINT,
  ADD COLUMN IF NOT EXISTS previous_company_name TEXT,
  ADD COLUMN IF NOT EXISTS reason_for_leaving TEXT,
  ADD COLUMN IF NOT EXISTS previous_company_rating INT CHECK (previous_company_rating >= 1 AND previous_company_rating <= 5),
  ADD COLUMN IF NOT EXISTS previous_company_feedback TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_salary_cents BIGINT,
  ADD COLUMN IF NOT EXISTS salary_expectation_cents BIGINT,
  ADD COLUMN IF NOT EXISTS previous_company_name TEXT,
  ADD COLUMN IF NOT EXISTS reason_for_leaving TEXT,
  ADD COLUMN IF NOT EXISTS previous_company_rating INT CHECK (previous_company_rating >= 1 AND previous_company_rating <= 5),
  ADD COLUMN IF NOT EXISTS previous_company_feedback TEXT;
