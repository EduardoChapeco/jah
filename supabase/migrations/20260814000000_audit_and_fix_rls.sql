-- ============================================================================
-- Jah Commerce — Auditoria e Endurecimento RLS
-- Migration: 20260814000000_audit_and_fix_rls.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ORGANIZATIONS
-- ============================================================================
-- Organizations só podem ser lidas por seus membros (ou se públicas)
DROP POLICY IF EXISTS "organizations_public_read" ON public.organizations;
DROP POLICY IF EXISTS "organizations_member_all" ON public.organizations;

CREATE POLICY "organizations_public_read"
  ON public.organizations FOR SELECT
  USING (true); -- Organizações são metadados públicos na plataforma

CREATE POLICY "organizations_member_all"
  ON public.organizations FOR ALL
  USING (
    id IN (
      SELECT s.organization_id 
      FROM public.workspace_members wm
      JOIN public.stores s ON s.id = wm.store_id
      WHERE wm.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT s.organization_id 
      FROM public.workspace_members wm
      JOIN public.stores s ON s.id = wm.store_id
      WHERE wm.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. STORES
-- ============================================================================
-- Lojas podem ser lidas publicamente (vitrine)
DROP POLICY IF EXISTS "stores_read_public" ON public.stores;
DROP POLICY IF EXISTS "stores_public_read" ON public.stores;
DROP POLICY IF EXISTS "stores_member_all" ON public.stores;

CREATE POLICY "stores_public_read"
  ON public.stores FOR SELECT
  USING (true);

CREATE POLICY "stores_member_all"
  ON public.stores FOR ALL
  USING (
    id IN (
      SELECT store_id FROM public.workspace_members WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT store_id FROM public.workspace_members WHERE profile_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. WORKSPACE MEMBERS
-- ============================================================================
-- Membros de loja: o usuário só vê sua própria membership OU memberships da mesma loja se for admin
DROP POLICY IF EXISTS "workspace_members_self_read" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_store_read" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_admin_all" ON public.workspace_members;

CREATE POLICY "workspace_members_self_read"
  ON public.workspace_members FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "workspace_members_store_read"
  ON public.workspace_members FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.workspace_members 
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "workspace_members_admin_all"
  ON public.workspace_members FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.workspace_members 
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM public.workspace_members 
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 4. PROFILES
-- ============================================================================
-- Perfis: Usuário pode ler perfis públicos, editar apenas o seu
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_all" ON public.profiles;

CREATE POLICY "profiles_public_read"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_self_all"
  ON public.profiles FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

COMMIT;
