-- ==============================================================================
-- MIGRAÇÃO: VÍNCULO DE LAYOUT DE VEÍCULO & GESTÃO DE CUSTOS DE EXCURSÃO
-- ==============================================================================

-- 1. Adicionar vehicle_layout_id em tourism_experiences se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tourism_experiences'
        AND column_name = 'vehicle_layout_id'
    ) THEN
        ALTER TABLE public.tourism_experiences
        ADD COLUMN vehicle_layout_id UUID REFERENCES public.vehicle_layouts(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Tabela de Custos Operacionais da Excursão (Orçamento & Break-even)
CREATE TABLE IF NOT EXISTS public.group_tour_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tourism_experiences(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('transport', 'hotel', 'insurance', 'tickets', 'guide', 'food', 'other')),
    description TEXT NOT NULL,
    cost_cents INTEGER NOT NULL DEFAULT 0,
    is_fixed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de busca rápida
CREATE INDEX IF NOT EXISTS idx_group_tour_costs_tour ON public.group_tour_costs(tour_id);

-- RLS Deny-by-default
ALTER TABLE public.group_tour_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members manage group tour costs"
    ON public.group_tour_costs
    FOR ALL
    TO authenticated
    USING (
        tour_id IN (
            SELECT id FROM public.tourism_experiences WHERE store_id IN (
                SELECT store_id FROM public.workspace_members WHERE profile_id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin')
        )
    );

CREATE POLICY "Public read group tour costs deny"
    ON public.group_tour_costs
    FOR SELECT
    TO anon
    USING (false);
