-- Migration: 20260815120000_universal_banners_and_hotpages.sql
-- Propósito: Estrutura canônica de Banners Universais (Vídeo/GIF/Imagem), Hotpages de Descoberta, Preferências de Usuário e Seeds Reais

-- ============================================================
-- 1. TABELA DE BANNERS UNIVERSAIS
-- ============================================================
CREATE TABLE IF NOT EXISTS banners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID REFERENCES stores(id) ON DELETE CASCADE, -- NULL = Banner Global / Admin
  title           TEXT NOT NULL,
  subtitle        TEXT,
  badge_text      TEXT,
  media_url       TEXT NOT NULL,
  media_type      TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'gif')),
  target_type     TEXT NOT NULL DEFAULT 'hotpage' CHECK (target_type IN ('product', 'category', 'hotpage', 'store', 'external_url')),
  target_id       TEXT,
  target_url      TEXT,
  cta_label       TEXT DEFAULT 'Conferir',
  placement       TEXT NOT NULL DEFAULT 'home' CHECK (placement IN ('home', 'marketplace', 'events', 'classifieds', 'all')),
  city_filter     TEXT, -- NULL = Exibir em todas as cidades
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at         TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banners_placement_active ON banners(placement, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_banners_dates ON banners(starts_at, ends_at);

-- ============================================================
-- 2. TABELA DE HOTPAGES (PÁGINAS / CATEGORIAS ESPECÍFICAS)
-- ============================================================
CREATE TABLE IF NOT EXISTS hotpages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  badge_label     TEXT,
  description     TEXT,
  cover_image_url TEXT,
  icon_name       TEXT,
  filter_rules    JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotpages_active ON hotpages(is_active, sort_order);

-- ============================================================
-- 3. TABELA DE PREFERÊNCIAS DO USUÁRIO (INTERESSES & CIDADE)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_niches TEXT[] NOT NULL DEFAULT '{}',
  default_city    TEXT DEFAULT 'Chapecó - SC',
  default_lat     NUMERIC,
  default_lng     NUMERIC,
  onboarding_done BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotpages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Leitura pública de Banners e Hotpages ativos
DO $$ BEGIN
  CREATE POLICY "Public read for active banners" ON banners
    FOR SELECT USING (is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at >= now()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read for active hotpages" ON hotpages
    FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Gestão de Banners por Lojistas / Admins
DO $$ BEGIN
  CREATE POLICY "Store members can manage their banners" ON banners
    FOR ALL USING (
      store_id IS NOT NULL AND 
      store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Preferências do Usuário
DO $$ BEGIN
  CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read for own user preferences" ON user_preferences
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 5. SEEDS CANÔNICOS DE LOJAS E PRODUTOS REAIS NO BANCO DE DADOS
-- ============================================================

-- Garantir que a organização padrão exista
INSERT INTO public.organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Jah Organization', 'jah-org')
ON CONFLICT (slug) DO NOTHING;

-- Garantir que as lojas existem no banco de dados com UUIDs reais
INSERT INTO public.stores (id, organization_id, name, slug, settings)
SELECT 
  'a0000000-0000-0000-0000-000000000001'::uuid,
  id,
  'La Brasa Gourmet',
  'la-brasa-gourmet',
  '{"description": "Hambúrgueres artesanais e lanches na brasa", "logoUrl": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&q=80"}'::jsonb
FROM public.organizations WHERE slug = 'jah-org'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stores (id, organization_id, name, slug, settings)
SELECT 
  'a0000000-0000-0000-0000-000000000002'::uuid,
  id,
  'Torrefação Autoral',
  'torrefacao-autoral',
  '{"description": "Cafés especiais selecionados e torrados na hora", "logoUrl": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&q=80"}'::jsonb
FROM public.organizations WHERE slug = 'jah-org'
ON CONFLICT (id) DO NOTHING;

-- Garantir produtos reais com UUIDs
INSERT INTO public.products (id, store_id, title, slug, description, price_cents, compare_at_cents, status)
VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Smash Burger Duplo Artesanal com Queijo Canastra',
    'smash-burger-duplo',
    'Dois blends de 90g prensados na chapa ultra quente com crosta caramelizada, queijo da canastra derretido, maionese artesanal da casa e pão brioche amanteigado tostado.',
    3490,
    4890,
    'published'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'Café Especial Moído na Hora (250g) - Notas Florais',
    'cafe-especial-graos',
    'Grãos selecionados 100% arábica da Serra da Mantiqueira. Torra média com notas sensoriais de caramelo, jasmim e frutas amarelas.',
    2900,
    3800,
    'published'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  compare_at_cents = EXCLUDED.compare_at_cents,
  status = EXCLUDED.status;

-- Garantir variantes dos produtos com UUIDs reais
INSERT INTO public.product_variants (id, product_id, sku, price_override_cents, stock_on_hand, attributes)
VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'BRG-SMASH-01',
    3490,
    50,
    '{"Tamanho": "Individual"}'::jsonb
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'BRG-SMASH-COMBO',
    4790,
    40,
    '{"Tamanho": "Combo Completo"}'::jsonb
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000002',
    'CAF-250G',
    2900,
    35,
    '{"Moagem": "Em Grãos"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  price_override_cents = EXCLUDED.price_override_cents,
  stock_on_hand = EXCLUDED.stock_on_hand,
  attributes = EXCLUDED.attributes;

-- Garantir mídias dos produtos
INSERT INTO public.product_media (id, product_id, url, alt, media_type, sort_order)
VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    'Smash Burger Duplo Artesanal',
    'image',
    0
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80',
    'Café Especial Grãos',
    'image',
    0
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. SEEDS DE BANNERS UNIVERSAIS DE ALTO IMPACTO
-- ============================================================
INSERT INTO banners (id, title, subtitle, badge_text, media_url, media_type, target_type, target_url, cta_label, placement, sort_order)
VALUES
  (
    'e0000000-0000-0000-0000-000000000001',
    'Festival Gastronômico da Comunidade JAH',
    'Pratos autorais, hambúrgueres artesanais e cafés especiais com até 30% OFF nesta semana.',
    'Destaque da Cidade',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=85',
    'image',
    'hotpage',
    '/mercado?niche=gastronomia',
    'Explorar Gastronomia',
    'all',
    1
  ),
  (
    'e0000000-0000-0000-0000-000000000002',
    'Entrega Grátis nos Melhores Produtores Locais',
    'Apoie o comércio da sua região com frete grátis para pedidos acima de R$ 50.',
    'Frete Grátis',
    'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=1600&q=85',
    'image',
    'hotpage',
    '/mercado?hotpage=entrega-gratis',
    'Ver Lojas Participantes',
    'home',
    2
  ),
  (
    'e0000000-0000-0000-0000-000000000003',
    'Agenda Cultural & Shows ao Vivo',
    'Garanta seus ingressos para feiras de artesanato, festivais e shows da cena autoral.',
    'Eventos em Alta',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&q=85',
    'image',
    'hotpage',
    '/agenda',
    'Ver Todos os Eventos',
    'events',
    3
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. SEEDS DE HOTPAGES CANÔNICAS
-- ============================================================
INSERT INTO hotpages (id, slug, title, badge_label, description, cover_image_url, icon_name, filter_rules, sort_order)
VALUES
  (
    'f0000000-0000-0000-0000-000000000001',
    'ofertas-relampago',
    'Ofertas Relâmpago',
    '⚡ Até 40% OFF',
    'Descontos exclusivos por tempo limitado na sua região.',
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80',
    'Flame',
    '{"is_promotion": true, "discount_min": 15}'::jsonb,
    1
  ),
  (
    'f0000000-0000-0000-0000-000000000002',
    'entrega-gratis',
    'Entrega Grátis',
    '🛵 Sem Frete',
    'Lojas e produtores locais com entrega cortesia da plataforma.',
    'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&q=80',
    'Truck',
    '{"free_shipping": true}'::jsonb,
    2
  ),
  (
    'f0000000-0000-0000-0000-000000000003',
    'gastronomia-artesanal',
    'Gastronomia & Lanches',
    '🍔 Sabor Local',
    'Burgers, pizzas, cafés especiais, sobremesas e pratos autorais.',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
    'Utensils',
    '{"niche": "gastronomia"}'::jsonb,
    3
  ),
  (
    'f0000000-0000-0000-0000-000000000004',
    'beleza-sem-hora',
    'Beleza & Bem-Estar',
    '✂️ Sem Hora Marcada',
    'Barbearias, salões de beleza, massoterapia e cuidados pessoais.',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80',
    'Sparkles',
    '{"niche": "beleza"}'::jsonb,
    4
  ),
  (
    'f0000000-0000-0000-0000-000000000005',
    'empregos-vagas',
    'Vagas & Oportunidades',
    '💼 Contratação Direta',
    'Empregos locais, freelas, vagas no comércio e parcerias.',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80',
    'Briefcase',
    '{"niche": "empregos"}'::jsonb,
    5
  ),
  (
    'f0000000-0000-0000-0000-000000000006',
    'viagens-experiencias',
    'Viagens & Passeios',
    '✈️ Turismo Regional',
    'Passeios rurais, ecoturismo, cabanas e estadias na região.',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80',
    'Compass',
    '{"niche": "viagens"}'::jsonb,
    6
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  badge_label = EXCLUDED.badge_label,
  description = EXCLUDED.description,
  cover_image_url = EXCLUDED.cover_image_url,
  filter_rules = EXCLUDED.filter_rules;
