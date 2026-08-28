-- ============================================================================
-- WIDER PLATFORM: OTIMIZAÇÕES DE ALTA ESCALA, ÍNDICES PARCIAIS, RLS OPTIMIZED & WEBHOOKS IDEMPOTENTES
-- Supabase Postgres Best Practices: (select auth.uid()), Partial Indexes, Webhook Inbox/Outbox
-- ============================================================================

-- 1. Tabela de Webhooks Inbound com Idempotência Transacional
CREATE TABLE IF NOT EXISTS public.token_recharge_webhooks_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name TEXT NOT NULL, -- 'asaas', 'pagarme', 'stripe', 'mercadopago'
  event_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  signature TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices Parciais de Alta Performance
CREATE INDEX IF NOT EXISTS idx_webhook_inbox_pending ON public.token_recharge_webhooks_inbox(status) WHERE status = 'received';
CREATE INDEX IF NOT EXISTS idx_wallets_locked ON public.store_token_wallets(is_locked) WHERE is_locked = true;
CREATE INDEX IF NOT EXISTS idx_billing_invoices_pending ON public.store_token_billing_invoices(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_security_events_unresolved ON public.security_audit_events(severity, created_at DESC) WHERE resolved = false;

-- Índices em Chaves Estrangeiras para Prevenir Locks
CREATE INDEX IF NOT EXISTS idx_token_ledger_store_id ON public.token_ledger_transactions(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_invoices_store_id ON public.store_token_billing_invoices(store_id);
CREATE INDEX IF NOT EXISTS idx_growth_bounties_store_id ON public.store_growth_bounties(store_id);

-- 2. Stored Procedure ACID para Processamento de Webhook de Pagamento com Idempotência
CREATE OR REPLACE FUNCTION public.process_token_payment_webhook_atomic(
  p_gateway_name TEXT,
  p_idempotency_key TEXT,
  p_store_id UUID,
  p_package_id TEXT,
  p_tokens_to_credit INTEGER,
  p_amount_cents INTEGER,
  p_gateway_payment_id TEXT,
  p_payload JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_webhook_id UUID;
  v_wallet RECORD;
  v_new_purchased INTEGER;
  v_new_total INTEGER;
  v_invoice_num TEXT;
BEGIN
  -- 1. Garantir Idempotência Rígida
  INSERT INTO public.token_recharge_webhooks_inbox (
    gateway_name,
    event_type,
    idempotency_key,
    payload,
    status
  )
  VALUES (
    p_gateway_name,
    'payment_confirmed',
    p_idempotency_key,
    p_payload,
    'received'
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_webhook_id;

  -- Se já foi processado antes, retornar sucesso idempotente sem duplicar créditos
  IF v_webhook_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'status', 'ALREADY_PROCESSED_IDEMPOTENT',
      'idempotency_key', p_idempotency_key
    );
  END IF;

  -- 2. Bloquear e Atualizar Carteira da Loja (Crédito direto em Purchased Balance)
  SELECT * INTO v_wallet
  FROM public.store_token_wallets
  WHERE store_id = p_store_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.store_token_wallets (
      store_id, balance, purchased_balance, promotional_balance, lifetime_purchased, lifetime_consumed
    )
    VALUES (
      p_store_id, p_tokens_to_credit, p_tokens_to_credit, 0, p_tokens_to_credit, 0
    )
    RETURNING * INTO v_wallet;
    v_new_purchased := p_tokens_to_credit;
    v_new_total := p_tokens_to_credit;
  ELSE
    v_new_purchased := v_wallet.purchased_balance + p_tokens_to_credit;
    v_new_total := v_wallet.promotional_balance + v_new_purchased;

    UPDATE public.store_token_wallets
    SET
      purchased_balance = v_new_purchased,
      balance = v_new_total,
      lifetime_purchased = v_wallet.lifetime_purchased + p_tokens_to_credit,
      total_gateway_purchases = v_wallet.total_gateway_purchases + 1,
      updated_at = timezone('utc'::text, now())
    WHERE store_id = p_store_id;
  END IF;

  -- 3. Gerar Fatura Paga no Histórico
  v_invoice_num := 'FAT-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(gen_random_uuid()::text, 1, 6));

  INSERT INTO public.store_token_billing_invoices (
    store_id,
    invoice_number,
    amount_cents,
    tokens_credited,
    tokens_package_id,
    status,
    payment_method,
    gateway_payment_id,
    paid_at,
    metadata
  )
  VALUES (
    p_store_id,
    v_invoice_num,
    p_amount_cents,
    p_tokens_to_credit,
    p_package_id,
    'paid',
    'credit_card_auto',
    p_gateway_payment_id,
    timezone('utc'::text, now()),
    jsonb_build_object('idempotency_key', p_idempotency_key, 'gateway', p_gateway_name)
  );

  -- 4. Gravar no Ledger Criptográfico Imutável
  INSERT INTO public.token_ledger_transactions (
    store_id,
    amount,
    balance_after,
    action_type,
    origin_type,
    origin_reference_id,
    idempotency_key,
    description
  )
  VALUES (
    p_store_id,
    p_tokens_to_credit,
    v_new_total,
    'package_purchase',
    'gateway_confirmed_payment',
    p_gateway_payment_id,
    p_idempotency_key,
    'Recarga confirmada: +' || p_tokens_to_credit || ' Tokens de Infraestrutura (' || p_package_id || ')'
  );

  -- 5. Marcar Webhook como Processado com Sucesso
  UPDATE public.token_recharge_webhooks_inbox
  SET
    status = 'processed',
    processed_at = timezone('utc'::text, now())
  WHERE id = v_webhook_id;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'CREDITED_SUCCESS',
    'tokens_credited', p_tokens_to_credit,
    'new_purchased_balance', v_new_purchased,
    'new_total_balance', v_new_total,
    'invoice_number', v_invoice_num
  );
END;
$$;

-- 3. Otimização de RLS com (select auth.uid()) conforme Supabase Best Practices
DROP POLICY IF EXISTS "Store members can view invoices" ON public.store_token_billing_invoices;
CREATE POLICY "Store members can view invoices" ON public.store_token_billing_invoices
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM public.workspace_members WHERE profile_id = (SELECT auth.uid())
    )
    OR (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin'))
  );
