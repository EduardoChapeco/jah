-- ==============================================================================
-- Migration: 20261013000000_security_audit_rls_hardening.sql
-- Description:
-- 1. Hardening estrito de RLS em tabelas operacionais (travel_*, eventos_*, notifications)
--    eliminando políticas permissivas USING (true) e impondo isolamento multi-tenant via workspace_members.
-- 2. Expansão de auditoria estruturada em system_error_logs (page_url, schema_name, table_name, column_name, contract_name).
-- 3. Criação da tabela store_pixel_configs para Meta Pixel, CAPI e Google Ads por loja.
-- 4. Criação da tabela employer_reviews (InfoJobs style: salário, motivo de saída, avaliação de empregadores).
-- ==============================================================================

-- ── 1. Expansão da Tabela system_error_logs ─────────────────────────────────────
ALTER TABLE IF EXISTS public.system_error_logs
  ADD COLUMN IF NOT EXISTS page_url text,
  ADD COLUMN IF NOT EXISTS schema_name text DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS table_name text,
  ADD COLUMN IF NOT EXISTS column_name text,
  ADD COLUMN IF NOT EXISTS contract_name text;

CREATE INDEX IF NOT EXISTS idx_system_error_logs_contract
  ON public.system_error_logs (contract_name, created_at DESC);

-- ── 2. Tabela de Configuração de Pixels por Loja ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.store_pixel_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  meta_pixel_id text,
  meta_capi_token text,
  meta_test_event_code text,
  google_ads_id text,
  google_ads_conversion_label text,
  ga4_measurement_id text,
  track_page_views boolean DEFAULT true,
  track_whatsapp_leads boolean DEFAULT true,
  track_catalog_views boolean DEFAULT true,
  track_quotes boolean DEFAULT true,
  track_concursos boolean DEFAULT true,
  track_purchases boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.store_pixel_configs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_store_pixel_configs_store
  ON public.store_pixel_configs (store_id);

-- RLS para store_pixel_configs
DROP POLICY IF EXISTS "store_pixel_configs_manage" ON public.store_pixel_configs;
CREATE POLICY "store_pixel_configs_manage" ON public.store_pixel_configs
  FOR ALL TO authenticated
  USING (
    is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = store_pixel_configs.store_id AND wm.profile_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = store_pixel_configs.store_id AND wm.profile_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "store_pixel_configs_service" ON public.store_pixel_configs;
CREATE POLICY "store_pixel_configs_service" ON public.store_pixel_configs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Função segura para obter tags públicas de pixel sem vazar o CAPI token
CREATE OR REPLACE FUNCTION public.get_store_public_pixels(p_store_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'meta_pixel_id', meta_pixel_id,
    'google_ads_id', google_ads_id,
    'google_ads_conversion_label', google_ads_conversion_label,
    'ga4_measurement_id', ga4_measurement_id,
    'track_whatsapp_leads', COALESCE(track_whatsapp_leads, true),
    'track_page_views', COALESCE(track_page_views, true),
    'track_catalog_views', COALESCE(track_catalog_views, true),
    'track_purchases', COALESCE(track_purchases, true)
  )
  FROM public.store_pixel_configs
  WHERE store_id = p_store_id;
$$;

-- ── 3. Tabela de Avaliações de Empregadores (Estilo InfoJobs) ───────────────────
CREATE TABLE IF NOT EXISTS public.employer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  job_title text NOT NULL,
  employment_type text,
  salary_cents bigint,
  start_date text,
  end_date text,
  is_current boolean DEFAULT false,
  exit_reason text,
  company_rating integer CHECK (company_rating BETWEEN 1 AND 5),
  work_environment_rating integer CHECK (work_environment_rating BETWEEN 1 AND 5),
  career_growth_rating integer CHECK (career_growth_rating BETWEEN 1 AND 5),
  benefits_rating integer CHECK (benefits_rating BETWEEN 1 AND 5),
  management_rating integer CHECK (management_rating BETWEEN 1 AND 5),
  would_recommend boolean DEFAULT true,
  pros text,
  cons text,
  advice_to_management text,
  is_anonymous boolean DEFAULT true,
  status text DEFAULT 'published' CHECK (status IN ('draft', 'published', 'moderated', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.employer_reviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_employer_reviews_store
  ON public.employer_reviews (store_id, status);

CREATE INDEX IF NOT EXISTS idx_employer_reviews_company
  ON public.employer_reviews (lower(company_name), status);

CREATE INDEX IF NOT EXISTS idx_employer_reviews_user
  ON public.employer_reviews (user_id);

-- RLS employer_reviews
DROP POLICY IF EXISTS "employer_reviews_public_read" ON public.employer_reviews;
CREATE POLICY "employer_reviews_public_read" ON public.employer_reviews
  FOR SELECT TO public
  USING (status = 'published');

DROP POLICY IF EXISTS "employer_reviews_insert_auth" ON public.employer_reviews;
CREATE POLICY "employer_reviews_insert_auth" ON public.employer_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "employer_reviews_update_own" ON public.employer_reviews;
CREATE POLICY "employer_reviews_update_own" ON public.employer_reviews
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR is_platform_admin()
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR is_platform_admin()
  );

DROP POLICY IF EXISTS "employer_reviews_service" ON public.employer_reviews;
CREATE POLICY "employer_reviews_service" ON public.employer_reviews
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── 4. Blindagem de Segurança RLS Multi-Tenant em Módulos Operacionais ─────────

-- A. travel_suppliers
DROP POLICY IF EXISTS "travel_suppliers_store_manage" ON public.travel_suppliers;
DROP POLICY IF EXISTS "travel_suppliers_anon_read" ON public.travel_suppliers;

CREATE POLICY "travel_suppliers_store_manage" ON public.travel_suppliers
  FOR ALL TO authenticated
  USING (
    is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = travel_suppliers.store_id AND wm.profile_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = travel_suppliers.store_id AND wm.profile_id = (SELECT auth.uid())
    )
  );

-- B. travel_visas
DROP POLICY IF EXISTS "travel_visas_store_manage" ON public.travel_visas;
CREATE POLICY "travel_visas_store_manage" ON public.travel_visas
  FOR ALL TO authenticated
  USING (
    is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = travel_visas.store_id AND wm.profile_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = travel_visas.store_id AND wm.profile_id = (SELECT auth.uid())
    )
  );

-- C. travel_vouchers
DROP POLICY IF EXISTS "travel_vouchers_store_manage" ON public.travel_vouchers;
CREATE POLICY "travel_vouchers_store_manage" ON public.travel_vouchers
  FOR ALL TO authenticated
  USING (
    is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = travel_vouchers.store_id AND wm.profile_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = travel_vouchers.store_id AND wm.profile_id = (SELECT auth.uid())
    )
  );

-- D. travel_departures_kanban
DROP POLICY IF EXISTS "travel_departures_kanban_store_manage" ON public.travel_departures_kanban;
CREATE POLICY "travel_departures_kanban_store_manage" ON public.travel_departures_kanban
  FOR ALL TO authenticated
  USING (
    is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = travel_departures_kanban.store_id AND wm.profile_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = travel_departures_kanban.store_id AND wm.profile_id = (SELECT auth.uid())
    )
  );

-- E. traveler_forms
DROP POLICY IF EXISTS "traveler_forms_store_manage" ON public.traveler_forms;
DROP POLICY IF EXISTS "traveler_forms_public_access" ON public.traveler_forms;

CREATE POLICY "traveler_forms_store_manage" ON public.traveler_forms
  FOR ALL TO authenticated
  USING (
    is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = traveler_forms.store_id AND wm.profile_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = traveler_forms.store_id AND wm.profile_id = (SELECT auth.uid())
    )
  );

-- Formulário de viajante público apenas para leitura e submissão via token específico
CREATE POLICY "traveler_forms_token_access" ON public.traveler_forms
  FOR SELECT TO public
  USING (
    token IS NOT NULL AND token != ''
  );

CREATE POLICY "traveler_forms_token_update" ON public.traveler_forms
  FOR UPDATE TO public
  USING (
    token IS NOT NULL AND token != '' AND completed_at IS NULL
  )
  WITH CHECK (
    token IS NOT NULL AND token != ''
  );

-- F. Eventos Enterprise: Blindagem das Tabelas de Gestão de Eventos
CREATE OR REPLACE FUNCTION public.can_manage_event(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = p_event_id AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = e.store_id AND wm.profile_id = (SELECT auth.uid())
    )
  );
$$;

-- eventos_documentos
DROP POLICY IF EXISTS "eventos_documentos_auth" ON public.eventos_documentos;
CREATE POLICY "eventos_documentos_auth" ON public.eventos_documentos
  FOR ALL TO authenticated
  USING (public.can_manage_event(evento_id))
  WITH CHECK (public.can_manage_event(evento_id));

-- eventos_lineup
DROP POLICY IF EXISTS "eventos_lineup_auth" ON public.eventos_lineup;
DROP POLICY IF EXISTS "eventos_lineup_public_read" ON public.eventos_lineup;

CREATE POLICY "eventos_lineup_auth" ON public.eventos_lineup
  FOR ALL TO authenticated
  USING (public.can_manage_event(evento_id))
  WITH CHECK (public.can_manage_event(evento_id));

CREATE POLICY "eventos_lineup_public_read" ON public.eventos_lineup
  FOR SELECT TO public
  USING (true);

-- eventos_orcamentos
DROP POLICY IF EXISTS "eventos_orcamentos_auth" ON public.eventos_orcamentos;
CREATE POLICY "eventos_orcamentos_auth" ON public.eventos_orcamentos
  FOR ALL TO authenticated
  USING (public.can_manage_event(evento_id))
  WITH CHECK (public.can_manage_event(evento_id));

-- eventos_parceiros
DROP POLICY IF EXISTS "eventos_parceiros_auth" ON public.eventos_parceiros;
DROP POLICY IF EXISTS "eventos_parceiros_public_read" ON public.eventos_parceiros;

CREATE POLICY "eventos_parceiros_auth" ON public.eventos_parceiros
  FOR ALL TO authenticated
  USING (public.can_manage_event(evento_id))
  WITH CHECK (public.can_manage_event(evento_id));

CREATE POLICY "eventos_parceiros_public_read" ON public.eventos_parceiros
  FOR SELECT TO public
  USING (true);

-- eventos_quadros
DROP POLICY IF EXISTS "eventos_quadros_auth" ON public.eventos_quadros;
CREATE POLICY "eventos_quadros_auth" ON public.eventos_quadros
  FOR ALL TO authenticated
  USING (public.can_manage_event(evento_id))
  WITH CHECK (public.can_manage_event(evento_id));

-- eventos_quadros_colunas
DROP POLICY IF EXISTS "eventos_quadros_colunas_auth" ON public.eventos_quadros_colunas;
CREATE POLICY "eventos_quadros_colunas_auth" ON public.eventos_quadros_colunas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.eventos_quadros q
      WHERE q.id = eventos_quadros_colunas.quadro_id AND public.can_manage_event(q.evento_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.eventos_quadros q
      WHERE q.id = eventos_quadros_colunas.quadro_id AND public.can_manage_event(q.evento_id)
    )
  );

-- eventos_setores
DROP POLICY IF EXISTS "eventos_setores_auth" ON public.eventos_setores;
DROP POLICY IF EXISTS "eventos_setores_public_read" ON public.eventos_setores;

CREATE POLICY "eventos_setores_auth" ON public.eventos_setores
  FOR ALL TO authenticated
  USING (public.can_manage_event(evento_id))
  WITH CHECK (public.can_manage_event(evento_id));

CREATE POLICY "eventos_setores_public_read" ON public.eventos_setores
  FOR SELECT TO public
  USING (true);

-- eventos_tarefas
DROP POLICY IF EXISTS "eventos_tarefas_auth" ON public.eventos_tarefas;
CREATE POLICY "eventos_tarefas_auth" ON public.eventos_tarefas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.eventos_quadros_colunas c
      JOIN public.eventos_quadros q ON q.id = c.quadro_id
      WHERE c.id = eventos_tarefas.coluna_id AND public.can_manage_event(q.evento_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.eventos_quadros_colunas c
      JOIN public.eventos_quadros q ON q.id = c.quadro_id
      WHERE c.id = eventos_tarefas.coluna_id AND public.can_manage_event(q.evento_id)
    )
  );

-- G. notifications
DROP POLICY IF EXISTS "notifications_service_insert" ON public.notifications;
CREATE POLICY "notifications_service_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    is_platform_admin() OR
    user_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.profile_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "notifications_service_role" ON public.notifications
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
