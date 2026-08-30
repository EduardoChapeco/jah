-- Migration: Handle Governance & 30-Day Anti-Squatting Engine
-- Permite 1 mudanca de handle a cada 30 dias, protege o handle antigo por 30 dias para o mesmo titular
-- e garante resolucao historica sem quebrar links antigos compartilhados.

CREATE OR REPLACE FUNCTION public.claim_handle_atomic(
  p_profile_id UUID,
  p_new_handle TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_handle TEXT;
  v_exists BOOLEAN;
  v_normalized_handle TEXT;
  v_last_change RECORD;
  v_squatter_lock RECORD;
  v_days_since_change NUMERIC;
  v_days_remaining INT;
BEGIN
  -- 1. Normaliza e valida formato (apenas letras minusculas, numeros e underscores, 3-30 chars)
  v_normalized_handle := lower(trim(p_new_handle));

  IF v_normalized_handle !~ '^[a-z0-9_]{3,30}$' THEN
    RAISE EXCEPTION 'Handle invalido. Use apenas letras minusculas, numeros e underscore, de 3 a 30 caracteres.';
  END IF;

  -- 2. Verifica se o perfil existe
  SELECT username INTO v_current_handle
  FROM public.profiles
  WHERE id = p_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil nao encontrado.';
  END IF;

  -- 3. Se for o mesmo handle atual, retorna sucesso imediatamente (idempotente)
  IF v_current_handle = v_normalized_handle THEN
    RETURN jsonb_build_object(
      'status', 'success',
      'handle', v_normalized_handle,
      'message', 'Handle mantido sem alteracoes.'
    );
  END IF;

  -- 4. Verifica se o handle ja esta em uso por outro usuario ativo
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE username = v_normalized_handle AND id != p_profile_id
  ) INTO v_exists;

  IF v_exists THEN
    RAISE EXCEPTION 'Este nome de usuario ja esta em uso por outro membro.';
  END IF;

  -- 5. Verifica protecao contra Squatting (handle antigo de outro usuario liberado ha menos de 30 dias)
  SELECT profile_id, old_handle, created_at INTO v_squatter_lock
  FROM public.handle_history
  WHERE old_handle = v_normalized_handle
    AND profile_id != p_profile_id
    AND created_at > (now() - interval '30 days')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_squatter_lock.profile_id IS NOT NULL THEN
    RAISE EXCEPTION 'Este nome de usuario pertenceu a outro membro recentemente e esta protegido temporariamente por 30 dias.';
  END IF;

  -- 6. Verifica regra de frequencia: maximo de 1 alteracao a cada 30 dias
  -- Excecao: Se o usuario estiver restaurando para o seu handle antigo anterior, permitimos!
  IF v_current_handle IS NOT NULL THEN
    SELECT id, old_handle, new_handle, created_at INTO v_last_change
    FROM public.handle_history
    WHERE profile_id = p_profile_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_change.id IS NOT NULL THEN
      v_days_since_change := EXTRACT(EPOCH FROM (now() - v_last_change.created_at)) / 86400.0;
      
      IF v_days_since_change < 30.0 THEN
        -- Se estiver restaurando para o handle imediatamente anterior, permite restauracao!
        IF v_last_change.old_handle = v_normalized_handle THEN
          -- Restauracao autorizada
          NULL;
        ELSE
          v_days_remaining := CEIL(30.0 - v_days_since_change);
          RAISE EXCEPTION 'Voce so pode alterar seu nome de usuario uma vez a cada 30 dias. Tente novamente em % dias (ou restaure para seu @antigo: @%).', v_days_remaining, v_last_change.old_handle;
        END IF;
      END IF;
    END IF;
  END IF;

  -- 7. Registra alteracao no historico
  IF v_current_handle IS NOT NULL THEN
    INSERT INTO public.handle_history (profile_id, old_handle, new_handle, created_at)
    VALUES (p_profile_id, v_current_handle, v_normalized_handle, now());
  END IF;

  -- 8. Atualiza o perfil atomicamente
  UPDATE public.profiles
  SET username = v_normalized_handle,
      updated_at = now()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'handle', v_normalized_handle,
    'previous_handle', v_current_handle,
    'protected_days', 30
  );
END;
$$;
