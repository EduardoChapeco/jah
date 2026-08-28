-- ============================================================================
-- WIDER PLATFORM: MOTOR DE CRESCIMENTO ORGÂNICO, BOUNTIES VIRAIS & CARTEIRAS DE USUÁRIOS
-- Tráfego Próprio Gratuito (0 Tokens), Bounties de +100k Tokens e Cashback Comunitário
-- ============================================================================

-- 1. Carteira de Tokens de Usuários / Consumidores Comuns
CREATE TABLE IF NOT EXISTS public.user_token_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0, -- Saldo inicia rigorosamente em ZERO (Sem tokens gratuitos da plataforma)
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_redeemed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Ledger de Tokens de Usuários (Cashback, Descontos e Fidelidade)
CREATE TABLE IF NOT EXISTS public.user_token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positivo = Ganho; Negativo = Resgate/Desconto
  balance_after INTEGER NOT NULL,
  origin_store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'signup_welcome',
    'store_cashback_earned',
    'store_discount_redeemed',
    'referral_bonus',
    'community_reward'
  )),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de Bounties Virais & Atribuição de Novos Clientes para Lojas
CREATE TABLE IF NOT EXISTS public.store_growth_bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  bounty_type TEXT NOT NULL CHECK (bounty_type IN (
    'new_user_registration', -- Trouxe um novo cliente para o app (+100.000 tokens)
    'organic_sale_milestone', -- Venda orgânica no próprio biolink/site (+10.000 tokens)
    'viral_traffic_milestone' -- 1.000 visitas no link próprio (+20.000 tokens)
  )),
  tokens_awarded INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'awarded' CHECK (status IN ('awarded', 'pending_validation', 'rejected')),
  origin_channel TEXT DEFAULT 'biolink_qr_code',
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_user_wallets_user ON public.user_token_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_token_ledger_user ON public.user_token_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_growth_bounties_store ON public.store_growth_bounties(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_growth_bounties_user ON public.store_growth_bounties(referred_user_id);

-- Habilitar RLS
ALTER TABLE public.user_token_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_growth_bounties ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can read own token wallet" ON public.user_token_wallets;
CREATE POLICY "Users can read own token wallet" ON public.user_token_wallets
  FOR SELECT USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin')));

DROP POLICY IF EXISTS "Users can read own token ledger" ON public.user_token_transactions;
CREATE POLICY "Users can read own token ledger" ON public.user_token_transactions
  FOR SELECT USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin')));

DROP POLICY IF EXISTS "Store owners can read their growth bounties" ON public.store_growth_bounties;
CREATE POLICY "Store owners can read their growth bounties" ON public.store_growth_bounties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      JOIN public.workspace_members wm ON wm.store_id = s.id
      WHERE s.id = store_growth_bounties.store_id
      AND wm.profile_id = auth.uid()
    )
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin'))
  );

-- 4. Stored Procedure Atômica para Bounties de Novos Clientes para a Loja
CREATE OR REPLACE FUNCTION public.award_store_new_client_bounty(
  p_store_id UUID,
  p_referred_user_id UUID,
  p_bounty_tokens INTEGER DEFAULT 100000,
  p_channel TEXT DEFAULT 'biolink_qr_code'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store_wallet RECORD;
  v_store_new_balance INTEGER;
BEGIN
  -- 1. Bloquear carteira da loja para atualização
  SELECT * INTO v_store_wallet
  FROM public.store_token_wallets
  WHERE store_id = p_store_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.store_token_wallets (store_id, balance, lifetime_purchased, lifetime_consumed)
    VALUES (p_store_id, 50000, 50000, 0)
    RETURNING * INTO v_store_wallet;
  END IF;

  v_store_new_balance := v_store_wallet.balance + p_bounty_tokens;

  -- Atualizar saldo da loja
  UPDATE public.store_token_wallets
  SET
    balance = v_store_new_balance,
    lifetime_purchased = v_store_wallet.lifetime_purchased + p_bounty_tokens,
    updated_at = timezone('utc'::text, now())
  WHERE store_id = p_store_id;

  -- Registrar no ledger da loja
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
    p_bounty_tokens,
    v_store_new_balance,
    'curation_reward',
    'Bounty Viral: Novo cliente cadastrado através do seu link/biolink (+100.000 Tokens)',
    jsonb_build_object('referred_user_id', p_referred_user_id, 'channel', p_channel),
    60 -- Economizou 1 hora de prospecção
  );

  -- Registrar na tabela de bounties
  INSERT INTO public.store_growth_bounties (
    store_id,
    referred_user_id,
    bounty_type,
    tokens_awarded,
    origin_channel
  )
  VALUES (
    p_store_id,
    p_referred_user_id,
    'new_user_registration',
    p_bounty_tokens,
    p_channel
  );

  RETURN jsonb_build_object(
    'success', true,
    'store_tokens_awarded', p_bounty_tokens,
    'store_new_balance', v_store_new_balance
  );
END;
$$;

-- 5. Stored Procedure: Emissão de Tokens de Fidelidade Financiada pelo Lojista para o Cliente
CREATE OR REPLACE FUNCTION public.emit_store_loyalty_tokens_to_user(
  p_store_id UUID,
  p_user_id UUID,
  p_tokens INTEGER,
  p_reason TEXT DEFAULT 'Cashback / Fidelidade sobre compra'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store_wallet RECORD;
  v_user_wallet RECORD;
  v_store_new_balance INTEGER;
  v_user_new_balance INTEGER;
BEGIN
  -- 1. Bloquear e debitar da loja (O lojista é o único financiador dos tokens do cliente)
  SELECT * INTO v_store_wallet
  FROM public.store_token_wallets
  WHERE store_id = p_store_id
  FOR UPDATE;

  IF NOT FOUND OR v_store_wallet.balance < p_tokens THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_STORE_TOKENS',
      'message', 'Loja não possui saldo suficiente de tokens para emitir esta fidelidade.'
    );
  END IF;

  v_store_new_balance := v_store_wallet.balance - p_tokens;

  UPDATE public.store_token_wallets
  SET
    balance = v_store_new_balance,
    lifetime_consumed = v_store_wallet.lifetime_consumed + p_tokens,
    updated_at = timezone('utc'::text, now())
  WHERE store_id = p_store_id;

  INSERT INTO public.token_ledger_transactions (
    store_id,
    amount,
    balance_after,
    action_type,
    description,
    metadata
  )
  VALUES (
    p_store_id,
    -p_tokens,
    v_store_new_balance,
    'burn_market_insight',
    'Emissão de Tokens de Fidelidade para cliente: ' || p_reason,
    jsonb_build_object('recipient_user_id', p_user_id)
  );

  -- 2. Creditar na carteira do consumidor
  SELECT * INTO v_user_wallet
  FROM public.user_token_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.user_token_wallets (user_id, balance, lifetime_earned, lifetime_redeemed)
    VALUES (p_user_id, p_tokens, p_tokens, 0)
    RETURNING * INTO v_user_wallet;
    v_user_new_balance := p_tokens;
  ELSE
    v_user_new_balance := v_user_wallet.balance + p_tokens;
    UPDATE public.user_token_wallets
    SET
      balance = v_user_new_balance,
      lifetime_earned = v_user_wallet.lifetime_earned + p_tokens,
      updated_at = timezone('utc'::text, now())
    WHERE user_id = p_user_id;
  END IF;

  -- 3. Registrar no ledger do consumidor com rastreabilidade da loja emissora
  INSERT INTO public.user_token_transactions (
    user_id,
    amount,
    balance_after,
    origin_store_id,
    action_type,
    description
  )
  VALUES (
    p_user_id,
    p_tokens,
    v_user_new_balance,
    p_store_id,
    'store_cashback_earned',
    p_reason
  );

  RETURN jsonb_build_object(
    'success', true,
    'tokens_emitted', p_tokens,
    'store_new_balance', v_store_new_balance,
    'user_new_balance', v_user_new_balance
  );
END;
$$;
