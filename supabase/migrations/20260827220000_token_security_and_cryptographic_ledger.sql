-- ============================================================================
-- WIDER PLATFORM: PROTOCOLO DE SEGURANÇA BANCÁRIA, LEDGER CRIPTOGRÁFICO & ANTI-INJEÇÃO DE TOKENS
-- Proof of Solvency, Selo Criptográfico SHA-256, Imutabilidade Forense e Conciliação Zero-Divergência
-- ============================================================================

-- 1. Tabela de Logs de Auditoria de Segurança & Tentativas de Fraude
CREATE TABLE IF NOT EXISTS public.security_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'emergency')),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Adicionar Colunas de Segurança e Bloqueio Cautelar na Carteira de Lojas
ALTER TABLE public.store_token_wallets
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lock_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_reconciled_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS last_integrity_hash TEXT,
  ADD COLUMN IF NOT EXISTS total_master_grants INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_gateway_purchases INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_verified_bounties INTEGER NOT NULL DEFAULT 0;

-- 3. Adicionar Selo Criptográfico no Ledger de Transações (Cadeia de Integridade Estilo Blockchain)
ALTER TABLE public.token_ledger_transactions
  ADD COLUMN IF NOT EXISTS tamper_seal TEXT,
  ADD COLUMN IF NOT EXISTS prev_seal TEXT,
  ADD COLUMN IF NOT EXISTS origin_type TEXT NOT NULL DEFAULT 'system_operation' CHECK (origin_type IN (
    'master_admin_grant',
    'gateway_confirmed_payment',
    'kyc_verified_referral_bounty',
    'verified_order_cashback',
    'system_burn_service',
    'reversal_refund'
  )),
  ADD COLUMN IF NOT EXISTS origin_reference_id TEXT, -- ID do pagamento gateway, ID do Master ou ID do Usuário KYC
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- 4. Função Trigger: Proibir Terminantemente UPDATE ou DELETE em Tabelas de Ledger (Imutabilidade Absoluta)
CREATE OR REPLACE FUNCTION public.enforce_ledger_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'VIOLAÇÃO DE SEGURANÇA: Registros do Ledger de Tokens são estritamente imutáveis e não podem ser alterados ou deletados.';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_immutable_token_ledger ON public.token_ledger_transactions;
CREATE TRIGGER trg_immutable_token_ledger
BEFORE UPDATE OR DELETE ON public.token_ledger_transactions
FOR EACH ROW EXECUTE FUNCTION public.enforce_ledger_immutability();

DROP TRIGGER IF EXISTS trg_immutable_user_token_ledger ON public.user_token_transactions;
CREATE TRIGGER trg_immutable_user_token_ledger
BEFORE UPDATE OR DELETE ON public.user_token_transactions
FOR EACH ROW EXECUTE FUNCTION public.enforce_ledger_immutability();

-- 5. Função de Cálculo do Selo Criptográfico SHA-256 para cada Transação
CREATE OR REPLACE FUNCTION public.generate_token_transaction_seal(
  p_tx_id UUID,
  p_store_id UUID,
  p_amount INTEGER,
  p_balance_after INTEGER,
  p_action_type TEXT,
  p_created_at TIMESTAMPTZ,
  p_prev_seal TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN encode(
    digest(
      p_tx_id::text || '|' ||
      p_store_id::text || '|' ||
      p_amount::text || '|' ||
      p_balance_after::text || '|' ||
      p_action_type || '|' ||
      p_created_at::text || '|' ||
      COALESCE(p_prev_seal, 'GENESIS_WIDER_VAULT_2026'),
      'sha256'
    ),
    'hex'
  );
END;
$$;

-- 6. Stored Procedure ACID: Conciliação & Verificação Forense de Carteira (Anti-Hacker / Zero-Divergence)
CREATE OR REPLACE FUNCTION public.verify_and_reconcile_store_wallet(p_store_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet RECORD;
  v_calculated_balance INTEGER := 0;
  v_total_credits INTEGER := 0;
  v_total_debits INTEGER := 0;
  v_tx RECORD;
  v_prev_seal TEXT := 'GENESIS_WIDER_VAULT_2026';
  v_calculated_seal TEXT;
  v_chain_broken BOOLEAN := false;
  v_divergence_amount INTEGER := 0;
BEGIN
  -- 1. Obter carteira
  SELECT * INTO v_wallet
  FROM public.store_token_wallets
  WHERE store_id = p_store_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'WALLET_NOT_FOUND');
  END IF;

  -- 2. Percorrer todo o histórico do ledger cronologicamente e recalcular saldo
  FOR v_tx IN (
    SELECT * FROM public.token_ledger_transactions
    WHERE store_id = p_store_id
    ORDER BY created_at ASC, id ASC
  ) LOOP
    IF v_tx.amount > 0 THEN
      v_total_credits := v_total_credits + v_tx.amount;
    ELSE
      v_total_debits := v_total_debits + ABS(v_tx.amount);
    END IF;

    v_calculated_balance := v_calculated_balance + v_tx.amount;

    -- Validar selo criptográfico se existir
    IF v_tx.tamper_seal IS NOT NULL THEN
      v_calculated_seal := public.generate_token_transaction_seal(
        v_tx.id, v_tx.store_id, v_tx.amount, v_tx.balance_after, v_tx.action_type, v_tx.created_at, v_tx.prev_seal
      );
      IF v_tx.tamper_seal <> v_calculated_seal THEN
        v_chain_broken := true;
      END IF;
    END IF;

    v_prev_seal := v_tx.tamper_seal;
  END LOOP;

  -- 3. Comparar Saldo Calculado vs Saldo Gravado na Carteira
  v_divergence_amount := v_wallet.balance - v_calculated_balance;

  -- Se houver divergência ou quebra de selo, BLOQUEAR CARTEIRA AUTOMATICAMENTE
  IF v_divergence_amount <> 0 OR v_chain_broken THEN
    UPDATE public.store_token_wallets
    SET
      is_locked = true,
      lock_reason = 'DIVERGÊNCIA DETECTADA: Saldo na carteira (' || v_wallet.balance || ') difere do somatório auditado (' || v_calculated_balance || '). Cadeia criptográfica: ' || CASE WHEN v_chain_broken THEN 'ROMPIDA' ELSE 'OK' END,
      last_reconciled_at = timezone('utc'::text, now())
    WHERE store_id = p_store_id;

    -- Inserir Alerta Crítico de Segurança
    INSERT INTO public.security_audit_events (
      severity,
      event_type,
      entity_type,
      entity_id,
      details
    )
    VALUES (
      'critical',
      'WALLET_INTEGRITY_COMPROMISED',
      'store_token_wallet',
      p_store_id,
      jsonb_build_object(
        'store_id', p_store_id,
        'wallet_balance', v_wallet.balance,
        'calculated_balance', v_calculated_balance,
        'divergence', v_divergence_amount,
        'chain_broken', v_chain_broken
      )
    );

    RETURN jsonb_build_object(
      'success', false,
      'is_valid', false,
      'status', 'LOCKED_DUE_TO_DIVERGENCE',
      'wallet_balance', v_wallet.balance,
      'audited_balance', v_calculated_balance,
      'divergence', v_divergence_amount,
      'chain_broken', v_chain_broken
    );
  END IF;

  -- Se tudo for 100% válido, atualizar carimbo de conciliação
  UPDATE public.store_token_wallets
  SET
    last_reconciled_at = timezone('utc'::text, now()),
    is_locked = false,
    lock_reason = NULL
  WHERE store_id = p_store_id;

  RETURN jsonb_build_object(
    'success', true,
    'is_valid', true,
    'status', 'CONCILIATED_PERFECT',
    'wallet_balance', v_wallet.balance,
    'total_credits_audited', v_total_credits,
    'total_debits_audited', v_total_debits,
    'divergence', 0,
    'chain_broken', false,
    'last_reconciled_at', timezone('utc'::text, now())
  );
END;
$$;

-- 7. Stored Procedure: Conciliação Global da Plataforma (Proof of Solvency Master)
CREATE OR REPLACE FUNCTION public.reconcile_platform_token_solvency()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store RECORD;
  v_total_wallets INTEGER := 0;
  v_total_circulating INTEGER := 0;
  v_total_audited_balance INTEGER := 0;
  v_tampered_count INTEGER := 0;
  v_res JSONB;
BEGIN
  FOR v_store IN SELECT id FROM public.stores LOOP
    v_total_wallets := v_total_wallets + 1;
    v_res := public.verify_and_reconcile_store_wallet(v_store.id);

    IF (v_res->>'is_valid')::boolean = false THEN
      v_tampered_count := v_tampered_count + 1;
    END IF;
  END LOOP;

  SELECT COALESCE(SUM(balance), 0) INTO v_total_circulating FROM public.store_token_wallets;
  SELECT COALESCE(SUM(amount), 0) INTO v_total_audited_balance FROM public.token_ledger_transactions;

  RETURN jsonb_build_object(
    'success', true,
    'total_wallets_audited', v_total_wallets,
    'total_circulating_in_wallets', v_total_circulating,
    'total_audited_in_ledger', v_total_audited_balance,
    'net_divergence', (v_total_circulating - v_total_audited_balance),
    'tampered_wallets_found', v_tampered_count,
    'solvency_status', CASE WHEN v_tampered_count = 0 AND (v_total_circulating - v_total_audited_balance) = 0 THEN '100%_SECURE_SOLVENT' ELSE 'REQUIRES_INVESTIGATION' END,
    'audit_timestamp', timezone('utc'::text, now())
  );
END;
$$;

-- Habilitar RLS Rígido em Eventos de Segurança
ALTER TABLE public.security_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view security events" ON public.security_audit_events;
CREATE POLICY "Admins can view security events" ON public.security_audit_events
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin'))
  );
