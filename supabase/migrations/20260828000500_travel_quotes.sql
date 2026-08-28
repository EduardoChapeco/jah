-- Migration: 20260828000000_travel_quotes.sql
-- Description: Creates the travel_quotes table for generic travel leads (CVC-style), separating it from in-app specific experience bookings.

CREATE TABLE IF NOT EXISTS public.travel_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_city TEXT NOT NULL,
    origin_iata TEXT,
    destination_city TEXT NOT NULL,
    destination_iata TEXT,
    departure_date DATE,
    return_date DATE,
    rooms_count INTEGER DEFAULT 1,
    adults_count INTEGER DEFAULT 2,
    children_count INTEGER DEFAULT 0,
    children_ages JSONB DEFAULT '[]'::jsonb,
    trip_type TEXT DEFAULT 'air_package' CHECK (trip_type IN ('air_package', 'hotel_only', 'cruise', 'bus', 'visa_assistance')),
    flexible_dates BOOLEAN DEFAULT false,
    contact_name TEXT NOT NULL,
    contact_whatsapp TEXT NOT NULL,
    contact_email TEXT,
    budget_tier TEXT DEFAULT 'standard' CHECK (budget_tier IN ('economy', 'standard', 'premium', 'luxury')),
    special_notes TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'analyzing', 'quoted', 'won', 'lost')),
    agency_notes TEXT,
    quote_amount_cents BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.travel_quotes ENABLE ROW LEVEL SECURITY;

-- Policy 1: Any user (even anonymous) can submit a travel quote lead.
CREATE POLICY "Qualquer visitante pode enviar uma cotação de viagem"
    ON public.travel_quotes FOR INSERT
    WITH CHECK (true);

-- Policy 2: Authenticated agencies (or admins) can view the quotes.
-- In a real scenario, this would be tied to `store_id` or an admin role. For now, we allow authenticated users.
CREATE POLICY "Usuários autenticados podem ver cotações"
    ON public.travel_quotes FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy 3: Authenticated agencies can update the quote status.
CREATE POLICY "Usuários autenticados podem atualizar cotações"
    ON public.travel_quotes FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_travel_quotes_status ON public.travel_quotes(status);
CREATE INDEX IF NOT EXISTS idx_travel_quotes_created_at ON public.travel_quotes(created_at DESC);
