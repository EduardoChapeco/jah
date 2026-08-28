-- ============================================================================
-- WIDER PLATFORM: DUAL-BUCKET TOKENOMICS, SMART BILLING (META ADS STYLE) & HARD-COST PROTECTION
-- Blindagem de Custos Reais de APIs (NF-e, IA, WhatsApp), Faturamento Automático por Limite e Auditoria
-- ============================================================================

-- 1. Evolução da Carteira de Tokens de Lojas com Buckets Separados (Mídia vs Infra/APIs)
ALTER TABLE public.store_token_wallets
  ADD COLUMN IF NOT EXISTS promotional_balance INTEGER NOT NULL DEFAULT 0, -- Tokens de Bounties, Mídia e Radar (Custo Marginal Zero)
  ADD COLUMN IF NOT EXISTS purchased_balance INTEGER NOT NULL DEFAULT 50000, -- Tokens Pagos com R$ Real (Lastreados para NF-e, IA e APIs)
  ADD COLUMN IF NOT EXISTS billing_mode TEXT NOT NULL DEFAULT 'prepaid' CHECK (billing_mode IN ('prepaid', 'auto_threshold', 'monthly_invoice')),
  ADD COLUMN IF NOT EXISTS auto_recharge_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_recharge_threshold_tokens INTEGER DEFAULT 20000, -- Quando cair abaixo de 20k tokens, recarrega
  ADD COLUMN IF NOT EXISTS auto_recharge_package_id TEXT DEFAULT 'pkg_starter',
  ADD COLUMN IF NOT EXISTS payment_customer_id TEXT, -- ID do cliente no gateway (Asaas/Stripe/Pagarme)
  ADD COLUMN IF NOT EXISTS card_last4 TEXT,
  ADD COLUMN IF NOT EXISTS card_brand TEXT,
  ADD COLUMN IF NOT EXISTS spending_limit_monthly_brl NUMERIC(10, 2) DEFAULT 500.00;

-- 2. Tabela de Faturas & Recargas Automáticas por Limite de Gastos (Estilo Meta Ads Threshold)
CREATE TABLE IF NOT EXISTS public.store_token_billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL, -- Valor em centavos de Real (BRL)
  tokens_credited INTEGER NOT NULL,
  tokens_package_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('credit_card_auto', 'pix_instant', 'invoice_boleto')),
  gateway_payment_id TEXT,
  gateway_invoice_url TEXT,
  period_start TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  period_end TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_token_invoices_store ON public.store_token_billing_invoices(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_invoices_status ON public.store_token_billing_invoices(status);

-- 3. Stored Procedure: Consumo Inteligente com Blindagem de Custos Externos (Hard-Cost Guard)
CREATE OR REPLACE FUNCTION public.consume_store_tokens_scoped(
  p_store_id UUID,
  p_tokens INTEGER,
  p_service_category TEXT, -- 'internal_media', 'radar_boost', 'curation_badge', 'fiscal_nfe', 'heavy_ia_llm', 'whatsapp_api'
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet RECORD;
  v_is_hard_cost BOOLEAN := false;
  v_promo_deduct INTEGER := 0;
  v_purchased_deduct INTEGER := 0;
  v_new_promo INTEGER;
  v_new_purchased INTEGER;
  v_new_total INTEGER;
BEGIN
  -- 1. Determinar se o serviço possui custo real de API externa de terceiros
  -- Serviços de Hard Cost (NF-e, IA pesada, WhatsApp) NUNCA podem consumir saldo promocional gratuito!
  IF p_service_category IN ('fiscal_nfe', 'heavy_ia_llm', 'whatsapp_api', 'sms_gateway') THEN
    v_is_hard_cost := true;
  END IF;

  SELECT * INTO v_wallet
  FROM public.store_token_wallets
  WHERE store_id = p_store_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'WALLET_NOT_FOUND');
  END IF;

  -- 2. Verificação de Saldo por Categoria de Serviço
  IF v_is_hard_cost THEN
    -- Exige estritamente saldo comprado com R$ real
    IF v_wallet.purchased_balance < p_tokens THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'INSUFFICIENT_PURCHASED_TOKENS',
        'message', 'Este serviço (NF-e / IA Avançada / WhatsApp) requer tokens de infraestrutura pagos. Seu saldo promocional de mídia não pode ser utilizado para custos de terceiros.',
        'purchased_balance', v_wallet.purchased_balance,
        'tokens_required', p_tokens
      );
    END IF;

    v_purchased_deduct := p_tokens;
    v_promo_deduct := 0;
  ELSE
    -- Serviços internos (Radar, Feed, Curadoria): queima primeiro o saldo promocional, depois o comprado
    IF (v_wallet.promotional_balance + v_wallet.purchased_balance) < p_tokens THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'INSUFFICIENT_TOTAL_TOKENS',
        'message', 'Saldo total insuficiente de tokens.',
        'total_balance', (v_wallet.promotional_balance + v_wallet.purchased_balance),
        'tokens_required', p_tokens
      );
    END IF;

    IF v_wallet.promotional_balance >= p_tokens THEN
      v_promo_deduct := p_tokens;
      v_purchased_deduct := 0;
    ELSE
      v_promo_deduct := v_wallet.promotional_balance;
      v_purchased_deduct := p_tokens - v_wallet.promotional_balance;
    END IF;
  END IF;

  -- 3. Atualizar saldos atômicos
  v_new_promo := v_wallet.promotional_balance - v_promo_deduct;
  v_new_purchased := v_wallet.purchased_balance - v_purchased_deduct;
  v_new_total := v_new_promo + v_new_purchased;

  UPDATE public.store_token_wallets
  SET
    promotional_balance = v_new_promo,
    purchased_balance = v_new_purchased,
    balance = v_new_total,
    lifetime_consumed = v_wallet.lifetime_consumed + p_tokens,
    updated_at = timezone('utc'::text, now())
  WHERE store_id = p_store_id;

  -- 4. Gravar no ledger imutável com carimbo da categoria
  INSERT INTO public.token_ledger_transactions (
    store_id,
    amount,
    balance_after,
    action_type,
    origin_type,
    description,
    metadata
  )
  VALUES (
    p_store_id,
    -p_tokens,
    v_new_total,
    'system_burn_service',
    'system_burn_service',
    p_description,
    p_metadata || jsonb_build_object(
      'service_category', p_service_category,
      'is_hard_cost', v_is_hard_cost,
      'promo_deducted', v_promo_deduct,
      'purchased_deducted', v_purchased_deduct
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'tokens_consumed', p_tokens,
    'service_category', p_service_category,
    'new_total_balance', v_new_total,
    'new_promotional_balance', v_new_promo,
    'new_purchased_balance', v_new_purchased
  );
END;
$$;

-- Habilitar RLS em Faturas
ALTER TABLE public.store_token_billing_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store members can view invoices" ON public.store_token_billing_invoices;
CREATE POLICY "Store members can view invoices" ON public.store_token_billing_invoices
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM public.workspace_members WHERE profile_id = auth.uid()
    )
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin'))
  );
