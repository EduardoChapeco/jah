-- ==============================================================================
-- MIGRAÇÃO: BANCO UNIFICADO DE DESTINOS E HOTÉIS/RESORTS (TURISMO & VIAGENS)
-- ==============================================================================

-- 1. TABELA DE DESTINOS TURÍSTICOS
CREATE TABLE IF NOT EXISTS public.destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT,
    country TEXT NOT NULL DEFAULT 'Brasil',
    region TEXT,
    description TEXT,
    best_season TEXT,
    iata_gateway TEXT,
    weather_summary TEXT,
    cover_image_url TEXT,
    gallery_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de performance para destinos
CREATE INDEX IF NOT EXISTS idx_destinations_store_id ON public.destinations(store_id);
CREATE INDEX IF NOT EXISTS idx_destinations_name ON public.destinations(name);
CREATE INDEX IF NOT EXISTS idx_destinations_is_active ON public.destinations(is_active);

-- RLS para Destinos
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- Leitura pública para destinos ativos
CREATE POLICY "Public read active destinations"
    ON public.destinations
    FOR SELECT
    USING (is_active = true);

-- Agência gerencia seus destinos
CREATE POLICY "Agency manage own destinations"
    ON public.destinations
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

-- 2. TABELA DE BANCO DE HOTÉIS, RESORTS & POUSADAS
CREATE TABLE IF NOT EXISTS public.hotels_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
    created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT NOT NULL DEFAULT 'Brasil',
    stars INTEGER NOT NULL DEFAULT 4,
    regime_options TEXT[] NOT NULL DEFAULT '{"All Inclusive"}'::text[],
    description TEXT,
    bio_bullets TEXT[] NOT NULL DEFAULT '{}'::text[],
    highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
    badges TEXT[] NOT NULL DEFAULT '{"Eco-friendly", "Pé na Areia"}'::text[],
    photos TEXT[] NOT NULL DEFAULT '{}'::text[],
    cover_photo_url TEXT,
    website TEXT,
    phone TEXT,
    internal_rating NUMERIC(3,1) NOT NULL DEFAULT 4.8,
    tags TEXT[] NOT NULL DEFAULT '{}'::text[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de performance para hotéis
CREATE INDEX IF NOT EXISTS idx_hotels_bank_store_id ON public.hotels_bank(store_id);
CREATE INDEX IF NOT EXISTS idx_hotels_bank_destination_id ON public.hotels_bank(destination_id);
CREATE INDEX IF NOT EXISTS idx_hotels_bank_name ON public.hotels_bank(name);
CREATE INDEX IF NOT EXISTS idx_hotels_bank_is_active ON public.hotels_bank(is_active);

-- RLS para Hotéis
ALTER TABLE public.hotels_bank ENABLE ROW LEVEL SECURITY;

-- Leitura pública para hotéis ativos
CREATE POLICY "Public read active hotels"
    ON public.hotels_bank
    FOR SELECT
    USING (is_active = true);

-- Agência gerencia seus hotéis
CREATE POLICY "Agency manage own hotels"
    ON public.hotels_bank
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
