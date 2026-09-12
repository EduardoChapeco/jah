-- Migration: 20261015000000_fix_exchanges_schema_and_rpc.sql
-- Adiciona coluna processed_by em exchanges e atualiza process_exchange_transaction para idempotência, customer_id e precisão.

ALTER TABLE public.exchanges 
ADD COLUMN IF NOT EXISTS processed_by uuid;

DROP FUNCTION IF EXISTS public.process_exchange_transaction(uuid, uuid, text, text, integer, uuid);

CREATE OR REPLACE FUNCTION public.process_exchange_transaction(
  p_store_id uuid,
  p_original_order_id uuid,
  p_resolution_type text,
  p_reason text,
  p_value_cents integer,
  p_user_id uuid,
  p_exchange_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_exchange_id uuid;
  v_customer_id uuid;
  v_code text;
BEGIN
  IF p_exchange_id IS NOT NULL THEN
    -- Atualiza troca existente
    UPDATE public.exchanges
    SET 
      status = 'completed',
      resolution_type = p_resolution_type,
      total_value_cents = p_value_cents,
      processed_by = p_user_id,
      updated_at = NOW()
    WHERE id = p_exchange_id AND store_id = p_store_id
    RETURNING id INTO v_exchange_id;
  ELSE
    -- Descobre o customer_id a partir do pedido original
    SELECT customer_id INTO v_customer_id
    FROM public.orders
    WHERE id = p_original_order_id;

    IF v_customer_id IS NULL THEN
      v_customer_id := p_user_id;
    END IF;

    -- Insere nova troca concluída
    INSERT INTO public.exchanges (
      store_id,
      original_order_id,
      customer_id,
      status,
      resolution_type,
      reason,
      total_value_cents,
      created_by,
      processed_by,
      created_at,
      updated_at
    ) VALUES (
      p_store_id,
      p_original_order_id,
      v_customer_id,
      'completed',
      p_resolution_type,
      p_reason,
      p_value_cents,
      p_user_id,
      p_user_id,
      NOW(),
      NOW()
    ) RETURNING id INTO v_exchange_id;
  END IF;

  IF p_resolution_type = 'store_credit' AND p_value_cents > 0 THEN
    -- Gera gift card (vale-compras) com código único
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
    RETURN json_build_object(
      'status', 'success',
      'exchange_id', v_exchange_id,
      'resolution', 'refund',
      'amount_cents', p_value_cents
    );
  END IF;

  RETURN json_build_object('status', 'success', 'exchange_id', v_exchange_id);
END;
$function$;
