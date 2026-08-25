-- Migration: 20260820000000_fix_workspace_members_recursion.sql
-- Description: Elimina recursão infinita de RLS em workspace_members e padroniza acesso via SECURITY DEFINER.

-- 1. Helper Function: Retorna os store_ids onde o usuário é admin/owner/manager
CREATE OR REPLACE FUNCTION public.get_user_admin_store_ids(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (store_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wm.store_id 
  FROM public.workspace_members wm 
  WHERE wm.profile_id = p_user_id 
    AND wm.role IN ('owner', 'admin', 'manager');
$$;

-- 2. Helper Function: Retorna todos os store_ids aos quais o usuário pertence
CREATE OR REPLACE FUNCTION public.get_user_store_ids(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (store_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wm.store_id 
  FROM public.workspace_members wm 
  WHERE wm.profile_id = p_user_id;
$$;

-- 3. Reset e recriação das policies em workspace_members (SEM auto-recursão)
DROP POLICY IF EXISTS "workspace_members_self_read" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_store_read" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_admin_all" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_admin_manage" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;

-- Leitura: Qualquer usuário autenticado pode ver seus próprios vínculos ou vínculos de lojas que administra
CREATE POLICY "workspace_members_select"
ON public.workspace_members FOR SELECT
TO authenticated
USING (
  profile_id = auth.uid() 
  OR store_id IN (SELECT store_id FROM public.get_user_admin_store_ids(auth.uid()))
);

-- Gerenciamento completo: Apenas admins/owners da loja podem criar/editar/remover membros
CREATE POLICY "workspace_members_admin_manage"
ON public.workspace_members FOR ALL
TO authenticated
USING (
  store_id IN (SELECT store_id FROM public.get_user_admin_store_ids(auth.uid()))
)
WITH CHECK (
  store_id IN (SELECT store_id FROM public.get_user_admin_store_ids(auth.uid()))
);

-- 4. Garantir que profiles seja legível publicamente (Vitrine, Autores de Post, etc.)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read"
ON public.profiles FOR SELECT
USING (true);

-- 5. Garantir que stores seja legível publicamente (Vitrine, Diretório, etc.)
DROP POLICY IF EXISTS "Stores are viewable by everyone" ON public.stores;
DROP POLICY IF EXISTS "stores_public_read" ON public.stores;
CREATE POLICY "stores_public_read"
ON public.stores FOR SELECT
USING (true);
