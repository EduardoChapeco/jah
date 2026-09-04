-- ============================================================================
-- MIGRATION: BUILDER & EDITOR UNIVERSAL DE EXPERIÊNCIAS JAH (MULTI-PORTAL 360)
-- Version: 20260904230000
-- ============================================================================

-- 1. Enumeração dos Tipos de Portais e Experiências
DO $$ BEGIN
  CREATE TYPE public.experience_portal_type AS ENUM (
    'storefront',          -- Vitrine Comercial de E-commerce / Catálogo
    'customer_portal',     -- Portal do Cliente 360 (Contratos, Carnês, Agendamentos)
    'job_board',           -- Portal de Carreiras e Vagas de Emprego
    'reputation_portal',   -- Portal de Reputação e SAC Auditado (Reclame Aqui)
    'biolink',             -- BioLink Mobile-First para Redes Sociais
    'landing_page',        -- Landing Page / Hotsite de Lançamento
    'office_doc',          -- Minuta de Contrato / Proposta / Documento Timbrado
    'creative_graphic'     -- Flyer / Banner / Post para Redes Sociais
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Atualização / Adição de portal_type em experience_documents se ainda não existir
DO $$ BEGIN
  ALTER TABLE public.experience_documents
    ADD COLUMN IF NOT EXISTS portal_type public.experience_portal_type NOT NULL DEFAULT 'storefront';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.experience_documents
    ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.experience_documents
    ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_exp_docs_store_portal ON public.experience_documents(store_id, portal_type);
CREATE INDEX IF NOT EXISTS idx_exp_docs_custom_domain ON public.experience_documents(custom_domain);

-- 3. Páginas Pertencentes a Cada Documento (Multi-page Support)
CREATE TABLE IF NOT EXISTS public.experience_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.experience_documents(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  path VARCHAR(255) NOT NULL, -- Ex: '/', '/contratos', '/carnes', '/vagas/:id'
  is_home BOOLEAN NOT NULL DEFAULT false,
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_doc_page_path UNIQUE (document_id, path)
);

CREATE INDEX IF NOT EXISTS idx_exp_pages_doc ON public.experience_pages(document_id);

-- 4. Adicionar page_id em experience_nodes se não existir
DO $$ BEGIN
  ALTER TABLE public.experience_nodes
    ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES public.experience_pages(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.experience_nodes
    ADD COLUMN IF NOT EXISTS animation_rules JSONB NOT NULL DEFAULT '{}'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 5. Configuração e Acesso do Portal do Cliente 360
CREATE TABLE IF NOT EXISTS public.customer_portal_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  document_id UUID REFERENCES public.experience_documents(id) ON DELETE SET NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  allow_magic_link_auth BOOLEAN NOT NULL DEFAULT true,
  allow_cpf_auth BOOLEAN NOT NULL DEFAULT true,
  enabled_modules JSONB NOT NULL DEFAULT '{
    "contracts": true,
    "carnes_bills": true,
    "appointments": true,
    "orders_rentals": true,
    "support_chat": true
  }'::jsonb,
  custom_theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customer_portal_store ON public.customer_portal_configs(store_id);

-- 6. Portal de Carreiras / Empregos: Tabela de Vagas do Construtor Whitelabel
CREATE TABLE IF NOT EXISTS public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  department VARCHAR(128) NOT NULL,
  work_model VARCHAR(32) NOT NULL DEFAULT 'on_site', -- 'on_site', 'remote', 'hybrid'
  employment_type VARCHAR(32) NOT NULL DEFAULT 'clt', -- 'clt', 'pj', 'internship', 'temporary'
  location VARCHAR(255),
  salary_range VARCHAR(128),
  show_salary BOOLEAN NOT NULL DEFAULT false,
  description_markdown TEXT NOT NULL,
  requirements TEXT[],
  benefits TEXT[],
  custom_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(32) NOT NULL DEFAULT 'published', -- 'draft', 'published', 'paused', 'closed'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_job_store_slug UNIQUE (store_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_jobs_store_status ON public.job_postings(store_id, status);

-- 7. Expansão de Candidaturas (job_applications) para integração com ATS & Builder
DO $$ BEGIN
  ALTER TABLE public.job_applications
    ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
    ADD COLUMN IF NOT EXISTS salary_expectation NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS pipeline_stage VARCHAR(64) NOT NULL DEFAULT 'applied',
    ADD COLUMN IF NOT EXISTS recruiter_notes TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_apps_job_stage ON public.job_applications(job_id, pipeline_stage);

-- 8. Portal de Reputação Estilo Reclame Aqui: Perfil da Empresa
CREATE TABLE IF NOT EXISTS public.company_reputation_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMPTZ,
  claimed_by UUID REFERENCES auth.users(id),
  total_complaints INT NOT NULL DEFAULT 0,
  answered_complaints INT NOT NULL DEFAULT 0,
  resolved_complaints INT NOT NULL DEFAULT 0,
  average_response_hours NUMERIC(6, 1) NOT NULL DEFAULT 0,
  reputation_score NUMERIC(3, 1) NOT NULL DEFAULT 0.0, -- De 0.0 a 10.0
  reputation_badge VARCHAR(32) NOT NULL DEFAULT 'unrated', -- 'bad', 'regular', 'good', 'great', 'ra1000'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rep_profile_store ON public.company_reputation_profiles(store_id);

-- 9. Reclamações Públicas e Protocolos Auditados
CREATE TABLE IF NOT EXISTS public.reputation_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  protocol_number VARCHAR(32) NOT NULL UNIQUE,
  consumer_name VARCHAR(255) NOT NULL,
  consumer_email VARCHAR(255) NOT NULL,
  consumer_cpf_masked VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  evidence_urls TEXT[],
  status VARCHAR(32) NOT NULL DEFAULT 'open', -- 'open', 'replied', 'in_triplicate', 'resolved', 'unresolved'
  consumer_score INT, -- De 1 a 10 atribuído pelo cliente no encerramento
  would_buy_again BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_complaints_store_status ON public.reputation_complaints(store_id, status);

-- 10. Interações da Reclamação (Histórico de Respostas / Réplicas / Tréplicas)
CREATE TABLE IF NOT EXISTS public.reputation_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.reputation_complaints(id) ON DELETE CASCADE,
  author_type VARCHAR(32) NOT NULL, -- 'company', 'consumer', 'system'
  author_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  attachment_urls TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rep_interactions_complaint ON public.reputation_interactions(complaint_id);

-- 11. Suíte JAH Office: Documentos, Minutas e Modelos Contratuais
CREATE TABLE IF NOT EXISTS public.office_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL DEFAULT 'contract', -- 'contract', 'proposal', 'invoice', 'receipt', 'notice'
  content_html TEXT NOT NULL,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb, -- Árvore do editor ProseMirror / Tiptap
  header_template TEXT,
  footer_template TEXT,
  variable_schema JSONB NOT NULL DEFAULT '[]'::jsonb, -- Lista de tags dinâmicas suportadas
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_office_docs_store_cat ON public.office_documents(store_id, category);

-- 12. JAH Creative Studio: Banners, Flyers e Criativos Visuais
CREATE TABLE IF NOT EXISTS public.marketing_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  canvas_format VARCHAR(32) NOT NULL DEFAULT 'instagram_square', -- 'instagram_square', 'story_reels', 'landscape_banner'
  width INT NOT NULL DEFAULT 1080,
  height INT NOT NULL DEFAULT 1080,
  layers JSONB NOT NULL DEFAULT '[]'::jsonb, -- Camadas gráficas (texto, formas, imagens)
  thumbnail_url TEXT,
  exported_asset_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_marketing_creatives_store ON public.marketing_creatives(store_id);

-- ============================================================================
-- HABILITAÇÃO DE ROW LEVEL SECURITY (RLS) E POLÍTICAS ATÔMICAS
-- ============================================================================

ALTER TABLE public.experience_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_portal_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_reputation_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_creatives ENABLE ROW LEVEL SECURITY;

-- 1. experience_pages
DROP POLICY IF EXISTS "Lojistas gerenciam paginas dos seus documentos" ON public.experience_pages;
CREATE POLICY "Lojistas gerenciam paginas dos seus documentos"
  ON public.experience_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.experience_documents ed
      WHERE ed.id = experience_pages.document_id
      AND public.is_store_staff(ed.store_id)
    )
  );

DROP POLICY IF EXISTS "Publico visualiza paginas publicadas" ON public.experience_pages;
CREATE POLICY "Publico visualiza paginas publicadas"
  ON public.experience_pages FOR SELECT
  USING (true);

-- 2. customer_portal_configs
DROP POLICY IF EXISTS "Lojistas gerenciam configuracao do portal do cliente" ON public.customer_portal_configs;
CREATE POLICY "Lojistas gerenciam configuracao do portal do cliente"
  ON public.customer_portal_configs FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS "Publico le configuracao ativa do portal" ON public.customer_portal_configs;
CREATE POLICY "Publico le configuracao ativa do portal"
  ON public.customer_portal_configs FOR SELECT
  USING (is_enabled = true);

-- 3. job_postings
DROP POLICY IF EXISTS "Lojistas gerenciam suas vagas de emprego" ON public.job_postings;
CREATE POLICY "Lojistas gerenciam suas vagas de emprego"
  ON public.job_postings FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS "Publico visualiza vagas publicadas" ON public.job_postings;
CREATE POLICY "Publico visualiza vagas publicadas"
  ON public.job_postings FOR SELECT
  USING (status = 'published');

-- 4. job_applications
DROP POLICY IF EXISTS "Lojistas gerenciam candidaturas as suas vagas" ON public.job_applications;
CREATE POLICY "Lojistas gerenciam candidaturas as suas vagas"
  ON public.job_applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_applications.job_id
      AND j.store_id IS NOT NULL
      AND public.is_store_staff(j.store_id)
    )
  );

DROP POLICY IF EXISTS "Candidatos podem submeter candidaturas" ON public.job_applications;
CREATE POLICY "Candidatos podem submeter candidaturas"
  ON public.job_applications FOR INSERT
  WITH CHECK (true);

-- 5. company_reputation_profiles
DROP POLICY IF EXISTS "Lojistas gerenciam perfil de reputacao" ON public.company_reputation_profiles;
CREATE POLICY "Lojistas gerenciam perfil de reputacao"
  ON public.company_reputation_profiles FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS "Publico visualiza perfil de reputacao" ON public.company_reputation_profiles;
CREATE POLICY "Publico visualiza perfil de reputacao"
  ON public.company_reputation_profiles FOR SELECT
  USING (true);

-- 6. reputation_complaints
DROP POLICY IF EXISTS "Lojistas visualizam e respondem reclamacoes" ON public.reputation_complaints;
CREATE POLICY "Lojistas visualizam e respondem reclamacoes"
  ON public.reputation_complaints FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS "Consumidores podem registrar reclamacoes" ON public.reputation_complaints;
CREATE POLICY "Consumidores podem registrar reclamacoes"
  ON public.reputation_complaints FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Publico visualiza reclamacoes abertas e resolvidas" ON public.reputation_complaints;
CREATE POLICY "Publico visualiza reclamacoes abertas e resolvidas"
  ON public.reputation_complaints FOR SELECT
  USING (true);

-- 7. reputation_interactions
DROP POLICY IF EXISTS "Lojistas e consumidores visualizam interacoes" ON public.reputation_interactions;
CREATE POLICY "Lojistas e consumidores visualizam interacoes"
  ON public.reputation_interactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Membros autorizados inserem interacoes" ON public.reputation_interactions;
CREATE POLICY "Membros autorizados inserem interacoes"
  ON public.reputation_interactions FOR INSERT
  WITH CHECK (true);

-- 8. office_documents
DROP POLICY IF EXISTS "Lojistas gerenciam minutas e documentos de office" ON public.office_documents;
CREATE POLICY "Lojistas gerenciam minutas e documentos de office"
  ON public.office_documents FOR ALL
  USING (public.is_store_staff(store_id));

-- 9. marketing_creatives
DROP POLICY IF EXISTS "Lojistas gerenciam criativos de marketing" ON public.marketing_creatives;
CREATE POLICY "Lojistas gerenciam criativos de marketing"
  ON public.marketing_creatives FOR ALL
  USING (public.is_store_staff(store_id));

-- Triggers para atualização automática de updated_at
DROP TRIGGER IF EXISTS update_experience_pages_updated_at ON public.experience_pages;
CREATE TRIGGER update_experience_pages_updated_at
  BEFORE UPDATE ON public.experience_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_portal_configs_updated_at ON public.customer_portal_configs;
CREATE TRIGGER update_customer_portal_configs_updated_at
  BEFORE UPDATE ON public.customer_portal_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_postings_updated_at ON public.job_postings;
CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_reputation_profiles_updated_at ON public.company_reputation_profiles;
CREATE TRIGGER update_company_reputation_profiles_updated_at
  BEFORE UPDATE ON public.company_reputation_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_reputation_complaints_updated_at ON public.reputation_complaints;
CREATE TRIGGER update_reputation_complaints_updated_at
  BEFORE UPDATE ON public.reputation_complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_office_documents_updated_at ON public.office_documents;
CREATE TRIGGER update_office_documents_updated_at
  BEFORE UPDATE ON public.office_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketing_creatives_updated_at ON public.marketing_creatives;
CREATE TRIGGER update_marketing_creatives_updated_at
  BEFORE UPDATE ON public.marketing_creatives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
