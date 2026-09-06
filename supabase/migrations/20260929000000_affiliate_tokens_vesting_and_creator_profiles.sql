-- ==============================================================================
-- MIGRATION: 20260929000000_affiliate_tokens_vesting_and_creator_profiles.sql
-- DIRETIVA BIGTECH: Módulo de Afiliados com Tokens de Vesting Futuro,
-- Sub-Perfis de Criador/Influenciador com Anonimato Pessoal e Abatimento de Faturas
-- ==============================================================================

-- 1. Campos de Privacidade & Anonimato em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS privacy_mode TEXT DEFAULT 'public' CHECK (privacy_mode IN ('public', 'unlisted', 'private')),
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS active_creator_handle TEXT;

-- 2. Tabela de Sub-Perfis de Criador / Influenciador / Marca (creator_profiles)
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  stage_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  category TEXT DEFAULT 'general',
  is_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'under_review')),
  social_links JSONB DEFAULT '{}'::jsonb,
  pinned_products JSONB DEFAULT '[]'::jsonb,
  metrics JSONB DEFAULT '{"total_referrals": 0, "total_tokens_earned": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_profiles_user ON public.creator_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_handle ON public.creator_profiles(handle);

-- 3. Tabela de Regras de Recompensa de Afiliados / Emissão de Tokens (affiliate_reward_rules)
CREATE TABLE IF NOT EXISTS public.affiliate_reward_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  tokens_amount INT NOT NULL DEFAULT 50000,
  vesting_days INT NOT NULL DEFAULT 30,
  target_type TEXT NOT NULL CHECK (target_type IN ('user_signup', 'store_signup', 'first_order', 'first_subscription')),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserção de regras padrão caso não existam
INSERT INTO public.affiliate_reward_rules (rule_key, title, tokens_amount, vesting_days, target_type, description)
VALUES 
  ('user_referral', 'Indicação de Novo Usuário', 50000, 30, 'user_signup', 'Concede 50.000 tokens em vesting por novo usuário cadastrado via link.'),
  ('store_referral', 'Indicação de Loja Parceira', 500000, 60, 'store_signup', 'Concede 500.000 tokens em vesting por nova empresa cadastrada e verificada.'),
  ('order_cashback', 'Comissão de Primeiro Pedido', 100000, 15, 'first_order', 'Concede 100.000 tokens quando o indicado realiza seu 1º pedido.')
ON CONFLICT (rule_key) DO UPDATE SET
  tokens_amount = EXCLUDED.tokens_amount,
  vesting_days = EXCLUDED.vesting_days;

-- 4. Evolução de user_token_wallets para suportar vesting e maturidade
ALTER TABLE public.user_token_wallets
  ADD COLUMN IF NOT EXISTS vesting_unlock_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vesting_rules JSONB DEFAULT '[]'::jsonb;

-- 5. Evolução de store_token_billing_invoices para Abatimento de Faturas com Tokens
ALTER TABLE public.store_token_billing_invoices
  ADD COLUMN IF NOT EXISTS tokens_redeemed_for_discount INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_applied_cents INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_status TEXT DEFAULT 'none' CHECK (discount_status IN ('none', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS discount_approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discount_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_store_invoices_discount ON public.store_token_billing_invoices(discount_status);

-- 6. Tabela de Indicações de Afiliados com Telemetria (affiliate_referrals)
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referred_store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  referral_type TEXT NOT NULL CHECK (referral_type IN ('user', 'store')),
  tokens_awarded INT DEFAULT 0,
  vesting_unlock_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending_vesting' CHECK (status IN ('pending_vesting', 'matured', 'cancelled', 'flagged_fraud')),
  tamper_seal TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  matured_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_affiliate_ref_user ON public.affiliate_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_ref_code ON public.affiliate_referrals(referral_code);

-- 7. Stored Procedure ACID: Concessão de Tokens de Indicação com Vesting
CREATE OR REPLACE FUNCTION public.award_referral_tokens_with_vesting(
  p_referrer_id UUID,
  p_referred_user_id UUID,
  p_referred_store_id UUID,
  p_referral_code TEXT,
  p_referral_type TEXT
) RETURNS JSONB AS $$
DECLARE
  v_rule RECORD;
  v_tokens_amount INT := 50000;
  v_vesting_days INT := 30;
  v_unlock_date TIMESTAMPTZ;
  v_wallet_id UUID;
  v_current_pending INT := 0;
  v_referral_id UUID;
  v_tamper_seal TEXT;
BEGIN
  -- 1. Busca regra ativa correspondente
  IF p_referral_type = 'store' THEN
    SELECT * INTO v_rule FROM public.affiliate_reward_rules WHERE rule_key = 'store_referral' AND is_active = true;
  ELSE
    SELECT * INTO v_rule FROM public.affiliate_reward_rules WHERE rule_key = 'user_referral' AND is_active = true;
  END IF;

  IF FOUND THEN
    v_tokens_amount := v_rule.tokens_amount;
    v_vesting_days := v_rule.vesting_days;
  END IF;

  v_unlock_date := NOW() + (v_vesting_days || ' days')::INTERVAL;

  -- 2. Gera selo criptográfico tamper-seal
  v_tamper_seal := md5(p_referrer_id::text || ':' || v_tokens_amount || ':' || v_unlock_date::text || ':wider_secure_vesting_token');

  -- 3. Registra indicação
  INSERT INTO public.affiliate_referrals (
    referrer_id,
    referred_user_id,
    referred_store_id,
    referral_code,
    referral_type,
    tokens_awarded,
    vesting_unlock_date,
    status,
    tamper_seal,
    metadata
  ) VALUES (
    p_referrer_id,
    p_referred_user_id,
    p_referred_store_id,
    p_referral_code,
    p_referral_type,
    v_tokens_amount,
    v_unlock_date,
    'pending_vesting',
    v_tamper_seal,
    jsonb_build_object('rule_key', COALESCE(v_rule.rule_key, 'default'), 'vesting_days', v_vesting_days)
  ) RETURNING id INTO v_referral_id;

  -- 4. Atualiza carteira do usuário (garantindo que existe)
  INSERT INTO public.user_token_wallets (user_id, balance, lifetime_earned, balance_pending_maturity, vesting_unlock_date)
  VALUES (p_referrer_id, 0, v_tokens_amount, v_tokens_amount, v_unlock_date)
  ON CONFLICT (user_id) DO UPDATE SET
    balance_pending_maturity = COALESCE(user_token_wallets.balance_pending_maturity, 0) + v_tokens_amount,
    lifetime_earned = COALESCE(user_token_wallets.lifetime_earned, 0) + v_tokens_amount,
    vesting_unlock_date = GREATEST(COALESCE(user_token_wallets.vesting_unlock_date, NOW()), v_unlock_date),
    updated_at = NOW()
  RETURNING id, balance_pending_maturity INTO v_wallet_id, v_current_pending;

  RETURN jsonb_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'tokens_awarded', v_tokens_amount,
    'vesting_unlock_date', v_unlock_date,
    'balance_pending_maturity', v_current_pending
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Stored Procedure ACID: Solicitação de Abatimento de Fatura com Tokens
CREATE OR REPLACE FUNCTION public.request_invoice_token_discount(
  p_store_id UUID,
  p_invoice_id UUID,
  p_tokens_amount INT,
  p_cents_per_thousand_tokens INT DEFAULT 50 -- R$ 0,50 por 1.000 tokens (R$ 50,00 por 1M)
) RETURNS JSONB AS $$
DECLARE
  v_store_wallet RECORD;
  v_invoice RECORD;
  v_discount_cents INT;
BEGIN
  -- 1. Verifica carteira da loja
  SELECT * INTO v_store_wallet FROM public.store_token_wallets WHERE store_id = p_store_id;
  IF NOT FOUND OR v_store_wallet.balance < p_tokens_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo de tokens insuficiente na loja.');
  END IF;

  -- 2. Verifica fatura
  SELECT * INTO v_invoice FROM public.store_token_billing_invoices WHERE id = p_invoice_id AND store_id = p_store_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fatura não encontrada.');
  END IF;

  IF v_invoice.status = 'paid' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fatura já está quitada.');
  END IF;

  -- 3. Calcula desconto em centavos (não podendo exceder o total da fatura)
  v_discount_cents := (p_tokens_amount::numeric / 1000.0 * p_cents_per_thousand_tokens)::int;
  IF v_discount_cents > v_invoice.amount_cents THEN
    v_discount_cents := v_invoice.amount_cents;
  END IF;

  -- 4. Debita tokens da carteira da loja preventivamente
  UPDATE public.store_token_wallets
  SET 
    balance = balance - p_tokens_amount,
    lifetime_consumed = COALESCE(lifetime_consumed, 0) + p_tokens_amount,
    updated_at = NOW()
  WHERE store_id = p_store_id;

  -- 5. Atualiza fatura com status de desconto pendente de aprovação
  UPDATE public.store_token_billing_invoices
  SET 
    tokens_redeemed_for_discount = p_tokens_amount,
    discount_applied_cents = v_discount_cents,
    discount_status = 'pending',
    discount_notes = 'Solicitação de abatimento de ' || p_tokens_amount || ' tokens.'
  WHERE id = p_invoice_id;

  -- 6. Registra no ledger criptográfico
  INSERT INTO public.token_ledger_transactions (
    store_id,
    amount,
    balance_after,
    action_type,
    description,
    origin_type,
    origin_reference_id,
    tamper_seal
  ) VALUES (
    p_store_id,
    -p_tokens_amount,
    v_store_wallet.balance - p_tokens_amount,
    'invoice_discount_hold',
    'Tokens retidos para abatimento na fatura ' || COALESCE(v_invoice.invoice_number, p_invoice_id::text),
    'invoice_discount',
    p_invoice_id::text,
    md5(p_store_id::text || ':' || p_invoice_id::text || ':' || p_tokens_amount || ':hold')
  );

  RETURN jsonb_build_object(
    'success', true,
    'discount_cents', v_discount_cents,
    'tokens_debited', p_tokens_amount,
    'remaining_invoice_cents', v_invoice.amount_cents - v_discount_cents
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Stored Procedure ACID: Conciliação / Aprovação de Abatimento pelo Super Admin
CREATE OR REPLACE FUNCTION public.approve_invoice_token_discount(
  p_invoice_id UUID,
  p_admin_id UUID,
  p_approved BOOLEAN,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_invoice RECORD;
BEGIN
  SELECT * INTO v_invoice FROM public.store_token_billing_invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fatura não encontrada.');
  END IF;

  IF v_invoice.discount_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta solicitação já foi processada.');
  END IF;

  IF p_approved THEN
    -- Aplica o abatimento definitivamente
    UPDATE public.store_token_billing_invoices
    SET 
      discount_status = 'approved',
      discount_approved_by = p_admin_id,
      discount_approved_at = NOW(),
      discount_notes = COALESCE(p_notes, 'Abatimento aprovado pelo Admin Master.')
    WHERE id = p_invoice_id;

    RETURN jsonb_build_object('success', true, 'status', 'approved');
  ELSE
    -- Rejeição: estorna os tokens de volta para a carteira da loja
    UPDATE public.store_token_wallets
    SET 
      balance = balance + v_invoice.tokens_redeemed_for_discount,
      lifetime_consumed = GREATEST(0, COALESCE(lifetime_consumed, 0) - v_invoice.tokens_redeemed_for_discount),
      updated_at = NOW()
    WHERE store_id = v_invoice.store_id;

    UPDATE public.store_token_billing_invoices
    SET 
      discount_status = 'rejected',
      discount_approved_by = p_admin_id,
      discount_approved_at = NOW(),
      discount_notes = COALESCE(p_notes, 'Abatimento recusado pelo Admin Master. Tokens estornados.')
    WHERE id = p_invoice_id;

    -- Registra estorno no ledger
    INSERT INTO public.token_ledger_transactions (
      store_id,
      amount,
      balance_after,
      action_type,
      description,
      origin_type,
      origin_reference_id,
      tamper_seal
    ) VALUES (
      v_invoice.store_id,
      v_invoice.tokens_redeemed_for_discount,
      (SELECT balance FROM public.store_token_wallets WHERE store_id = v_invoice.store_id),
      'invoice_discount_reverted',
      'Estorno de tokens por recusa de abatimento na fatura ' || p_invoice_id::text,
      'invoice_discount',
      p_invoice_id::text,
      md5(v_invoice.store_id::text || ':' || p_invoice_id::text || ':refund')
    );

    RETURN jsonb_build_object('success', true, 'status', 'rejected', 'refunded_tokens', v_invoice.tokens_redeemed_for_discount);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. RLS para creator_profiles e affiliate_reward_rules
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_reward_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- Leitura pública de creator_profiles com status ativo
DROP POLICY IF EXISTS "creator_profiles_public_read" ON public.creator_profiles;
CREATE POLICY "creator_profiles_public_read" ON public.creator_profiles
  FOR SELECT USING (status = 'active');

-- Autor gerencia seu creator_profile
DROP POLICY IF EXISTS "creator_profiles_owner_all" ON public.creator_profiles;
CREATE POLICY "creator_profiles_owner_all" ON public.creator_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Leitura pública de regras ativas
DROP POLICY IF EXISTS "affiliate_reward_rules_public_read" ON public.affiliate_reward_rules;
CREATE POLICY "affiliate_reward_rules_public_read" ON public.affiliate_reward_rules
  FOR SELECT USING (is_active = true);

-- Referrals lidos pelo próprio afiliado
DROP POLICY IF EXISTS "affiliate_referrals_owner_read" ON public.affiliate_referrals;
CREATE POLICY "affiliate_referrals_owner_read" ON public.affiliate_referrals
  FOR SELECT USING (auth.uid() = referrer_id);
