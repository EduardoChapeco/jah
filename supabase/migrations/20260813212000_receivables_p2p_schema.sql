-- Migration 0088: Receivables & P2P Billing
-- Protocolo V3 - Gestão de Parcelas, Cobranças e Comprovantes

CREATE TABLE IF NOT EXISTS public.receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  creditor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  debtor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  total_cents BIGINT NOT NULL,
  installments_count INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled', 'defaulted', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.receivable_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receivable_id UUID REFERENCES public.receivables(id) ON DELETE CASCADE NOT NULL,
  installment_number INT NOT NULL,
  amount_cents BIGINT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'late', 'waived', 'cancelled')),
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  payment_proof_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (receivable_id, installment_number)
);

ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivable_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receivables_participants_policy" ON public.receivables
  FOR ALL USING (creditor_id = auth.uid() OR debtor_id = auth.uid());

CREATE POLICY "installments_participants_policy" ON public.receivable_installments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.receivables r
      WHERE r.id = receivable_installments.receivable_id
      AND (r.creditor_id = auth.uid() OR r.debtor_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS receivables_creditor_idx ON public.receivables(creditor_id);
CREATE INDEX IF NOT EXISTS receivables_debtor_idx ON public.receivables(debtor_id);
CREATE INDEX IF NOT EXISTS installments_due_date_idx ON public.receivable_installments(due_date);
