-- Migration: 20260902270000_lawsuit_deadlines_and_calendar.sql
-- Módulo JUS & Advocacia 360° — Prazos Processuais Fatais, Agenda de Audiências e Controle de Preclusão

CREATE TABLE IF NOT EXISTS public.lawsuit_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lawsuit_id UUID REFERENCES public.mined_lawsuits(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    deadline_type TEXT NOT NULL DEFAULT 'manifestacao', -- 'contestacao', 'recurso', 'audiencia', 'pericia', 'manifestacao', 'cumprimento', 'pagamento', 'outro'
    due_date TIMESTAMPTZ NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal', -- 'normal', 'high', 'urgent', 'fatal'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'expired', 'cancelled'
    court_name TEXT,
    process_number TEXT,
    client_name TEXT,
    notes TEXT,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    protocol_receipt TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de alta performance para a esteira processual
CREATE INDEX IF NOT EXISTS idx_lawsuit_deadlines_store ON public.lawsuit_deadlines(store_id);
CREATE INDEX IF NOT EXISTS idx_lawsuit_deadlines_profile ON public.lawsuit_deadlines(profile_id);
CREATE INDEX IF NOT EXISTS idx_lawsuit_deadlines_lawsuit ON public.lawsuit_deadlines(lawsuit_id);
CREATE INDEX IF NOT EXISTS idx_lawsuit_deadlines_due_date ON public.lawsuit_deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_lawsuit_deadlines_status ON public.lawsuit_deadlines(status);
CREATE INDEX IF NOT EXISTS idx_lawsuit_deadlines_priority ON public.lawsuit_deadlines(priority);

-- RLS Deny-by-default estrito
ALTER TABLE public.lawsuit_deadlines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lawsuit_deadlines_staff_select" ON public.lawsuit_deadlines;
CREATE POLICY "lawsuit_deadlines_staff_select" ON public.lawsuit_deadlines
    FOR SELECT USING (
        auth.uid() = profile_id 
        OR (store_id IS NOT NULL AND public.is_store_staff(store_id))
    );

DROP POLICY IF EXISTS "lawsuit_deadlines_staff_insert" ON public.lawsuit_deadlines;
CREATE POLICY "lawsuit_deadlines_staff_insert" ON public.lawsuit_deadlines
    FOR INSERT WITH CHECK (
        auth.uid() = profile_id
    );

DROP POLICY IF EXISTS "lawsuit_deadlines_staff_update" ON public.lawsuit_deadlines;
CREATE POLICY "lawsuit_deadlines_staff_update" ON public.lawsuit_deadlines
    FOR UPDATE USING (
        auth.uid() = profile_id 
        OR (store_id IS NOT NULL AND public.is_store_staff(store_id))
    );

DROP POLICY IF EXISTS "lawsuit_deadlines_staff_delete" ON public.lawsuit_deadlines;
CREATE POLICY "lawsuit_deadlines_staff_delete" ON public.lawsuit_deadlines
    FOR DELETE USING (
        auth.uid() = profile_id 
        OR (store_id IS NOT NULL AND public.is_store_staff(store_id))
    );
