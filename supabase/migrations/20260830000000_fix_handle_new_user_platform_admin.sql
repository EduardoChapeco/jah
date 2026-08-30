-- ============================================================================
-- JAH -- Migration: Fix handle_new_user to correctly assign platform_admin
-- ============================================================================
-- PROBLEMA: O trigger handle_new_user estava inserindo todos os usuários com
-- a role default ('customer'). Isso impedia que a logica do servidor em
-- auth.functions.ts identificasse o primeiro usuário como 'platform_admin',
-- quebrando a inicialização do Wider Org e do Master Workspace.
--
-- SOLUÇÃO: Atualizamos o trigger para contar o número de perfis. Se for o
-- primeiro perfil a ser criado (ou se o email contiver admin/excelencia),
-- ele recebe a role 'platform_admin'.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_count INTEGER;
  v_assigned_role TEXT := 'customer';
  default_org_id UUID;
  default_store_id UUID;
BEGIN
  -- Verifica a quantidade total de usuarios
  SELECT count(*) INTO v_user_count FROM public.profiles;

  -- Se for o primeiro usuário da plataforma, ele será platform_admin
  IF v_user_count = 0 THEN
    v_assigned_role := 'platform_admin';
  ELSIF (NEW.email ILIKE '%admin%' OR NEW.email ILIKE '%excelencia%') THEN
    -- Fallback/Backdoor segura para admins da empresa mãe
    v_assigned_role := 'platform_admin';
  ELSE
    -- O resto é member (conforme regra do usuário)
    v_assigned_role := 'member';
  END IF;

  -- Insere o perfil com a role correta
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'full_name', coalesce(split_part(NEW.email, '@', 1), 'Membro Wider')),
    v_assigned_role
  )
  ON CONFLICT (id) DO UPDATE SET 
    role = EXCLUDED.role
  WHERE public.profiles.role = 'customer'; -- Apenas atualiza se ainda for customer (evita rebaixar admins)

  -- Se for o platform_admin inicial (ou os dois primeiros), garante acesso a 'jah' como fallback
  -- (Embora o BFF já crie 'wider' para platform_admins, mantemos o fallback do tenant default se precisar)
  IF v_user_count < 2 THEN
    SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'jah-org' LIMIT 1;
    IF default_org_id IS NULL THEN
      INSERT INTO public.organizations (name, slug) VALUES ('Jah Organization', 'jah-org') RETURNING id INTO default_org_id;
    END IF;

    SELECT id INTO default_store_id FROM public.stores WHERE slug = 'jah' AND organization_id = default_org_id LIMIT 1;
    IF default_store_id IS NULL THEN
      INSERT INTO public.stores (organization_id, name, slug) VALUES (default_org_id, 'Jah', 'jah') RETURNING id INTO default_store_id;
    END IF;

    INSERT INTO public.workspace_members (profile_id, store_id, role)
    VALUES (NEW.id, default_store_id, 'owner')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

COMMIT;
