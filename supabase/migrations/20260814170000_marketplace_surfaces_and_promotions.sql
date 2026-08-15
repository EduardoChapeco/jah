-- Migration: 20260814170000_marketplace_surfaces_and_promotions.sql
-- Propósito: Estrutura canônica de Marketplace Surfaces, Seções Dinâmicas, Rails e Motor de Promoções / Ofertas Relâmpago

-- ============================================================
-- 1. ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE marketplace_section_type AS ENUM (
    'offer_rail',
    'store_rail',
    'product_rail',
    'category_rail',
    'banner_hero',
    'flash_deal_rail',
    'curated_grid'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE promotion_type AS ENUM (
    'flash_offer',
    'percentage_discount',
    'fixed_discount',
    'buy_x_get_y',
    'progressive_quantity',
    'club_price'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. TABELA DE SUPERFÍCIES DO MARKETPLACE
-- ============================================================
CREATE TABLE IF NOT EXISTS marketplace_surfaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  description TEXT,
  is_global   BOOLEAN NOT NULL DEFAULT true,
  store_id    UUID REFERENCES stores(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. TABELA DE SEÇÕES DINÂMICAS / RAILS DA SUPERFÍCIE
-- ============================================================
CREATE TABLE IF NOT EXISTS marketplace_sections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surface_id        UUID NOT NULL REFERENCES marketplace_surfaces(id) ON DELETE CASCADE,
  type              marketplace_section_type NOT NULL DEFAULT 'product_rail',
  title             TEXT NOT NULL,
  subtitle          TEXT,
  data_source       TEXT NOT NULL DEFAULT 'auto', -- 'auto', 'category', 'collection', 'flash_deals', 'top_sellers'
  taxonomy_slug     TEXT,
  ranking_strategy  TEXT NOT NULL DEFAULT 'popularity', -- 'popularity', 'recency', 'discount', 'proximity'
  layout_variant    TEXT NOT NULL DEFAULT 'rail_standard', -- 'rail_standard', 'rail_compact', 'banner_large', 'grid_4'
  item_limit        INTEGER NOT NULL DEFAULT 12,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_sections_surface ON marketplace_sections(surface_id, sort_order);

-- ============================================================
-- 4. TABELA DE PROMOÇÕES E OFERTAS RELÂMPAGO
-- ============================================================
CREATE TABLE IF NOT EXISTS promotions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  type                promotion_type NOT NULL DEFAULT 'percentage_discount',
  discount_percent    INTEGER DEFAULT 0,
  discount_cents      INTEGER DEFAULT 0,
  buy_qty             INTEGER DEFAULT 1,
  get_qty             INTEGER DEFAULT 1,
  starts_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at             TIMESTAMPTZ,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  max_redemptions     INTEGER,
  current_redemptions INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotions_store_id ON promotions(store_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active, starts_at, ends_at);

-- ============================================================
-- 5. TABELA DE VÍNCULO PRODUTO x PROMOÇÃO
-- ============================================================
CREATE TABLE IF NOT EXISTS promotion_products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id  UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(promotion_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_promotion_products_prod ON promotion_products(product_id);

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE marketplace_surfaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_products ENABLE ROW LEVEL SECURITY;

-- Leitura pública para superfícies e promoções ativas
CREATE POLICY "Public read for marketplace surfaces" ON marketplace_surfaces FOR SELECT USING (true);
CREATE POLICY "Public read for marketplace sections" ON marketplace_sections FOR SELECT USING (is_active = true);
CREATE POLICY "Public read for promotions" ON promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Public read for promotion products" ON promotion_products FOR SELECT USING (true);

-- Gestão por membros da loja
CREATE POLICY "Store members can manage their promotions" ON promotions FOR ALL
  USING (store_id IN (SELECT store_id FROM workspace_members WHERE profile_id = auth.uid()));

CREATE POLICY "Store members can manage their promotion products" ON promotion_products FOR ALL
  USING (promotion_id IN (SELECT id FROM promotions WHERE store_id IN (SELECT store_id FROM workspace_members WHERE profile_id = auth.uid())));

-- ============================================================
-- 7. SEEDS CANÔNICOS DA SUPERFÍCIE GLOBAL DO MERCADO
-- ============================================================
INSERT INTO marketplace_surfaces (id, slug, title, description, is_global)
VALUES ('00000000-0000-0000-0000-000000000001', 'home_mercado', 'Mercado Central JAH', 'Superfície de descoberta contínua e comércio comunitário', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO marketplace_sections (surface_id, type, title, subtitle, data_source, ranking_strategy, layout_variant, item_limit, sort_order)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'flash_deal_rail', '⚡ Ofertas Relâmpago', 'Preços promocionais por tempo limitado em Chapecó e região', 'flash_deals', 'discount', 'rail_standard', 10, 10),
  ('00000000-0000-0000-0000-000000000001', 'store_rail', '🏪 Lojas & Produtores Locais', 'Conheça quem produz e fortalece a economia da nossa comunidade', 'top_sellers', 'proximity', 'rail_compact', 8, 20),
  ('00000000-0000-0000-0000-000000000001', 'product_rail', '🍔 Gastronomia & Artesanal', 'Lanches, cafés, pratos especiais e doces autorais', 'category', 'popularity', 'rail_standard', 12, 30),
  ('00000000-0000-0000-0000-000000000001', 'product_rail', '✨ Mais Desejados da Comunidade', 'Os itens com maior engajamento e avaliações reais da semana', 'auto', 'popularity', 'rail_standard', 12, 40)
ON CONFLICT DO NOTHING;
