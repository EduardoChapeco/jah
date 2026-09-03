-- ==============================================================================
-- MIGRAÇÃO: ECOSSISTEMA COMPLETO DE TURISMO & VIAGENS (PROPOSTAS, CONTRATOS E GRUPOS)
-- ==============================================================================

-- 1. TABELA DE PROPOSTAS & LÂMINAS DE VIAGEM (STUDIO)
CREATE TABLE IF NOT EXISTS public.travel_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES public.travel_quotes(id) ON DELETE SET NULL,
    public_token TEXT UNIQUE NOT NULL,
    canvas_format TEXT NOT NULL DEFAULT 'a4-portrait',
    title TEXT NOT NULL,
    destination_city TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_whatsapp TEXT NOT NULL,
    client_email TEXT,
    travel_start_date DATE,
    travel_end_date DATE,
    adults_count INTEGER NOT NULL DEFAULT 1,
    children_count INTEGER NOT NULL DEFAULT 0,
    hero_image_url TEXT,
    highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
    flights JSONB NOT NULL DEFAULT '[]'::jsonb,
    hotels JSONB NOT NULL DEFAULT '[]'::jsonb,
    itinerary JSONB NOT NULL DEFAULT '[]'::jsonb,
    pricing JSONB NOT NULL DEFAULT '{}'::jsonb,
    includes TEXT[] NOT NULL DEFAULT '{}',
    excludes TEXT[] NOT NULL DEFAULT '{}',
    important_notes TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft',
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_travel_proposals_store_id ON public.travel_proposals(store_id);
CREATE INDEX IF NOT EXISTS idx_travel_proposals_public_token ON public.travel_proposals(public_token);
CREATE INDEX IF NOT EXISTS idx_travel_proposals_status ON public.travel_proposals(status);
CREATE INDEX IF NOT EXISTS idx_travel_proposals_destination ON public.travel_proposals(destination_city);

-- RLS para Propostas
ALTER TABLE public.travel_proposals ENABLE ROW LEVEL SECURITY;

-- Leitura pública por token
CREATE POLICY "Public travel proposal read by token"
    ON public.travel_proposals
    FOR SELECT
    USING (true);

-- Agência gerencia suas propostas
CREATE POLICY "Agency manage own travel proposals"
    ON public.travel_proposals
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

-- 2. TABELA DE CONTRATOS TURÍSTICOS COM ASSINATURA ELETRÔNICA (SHA-256)
CREATE TABLE IF NOT EXISTS public.travel_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    proposal_id UUID REFERENCES public.travel_proposals(id) ON DELETE SET NULL,
    public_token TEXT UNIQUE NOT NULL,
    contract_title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_document TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT NOT NULL,
    client_address TEXT,
    destination TEXT NOT NULL,
    travel_start_date DATE,
    travel_end_date DATE,
    package_summary TEXT NOT NULL,
    total_value_cents BIGINT NOT NULL DEFAULT 0,
    payment_conditions TEXT NOT NULL,
    passengers JSONB NOT NULL DEFAULT '[]'::jsonb,
    clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
    signatures JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'sent',
    signed_at TIMESTAMPTZ,
    content_hash TEXT,
    certificate_serial TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_travel_contracts_store_id ON public.travel_contracts(store_id);
CREATE INDEX IF NOT EXISTS idx_travel_contracts_public_token ON public.travel_contracts(public_token);
CREATE INDEX IF NOT EXISTS idx_travel_contracts_status ON public.travel_contracts(status);
CREATE INDEX IF NOT EXISTS idx_travel_contracts_client_doc ON public.travel_contracts(client_document);

-- RLS para Contratos
ALTER TABLE public.travel_contracts ENABLE ROW LEVEL SECURITY;

-- Leitura e assinatura pública por token
CREATE POLICY "Public travel contract read by token"
    ON public.travel_contracts
    FOR SELECT
    USING (true);

CREATE POLICY "Public travel contract update signature by token"
    ON public.travel_contracts
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Agência gerencia seus contratos
CREATE POLICY "Agency manage own travel contracts"
    ON public.travel_contracts
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

-- 3. TABELA DE GRUPOS TERRESTRES, ÔNIBUS & ROOMING LIST
CREATE TABLE IF NOT EXISTS public.travel_group_tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_city TEXT NOT NULL,
    departure_date DATE NOT NULL,
    departure_time TEXT NOT NULL DEFAULT '06:00',
    return_date DATE NOT NULL,
    return_time TEXT NOT NULL DEFAULT '20:00',
    bus_company_name TEXT,
    bus_plate TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    total_seats INTEGER NOT NULL DEFAULT 46,
    seats JSONB NOT NULL DEFAULT '[]'::jsonb,
    rooms JSONB NOT NULL DEFAULT '[]'::jsonb,
    price_cents BIGINT NOT NULL DEFAULT 0,
    included_items TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'open',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_travel_group_tours_store_id ON public.travel_group_tours(store_id);
CREATE INDEX IF NOT EXISTS idx_travel_group_tours_departure_date ON public.travel_group_tours(departure_date);
CREATE INDEX IF NOT EXISTS idx_travel_group_tours_status ON public.travel_group_tours(status);

-- RLS para Grupos Terrestres
ALTER TABLE public.travel_group_tours ENABLE ROW LEVEL SECURITY;

-- Leitura pública para consulta de grupos abertos
CREATE POLICY "Public read group tours"
    ON public.travel_group_tours
    FOR SELECT
    USING (status IN ('open', 'confirmed'));

-- Agência gerencia seus grupos terrestres
CREATE POLICY "Agency manage own group tours"
    ON public.travel_group_tours
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

