-- ==============================================================================
-- MIGRATION: 20260930010000_group_tours_enrichment.sql
-- Enriquecimento de colunas para o NewGroupTourWizard (7 passos do motor de excursões)
-- ==============================================================================

ALTER TABLE public.group_tours
  ADD COLUMN IF NOT EXISTS transport_type TEXT DEFAULT 'air',
  ADD COLUMN IF NOT EXISTS registration_deadline DATE,
  ADD COLUMN IF NOT EXISTS total_seats INTEGER DEFAULT 40,
  ADD COLUMN IF NOT EXISTS departure_city TEXT,
  ADD COLUMN IF NOT EXISTS includes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS excludes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS itinerary JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hotel_details JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS promo_media JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pricing_tiers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS extra_options JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Atualizar índices para busca e ordenação
CREATE INDEX IF NOT EXISTS idx_group_tours_departure_date ON public.group_tours(departure_date);
CREATE INDEX IF NOT EXISTS idx_group_tours_status ON public.group_tours(status);
CREATE INDEX IF NOT EXISTS idx_group_tours_is_public ON public.group_tours(is_public);
