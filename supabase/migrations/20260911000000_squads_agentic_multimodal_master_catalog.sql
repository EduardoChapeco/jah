-- ==============================================================================
-- MIGRAÇÃO DEFINITIVA: SQUADS AGÊNTICOS, ONBOARDING MULTIMODAL, 
-- INTELIGÊNCIA COMPETITIVA & GLOBAL MASTER CATALOG
-- Protocolo Big Tech Principal Architect Level - Plataforma Waesy
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Catálogo Canônico de Agentes Individuais
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_registry (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  ui_group TEXT NOT NULL DEFAULT 'general',
  seniority TEXT NOT NULL DEFAULT 'Senior / PhD',
  career_summary TEXT NOT NULL,
  curriculum JSONB NOT NULL DEFAULT '{
    "academic_background": [],
    "certifications": [],
    "years_experience": 10,
    "specialties": []
  }'::jsonb,
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  execution_mode TEXT NOT NULL DEFAULT 'llm',
  default_model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  token_budget INT NOT NULL DEFAULT 4000,
  system_prompt_template TEXT NOT NULL,
  input_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 2. Templates de Squads Estruturados (Times de Especialistas)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.squad_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  department TEXT NOT NULL,
  runtime_status TEXT NOT NULL DEFAULT 'ready',
  onboarding_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  icon_name TEXT NOT NULL DEFAULT 'Users',
  badge_label TEXT NOT NULL DEFAULT 'Enterprise Grade',
  is_system BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 3. Membros do Squad e Ordem de Execução (Task Graph)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.squad_template_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_template_id UUID NOT NULL REFERENCES public.squad_templates(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES public.agent_registry(id) ON DELETE RESTRICT,
  task_order INT NOT NULL DEFAULT 0,
  role_label TEXT NOT NULL,
  depends_on_agent_id TEXT REFERENCES public.agent_registry(id) ON DELETE SET NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  input_contract JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_contract JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_squad_agent_order UNIQUE (squad_template_id, task_order),
  CONSTRAINT uq_squad_agent_pair UNIQUE (squad_template_id, agent_id)
);

-- -----------------------------------------------------------------------------
-- 4. Instâncias de Squads Ativos por Loja / Empresa (Multi-Tenant)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  squad_template_id UUID NOT NULL REFERENCES public.squad_templates(id) ON DELETE RESTRICT,
  custom_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  operational_goal TEXT,
  cadence TEXT NOT NULL DEFAULT 'on_demand',
  approval_mode TEXT NOT NULL DEFAULT 'human_in_the_loop',
  onboarding_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  runtime_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_store_squad_slug UNIQUE (store_id, squad_template_id)
);

CREATE INDEX IF NOT EXISTS idx_store_squads_store ON public.store_squads(store_id);

-- -----------------------------------------------------------------------------
-- 5. Execuções do Squad e Registro de Artefatos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_squad_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_squad_id UUID NOT NULL REFERENCES public.store_squads(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  trigger_source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'running',
  current_agent_id TEXT REFERENCES public.agent_registry(id),
  input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_artifacts JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_log TEXT,
  total_tokens_consumed INT NOT NULL DEFAULT 0,
  cost_estimate_cents INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_squad_runs_store ON public.store_squad_runs(store_id, status);

-- -----------------------------------------------------------------------------
-- 6. Perfil de DNA de Marca e Framework dos 7 Pecados Capitais
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brand_dna_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  archetype TEXT NOT NULL DEFAULT 'O Herói',
  archetype_justification TEXT,
  tone_of_voice TEXT NOT NULL DEFAULT 'Profissional e acolhedor',
  tone_rules TEXT[] NOT NULL DEFAULT '{}',
  content_pillars TEXT[] NOT NULL DEFAULT '{}',
  forbidden_words TEXT[] NOT NULL DEFAULT '{}',
  color_palette JSONB NOT NULL DEFAULT '{
    "primary": "#0F172A",
    "secondary": "#3B82F6",
    "accent": "#F59E0B",
    "background": "#FFFFFF",
    "text": "#0F172A"
  }'::jsonb,
  seven_sins_triggers JSONB NOT NULL DEFAULT '{
    "pride_vanity": "Destacar exclusividade, status social e pertencer a um grupo de elite.",
    "greed": "Enfatizar economia real, ROI comprovado e ganho patrimonial.",
    "lust": "Estimular o apelo estético impecável, desejo imediato e acabamento premium.",
    "envy": "Demonstrar por que os clientes estarão à frente de quem não possui a solução.",
    "gluttony": "Oferecer pacotes fartos, suporte ilimitado e riqueza de benefícios.",
    "wrath": "Canalizar a indignação com serviços ruins do mercado tradicional.",
    "sloth": "Proporcionar conveniência absoluta, zero burocracia e solução sem esforço."
  }'::jsonb,
  swot_analysis JSONB NOT NULL DEFAULT '{
    "strengths": [],
    "weaknesses": [],
    "opportunities": [],
    "threats": []
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 7. Radar de Concorrentes & Inteligência de Mercado
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.market_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website_url TEXT,
  instagram_handle TEXT,
  facebook_url TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_store_competitor_name UNIQUE (store_id, name)
);

CREATE INDEX IF NOT EXISTS idx_competitors_store ON public.market_competitors(store_id);

-- -----------------------------------------------------------------------------
-- 8. Snapshots e Capturas dos Concorrentes (Screenshots & Análises)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES public.market_competitors(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  snapshot_type TEXT NOT NULL DEFAULT 'website',
  screenshot_url TEXT NOT NULL,
  extracted_dna JSONB NOT NULL DEFAULT '{}'::jsonb,
  marketing_hooks TEXT[],
  pricing_signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  analyzed_by_agent_id TEXT REFERENCES public.agent_registry(id),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_comp_snapshots_competitor ON public.competitor_snapshots(competitor_id);

-- -----------------------------------------------------------------------------
-- 9. Banco Centralizado Global de Produtos (Master Catalog)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.global_master_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode_ean TEXT UNIQUE,
  name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  suggested_price_cents INT,
  ncm_code TEXT,
  cest_code TEXT,
  tax_tribute_group TEXT DEFAULT 'tributado_integralmente',
  unit_of_measure TEXT NOT NULL DEFAULT 'UN',
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  nutrition_facts JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  is_verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_master_catalog_barcode ON public.global_master_catalog(barcode_ean);
CREATE INDEX IF NOT EXISTS idx_master_catalog_category ON public.global_master_catalog(category);

-- -----------------------------------------------------------------------------
-- 10. Sessão de Onboarding Multimodal de Fricção Zero
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.multimodal_onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'uploaded',
  input_sources JSONB NOT NULL DEFAULT '{
    "image_urls": [],
    "external_links": []
  }'::jsonb,
  extracted_business_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  extracted_products JSONB NOT NULL DEFAULT '[]'::jsonb,
  extracted_categories TEXT[] DEFAULT '{}',
  applied_products_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_store ON public.multimodal_onboarding_sessions(store_id);

-- -----------------------------------------------------------------------------
-- RLS HARDENING (ROW LEVEL SECURITY EM 100% DAS TABELAS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.agent_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_template_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_squad_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_dna_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_master_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multimodal_onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- 1. Catálogos canônicos são legíveis publicamente
DROP POLICY IF EXISTS "Public read agent_registry" ON public.agent_registry;
CREATE POLICY "Public read agent_registry"
  ON public.agent_registry FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read squad_templates" ON public.squad_templates;
CREATE POLICY "Public read squad_templates"
  ON public.squad_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read squad_template_agents" ON public.squad_template_agents;
CREATE POLICY "Public read squad_template_agents"
  ON public.squad_template_agents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read global_master_catalog" ON public.global_master_catalog;
CREATE POLICY "Public read global_master_catalog"
  ON public.global_master_catalog FOR SELECT USING (true);

-- 2. Políticas de Isolamento por Loja
DROP POLICY IF EXISTS "Workspace staff manages store squads" ON public.store_squads;
CREATE POLICY "Workspace staff manages store squads"
  ON public.store_squads FOR ALL
  TO authenticated
  USING (
    is_store_staff(store_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin'))
  );

DROP POLICY IF EXISTS "Workspace staff manages squad runs" ON public.store_squad_runs;
CREATE POLICY "Workspace staff manages squad runs"
  ON public.store_squad_runs FOR ALL
  TO authenticated
  USING (
    is_store_staff(store_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin'))
  );

DROP POLICY IF EXISTS "Workspace staff manages brand dna" ON public.brand_dna_profiles;
CREATE POLICY "Workspace staff manages brand dna"
  ON public.brand_dna_profiles FOR ALL
  TO authenticated
  USING (
    is_store_staff(store_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin'))
  );

DROP POLICY IF EXISTS "Workspace staff manages market competitors" ON public.market_competitors;
CREATE POLICY "Workspace staff manages market competitors"
  ON public.market_competitors FOR ALL
  TO authenticated
  USING (
    is_store_staff(store_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin'))
  );

DROP POLICY IF EXISTS "Workspace staff manages competitor snapshots" ON public.competitor_snapshots;
CREATE POLICY "Workspace staff manages competitor snapshots"
  ON public.competitor_snapshots FOR ALL
  TO authenticated
  USING (
    is_store_staff(store_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin'))
  );

DROP POLICY IF EXISTS "Workspace staff manages onboarding sessions" ON public.multimodal_onboarding_sessions;
CREATE POLICY "Workspace staff manages onboarding sessions"
  ON public.multimodal_onboarding_sessions FOR ALL
  TO authenticated
  USING (
    is_store_staff(store_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin'))
  );
