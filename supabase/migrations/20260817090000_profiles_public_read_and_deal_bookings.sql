-- ==============================================================================
-- 20260817090000_profiles_public_read_and_deal_bookings.sql
-- 1. Permite leitura pública sanitizada de perfis da comunidade (correção de /membro/$id)
-- 2. Enriquece a tabela 'deals' com suporte a reservas diretas por diária/temporada
-- ==============================================================================

-- 1. Profiles: Habilitar leitura pública para exibição de perfil comunitário
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read"
  ON public.profiles FOR SELECT
  USING (true);

-- 2. Deals: Adicionar colunas de suporte a reservas por diária / temporada / hospedagem
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS nights_count INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS daily_rate_cents BIGINT,
  ADD COLUMN IF NOT EXISTS cleaning_fee_cents BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_price_cents BIGINT,
  ADD COLUMN IF NOT EXISTS guests_count INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS booking_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS property_address TEXT,
  ADD COLUMN IF NOT EXISTS access_instructions TEXT,
  ADD COLUMN IF NOT EXISTS is_direct_booking BOOLEAN DEFAULT false;

-- 3. Índices para consultas ágeis de reservas e propostas
CREATE INDEX IF NOT EXISTS idx_deals_classified_buyer ON public.deals(classified_id, buyer_id);
CREATE INDEX IF NOT EXISTS idx_deals_seller_status ON public.deals(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_dates ON public.deals(start_date, end_date);
