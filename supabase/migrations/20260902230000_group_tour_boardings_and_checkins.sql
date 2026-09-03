-- ==============================================================================
-- MIGRAÇÃO: GESTÃO DE PONTOS DE EMBARQUE & CHECK-IN EM TEMPO REAL
-- ==============================================================================

-- 1. Pontos de Embarque da Excursão
CREATE TABLE IF NOT EXISTS public.group_tour_boardings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tourism_experiences(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    point_name TEXT NOT NULL,
    scheduled_time TIME NOT NULL,
    address TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_tour_boardings_tour ON public.group_tour_boardings(tour_id);

-- 2. Logs de Check-in em Tempo Real (Guia / Motorista)
CREATE TABLE IF NOT EXISTS public.passenger_checkin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tourism_experiences(id) ON DELETE CASCADE,
    seat_number INTEGER NOT NULL,
    passenger_name TEXT NOT NULL,
    checked_in_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    boarding_point_id UUID REFERENCES public.group_tour_boardings(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'no_show', 'cancelled')),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_passenger_checkin_tour ON public.passenger_checkin_logs(tour_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_passenger_checkin_seat ON public.passenger_checkin_logs(tour_id, seat_number);

-- RLS Deny-by-default
ALTER TABLE public.group_tour_boardings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passenger_checkin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members manage tour boardings"
    ON public.group_tour_boardings
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

CREATE POLICY "Workspace members manage checkin logs"
    ON public.passenger_checkin_logs
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
