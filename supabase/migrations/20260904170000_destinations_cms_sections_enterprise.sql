-- ==============================================================================
-- MIGRAÇÃO: EXPANSÃO ENTERPRISE DE DESTINOS TURÍSTICOS (CMS, SEÇÕES & MENSURAÇÃO)
-- ==============================================================================

-- 1. Adicionar colunas para localização canônica padronizada e mensuração
ALTER TABLE public.destinations 
    ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'SC',
    ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo (UTC-3)',
    ADD COLUMN IF NOT EXISTS climate_type TEXT DEFAULT 'Tropical / Subtropical',
    ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS attractions JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS reviews JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) NOT NULL DEFAULT 5.0,
    ADD COLUMN IF NOT EXISTS reviews_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS highlights TEXT[] NOT NULL DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS gastronomy_tip TEXT,
    ADD COLUMN IF NOT EXISTS travel_tip TEXT,
    ADD COLUMN IF NOT EXISTS seo_title TEXT,
    ADD COLUMN IF NOT EXISTS seo_description TEXT,
    ADD COLUMN IF NOT EXISTS seo_keywords TEXT[] NOT NULL DEFAULT '{}'::text[];

-- 2. Atualizar registros legados com defaults coerentes se vazios
UPDATE public.destinations
SET 
    city = COALESCE(NULLIF(city, ''), name),
    state = COALESCE(NULLIF(state, ''), NULLIF(region, ''), 'SC')
WHERE city = '' OR state = '';

-- 3. Índices de performance para filtros, mensuração e buscas analíticas
CREATE INDEX IF NOT EXISTS idx_destinations_city_state ON public.destinations(state, city);
CREATE INDEX IF NOT EXISTS idx_destinations_iata_gateway ON public.destinations(iata_gateway);
CREATE INDEX IF NOT EXISTS idx_destinations_tags ON public.destinations USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_destinations_sections ON public.destinations USING GIN (sections);
CREATE INDEX IF NOT EXISTS idx_destinations_avg_rating ON public.destinations(average_rating);
