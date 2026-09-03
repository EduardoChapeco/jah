-- =============================================================
-- MIGRATION: Fix Identity Engine & Tenancy Robustness
-- Data: 2026-08-31
-- 
-- PROBLEMAS IDENTIFICADOS:
-- 1. profiles.store_id não existe (foi removida na refatoração),
--    mas identity.functions.ts tenta fazer update nesta coluna.
-- 2. A função get_user_store_ids usa SECURITY DEFINER mas depende
--    de auth.uid() que pode ser NULL em certas chamadas server-side.
-- 3. Necessidade de garantir que todos os owners tenham memberships
--    corretos via trigger de auto-heal.
-- =============================================================

-- 1. Garantir que a função get_user_store_ids retorne resultado vazio
--    em vez de erro quando auth.uid() for NULL
CREATE OR REPLACE FUNCTION public.get_user_store_ids(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (store_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wm.store_id 
  FROM public.workspace_members wm 
  WHERE wm.profile_id = p_user_id
    AND p_user_id IS NOT NULL;
$$;

-- 2. Garantir que auth_user_store_ids retorne array vazio (não erro) quando uid é NULL
CREATE OR REPLACE FUNCTION public.auth_user_store_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(ARRAY(
    SELECT store_id FROM public.workspace_members
    WHERE profile_id = (SELECT auth.uid())
      AND (SELECT auth.uid()) IS NOT NULL
  ), ARRAY[]::uuid[]);
$$;

-- 3. Criar função de auto-heal: vincula automaticamente lojas cujo email
--    corresponde ao email do profile, caso não exista membership ainda
CREATE OR REPLACE FUNCTION public.auto_heal_workspace_membership(p_user_id UUID, p_user_email TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_store RECORD;
BEGIN
  -- Busca lojas com email correspondente que ainda não tem membership
  FOR v_store IN
    SELECT s.id
    FROM public.stores s
    WHERE LOWER(s.email) = LOWER(p_user_email)
      AND NOT EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.profile_id = p_user_id
          AND wm.store_id = s.id
      )
  LOOP
    INSERT INTO public.workspace_members (profile_id, store_id, role)
    VALUES (p_user_id, v_store.id, 'owner')
    ON CONFLICT (profile_id, store_id) DO NOTHING;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 4. Política de SELECT em workspace_members: garantir que funcione
--    corretamente mesmo com otimizações de planner
DROP POLICY IF EXISTS "wm_select_own_stores" ON public.workspace_members;
CREATE POLICY "wm_select_own_stores" ON public.workspace_members
  FOR SELECT USING (
    profile_id = (SELECT auth.uid())
    OR public.is_platform_admin()
    OR store_id = ANY(public.auth_user_store_ids())
  );

-- 5. INSERT policy: permitir que usuários autenticados se adicionem como owner
--    de uma loja que ainda não tem nenhum owner (loja nova/órfã)
DROP POLICY IF EXISTS "wm_insert_owner" ON public.workspace_members;
CREATE POLICY "wm_insert_owner" ON public.workspace_members
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND (
      public.is_platform_admin()
      OR public.get_store_role(store_id) IN ('owner', 'admin')
      -- Permite inserção inicial (quando é o próprio usuário e a loja é nova/órfã)
      OR (
        profile_id = (SELECT auth.uid())
        AND NOT EXISTS (
          SELECT 1 FROM public.workspace_members wm2
          WHERE wm2.store_id = workspace_members.store_id
            AND wm2.role = 'owner'
        )
      )
    )
  );

-- 6. Garantir que a tabela workspace_members tem índices adequados
CREATE INDEX IF NOT EXISTS idx_workspace_members_profile_id 
  ON public.workspace_members(profile_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_store_id 
  ON public.workspace_members(store_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_profile_store 
  ON public.workspace_members(profile_id, store_id);
