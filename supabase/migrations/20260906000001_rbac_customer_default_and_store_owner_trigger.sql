-- =============================================================================
-- Migration: 20260906000001_rbac_customer_default_and_store_owner_trigger.sql
-- Garante que:
-- 1. Novos usuários recebem role 'customer' por padrão (não 'member')
-- 2. Ao criar uma loja, o criador vira 'store_owner' automaticamente
-- 3. Admin master pode alterar roles livremente
-- =============================================================================


-- ─── 1. Corrigir o trigger handle_new_user para usar 'customer' ──────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_count INTEGER;
  v_assigned_role TEXT := 'customer';
  default_org_id UUID;
  default_store_id UUID;
BEGIN
  -- Conta perfis existentes
  SELECT count(*) INTO v_user_count FROM public.profiles;

  -- Primeiro usuário da plataforma → platform_admin
  IF v_user_count = 0 THEN
    v_assigned_role := 'platform_admin';
  -- Backdoor segura para emails da empresa mãe
  ELSIF (NEW.email ILIKE '%admin%' OR NEW.email ILIKE '%excelencia%') THEN
    v_assigned_role := 'platform_admin';
  ELSE
    -- Padrão: customer (usuário comum sem store)
    v_assigned_role := 'customer';
  END IF;

  -- Insere ou atualiza o perfil com a role correta
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    coalesce(
      NEW.raw_user_meta_data->>'full_name',
      coalesce(split_part(NEW.email, '@', 1), 'Membro Waesy')
    ),
    v_assigned_role
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Só atualiza role se ainda for 'customer' ou 'member' (nunca rebaixa admins)
    role = CASE
      WHEN public.profiles.role IN ('customer', 'member') THEN EXCLUDED.role
      ELSE public.profiles.role
    END;

  -- Se for o platform_admin inicial, garante acesso à org default
  IF v_user_count < 2 THEN
    SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'waesy-org' LIMIT 1;
    IF default_org_id IS NULL THEN
      INSERT INTO public.organizations (name, slug)
      VALUES ('Waesy Organization', 'waesy-org')
      RETURNING id INTO default_org_id;
    END IF;

    SELECT id INTO default_store_id
    FROM public.stores
    WHERE slug = 'waesy' AND organization_id = default_org_id
    LIMIT 1;

    IF default_store_id IS NULL THEN
      INSERT INTO public.stores (organization_id, name, slug)
      VALUES (default_org_id, 'Waesy', 'waesy')
      RETURNING id INTO default_store_id;
    END IF;

    INSERT INTO public.workspace_members (profile_id, store_id, role)
    VALUES (NEW.id, default_store_id, 'owner')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ─── 2. Migrar usuários 'member' existentes para 'customer' ─────────────────
-- (Apenas usuários sem loja ativa devem ser 'customer')
UPDATE public.profiles
SET role = 'customer'
WHERE role = 'member';

-- ─── 3. Garantir que donos de lojas ativas sejam 'store_owner' ──────────────
UPDATE public.profiles p
SET role = 'store_owner'
FROM public.workspace_members wm
WHERE wm.profile_id = p.id
  AND wm.role IN ('owner', 'admin')
  AND p.role NOT IN ('platform_admin', 'master', 'operator');

-- ─── 4. Função RPC: Elevar role ao criar loja (chamada pelo BFF) ─────────────
CREATE OR REPLACE FUNCTION public.elevate_to_store_owner(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'store_owner'
  WHERE id = p_user_id
    AND role NOT IN ('platform_admin', 'master', 'operator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Permissão: qualquer autenticado pode chamar (mas só afeta o próprio user via BFF)
REVOKE ALL ON FUNCTION public.elevate_to_store_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.elevate_to_store_owner(uuid) TO authenticated;

-- ─── 5. Função RPC: Admin altera role de qualquer usuário ───────────────────
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_target_user_id uuid,
  p_new_role text
)
RETURNS void AS $$
DECLARE
  v_caller_role text;
  v_allowed_roles text[] := ARRAY['customer', 'store_owner', 'operator', 'platform_admin'];
BEGIN
  -- Verificar que o chamador é platform_admin
  SELECT role INTO v_caller_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_caller_role NOT IN ('platform_admin', 'master') THEN
    RAISE EXCEPTION 'Acesso negado: apenas platform_admin pode alterar roles.';
  END IF;

  IF p_new_role != ALL(v_allowed_roles) THEN
    RAISE EXCEPTION 'Role inválida: %', p_new_role;
  END IF;

  -- Nunca rebaixar outro platform_admin sem ser o próprio sistema
  IF p_new_role NOT IN ('platform_admin', 'master') THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = p_target_user_id AND role IN ('platform_admin', 'master')
    ) THEN
      RAISE EXCEPTION 'Não é possível rebaixar um platform_admin por esta função.';
    END IF;
  END IF;

  UPDATE public.profiles
  SET role = p_new_role
  WHERE id = p_target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO authenticated;

-- ─── 6. RLS: Garantir que profiles são legíveis publicamente ────────────────
-- (Apenas dados públicos: id, full_name, avatar_url, username, role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'profiles_public_read'
  ) THEN
    CREATE POLICY profiles_public_read ON public.profiles
      FOR SELECT USING (true);
  END IF;
END $$;

