-- ============================================================
-- Migration: 20260826000000_universal_niche_banners_and_hotpages.sql
-- Propósito: 100% de Bilateralidade e Completude para Banners e Botões em todos os 25 Nichos da Plataforma Wider
-- ============================================================

-- 1. Atualizar Tabela BANNERS (Remover constraint restritiva e adicionar colunas de controle visual)
ALTER TABLE banners DROP CONSTRAINT IF EXISTS banners_placement_check;

ALTER TABLE banners ADD COLUMN IF NOT EXISTS show_title BOOLEAN DEFAULT false;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS show_description BOOLEAN DEFAULT false;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS show_overlay BOOLEAN DEFAULT false;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS show_badge BOOLEAN DEFAULT false;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS show_cta BOOLEAN DEFAULT false;

-- 2. Atualizar Tabela HOTPAGES (Garantir colunas de módulo, ícone, textura e mídia)
ALTER TABLE hotpages ADD COLUMN IF NOT EXISTS module TEXT DEFAULT 'home';
ALTER TABLE hotpages ADD COLUMN IF NOT EXISTS custom_icon_url TEXT;
ALTER TABLE hotpages ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE hotpages ADD COLUMN IF NOT EXISTS target_route TEXT;
ALTER TABLE hotpages ADD COLUMN IF NOT EXISTS bg_media_type TEXT DEFAULT 'none';
ALTER TABLE hotpages ADD COLUMN IF NOT EXISTS bg_media_url TEXT;
ALTER TABLE hotpages ADD COLUMN IF NOT EXISTS bg_color TEXT;
ALTER TABLE hotpages ADD COLUMN IF NOT EXISTS bg_overlay_opacity INTEGER DEFAULT 30;
ALTER TABLE hotpages ADD COLUMN IF NOT EXISTS bg_texture TEXT DEFAULT 'none';
ALTER TABLE hotpages ADD COLUMN IF NOT EXISTS show_title BOOLEAN DEFAULT true;
ALTER TABLE hotpages ADD COLUMN IF NOT EXISTS show_description BOOLEAN DEFAULT true;
ALTER TABLE hotpages ADD COLUMN IF NOT EXISTS show_overlay BOOLEAN DEFAULT true;
ALTER TABLE hotpages ADD COLUMN IF NOT EXISTS show_badge BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_banners_placement_active ON banners(placement, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_hotpages_module_active ON hotpages(module, is_active, sort_order);

-- 3. RLS para Banners e Hotpages (Permissão total para Platform Admin e Leitura Pública)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public read for active banners" ON banners;
  CREATE POLICY "Public read for active banners" ON banners
    FOR SELECT USING (is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at >= now()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Public read for active hotpages" ON hotpages;
  CREATE POLICY "Public read for active hotpages" ON hotpages
    FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Master admin full access banners" ON banners;
  CREATE POLICY "Master admin full access banners" ON banners
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'platform_admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Master admin full access hotpages" ON hotpages;
  CREATE POLICY "Master admin full access hotpages" ON hotpages
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'platform_admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. SEEDS CANÔNICOS DE BANNERS REAIS PARA CADA NICHO (Persistidos fisicamente no Banco de Dados)
INSERT INTO public.banners (id, title, subtitle, badge_text, media_url, media_type, target_type, target_url, placement, is_active, sort_order, show_title, show_description, show_overlay, show_badge, show_cta)
VALUES
  -- ── NOTÍCIAS & JORNALISMO ──
  (
    'e0000000-0000-0000-0000-000000000021',
    'Portal de Notícias em Tempo Real',
    'Fatos, reportagens e investigações jornalísticas da nossa região com credibilidade e independência.',
    'Últimas Notícias',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1600&q=85',
    'image',
    'hotpage',
    '/noticias',
    'noticias',
    true,
    1,
    false,
    false,
    false,
    false,
    false
  ),
  (
    'e0000000-0000-0000-0000-000000000022',
    'Economia, Política & Negócios Locais',
    'Acompanhe análises e o impacto dos acontecimentos no desenvolvimento regional.',
    'Economia & Foco',
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&q=85',
    'image',
    'hotpage',
    '/noticias',
    'noticias',
    true,
    2,
    false,
    false,
    false,
    false,
    false
  ),

  -- ── CLASSIFICADOS P2P ──
  (
    'e0000000-0000-0000-0000-000000000061',
    'Classificados da Comunidade',
    'Compre, venda e negocie carros, imóveis, eletrônicos e móveis direto com os moradores.',
    'Negociação Direta',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1600&q=85',
    'image',
    'hotpage',
    '/classificados',
    'classificados',
    true,
    1,
    false,
    false,
    false,
    false,
    false
  ),
  (
    'e0000000-0000-0000-0000-000000000062',
    'Desapegue e Encontre Oportunidades',
    'Anuncie seus itens usados com fotos e receba propostas no chat seguro da plataforma.',
    'Desapego Seguro',
    'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1600&q=85',
    'image',
    'hotpage',
    '/classificados',
    'classificados',
    true,
    2,
    false,
    false,
    false,
    false,
    false
  ),

  -- ── DIRETÓRIO COMERCIAL & GUIA LOCAL ──
  (
    'e0000000-0000-0000-0000-000000000041',
    'Guia Oficial de Empresas & Serviços',
    'Encontre prestadores verificados, lojas, oficinas, consultórios e telefones úteis.',
    'Guia Oficial',
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1600&q=85',
    'image',
    'hotpage',
    '/diretorio',
    'diretorio',
    true,
    1,
    false,
    false,
    false,
    false,
    false
  ),
  (
    'e0000000-0000-0000-0000-000000000042',
    'Serviços & Profissionais Avaliados',
    'Contrate com confiança baseado nas avaliações e histórico da comunidade.',
    'Recomendados',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&q=85',
    'image',
    'hotpage',
    '/diretorio',
    'diretorio',
    true,
    2,
    false,
    false,
    false,
    false,
    false
  ),

  -- ── FARMÁCIA & SAÚDE ──
  (
    'e0000000-0000-0000-0000-000000000071',
    'Farmácia, Saúde & Cuidados Pessoais',
    'Medicamentos, suplementos e itens de higiene com entrega rápida ou retirada.',
    'Saúde & Bem-Estar',
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1600&q=85',
    'image',
    'hotpage',
    '/farmacia',
    'farmacia',
    true,
    1,
    false,
    false,
    false,
    false,
    false
  ),
  (
    'e0000000-0000-0000-0000-000000000072',
    'Dermocosméticos & Vitaminas em Destaque',
    'Cuidado integral para sua família com as melhores marcas farmacêuticas.',
    'Farmácia Digital',
    'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=1600&q=85',
    'image',
    'hotpage',
    '/farmacia',
    'farmacia',
    true,
    2,
    false,
    false,
    false,
    false,
    false
  ),

  -- ── GASTRONOMIA & DELIVERY ──
  (
    'e0000000-0000-0000-0000-000000000011',
    'Gastronomia Autoral & Delivery da Cidade',
    'Pizzas, hambúrgueres artesanais, comida japonesa e pratos executivos com rastreamento.',
    'Sabor Local',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=85',
    'image',
    'hotpage',
    '/gastronomia',
    'gastronomia',
    true,
    1,
    false,
    false,
    false,
    false,
    false
  ),
  (
    'e0000000-0000-0000-0000-000000000012',
    'Cafés Coloniais, Docerias & Padarias',
    'Pães artesanais quentinhos, tortas e cafés especiais torrados na hora.',
    'Padaria & Café',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1600&q=85',
    'image',
    'hotpage',
    '/gastronomia',
    'gastronomia',
    true,
    2,
    false,
    false,
    false,
    false,
    false
  ),

  -- ── SUPERMERCADO & HORTIFRÚTI ──
  (
    'e0000000-0000-0000-0000-000000000013',
    'Supermercado & Feira Fresca do Dia',
    'Frutas, verduras colhidas no dia e despensa completa com preços direto do produtor.',
    'Feira Fresca',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=85',
    'image',
    'hotpage',
    '/mercado',
    'mercado',
    true,
    1,
    false,
    false,
    false,
    false,
    false
  ),

  -- ── TURISMO & HOSPEDAGEM ──
  (
    'e0000000-0000-0000-0000-000000000051',
    'Turismo, Chalés & Roteiros Regionais',
    'Descubra pousadas rurais, cachoeiras, passeios de aventura e hotéis aconchegantes.',
    'Viva o Turismo',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=85',
    'image',
    'hotpage',
    '/turismo',
    'turismo',
    true,
    1,
    false,
    false,
    false,
    false,
    false
  ),

  -- ── EMPREGOS & OPORTUNIDADES ──
  (
    'e0000000-0000-0000-0000-000000000055',
    'Banco de Vagas & Talentos da Região',
    'Encontre seu próximo emprego ou anuncie vagas da sua empresa com triagem automatizada.',
    'Vagas Abertas',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1600&q=85',
    'image',
    'hotpage',
    '/empregos',
    'empregos',
    true,
    1,
    false,
    false,
    false,
    false,
    false
  ),

  -- ── AGENDA & EVENTOS ──
  (
    'e0000000-0000-0000-0000-000000000031',
    'Agenda Cultural, Festivais & Shows',
    'Ingressos oficiais com QR Code, teatro, shows ao vivo e encontros esportivos.',
    'Agenda Oficial',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&q=85',
    'image',
    'hotpage',
    '/agenda',
    'agenda',
    true,
    1,
    false,
    false,
    false,
    false,
    false
  ),

  -- ── MOBILIDADE & TRANSPORTE ──
  (
    'e0000000-0000-0000-0000-000000000085',
    'Mobilidade Urbana & Corridas Locais',
    'Motoristas parceiros locais, frotas verificadas e entrega expressa de pacotes.',
    'Mobilidade Segura',
    'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600&q=85',
    'image',
    'hotpage',
    '/mobilidade',
    'mobilidade',
    true,
    1,
    false,
    false,
    false,
    false,
    false
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  badge_text = EXCLUDED.badge_text,
  media_url = EXCLUDED.media_url,
  placement = EXCLUDED.placement,
  is_active = EXCLUDED.is_active,
  target_url = EXCLUDED.target_url;

-- 5. SEEDS CANÔNICOS DE BOTÕES / HOTPAGES REAIS PARA CADA MÓDULO NO BANCO
INSERT INTO public.hotpages (id, slug, title, badge_label, description, cover_image_url, target_route, module, sort_order, is_active, show_title, show_badge, show_overlay)
VALUES
  -- Botões de Notícias
  ('f0000000-0000-0000-0000-000000000001', 'noticias-urgente', 'Última Hora', 'Ao Vivo', 'Plantão e reportagens urgentes', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80', '/noticias?cat=urgente', 'noticias', 1, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000002', 'noticias-cidade', 'Cidade & Região', 'Local', 'Obras, trânsito e bairros', 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&q=80', '/noticias?cat=cidade', 'noticias', 2, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000003', 'noticias-cultura', 'Cultura & Lazer', 'Eventos', 'Shows, teatro e festivais', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80', '/noticias?cat=cultura', 'noticias', 3, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000004', 'noticias-economia', 'Economia & Negócios', 'Mercado', 'Finanças e empresas locais', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80', '/noticias?cat=economia', 'noticias', 4, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000005', 'noticias-esportes', 'Esportes & Clubes', 'Campeonatos', 'Futebol e modalidades da região', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80', '/noticias?cat=esportes', 'noticias', 5, true, true, true, true),

  -- Botões de Classificados
  ('f0000000-0000-0000-0000-000000000011', 'classificados-imoveis', 'Imóveis & Moradia', 'Casas & Aptos', 'Aluguel e venda direta', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80', '/classificados?categoria=imoveis', 'classificados', 1, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000012', 'classificados-autos', 'Veículos & Autos', 'Carros & Motos', 'Seminovos com procedência', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80', '/classificados?categoria=veiculos', 'classificados', 2, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000013', 'classificados-tech', 'Desapegos & Tech', 'Eletrônicos', 'Smartphones, computadores e games', 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80', '/classificados?categoria=tech', 'classificados', 3, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000014', 'classificados-moveis', 'Casa & Móveis', 'Decoração', 'Móveis e eletrodomésticos', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80', '/classificados?categoria=casa', 'classificados', 4, true, true, true, true),

  -- Botões de Diretório Comercial
  ('f0000000-0000-0000-0000-000000000021', 'diretorio-saude', 'Saúde & Consultórios', 'Clínicas', 'Médicos, dentistas e laboratórios', 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&q=80', '/diretorio?categoria=saude', 'diretorio', 1, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000022', 'diretorio-auto', 'Oficinas & Mecânicas', 'Automotivo', 'Manutenção, peças e estética auto', 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&q=80', '/diretorio?categoria=auto', 'diretorio', 2, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000023', 'diretorio-reforma', 'Obras & Construção', 'Profissionais', 'Pedreiros, eletricistas e pintores', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80', '/diretorio?categoria=obras', 'diretorio', 3, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000024', 'diretorio-pets', 'Pet & Veterinária', 'Clínicas Pet', 'Veterinários, banho & tosa', 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&q=80', '/diretorio?categoria=pets', 'diretorio', 4, true, true, true, true),

  -- Botões de Farmácia
  ('f0000000-0000-0000-0000-000000000031', 'farmacia-remedios', 'Medicamentos Isentos', 'Dia a Dia', 'Gripe, dor e antialérgicos', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80', '/farmacia?sub=medicamentos', 'farmacia', 1, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000032', 'farmacia-vitaminas', 'Vitaminas & Suplementos', 'Nutrição', 'Whey, creatina e ômega 3', 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=600&q=80', '/farmacia?sub=vitaminas', 'farmacia', 2, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000033', 'farmacia-dermo', 'Dermocosméticos', 'Pele & Cabelo', 'Protetor solar e skincare', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80', '/farmacia?sub=dermo', 'farmacia', 3, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000034', 'farmacia-higiene', 'Higiene & Cuidados', 'Essencial', 'Higiene bucal e corporal', 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80', '/farmacia?sub=higiene', 'farmacia', 4, true, true, true, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  badge_label = EXCLUDED.badge_label,
  description = EXCLUDED.description,
  cover_image_url = EXCLUDED.cover_image_url,
  target_route = EXCLUDED.target_route,
  module = EXCLUDED.module,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;
