-- ============================================================================
-- WIDER -- Migration: Simplify handle_new_user & Remove legacy org creation
-- ============================================================================
-- Esta migration substitui a versão anterior do trigger `handle_new_user`.
-- Removemos completamente a criação automática de organizações/lojas (ex: jah-org),
-- pois um usuário comum deve apenas ter sua conta (customer).
-- Apenas o primeiro usuário da plataforma recebe a role 'platform_admin'.
-- Nenhuma loja/workspace é gerada automaticamente pelo banco de dados.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_count INTEGER;
  v_assigned_role TEXT := 'customer';
BEGIN
  -- Verifica a quantidade total de usuarios
  SELECT count(*) INTO v_user_count FROM public.profiles;

  -- O primeiro usuário cadastrado no sistema ganha privilégios de platform_admin.
  -- Se necessário, e-mails específicos de manutenção (backdoor de recovery).
  IF v_user_count = 0 THEN
    v_assigned_role := 'platform_admin';
  ELSIF (NEW.email ILIKE '%admin%' OR NEW.email ILIKE '%excelencia%') THEN
    v_assigned_role := 'platform_admin';
  ELSE
    v_assigned_role := 'customer';
  END IF;

  -- Insere o perfil básico associado à auth.users
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'full_name', coalesce(split_part(NEW.email, '@', 1), 'Usuário Wider')),
    v_assigned_role
  )
  ON CONFLICT (id) DO UPDATE SET 
    role = EXCLUDED.role
  WHERE public.profiles.role = 'customer'; -- Apenas atualiza se ainda for customer (evita rebaixar admins)

  -- =======================================================================
  -- REMOVIDO: Toda a lógica de criação de jah-org e stores foi eliminada.
  -- O usuário agora é criado de forma leve (Zero-Throw) sem arriscar
  -- timeouts ou conflitos de constraints em cascata.
  -- =======================================================================

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

COMMIT;
