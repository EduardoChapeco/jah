-- ==============================================================================
-- MIGRAÇÃO: CAIXA PRÓPRIO DA VIAGEM & LIVRO CAIXA EM TRÂNSITO
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.group_tour_cash_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tourism_experiences(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('inflow', 'outflow')),
    category TEXT NOT NULL DEFAULT 'other',
    description TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'pix', 'corporate_card', 'other')),
    receipt_url TEXT,
    registered_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tour_cash_tour ON public.group_tour_cash_ledger(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_cash_store ON public.group_tour_cash_ledger(store_id);

-- RLS
ALTER TABLE public.group_tour_cash_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members manage tour cash ledger"
    ON public.group_tour_cash_ledger
    FOR ALL
    TO authenticated
    USING (
        store_id IN (
            SELECT store_id FROM public.workspace_members WHERE profile_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin')
        )
    );
