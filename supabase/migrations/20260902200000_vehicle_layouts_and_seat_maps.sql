-- ==============================================================================
-- MIGRAÇÃO: MODELOS DE FROTA & MAPA INTERATIVO DE ASSENTOS 2D (VEHICLE LAYOUTS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.vehicle_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    vehicle_type TEXT NOT NULL DEFAULT 'bus' CHECK (vehicle_type IN ('bus', 'van', 'plane', 'microbus')),
    total_capacity INTEGER NOT NULL DEFAULT 46,
    rows INTEGER NOT NULL DEFAULT 12,
    cols INTEGER NOT NULL DEFAULT 5,
    is_double_decker BOOLEAN NOT NULL DEFAULT false,
    deck1_label TEXT NOT NULL DEFAULT 'Piso Principal',
    deck2_label TEXT DEFAULT 'Piso Superior',
    seat_map JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_vehicle_layouts_store ON public.vehicle_layouts(store_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_layouts_type ON public.vehicle_layouts(vehicle_type);

-- RLS Deny-by-default
ALTER TABLE public.vehicle_layouts ENABLE ROW LEVEL SECURITY;

-- Equipe do workspace gerencia seus veículos
CREATE POLICY "Workspace members manage store vehicle layouts"
    ON public.vehicle_layouts
    FOR ALL
    TO authenticated
    USING (
        store_id IN (
            SELECT store_id FROM public.workspace_members WHERE profile_id = auth.uid()
        )
        OR created_by_profile_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin')
        )
    );

-- Leitura pública para reserva de poltronas na vitrine / grupos
CREATE POLICY "Public read vehicle layouts for bookings"
    ON public.vehicle_layouts
    FOR SELECT
    USING (true);
