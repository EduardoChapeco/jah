-- Jah Commerce — Migration 20260812150000: Provide Shipping Quote RPC
-- Permite que o painel admin forneça o valor do frete para um pedido "awaiting_shipping_quote"

CREATE OR REPLACE FUNCTION public.provide_shipping_quote(
  p_order_id UUID,
  p_shipping_cents INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_record RECORD;
  v_new_total_cents INTEGER;
BEGIN
  -- 1. Validar e obter o pedido bloqueando a linha
  SELECT *
  INTO v_order_record
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado.';
  END IF;

  -- 2. Validar que o pedido está esperando cotação
  IF v_order_record.status != 'awaiting_shipping_quote' THEN
    RAISE EXCEPTION 'A cotação de frete só pode ser fornecida para pedidos com status awaiting_shipping_quote.';
  END IF;

  -- 3. Calcular o novo total
  -- total = subtotal + novo_frete - desconto
  v_new_total_cents := v_order_record.subtotal_cents + p_shipping_cents - COALESCE(v_order_record.discount_cents, 0);
  IF v_new_total_cents < 0 THEN
    v_new_total_cents := 0;
  END IF;

  -- 4. Atualizar o pedido para awaiting_payment
  UPDATE public.orders
  SET 
    shipping_cents = p_shipping_cents,
    total_cents = v_new_total_cents,
    status = 'awaiting_payment',
    updated_at = NOW()
  WHERE id = p_order_id;

  -- 5. Inserir log de auditoria
  INSERT INTO public.audit_logs (
    entity_name,
    entity_id,
    action,
    organization_id,
    store_id,
    metadata
  ) VALUES (
    'orders',
    p_order_id,
    'shipping_quote_provided',
    v_order_record.organization_id,
    v_order_record.store_id,
    jsonb_build_object(
      'previous_status', 'awaiting_shipping_quote',
      'new_status', 'awaiting_payment',
      'shipping_cents_applied', p_shipping_cents,
      'new_total_cents', v_new_total_cents
    )
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Cotação de frete aplicada com sucesso e pedido atualizado.',
    'new_total_cents', v_new_total_cents
  );
END;
$$;
