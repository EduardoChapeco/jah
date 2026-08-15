-- ============================================================================
-- JAH -- Migration: Fix handle_new_user (INCIDENT-IDENTITY-001)
-- ============================================================================
-- PROBLEMA: O trigger anterior inseria TODOS os novos usuarios em
-- workspace_members com a store padrao, incluindo clientes comuns com
-- role='customer'. Isso dava a todos acesso ao shell empresarial do workspace.
--
-- CORRECAO: Apenas os primeiros 2 usuarios (owners do sistema) recebem
-- entrada automatica em workspace_members. Clientes comuns recebem APENAS
-- uma linha em public.profiles.
--
-- Usuarios comuns passam a ser workspace members SOMENTE mediante:
--   1. Acao explicita: criar negocio (createBusinessProfile)
--   2. Acao explicita: aceitar convite para workspace
-- ============================================================================

BEGIN;

-- 1. Audit: quanto dano foi feito?
DO $$
DECLARE
  v_spurious_count INT;
BEGIN
  SELECT count(*) INTO v_spurious_count
  FROM public.workspace_members wm
  WHERE wm.role = 'customer'
    AND wm.store_id IN (
      SELECT id FROM public.stores WHERE slug = 'jah'
    );
  
  RAISE NOTICE '[IDENTITY-001] workspace_members com role=customer na store padrao encontrados e sendo removidos: %', v_spurious_count;

  DELETE FROM public.workspace_members wm
  WHERE wm.role = 'customer'
    AND wm.store_id IN (
      SELECT id FROM public.stores WHERE slug = 'jah'
    );
END;
$$;

-- 2. Substituir handle_new_user com logica segura
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_count INTEGER;
  default_org_id UUID;
  default_store_id UUID;
BEGIN
  SELECT count(*) INTO v_owner_count
  FROM public.workspace_members
  WHERE role = 'owner';

  IF v_owner_count < 2 THEN
    SELECT id INTO default_org_id
    FROM public.organizations
    WHERE slug = 'jah-org'
    LIMIT 1;

    IF default_org_id IS NULL THEN
      INSERT INTO public.organizations (name, slug)
      VALUES ('Jah Organization', 'jah-org')
      RETURNING id INTO default_org_id;
    END IF;

    SELECT id INTO default_store_id
    FROM public.stores
    WHERE slug = 'jah' AND organization_id = default_org_id
    LIMIT 1;

    IF default_store_id IS NULL THEN
      INSERT INTO public.stores (organization_id, name, slug)
      VALUES (default_org_id, 'Jah', 'jah')
      RETURNING id INTO default_store_id;
    END IF;

    INSERT INTO public.profiles (id, full_name)
    VALUES (
      NEW.id,
      coalesce(NEW.raw_user_meta_data->>'full_name', '')
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.workspace_members (profile_id, store_id, role)
    VALUES (NEW.id, default_store_id, 'owner')
    ON CONFLICT DO NOTHING;

  ELSE
    -- CORRECAO CRITICA: usuarios comuns NAO recebem workspace_member automatico.
    -- Apenas profile pessoal. Membership somente via acao explicita.
    INSERT INTO public.profiles (id, full_name)
    VALUES (
      NEW.id,
      coalesce(NEW.raw_user_meta_data->>'full_name', '')
    )
    ON CONFLICT (id) DO NOTHING;

    -- NAO INSERIR em workspace_members.
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. Reinstalar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMIT;
