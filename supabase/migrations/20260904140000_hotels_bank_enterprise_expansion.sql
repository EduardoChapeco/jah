-- ==============================================================================
-- MIGRAÇÃO: EXPANSÃO ENTERPRISE DO BANCO DE HOTÉIS & RESORTS (TURISMO)
-- ==============================================================================

-- 1. Adicionar colunas estruturadas para Localização, Categorias de Quarto, Políticas e Estrutura
ALTER TABLE public.hotels_bank
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS airport_distance TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS room_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS policies JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS structure JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Índices para buscas performáticas em JSONB
CREATE INDEX IF NOT EXISTS idx_hotels_bank_room_categories ON public.hotels_bank USING gin(room_categories);
CREATE INDEX IF NOT EXISTS idx_hotels_bank_structure ON public.hotels_bank USING gin(structure);

-- 3. Comentários para documentação de schema
COMMENT ON COLUMN public.hotels_bank.room_categories IS 'Array estruturado de tipos de acomodação: [{ id, name, description, capacity_adults, capacity_children, max_guests, bedding, size_m2, daily_rate_reference_cents, amenities, cover_photo_url, photos }]';
COMMENT ON COLUMN public.hotels_bank.policies IS 'Objeto com políticas de checkin, checkout, crianças, cancelamento, voltagem, acessibilidade PCD';
COMMENT ON COLUMN public.hotels_bank.structure IS 'Objeto com detalhes de complexo aquático, praia pé na areia, kids club, spa e restaurantes temáticos';
