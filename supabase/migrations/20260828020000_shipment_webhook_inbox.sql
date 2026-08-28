-- ============================================================================
-- WIDER PLATFORM: WEBHOOK DE LOGÍSTICA (INBOX E IDEMPOTÊNCIA)
-- ============================================================================

-- 1. Criação da Tabela de Webhooks Inbound de Frete/Logística (Inbox)
CREATE TABLE IF NOT EXISTS public.shipment_webhooks_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices Parciais de Alta Performance
CREATE INDEX IF NOT EXISTS idx_shipment_webhook_inbox_pending ON public.shipment_webhooks_inbox(status) WHERE status = 'received';

-- 2. Habilitar RLS
ALTER TABLE public.shipment_webhooks_inbox ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deny all client operations on shipment webhooks inbox" ON public.shipment_webhooks_inbox;
CREATE POLICY "Deny all client operations on shipment webhooks inbox" 
  ON public.shipment_webhooks_inbox FOR ALL 
  USING (false);

-- 3. Stored Procedure ACID para Processamento de Webhook de Frete
CREATE OR REPLACE FUNCTION public.process_shipment_webhook_atomic(
  p_provider TEXT,
  p_idempotency_key TEXT,
  p_order_id UUID,
  p_tracking_code TEXT,
  p_carrier_name TEXT,
  p_tracking_url TEXT,
  p_status TEXT, -- 'shipped', 'in_transit', 'delivered', etc.
  p_payload JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_webhook_id UUID;
  v_order RECORD;
  v_new_status TEXT;
BEGIN
  -- 1. Garantir Idempotência Rígida
  INSERT INTO public.shipment_webhooks_inbox (
    provider,
    event_type,
    idempotency_key,
    payload,
    status
  )
  VALUES (
    p_provider,
    p_status,
    p_idempotency_key,
    p_payload,
    'received'
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_webhook_id;

  -- Se já foi processado antes, retornar sucesso idempotente
  IF v_webhook_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'status', 'ALREADY_PROCESSED_IDEMPOTENT',
      'idempotency_key', p_idempotency_key
    );
  END IF;

  -- 2. Bloquear e Buscar Pedido (se fornecido order_id)
  IF p_order_id IS NOT NULL THEN
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;
  ELSIF p_tracking_code IS NOT NULL THEN
    SELECT * INTO v_order
    FROM public.orders
    WHERE tracking_code = p_tracking_code
    FOR UPDATE;
  END IF;

  IF v_order IS NULL THEN
    UPDATE public.shipment_webhooks_inbox
    SET status = 'ignored', error_message = 'Pedido não encontrado'
    WHERE id = v_webhook_id;

    RETURN jsonb_build_object(
      'success', false,
      'status', 'ORDER_NOT_FOUND'
    );
  END IF;

  -- 3. Calcular Novo Status e Atualizar
  v_new_status := v_order.status;
  
  IF p_status = 'shipped' OR p_status = 'in_transit' THEN
    v_new_status := 'shipped';
  ELSIF p_status = 'delivered' OR p_status = 'completed' THEN
    v_new_status := 'delivered';
  END IF;

  UPDATE public.orders
  SET
    status = v_new_status,
    tracking_code = COALESCE(p_tracking_code, tracking_code),
    carrier_name = COALESCE(p_carrier_name, carrier_name),
    tracking_url = COALESCE(p_tracking_url, tracking_url),
    updated_at = timezone('utc'::text, now()),
    shipped_at = CASE WHEN v_new_status = 'shipped' THEN COALESCE(shipped_at, timezone('utc'::text, now())) ELSE shipped_at END,
    delivered_at = CASE WHEN v_new_status = 'delivered' THEN COALESCE(delivered_at, timezone('utc'::text, now())) ELSE delivered_at END
  WHERE id = v_order.id;

  -- 4. Marcar Webhook como Processado
  UPDATE public.shipment_webhooks_inbox
  SET
    status = 'processed',
    processed_at = timezone('utc'::text, now())
  WHERE id = v_webhook_id;

  -- (Opcional) Log na antiga tabela para retrocompatibilidade
  INSERT INTO public.shipment_webhook_logs (store_id, order_id, provider, event_type, payload)
  VALUES (v_order.store_id, v_order.id, p_provider, p_status, p_payload)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'PROCESSED',
    'order_id', v_order.id,
    'new_status', v_new_status
  );
END;
$$;
