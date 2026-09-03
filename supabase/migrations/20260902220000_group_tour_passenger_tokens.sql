-- ==============================================================================
-- MIGRAÇÃO: MAGIC LINKS DE PREENCHIMENTO DE PASSAGEIROS & TERMOS DE EXCURSÃO
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.group_tour_passenger_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tourism_experiences(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    passenger_seat_number INTEGER,
    passenger_name TEXT,
    passenger_document TEXT,
    passenger_phone TEXT,
    passenger_birth_date DATE,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    dietary_restrictions TEXT,
    boarding_point TEXT,
    terms_accepted BOOLEAN NOT NULL DEFAULT false,
    terms_accepted_at TIMESTAMPTZ,
    terms_accepted_ip TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para busca ultrarrápida
CREATE INDEX IF NOT EXISTS idx_passenger_tokens_token ON public.group_tour_passenger_tokens(token);
CREATE INDEX IF NOT EXISTS idx_passenger_tokens_tour ON public.group_tour_passenger_tokens(tour_id);

-- Habilitar RLS
ALTER TABLE public.group_tour_passenger_tokens ENABLE ROW LEVEL SECURITY;

-- Equipe do workspace gerencia tokens da sua loja
CREATE POLICY "Workspace members manage tour passenger tokens"
    ON public.group_tour_passenger_tokens
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

-- Acesso anônimo/público via token não expirado (leitura e submissão)
CREATE POLICY "Public read passenger token by token value"
    ON public.group_tour_passenger_tokens
    FOR SELECT
    TO anon, authenticated
    USING (expires_at > now());

CREATE POLICY "Public update passenger token by token value"
    ON public.group_tour_passenger_tokens
    FOR UPDATE
    TO anon, authenticated
    USING (expires_at > now())
    WITH CHECK (expires_at > now());
