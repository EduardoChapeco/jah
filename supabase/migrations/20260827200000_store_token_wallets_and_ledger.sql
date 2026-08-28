-- ============================================================================
-- WIDER PLATFORM: SISTEMA DE CARTEIRA DE TOKENS & MOTOR "MÁQUINA DO TEMPO"
-- Ledger Transacional ACID, Consumômetro de Aceleração e Recargas
-- ============================================================================

-- 1. Carteira de Tokens por Loja / Estabelecimento
CREATE TABLE IF NOT EXISTS public.store_token_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 50000, -- 50.000 tokens gratuitos de boas-vindas
  lifetime_purchased INTEGER NOT NULL DEFAULT 50000,
  lifetime_consumed INTEGER NOT NULL DEFAULT 0,
  estimated_time_saved_hours NUMERIC(10, 2) NOT NULL DEFAULT 24.0, -- Horas de trabalho economizadas
  auto_recharge_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_recharge_threshold INTEGER NOT NULL DEFAULT 20,
  auto_recharge_package_tokens INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Ledger de Transações de Tokens (Extrato Forense)
CREATE TABLE IF NOT EXISTS public.token_ledger_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positivo = Recarga/Bônus; Negativo = Queima/Consumo
  balance_after INTEGER NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'welcome_bonus',
    'package_purchase',
    'admin_grant',
    'curation_reward',
    'burn_feed_view',
    'burn_visibility_boost',
    'burn_whatsapp_alert',
    'burn_push_notification',
    'burn_lead_unlock',
    'burn_ai_agent_chat',
    'burn_verified_daily',
    'burn_market_insight',
    'refund'
  )),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  time_saved_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de Consulta Rápida
CREATE INDEX IF NOT EXISTS idx_token_wallets_store ON public.store_token_wallets(store_id);
CREATE INDEX IF NOT EXISTS idx_token_ledger_store_date ON public.token_ledger_transactions(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_ledger_action ON public.token_ledger_transactions(action_type);

-- Habilitar RLS
ALTER TABLE public.store_token_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_ledger_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Store owners can read their token wallet" ON public.store_token_wallets;
CREATE POLICY "Store owners can read their token wallet" ON public.store_token_wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      JOIN public.workspace_members wm ON wm.store_id = s.id
      WHERE s.id = store_token_wallets.store_id
      AND wm.profile_id = auth.uid()
    )
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin'))
  );

DROP POLICY IF EXISTS "Store owners can read their token ledger" ON public.token_ledger_transactions;
CREATE POLICY "Store owners can read their token ledger" ON public.token_ledger_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      JOIN public.workspace_members wm ON wm.store_id = s.id
      WHERE s.id = token_ledger_transactions.store_id
      AND wm.profile_id = auth.uid()
    )
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin'))
  );

-- 3. Stored Procedure Atômica para Queima de Tokens (Thread-Safe / ACID)
CREATE OR REPLACE FUNCTION public.consume_store_tokens(
  p_store_id UUID,
  p_tokens_to_consume INTEGER,
  p_action_type TEXT,
  p_description TEXT,
  p_time_saved_minutes INTEGER DEFAULT 0,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet RECORD;
  v_new_balance INTEGER;
BEGIN
  -- Bloqueia a linha para evitar concorrência (Row-level Lock)
  SELECT * INTO v_wallet
  FROM public.store_token_wallets
  WHERE store_id = p_store_id
  FOR UPDATE;

  -- Se não existir carteira, inicializa com bônus de boas-vindas
  IF NOT FOUND THEN
    INSERT INTO public.store_token_wallets (store_id, balance, lifetime_purchased, lifetime_consumed)
    VALUES (p_store_id, 100, 100, 0)
    RETURNING * INTO v_wallet;
  END IF;

  -- Verifica saldo suficiente
  IF v_wallet.balance < p_tokens_to_consume THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_TOKENS',
      'current_balance', v_wallet.balance,
      'required_tokens', p_tokens_to_consume,
      'message', 'Saldo de tokens insuficiente para realizar esta aceleração.'
    );
  END IF;

  v_new_balance := v_wallet.balance - p_tokens_to_consume;

  -- Atualiza carteira
  UPDATE public.store_token_wallets
  SET
    balance = v_new_balance,
    lifetime_consumed = v_wallet.lifetime_consumed + p_tokens_to_consume,
    estimated_time_saved_hours = v_wallet.estimated_time_saved_hours + (p_time_saved_minutes::numeric / 60.0),
    updated_at = timezone('utc'::text, now())
  WHERE store_id = p_store_id;

  -- Insere no extrato forense
  INSERT INTO public.token_ledger_transactions (
    store_id,
    amount,
    balance_after,
    action_type,
    description,
    metadata,
    time_saved_minutes
  )
  VALUES (
    p_store_id,
    -p_tokens_to_consume,
    v_new_balance,
    p_action_type,
    p_description,
    p_metadata,
    p_time_saved_minutes
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'tokens_consumed', p_tokens_to_consume,
    'time_saved_minutes', p_time_saved_minutes
  );
END;
$$;
