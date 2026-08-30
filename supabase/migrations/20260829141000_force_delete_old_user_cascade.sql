-- ============================================================
-- FORCE DELETE OLD USERS DIRECTLY IN AUTH SCHEMA
-- ============================================================

DO $$
DECLARE
  v_master_id UUID := '2ea9f0aa-8b04-4086-9e1d-e23105560302';
  v_old_id UUID := '3e6b1201-3436-4d57-97e9-cab59a29faaa';
BEGIN
  -- Reatribuir PDV / Caixa / Movimentações
  BEGIN
    UPDATE public.cash_registers SET opened_by = v_master_id WHERE opened_by = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.cash_registers SET closed_by = v_master_id WHERE closed_by = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.cash_movements SET created_by = v_master_id WHERE created_by = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.cash_movements SET performed_by = v_master_id WHERE performed_by = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.chat_messages SET sender_id = v_master_id WHERE sender_id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.chat_threads SET customer_id = v_master_id WHERE customer_id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.pos_orders SET cashier_id = v_master_id WHERE cashier_id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.pos_orders SET seller_id = v_master_id WHERE seller_id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Remover de todas as tabelas auth internas
  DELETE FROM auth.identities WHERE user_id = v_old_id;
  DELETE FROM auth.sessions WHERE user_id = v_old_id;
  DELETE FROM auth.mfa_factors WHERE user_id = v_old_id;
  DELETE FROM auth.refresh_tokens WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = v_old_id);
  
  -- Remover da tabela public.profiles se ainda existir
  DELETE FROM public.profiles WHERE id = v_old_id;
  
  -- Deletar do auth.users
  DELETE FROM auth.users WHERE id = v_old_id;
END $$;
