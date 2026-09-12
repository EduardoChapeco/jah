-- =============================================================================
-- MIGRATION: 20260904220000_wms_batches_workflows_pwa_reputation.sql
-- ECOSSISTEMA Waesy: WMS BATCH PICKING, WORKFLOWS EM NÓS, PWA BUILDER & REPUTAÇÃO/CLAIM
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. wms_picking_batches (Ondas / Lotes de Separação de Pedidos em Massa)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wms_picking_batches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  batch_code   TEXT NOT NULL,
  operator_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'pending' 
                 CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  total_orders INT NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
  total_items  INT NOT NULL DEFAULT 0 CHECK (total_items >= 0),
  total_picked INT NOT NULL DEFAULT 0 CHECK (total_picked >= 0),
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_wms_batch_store_code UNIQUE (store_id, batch_code)
);

CREATE INDEX IF NOT EXISTS idx_wms_batches_store ON public.wms_picking_batches(store_id);
CREATE INDEX IF NOT EXISTS idx_wms_batches_status ON public.wms_picking_batches(store_id, status);

-- Enriquecer tabelas existentes de WMS:
ALTER TABLE public.wms_picking_sessions 
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.wms_picking_batches(id) ON DELETE SET NULL;

ALTER TABLE public.wms_picking_items 
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS location_bin TEXT;

-- ---------------------------------------------------------------------------
-- 2. visual_workflows (Construtor Visual de Automações em Diagrama de Nós)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.visual_workflows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title        TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  description  TEXT,
  trigger_type TEXT NOT NULL 
                 CHECK (trigger_type IN ('order_created', 'order_paid', 'lead_captured', 'ticket_opened', 'stock_low', 'schedule_cron', 'webhook')),
  nodes        JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges        JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  version      INT NOT NULL DEFAULT 1 CHECK (version >= 1),
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visual_workflows_store ON public.visual_workflows(store_id);
CREATE INDEX IF NOT EXISTS idx_visual_workflows_trigger ON public.visual_workflows(store_id, trigger_type) WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- 3. visual_workflow_executions (Execução e Trilha Forense de Nós)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.visual_workflow_executions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id       UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  workflow_id    UUID NOT NULL REFERENCES public.visual_workflows(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'running' 
                   CHECK (status IN ('running', 'completed', 'failed', 'paused')),
  trigger_event  TEXT NOT NULL,
  input_payload  JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  execution_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_ms    INT NOT NULL DEFAULT 0,
  error_message  TEXT,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wf_exec_workflow ON public.visual_workflow_executions(workflow_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_wf_exec_store ON public.visual_workflow_executions(store_id, status);

-- ---------------------------------------------------------------------------
-- 4. store_pwa_configs (Editor e Publicação de App PWA com Marca Própria)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_pwa_configs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  app_name         TEXT NOT NULL CHECK (char_length(app_name) BETWEEN 2 AND 100),
  short_name       TEXT NOT NULL CHECK (char_length(short_name) BETWEEN 1 AND 30),
  description      TEXT,
  theme_color      TEXT NOT NULL DEFAULT '#0F172A',
  background_color TEXT NOT NULL DEFAULT '#000000',
  icon_192_url     TEXT,
  icon_512_url     TEXT,
  splash_image_url TEXT,
  start_url        TEXT NOT NULL DEFAULT '/',
  display_mode     TEXT NOT NULL DEFAULT 'standalone' 
                     CHECK (display_mode IN ('standalone', 'fullscreen', 'minimal-ui', 'browser')),
  orientation      TEXT NOT NULL DEFAULT 'portrait' 
                     CHECK (orientation IN ('portrait', 'landscape', 'any')),
  custom_domain    TEXT,
  is_published     BOOLEAN NOT NULL DEFAULT false,
  published_at     TIMESTAMPTZ,
  settings         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pwa_configs_store ON public.store_pwa_configs(store_id);

-- ---------------------------------------------------------------------------
-- 5. store_reputation_claims (Portal de Atendimento e Claim estilo Reclame Aqui)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_reputation_claims (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name       TEXT NOT NULL CHECK (char_length(customer_name) >= 2),
  customer_email      TEXT NOT NULL,
  customer_phone      TEXT,
  order_id            UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  title               TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  description         TEXT NOT NULL,
  category            TEXT NOT NULL 
                        CHECK (category IN ('atendimento', 'entrega', 'produto_defeituoso', 'cobranca_indevida', 'cancelamento_estorno', 'outro')),
  status              TEXT NOT NULL DEFAULT 'pending_store_response' 
                        CHECK (status IN ('pending_store_response', 'replied_by_store', 'under_moderation', 'resolved', 'not_resolved', 'cancelled')),
  public_token        TEXT UNIQUE NOT NULL,
  is_public           BOOLEAN NOT NULL DEFAULT true,
  satisfaction_rating INT CHECK (satisfaction_rating IS NULL OR (satisfaction_rating >= 1 AND satisfaction_rating <= 10)),
  would_buy_again     BOOLEAN,
  resolved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reputation_claims_store ON public.store_reputation_claims(store_id, status);
CREATE INDEX IF NOT EXISTS idx_reputation_claims_token ON public.store_reputation_claims(public_token);

-- ---------------------------------------------------------------------------
-- 6. store_reputation_messages (Diálogo Público/Privado na Reclamação)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_reputation_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  claim_id         UUID NOT NULL REFERENCES public.store_reputation_claims(id) ON DELETE CASCADE,
  sender_type      TEXT NOT NULL 
                     CHECK (sender_type IN ('customer', 'store_staff', 'platform_moderator')),
  sender_name      TEXT NOT NULL,
  sender_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message          TEXT NOT NULL CHECK (char_length(message) >= 1),
  attachment_urls  TEXT[] NOT NULL DEFAULT '{}',
  is_internal_note BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reputation_msg_claim ON public.store_reputation_messages(claim_id, created_at);

-- ---------------------------------------------------------------------------
-- 7. store_reputation_scores (Índices e Selo de Reputação da Empresa)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_reputation_scores (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id                UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  total_claims            INT NOT NULL DEFAULT 0,
  answered_claims         INT NOT NULL DEFAULT 0,
  resolved_claims         INT NOT NULL DEFAULT 0,
  answered_rate_pct       NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  solve_rate_pct          NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  avg_response_time_hours NUMERIC(6,1) NOT NULL DEFAULT 0.0,
  would_buy_again_pct     NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  final_score             NUMERIC(3,1) NOT NULL DEFAULT 10.0,
  badge_level             TEXT NOT NULL DEFAULT 'otimo' 
                            CHECK (badge_level IN ('otimo', 'bom', 'regular', 'ruim', 'nao_recomendado', 'sem_indice')),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reputation_scores_store ON public.store_reputation_scores(store_id);

-- ---------------------------------------------------------------------------
-- RLS (ROW LEVEL SECURITY)
-- ---------------------------------------------------------------------------
ALTER TABLE public.wms_picking_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_pwa_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_reputation_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_reputation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_reputation_scores ENABLE ROW LEVEL SECURITY;

-- Staff Workspace Policies:
DROP POLICY IF EXISTS staff_manage_wms_batches ON public.wms_picking_batches;
CREATE POLICY staff_manage_wms_batches ON public.wms_picking_batches FOR ALL USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_visual_workflows ON public.visual_workflows;
CREATE POLICY staff_manage_visual_workflows ON public.visual_workflows FOR ALL USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_wf_executions ON public.visual_workflow_executions;
CREATE POLICY staff_manage_wf_executions ON public.visual_workflow_executions FOR ALL USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_pwa_configs ON public.store_pwa_configs;
CREATE POLICY staff_manage_pwa_configs ON public.store_pwa_configs FOR ALL USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_reputation_claims ON public.store_reputation_claims;
CREATE POLICY staff_manage_reputation_claims ON public.store_reputation_claims FOR ALL USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_reputation_messages ON public.store_reputation_messages;
CREATE POLICY staff_manage_reputation_messages ON public.store_reputation_messages FOR ALL USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_reputation_scores ON public.store_reputation_scores;
CREATE POLICY staff_manage_reputation_scores ON public.store_reputation_scores FOR ALL USING (public.is_store_staff(store_id));

-- Políticas Públicas / Portal de Reputação & PWA:
DROP POLICY IF EXISTS public_read_pwa_config ON public.store_pwa_configs;
CREATE POLICY public_read_pwa_config ON public.store_pwa_configs FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS public_read_reputation_claims ON public.store_reputation_claims;
CREATE POLICY public_read_reputation_claims ON public.store_reputation_claims FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS public_create_reputation_claim ON public.store_reputation_claims;
CREATE POLICY public_create_reputation_claim ON public.store_reputation_claims FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS public_read_reputation_messages ON public.store_reputation_messages;
CREATE POLICY public_read_reputation_messages ON public.store_reputation_messages FOR SELECT USING (
  is_internal_note = false 
  AND claim_id IN (SELECT id FROM public.store_reputation_claims WHERE is_public = true)
);

DROP POLICY IF EXISTS public_read_reputation_scores ON public.store_reputation_scores;
CREATE POLICY public_read_reputation_scores ON public.store_reputation_scores FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- Triggers para updated_at automático
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_wms_batches_updated_at ON public.wms_picking_batches;
CREATE TRIGGER trg_wms_batches_updated_at
  BEFORE UPDATE ON public.wms_picking_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_visual_workflows_updated_at ON public.visual_workflows;
CREATE TRIGGER trg_visual_workflows_updated_at
  BEFORE UPDATE ON public.visual_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_store_pwa_configs_updated_at ON public.store_pwa_configs;
CREATE TRIGGER trg_store_pwa_configs_updated_at
  BEFORE UPDATE ON public.store_pwa_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_reputation_claims_updated_at ON public.store_reputation_claims;
CREATE TRIGGER trg_reputation_claims_updated_at
  BEFORE UPDATE ON public.store_reputation_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_reputation_scores_updated_at ON public.store_reputation_scores;
CREATE TRIGGER trg_reputation_scores_updated_at
  BEFORE UPDATE ON public.store_reputation_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
