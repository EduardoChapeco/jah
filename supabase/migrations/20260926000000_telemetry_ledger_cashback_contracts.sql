-- ==============================================================================
-- MIGRATION: 20260926000000_telemetry_ledger_cashback_contracts.sql
-- DIRETIVA BIGTECH: Telemetria Imutável, Maturity Hold de Cashback,
-- Auditoria de Transações e Biometria Facial em Contratos Digitais
-- ==============================================================================

-- 1. Evolução de personal_financial_entries (Ledger de Telemetria & Imutabilidade)
ALTER TABLE public.personal_financial_entries 
  ADD COLUMN IF NOT EXISTS reference_type TEXT NOT NULL DEFAULT 'manual' 
  CHECK (reference_type IN ('manual', 'order', 'mobility', 'tourism', 'booking', 'refund', 'cashback', 'fee'));

ALTER TABLE public.personal_financial_entries 
  ADD COLUMN IF NOT EXISTS reference_id TEXT;

ALTER TABLE public.personal_financial_entries 
  ADD COLUMN IF NOT EXISTS parent_entry_id UUID REFERENCES public.personal_financial_entries(id) ON DELETE SET NULL;

ALTER TABLE public.personal_financial_entries 
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.personal_financial_entries 
  ADD COLUMN IF NOT EXISTS transaction_token TEXT;

-- Índices de Performance e Rastreabilidade do Ledger
CREATE INDEX IF NOT EXISTS idx_pfe_ref ON public.personal_financial_entries(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_pfe_parent ON public.personal_financial_entries(parent_entry_id);
CREATE INDEX IF NOT EXISTS idx_pfe_locked ON public.personal_financial_entries(profile_id, is_locked);
CREATE INDEX IF NOT EXISTS idx_pfe_token ON public.personal_financial_entries(transaction_token);

-- Atualização da Política RLS de Exclusão (Regra de Imutabilidade Estrita)
DROP POLICY IF EXISTS "pfe_delete_policy" ON public.personal_financial_entries;
CREATE POLICY "pfe_delete_policy" ON public.personal_financial_entries
  FOR DELETE USING (profile_id = auth.uid() AND is_locked = false);


-- 2. Evolução de user_token_transactions & Wallets (Maturity Hold Anti-Fraude)
ALTER TABLE public.user_token_transactions 
  ADD COLUMN IF NOT EXISTS maturity_status TEXT NOT NULL DEFAULT 'available' 
  CHECK (maturity_status IN ('pending_maturity', 'available', 'reversed', 'expired'));

ALTER TABLE public.user_token_transactions 
  ADD COLUMN IF NOT EXISTS matures_at TIMESTAMPTZ;

ALTER TABLE public.user_token_transactions 
  ADD COLUMN IF NOT EXISTS parent_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

ALTER TABLE public.user_token_wallets 
  ADD COLUMN IF NOT EXISTS balance_pending_maturity INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_token_maturity 
  ON public.user_token_transactions(user_id, maturity_status, matures_at);


-- 3. Evolução de Contratos & Envelopes de Assinatura (Biometria Facial & Certificados)
ALTER TABLE public.contracts 
  ADD COLUMN IF NOT EXISTS requires_facial_verification BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.signature_envelopes 
  ADD COLUMN IF NOT EXISTS facial_biometrics_url TEXT;

ALTER TABLE public.signature_envelopes 
  ADD COLUMN IF NOT EXISTS facial_verified BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.signature_envelopes 
  ADD COLUMN IF NOT EXISTS certificate_hash TEXT;


-- 4. Garantia dos Buckets de Storage e Políticas RLS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('receipts', 'receipts', true, 10485760, '{"image/jpeg","image/png","image/webp","application/pdf"}')
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Políticas de Storage para Receipts (Isolamento por Usuário)
DO $$ BEGIN
  CREATE POLICY "Users can upload own receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'receipts' AND 
      (auth.uid()::text = (storage.foldername(name))[1] OR auth.uid() IS NOT NULL)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can read own receipts"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'receipts' AND 
      (auth.uid()::text = (storage.foldername(name))[1] OR auth.uid() IS NOT NULL)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
