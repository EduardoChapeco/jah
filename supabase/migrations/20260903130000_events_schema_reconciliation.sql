-- ==============================================================================
-- MIGRAÇÃO: RECONCILIAÇÃO CANÔNICA DE EVENTOS & ATRAÇÕES (SCHEMA SHIELD)
-- ==============================================================================

ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'shows',
    ADD COLUMN IF NOT EXISTS organizer_name TEXT,
    ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS capacity INTEGER,
    ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    ADD COLUMN IF NOT EXISTS address TEXT;

CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(store_id, category);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(store_id, event_date);
