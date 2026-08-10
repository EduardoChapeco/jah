-- ============================================================================
-- Jah Community Platform — Microfase B
-- Migration 0083: Events Extended Schema
-- ============================================================================
-- Adiciona colunas essenciais à tabela events sem quebrar dados existentes.
-- Todas as colunas são nullable ou têm DEFAULT seguro para compatibilidade.
-- ============================================================================

BEGIN;

-- 1. Novos campos de data/tempo
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo';

-- 2. Localização estruturada
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS address TEXT;

-- 3. Capacidade e ingressos
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS capacity INT,
  ADD COLUMN IF NOT EXISTS min_age INT,
  ADD COLUMN IF NOT EXISTS organizer_name TEXT,
  ADD COLUMN IF NOT EXISTS online_link TEXT;

-- 4. Classificação e atributos dinâmicos por nicho
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}';

-- 5. Índices para busca e descoberta
CREATE INDEX IF NOT EXISTS events_event_date_idx ON public.events (event_date DESC);
CREATE INDEX IF NOT EXISTS events_tags_idx ON public.events USING GIN (tags);
CREATE INDEX IF NOT EXISTS events_status_store_idx ON public.events (store_id, status);

-- 6. FTS index para busca federada
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('portuguese',
        coalesce(title, '') || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(location, '') || ' ' ||
        coalesce(address, '') || ' ' ||
        coalesce(organizer_name, '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS events_fts_idx ON public.events USING GIN (search_vector);

-- 7. Atualizar trigger updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'events_updated_at'
  ) THEN
    CREATE TRIGGER events_updated_at
      BEFORE UPDATE ON public.events
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

COMMIT;
