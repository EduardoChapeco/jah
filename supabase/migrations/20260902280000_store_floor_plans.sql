-- Migration: 20260902280000_store_floor_plans.sql
-- Gastronomia & Restaurantes — Persistência Real da Planta do Salão de Mesas 2D

CREATE TABLE IF NOT EXISTS public.store_floor_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Salão Principal',
    grid_cols INT NOT NULL DEFAULT 4,
    grid_rows INT NOT NULL DEFAULT 3,
    tables JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de SalonTable [{ id, label, seats, col, row, shape }]
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT store_floor_plans_store_name_key UNIQUE (store_id, name)
);

CREATE INDEX IF NOT EXISTS idx_store_floor_plans_store ON public.store_floor_plans(store_id);

-- RLS Deny-by-default
ALTER TABLE public.store_floor_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_floor_plans_read_policy" ON public.store_floor_plans;
CREATE POLICY "store_floor_plans_read_policy" ON public.store_floor_plans
    FOR SELECT USING (true); -- Permitir leitura para clientes visualizarem o salão em reservas e staff operar

DROP POLICY IF EXISTS "store_floor_plans_staff_write_policy" ON public.store_floor_plans;
CREATE POLICY "store_floor_plans_staff_write_policy" ON public.store_floor_plans
    FOR ALL USING (public.is_store_staff(store_id));
