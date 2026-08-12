-- Phase 4 RPCs (BFF Database logic for atomic operations)

-- 1. close_cash_register
CREATE OR REPLACE FUNCTION public.close_cash_register(
  p_register_id uuid,
  p_counted_cents integer,
  p_user_id uuid,
  p_notes text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_register public.cash_registers;
  v_expected_cents integer;
  v_discrepancy boolean;
BEGIN
  -- Validate register exists and is open
  SELECT * INTO v_register FROM public.cash_registers WHERE id = p_register_id;
  
  IF v_register IS NULL THEN
    RAISE EXCEPTION 'Register not found';
  END IF;
  
  IF v_register.status != 'open' THEN
    RAISE EXCEPTION 'Register is not open';
  END IF;

  -- Calculate expected balance
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_expected_cents
  FROM public.cash_register_entries
  WHERE register_id = p_register_id;
  
  v_expected_cents := v_register.initial_balance_cents + v_expected_cents;
  v_discrepancy := v_expected_cents != p_counted_cents;

  -- Close register
  UPDATE public.cash_registers
  SET 
    status = 'closed',
    closed_at = NOW(),
    closed_by = p_user_id,
    expected_balance_cents = v_expected_cents,
    final_balance_cents = p_counted_cents,
    notes = p_notes
  WHERE id = p_register_id;

  RETURN json_build_object(
    'status', 'success',
    'expected', v_expected_cents,
    'counted', p_counted_cents,
    'discrepancy', v_discrepancy
  );
END;
$$;

-- 2. process_exchange_transaction (Troca com Vale-Presente prioritário)
CREATE OR REPLACE FUNCTION public.process_exchange_transaction(
  p_store_id uuid,
  p_original_order_id uuid,
  p_resolution_type text,
  p_reason text,
  p_value_cents integer,
  p_user_id uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exchange_id uuid;
  v_code text;
BEGIN
  -- Insert exchange record
  INSERT INTO public.exchanges (
    store_id, original_order_id, status, resolution_type, reason, processed_by
  ) VALUES (
    p_store_id, p_original_order_id, 'completed', p_resolution_type, p_reason, p_user_id
  ) RETURNING id INTO v_exchange_id;

  IF p_resolution_type = 'store_credit' THEN
    -- Generate gift card
    v_code := 'GC' || upper(substring(md5(random()::text) from 1 for 8));
    INSERT INTO public.gift_cards (
      store_id, code, balance_cents, initial_value_cents, status, expires_at
    ) VALUES (
      p_store_id, v_code, p_value_cents, p_value_cents, 'active', NOW() + INTERVAL '1 year'
    );
    
    RETURN json_build_object(
      'status', 'success',
      'exchange_id', v_exchange_id,
      'resolution', 'store_credit',
      'gift_card_code', v_code
    );
  ELSIF p_resolution_type = 'refund' THEN
    -- Register refund in active cash register if exists
    -- (In real app, we might need a register ID parameter)
    RETURN json_build_object(
      'status', 'success',
      'exchange_id', v_exchange_id,
      'resolution', 'refund'
    );
  END IF;

  RETURN json_build_object('status', 'success', 'exchange_id', v_exchange_id);
END;
$$;
