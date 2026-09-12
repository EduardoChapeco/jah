-- ============================================================================
-- Migration: 20261011000000_security_hardening_rls_and_attack_telemetry.sql
-- Objetivo: Blindagem absoluta de RLS no Supabase, revogação de todas as políticas
--           permissivas em tabelas de negócio e criação do motor avançado de
--           telemetria de incidentes e ataques com bloqueio de IPs.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. REVOGAÇÃO E BLINDAGEM DE TABELAS DE TURISMO, CONTRATOS E CLIENTES
-- ----------------------------------------------------------------------------

-- travel_contracts: Impedir que anônimos atualizem contratos via API direta
DROP POLICY IF EXISTS "Public travel contract update signature by token" ON public.travel_contracts;
DROP POLICY IF EXISTS "travel_contracts_staff_update" ON public.travel_contracts;
CREATE POLICY "travel_contracts_staff_update" ON public.travel_contracts
  FOR UPDATE TO authenticated
  USING (is_platform_admin() OR is_store_staff(store_id))
  WITH CHECK (is_platform_admin() OR is_store_staff(store_id));

-- clients: Exclusivo para staff da agência ou platform admin
DROP POLICY IF EXISTS "Clients staff access" ON public.clients;
DROP POLICY IF EXISTS "clients_staff_access" ON public.clients;
CREATE POLICY "clients_staff_access" ON public.clients
  FOR ALL TO authenticated
  USING (is_platform_admin() OR (agency_id IS NOT NULL AND is_store_staff(agency_id)))
  WITH CHECK (is_platform_admin() OR (agency_id IS NOT NULL AND is_store_staff(agency_id)));

-- trips: Exclusivo para staff da agência ou platform admin
DROP POLICY IF EXISTS "Trips staff access" ON public.trips;
DROP POLICY IF EXISTS "trips_staff_access" ON public.trips;
CREATE POLICY "trips_staff_access" ON public.trips
  FOR ALL TO authenticated
  USING (is_platform_admin() OR (agency_id IS NOT NULL AND is_store_staff(agency_id)))
  WITH CHECK (is_platform_admin() OR (agency_id IS NOT NULL AND is_store_staff(agency_id)));

-- vouchers: Exclusivo para staff da agência ou platform admin
DROP POLICY IF EXISTS "Vouchers staff access" ON public.vouchers;
DROP POLICY IF EXISTS "vouchers_staff_access" ON public.vouchers;
CREATE POLICY "vouchers_staff_access" ON public.vouchers
  FOR ALL TO authenticated
  USING (is_platform_admin() OR (agency_id IS NOT NULL AND is_store_staff(agency_id)))
  WITH CHECK (is_platform_admin() OR (agency_id IS NOT NULL AND is_store_staff(agency_id)));

-- proposals: Exclusivo para staff da agência ou platform admin
DROP POLICY IF EXISTS "Proposals staff access" ON public.proposals;
DROP POLICY IF EXISTS "proposals_staff_access" ON public.proposals;
CREATE POLICY "proposals_staff_access" ON public.proposals
  FOR ALL TO authenticated
  USING (is_platform_admin() OR (agency_id IS NOT NULL AND is_store_staff(agency_id)))
  WITH CHECK (is_platform_admin() OR (agency_id IS NOT NULL AND is_store_staff(agency_id)));

-- traveler_forms: Formulários de passageiros protegidos
DROP POLICY IF EXISTS "traveler_forms_public_access" ON public.traveler_forms;
DROP POLICY IF EXISTS "traveler_forms_store_manage" ON public.traveler_forms;
CREATE POLICY "traveler_forms_store_manage" ON public.traveler_forms
  FOR ALL TO authenticated
  USING (is_platform_admin() OR (store_id IS NOT NULL AND is_store_staff(store_id)))
  WITH CHECK (is_platform_admin() OR (store_id IS NOT NULL AND is_store_staff(store_id)));

-- group_tours: Exclusivo para staff da agência ou platform admin
DROP POLICY IF EXISTS "Group tours staff access" ON public.group_tours;
DROP POLICY IF EXISTS "group_tours_staff_manage" ON public.group_tours;
CREATE POLICY "group_tours_staff_manage" ON public.group_tours
  FOR ALL TO authenticated
  USING (is_platform_admin() OR (agency_id IS NOT NULL AND is_store_staff(agency_id)))
  WITH CHECK (is_platform_admin() OR (agency_id IS NOT NULL AND is_store_staff(agency_id)));

-- agencies: Apenas platform admin ou staff da loja vinculada
DROP POLICY IF EXISTS "Agencies staff access" ON public.agencies;
DROP POLICY IF EXISTS "agencies_staff_access" ON public.agencies;
CREATE POLICY "agencies_staff_access" ON public.agencies
  FOR ALL TO authenticated
  USING (is_platform_admin() OR (store_id IS NOT NULL AND is_store_staff(store_id)))
  WITH CHECK (is_platform_admin() OR (store_id IS NOT NULL AND is_store_staff(store_id)));

-- bus_layouts: Apenas platform admin ou staff da agência
DROP POLICY IF EXISTS "Bus layouts staff access" ON public.bus_layouts;
DROP POLICY IF EXISTS "bus_layouts_staff_manage" ON public.bus_layouts;
CREATE POLICY "bus_layouts_staff_manage" ON public.bus_layouts
  FOR ALL TO authenticated
  USING (is_platform_admin() OR (agency_id IS NOT NULL AND is_store_staff(agency_id)))
  WITH CHECK (is_platform_admin() OR (agency_id IS NOT NULL AND is_store_staff(agency_id)));

-- ----------------------------------------------------------------------------
-- 2. REVOGAÇÃO E BLINDAGEM DE STUDIO, DOCUMENTOS E SIMLAB
-- ----------------------------------------------------------------------------

-- studio_projects: Dono do projeto, staff da loja ou platform admin
DROP POLICY IF EXISTS "studio_projects_insert_all" ON public.studio_projects;
DROP POLICY IF EXISTS "studio_projects_update_all" ON public.studio_projects;
DROP POLICY IF EXISTS "studio_projects_delete_all" ON public.studio_projects;
DROP POLICY IF EXISTS "studio_projects_manage_own" ON public.studio_projects;
CREATE POLICY "studio_projects_manage_own" ON public.studio_projects
  FOR ALL TO authenticated
  USING (is_platform_admin() OR auth.uid() = user_id OR (store_id IS NOT NULL AND is_store_staff(store_id)))
  WITH CHECK (is_platform_admin() OR auth.uid() = user_id OR (store_id IS NOT NULL AND is_store_staff(store_id)));

-- studio_templates: Apenas platform admin pode criar/alterar/remover templates
DROP POLICY IF EXISTS "studio_templates_delete_admin" ON public.studio_templates;
DROP POLICY IF EXISTS "studio_templates_insert_admin" ON public.studio_templates;
DROP POLICY IF EXISTS "studio_templates_update_admin" ON public.studio_templates;
DROP POLICY IF EXISTS "studio_templates_admin_manage" ON public.studio_templates;
CREATE POLICY "studio_templates_admin_manage" ON public.studio_templates
  FOR ALL TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- company_documents: Apenas gestores da loja ou admin master
DROP POLICY IF EXISTS "Gestores criam e atualizam documentos" ON public.company_documents;
DROP POLICY IF EXISTS "company_documents_staff_manage" ON public.company_documents;
CREATE POLICY "company_documents_staff_manage" ON public.company_documents
  FOR ALL TO authenticated
  USING (is_platform_admin() OR is_store_staff(store_id))
  WITH CHECK (is_platform_admin() OR is_store_staff(store_id));

-- company_document_reads: Registro seguro de leitura por colaborador autenticado
DROP POLICY IF EXISTS "Colaboradores registram leitura" ON public.company_document_reads;
DROP POLICY IF EXISTS "company_document_reads_insert" ON public.company_document_reads;
DROP POLICY IF EXISTS "company_document_reads_select" ON public.company_document_reads;
CREATE POLICY "company_document_reads_insert" ON public.company_document_reads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "company_document_reads_select" ON public.company_document_reads
  FOR SELECT TO authenticated
  USING (is_platform_admin() OR auth.uid() = employee_id OR EXISTS (
    SELECT 1 FROM public.company_documents d 
    WHERE d.id = document_id AND is_store_staff(d.store_id)
  ));

-- simlab tables: Lojista isolado por loja e admin
DO $$
DECLARE
  simlab_t TEXT;
BEGIN
  FOR simlab_t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'simlab_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Lojista gerencia sessoes de focus group" ON public.%I', simlab_t);
    EXECUTE format('DROP POLICY IF EXISTS "Lojista gerencia mensagens do focus group" ON public.%I', simlab_t);
    EXECUTE format('DROP POLICY IF EXISTS "Lojista gerencia seus experimentos no SimLab" ON public.%I', simlab_t);
    EXECUTE format('DROP POLICY IF EXISTS "Lojista acessa respostas dos seus experimentos" ON public.%I', simlab_t);
    EXECUTE format('DROP POLICY IF EXISTS "Lojista acessa sintese dos seus experimentos" ON public.%I', simlab_t);
    EXECUTE format('DROP POLICY IF EXISTS "store_access_focus_messages" ON public.%I', simlab_t);
    EXECUTE format('DROP POLICY IF EXISTS "store_access_simlab_responses" ON public.%I', simlab_t);
    EXECUTE format('DROP POLICY IF EXISTS "store_access_simlab_synthesis" ON public.%I', simlab_t);
  END LOOP;
END $$;

-- sponsor_placements: Apenas platform admin
DROP POLICY IF EXISTS "sponsor_placements_staff_all" ON public.sponsor_placements;
DROP POLICY IF EXISTS "sponsor_placements_admin_manage" ON public.sponsor_placements;
CREATE POLICY "sponsor_placements_admin_manage" ON public.sponsor_placements
  FOR ALL TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- squad_generated_posts: Apenas staff da loja
DROP POLICY IF EXISTS "Lojista gerencia posts gerados por seus squads" ON public.squad_generated_posts;
DROP POLICY IF EXISTS "squad_generated_posts_staff_manage" ON public.squad_generated_posts;
CREATE POLICY "squad_generated_posts_staff_manage" ON public.squad_generated_posts
  FOR ALL TO authenticated
  USING (is_platform_admin() OR is_store_staff(store_id))
  WITH CHECK (is_platform_admin() OR is_store_staff(store_id));

-- synthetic tables: Apenas platform admin
DROP POLICY IF EXISTS "public_read_synthetic_memories" ON public.synthetic_agent_memories;
DROP POLICY IF EXISTS "synthetic_memories_admin_manage" ON public.synthetic_agent_memories;
CREATE POLICY "synthetic_memories_admin_manage" ON public.synthetic_agent_memories
  FOR ALL TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

DROP POLICY IF EXISTS "public_read_synthetic_archetypes" ON public.synthetic_population_archetypes;
DROP POLICY IF EXISTS "synthetic_archetypes_read" ON public.synthetic_population_archetypes;
DROP POLICY IF EXISTS "synthetic_archetypes_admin_write" ON public.synthetic_population_archetypes;
CREATE POLICY "synthetic_archetypes_read" ON public.synthetic_population_archetypes
  FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "synthetic_archetypes_admin_write" ON public.synthetic_population_archetypes
  FOR ALL TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- outbox_events: Apenas platform admin ou service role
DROP POLICY IF EXISTS "outbox_events_service_role" ON public.outbox_events;
DROP POLICY IF EXISTS "outbox_events_admin_only" ON public.outbox_events;
CREATE POLICY "outbox_events_admin_only" ON public.outbox_events
  FOR ALL TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ----------------------------------------------------------------------------
-- 3. MOTOR DE TELEMETRIA DE ATAQUES E INCIDENTES SERVER-SIDE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.security_attack_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attack_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical', 'emergency')),
  target_route TEXT,
  attacker_ip TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  device_fingerprint TEXT,
  payload_snapshot JSONB DEFAULT '{}'::jsonb,
  headers_snapshot JSONB DEFAULT '{}'::jsonb,
  blocked BOOLEAN DEFAULT false,
  resolution_status TEXT DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'investigating', 'mitigated', 'blocked_ip', 'false_positive')),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sec_attack_severity ON public.security_attack_incidents(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_attack_ip ON public.security_attack_incidents(attacker_ip);
CREATE INDEX IF NOT EXISTS idx_sec_attack_created ON public.security_attack_incidents(created_at DESC);

ALTER TABLE public.security_attack_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sec_attack_admin_all" ON public.security_attack_incidents;
CREATE POLICY "sec_attack_admin_all" ON public.security_attack_incidents
  FOR ALL TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Tabela de IPs Bloqueados
CREATE TABLE IF NOT EXISTS public.blocked_attacker_ips (
  ip_address TEXT PRIMARY KEY,
  reason TEXT NOT NULL,
  severity TEXT DEFAULT 'critical',
  blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_attacker_ips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_ips_admin_all" ON public.blocked_attacker_ips;
CREATE POLICY "blocked_ips_admin_all" ON public.blocked_attacker_ips
  FOR ALL TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Procedure segura para registro de incidentes (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.log_security_attack_incident(
  p_attack_type TEXT,
  p_severity TEXT,
  p_target_route TEXT DEFAULT NULL,
  p_attacker_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_device_fingerprint TEXT DEFAULT NULL,
  p_payload_snapshot JSONB DEFAULT '{}'::jsonb,
  p_headers_snapshot JSONB DEFAULT '{}'::jsonb,
  p_blocked BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.security_attack_incidents (
    attack_type,
    severity,
    target_route,
    attacker_ip,
    user_agent,
    user_id,
    device_fingerprint,
    payload_snapshot,
    headers_snapshot,
    blocked
  ) VALUES (
    p_attack_type,
    p_severity,
    p_target_route,
    p_attacker_ip,
    p_user_agent,
    p_user_id,
    p_device_fingerprint,
    COALESCE(p_payload_snapshot, '{}'::jsonb),
    COALESCE(p_headers_snapshot, '{}'::jsonb),
    COALESCE(p_blocked, false)
  )
  RETURNING id INTO v_id;

  -- Auto-bloqueio de IP caso marcado como bloqueado
  IF p_blocked = true AND p_attacker_ip IS NOT NULL AND length(trim(p_attacker_ip)) > 0 THEN
    INSERT INTO public.blocked_attacker_ips (ip_address, reason, severity)
    VALUES (trim(p_attacker_ip), 'Auto-bloqueio por incidente: ' || p_attack_type, p_severity)
    ON CONFLICT (ip_address) DO UPDATE
    SET severity = EXCLUDED.severity,
        reason = EXCLUDED.reason,
        created_at = now();
  END IF;

  RETURN v_id;
END;
$$;
