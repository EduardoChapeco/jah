-- ==============================================================================
-- MIGRATION: 20260908120000_classified_boost_payments.sql
-- Description:
--   Cria a tabela classified_boost_payments para registrar financeiramente
--   cada transação de impulsionamento de anúncio classificado.
--   O boost só é ativado no anúncio APÓS confirmação de pagamento.
--   RLS: dono do anúncio + admins da plataforma.
-- ==============================================================================

-- 1. TABELA PRINCIPAL
CREATE TABLE IF NOT EXISTS public.classified_boost_payments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classified_id    uuid NOT NULL REFERENCES public.classifieds(id) ON DELETE CASCADE,
  profile_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Plano de boost
  plan_days        integer NOT NULL CHECK (plan_days IN (7, 15, 30)),
  plan_name        text NOT NULL,
  amount_cents     integer NOT NULL CHECK (amount_cents > 0),

  -- Provedor de pagamento
  provider         text NOT NULL DEFAULT 'manual', -- 'asaas' | 'stripe' | 'manual'
  provider_ref     text,          -- ID externo da cobrança no provider
  provider_payload jsonb,         -- resposta raw do provider (para auditoria)

  -- Estado da transação
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'expired')),

  -- Dados de pagamento PIX (Asaas)
  pix_qr_code      text,          -- QR code base64 para exibição
  pix_copy_paste   text,          -- Código copia-e-cola PIX
  payment_link     text,          -- Link de pagamento (Stripe Checkout / Asaas)

  -- Timestamps
  expires_at       timestamptz,   -- Expiração do link/QR
  paid_at          timestamptz,
  activated_at     timestamptz,   -- Quando o boost foi ativado no anúncio
  failed_at        timestamptz,
  failure_reason   text,

  -- Auditoria
  confirmed_by     uuid REFERENCES public.profiles(id), -- admin que confirmou manualmente
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- 2. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_cbp_classified_id ON public.classified_boost_payments (classified_id);
CREATE INDEX IF NOT EXISTS idx_cbp_profile_id    ON public.classified_boost_payments (profile_id);
CREATE INDEX IF NOT EXISTS idx_cbp_status        ON public.classified_boost_payments (status);
CREATE INDEX IF NOT EXISTS idx_cbp_created_at    ON public.classified_boost_payments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cbp_provider_ref  ON public.classified_boost_payments (provider_ref) WHERE provider_ref IS NOT NULL;

-- 3. RLS DENY-BY-DEFAULT
ALTER TABLE public.classified_boost_payments ENABLE ROW LEVEL SECURITY;

-- Dono do anúncio vê seus próprios pagamentos de boost
DROP POLICY IF EXISTS "Owner sees own boost payments" ON public.classified_boost_payments;
CREATE POLICY "Owner sees own boost payments"
  ON public.classified_boost_payments FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Dono pode criar (INSERT) — controlado pelo BFF
DROP POLICY IF EXISTS "Owner can insert boost payment" ON public.classified_boost_payments;
CREATE POLICY "Owner can insert boost payment"
  ON public.classified_boost_payments FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- Admins e serviço podem fazer tudo (para webhook e confirmação manual)
DROP POLICY IF EXISTS "Service role full access boost payments" ON public.classified_boost_payments;
CREATE POLICY "Service role full access boost payments"
  ON public.classified_boost_payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. TRIGGER UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_cbp_modtime()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_cbp_modtime ON public.classified_boost_payments;
CREATE TRIGGER trigger_cbp_modtime
  BEFORE UPDATE ON public.classified_boost_payments
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_cbp_modtime();

-- 5. COMENTÁRIOS DE DOMÍNIO
COMMENT ON TABLE public.classified_boost_payments IS
  'Registro financeiro de cada transação de impulsionamento (boost) de anúncio classificado. O boost no anúncio só é ativado após status = paid.';
COMMENT ON COLUMN public.classified_boost_payments.provider IS
  'asaas = PIX/boleto/cartão via Asaas; stripe = cartão internacional via Stripe; manual = confirmação manual pelo admin.';
COMMENT ON COLUMN public.classified_boost_payments.status IS
  'pending = aguardando pagamento; paid = pago e boost ativo; failed = falha; refunded = estornado; expired = link expirado.';
