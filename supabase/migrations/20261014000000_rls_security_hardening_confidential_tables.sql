-- ==============================================================================
-- MIGRATION: 20261014000000_rls_security_hardening_confidential_tables.sql
-- DESCRIÇÃO: Blindagem estrita de segurança RLS (Multi-Tenant & Anti-Vazamento)
--            Elimina políticas abertas com qual: true em company_documents,
--            studio_projects, contract_templates e store_floor_plans.
-- ==============================================================================

-- ── 1. Blindagem de company_documents (Documentos Confidenciais de Lojas) ──────
DROP POLICY IF EXISTS "Colaboradores e gestores visualizam documentos da loja" ON public.company_documents;
DROP POLICY IF EXISTS "company_documents_select_public" ON public.company_documents;

CREATE POLICY "company_documents_staff_select"
  ON public.company_documents FOR SELECT
  USING (
    is_platform_admin() OR 
    is_store_staff(store_id)
  );

-- ── 2. Blindagem de studio_projects (Projetos de Design & Mídia Privados) ─────
DROP POLICY IF EXISTS "studio_projects_select_all" ON public.studio_projects;
DROP POLICY IF EXISTS "studio_projects_select_own_or_staff" ON public.studio_projects;

CREATE POLICY "studio_projects_select_own_or_staff"
  ON public.studio_projects FOR SELECT
  USING (
    is_platform_admin() OR 
    (auth.uid() = user_id) OR 
    (store_id IS NOT NULL AND is_store_staff(store_id))
  );

-- ── 3. Blindagem de contract_templates (Modelos de Contratos) ─────────────────
DROP POLICY IF EXISTS "templates_select_all" ON public.contract_templates;
DROP POLICY IF EXISTS "templates_select_active" ON public.contract_templates;

CREATE POLICY "templates_select_active"
  ON public.contract_templates FOR SELECT
  USING (
    is_active = true AND (auth.role() = 'authenticated' OR is_platform_admin())
  );

-- ── 4. Blindagem de store_floor_plans (Plantas Baixas e Mesas) ────────────────
DROP POLICY IF EXISTS "store_floor_plans_read_policy" ON public.store_floor_plans;

CREATE POLICY "store_floor_plans_read_policy"
  ON public.store_floor_plans FOR SELECT
  USING (
    is_platform_admin() OR 
    is_store_staff(store_id)
  );
