-- ============================================================================
-- Jah Community Platform — Microfase 5 (RMA & Credits)
-- Migration 0082: Grant Customer Credit RPC
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.grant_customer_credit(
  p_customer_id UUID,
  p_store_id UUID,
  p_amount_cents INTEGER,
  p_reason TEXT
) RETURNS JSONB AS $$
DECLARE
  v_credit_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- 1. Ensure the customer_credits record exists
  INSERT INTO public.customer_credits (customer_id, store_id, balance_cents)
  VALUES (p_customer_id, p_store_id, 0)
  ON CONFLICT (customer_id, store_id) DO NOTHING;

  -- 2. Select the ID and lock the row for update to prevent race conditions
  SELECT id INTO v_credit_id
  FROM public.customer_credits
  WHERE customer_id = p_customer_id AND store_id = p_store_id
  FOR UPDATE;

  -- 3. Update the balance
  UPDATE public.customer_credits
  SET balance_cents = balance_cents + p_amount_cents,
      updated_at = now()
  WHERE id = v_credit_id
  RETURNING balance_cents INTO v_new_balance;

  -- 4. Insert the transaction log
  INSERT INTO public.customer_credit_transactions (
    customer_credit_id, amount_cents, reason
  ) VALUES (
    v_credit_id, p_amount_cents, p_reason
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'new_balance_cents', v_new_balance,
    'customer_credit_id', v_credit_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
