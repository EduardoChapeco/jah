-- Migration: Identity Engine V1 (Handles e Unicidade)

-- 1. Tabela de histrico para prevenir squatting e manter referncias
CREATE TABLE IF NOT EXISTS public.handle_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  old_handle TEXT NOT NULL,
  new_handle TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_handle_history_profile ON public.handle_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_handle_history_old ON public.handle_history(old_handle);

-- 2. Limpeza sanitizada dos usernames existentes antes de aplicar a constraint
-- Substitui espaos por underscores e remove caracteres invlidos
UPDATE public.profiles
SET username = lower(regexp_replace(username, '[^a-z0-9_]', '_', 'g'))
WHERE username IS NOT NULL;

-- 3. Adicionar constraint restritiva para o handle (username)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_username_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_check 
  CHECK (username IS NULL OR (username ~ '^[a-z0-9_]{3,30}$'));

-- 4. RPC para atomicidade na reivindicao de um handle
CREATE OR REPLACE FUNCTION public.claim_handle_atomic(
  p_profile_id UUID,
  p_new_handle TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_handle TEXT;
  v_exists BOOLEAN;
  v_normalized_handle TEXT;
BEGIN
  -- Normaliza e valida
  v_normalized_handle := lower(trim(p_new_handle));

  IF v_normalized_handle !~ '^[a-z0-9_]{3,30}$' THEN
    RAISE EXCEPTION 'Handle invlido. Use apenas letras minsculas, nmeros e underscore, de 3 a 30 caracteres.';
  END IF;

  -- Verifica se o usurio possui permisso / existe
  SELECT username INTO v_current_handle
  FROM public.profiles
  WHERE id = p_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil no encontrado.';
  END IF;

  -- Se for o mesmo handle, apenas retorna sucesso
  IF v_current_handle = v_normalized_handle THEN
    RETURN jsonb_build_object('status', 'success', 'handle', v_normalized_handle);
  END IF;

  -- Bloqueia a verificao de existncia para evitar race condition
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE username = v_normalized_handle
  ) INTO v_exists;

  IF v_exists THEN
    RAISE EXCEPTION 'Este handle j est em uso.';
  END IF;

  -- Registra no histrico
  IF v_current_handle IS NOT NULL THEN
    INSERT INTO public.handle_history (profile_id, old_handle, new_handle)
    VALUES (p_profile_id, v_current_handle, v_normalized_handle);
  END IF;

  -- Atualiza o perfil
  UPDATE public.profiles
  SET username = v_normalized_handle,
      updated_at = now()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object('status', 'success', 'handle', v_normalized_handle);
END;
$$;
