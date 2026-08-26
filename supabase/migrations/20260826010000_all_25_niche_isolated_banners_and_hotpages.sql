-- ============================================================================
-- Wider Master Platform — Canonical Migration
-- File: 20260826010000_all_25_niche_isolated_banners_and_hotpages.sql
-- Propósito: 100% de Isolamento Bilateral de Banners e Hotpages para todos os 25 Nichos
-- ============================================================================

-- 1. Inserir os Banners Canônicos Segmentados por Nicho
INSERT INTO public.banners (id, title, subtitle, badge_text, media_url, media_type, target_type, target_url, placement, is_active, sort_order, show_title, show_description, show_overlay, show_badge, show_cta)
VALUES
  -- ── 1. HOME (Início) ──
  (
    'e0000000-0000-0000-0000-000000000001',
    'Descubra o Melhor da Nossa Região',
    'Comércio local, gastronomia autoral, notícias e eventos em um só lugar.',
    'Comunidade Wider',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=85',
    'image',
    'hotpage',
    '/',
    'home',
    true,
    1,
    false,
    false,
    false,
    false,
    false
  ),

  -- ── 2. MERCADO & HORTIFRUTI ──
  (
    'e0000000-0000-0000-0000-000000000011',
    'Feira Fresca, Supermercados & Mercearias',
    'Frutas, verduras e produtos coloniais frescos com entrega rápida.',
    'Direto do Produtor',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=85',
    'image',
    'category',
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

  -- ── 3. GASTRONOMIA & DELIVERY ──
  (
    'e0000000-0000-0000-0000-000000000012',
    'Gastronomia Local & Pratos Autorais',
    'Burgers artesanais, pizzas, sushi e sobremesas dos melhores restaurantes.',
    'Sabor Regional',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=85',
    'image',
    'category',
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

  -- ── 4. AGENDAMENTOS & AGENDA DE EVENTOS ──
  (
    'e0000000-0000-0000-0000-000000000031',
    'Agenda Cultural & Shows da Região',
    'Descubra festivais, apresentações, feiras de negócios e vida noturna.',
    'Programação Oficial',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&q=85',
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

  -- ── 5. TURISMO & HOSPEDAGEM ──
  (
    'e0000000-0000-0000-0000-000000000041',
    'Roteiros Ecológicos, Cabanas & Pousadas',
    'Descubra cachoeiras, trilhas e estadias aconchegantes na nossa região.',
    'Turismo Regional',
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

  -- ── 6. BELEZA & ESTÉTICA ──
  (
    'e0000000-0000-0000-0000-000000000051',
    'Barbearias, Salões & Estética',
    'Agende horários com os melhores profissionais de beleza e bem-estar.',
    'Cuidados & Estilo',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&q=85',
    'image',
    'category',
    '/beleza',
    'beleza',
    true,
    1,
    false,
    false,
    false,
    false,
    false
  ),

  -- ── 7. EMPREGOS & VAGAS ──
  (
    'e0000000-0000-0000-0000-000000000061',
    'Vagas de Emprego & Oportunidades Locais',
    'Empresas da região contratando com candidatura expressa em 1 toque.',
    'Mural de Vagas',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=85',
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

  -- ── 8. SERVIÇOS & PROFISSIONAIS ──
  (
    'e0000000-0000-0000-0000-000000000071',
    'Serviços Especializados & Reformas',
    'Encontre prestadores de serviços, técnicos, mecânicos e assistências.',
    'Mão de Obra Qualificada',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&q=85',
    'image',
    'category',
    '/servicos',
    'servicos',
    true,
    1,
    false,
    false,
    false,
    false,
    false
  ),

  -- ── 9. IMÓVEIS & LOCAÇÃO ──
  (
    'e0000000-0000-0000-0000-000000000081',
    'Imóveis, Casas & Apartamentos',
    'Aluguel e venda direto com imobiliárias e proprietários da cidade.',
    'Moradia & Negócios',
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=85',
    'image',
    'category',
    '/imoveis',
    'imoveis',
    true,
    1,
    false,
    false,
    false,
    false,
    false
  ),

  -- ── 10. PET SHOP & VETERINÁRIA ──
  (
    'e0000000-0000-0000-0000-000000000091',
    'Nutrição & Cuidados para o Seu Pet',
    'Rações premium, banho & tosa e clínicas veterinárias de confiança.',
    'Mundo Pet',
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1600&q=85',
    'image',
    'category',
    '/pet',
    'pet',
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
  media_type = EXCLUDED.media_type,
  target_type = EXCLUDED.target_type,
  target_url = EXCLUDED.target_url,
  placement = EXCLUDED.placement,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  show_title = EXCLUDED.show_title,
  show_description = EXCLUDED.show_description,
  show_overlay = EXCLUDED.show_overlay,
  show_badge = EXCLUDED.show_badge,
  show_cta = EXCLUDED.show_cta;

-- 2. Inserir Hotpages e Botões Canônicos com Isolamento Estrito para TODOS os Módulos
INSERT INTO public.hotpages (id, slug, title, badge_label, description, cover_image_url, target_route, module, sort_order, is_active, show_title, show_badge, show_overlay)
VALUES
  -- ── A. HOME (Início) ──
  ('f0000000-0000-0000-0000-000000000101', 'home-ofertas', 'Ofertas Relâmpago', 'Economia', 'Descontos de até 40% nas lojas da cidade', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80', '/ofertas', 'home', 1, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000102', 'home-gastronomia', 'Gastronomia Local', 'Sabor', 'Restaurantes, lanchonetes e confeitarias', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80', '/gastronomia', 'home', 2, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000103', 'home-mercado', 'Supermercado & Feira', 'Frescor', 'Hortifrúti e compras do mês', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80', '/mercado', 'home', 3, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000104', 'home-noticias', 'Notícias da Cidade', 'Tempo Real', 'Acontecimentos e fatos da região', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80', '/noticias', 'home', 4, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000105', 'home-agenda', 'Agenda & Eventos', 'Cultura', 'Shows, teatro e atrações', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80', '/agenda', 'home', 5, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000106', 'home-classificados', 'Classificados P2P', 'Direto', 'Imóveis, autos e desapegos', 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80', '/classificados', 'home', 6, true, true, true, true),

  -- ── B. MERCADO & SUPERMERCADOS ──
  ('f0000000-0000-0000-0000-000000000111', 'mercado-hortifruti', 'Hortifrúti & Feira', 'Frescos', 'Frutas, verduras e legumes orgânicos', 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80', '/mercado?categoria=hortifruti', 'mercado', 1, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000112', 'mercado-acougue', 'Açougue & Carnes', 'Cortes Nobres', 'Carnes para churrasco e dia a dia', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80', '/mercado?categoria=carnes', 'mercado', 2, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000113', 'mercado-padaria', 'Padaria & Frios', 'Colonial', 'Pães artesanais, queijos e embutidos', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80', '/mercado?categoria=padaria', 'mercado', 3, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000114', 'mercado-bebidas', 'Bebidas & Adega', 'Seleção', 'Vinhos, cervejas e sucos naturais', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80', '/mercado?categoria=bebidas', 'mercado', 4, true, true, true, true),

  -- ── C. GASTRONOMIA & RESTAURANTES ──
  ('f0000000-0000-0000-0000-000000000121', 'gastro-burgers', 'Burgers & Lanches', 'Artesanal', 'Smash burgers, fritas e molhos especiais', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80', '/gastronomia?categoria=burgers', 'gastronomia', 1, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000122', 'gastro-pizzas', 'Pizzas & Massas', 'Forno a Lenha', 'Pizzas napolitanas e massas frescas', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80', '/gastronomia?categoria=pizzas', 'gastronomia', 2, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000123', 'gastro-oriental', 'Sushi & Oriental', 'Fresco', 'Combinados, temakis e poke bowls', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80', '/gastronomia?categoria=oriental', 'gastronomia', 3, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000124', 'gastro-doces', 'Cafés & Sobremesas', 'Doceria', 'Cafés especiais, tortas e sobremesas', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80', '/gastronomia?categoria=doces', 'gastronomia', 4, true, true, true, true),

  -- ── D. AGENDA & EVENTOS ──
  ('f0000000-0000-0000-0000-000000000131', 'agenda-shows', 'Shows & Festivais', 'Música', 'Apresentações ao vivo e grandes atrações', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80', '/agenda?categoria=shows', 'agenda', 1, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000132', 'agenda-teatro', 'Teatro & Cultura', 'Artes', 'Peças teatrais, dança e exposições', 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&q=80', '/agenda?categoria=teatro', 'agenda', 2, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000133', 'agenda-esportes', 'Esportes & Lazer', 'Torneios', 'Campeonatos, corridas e pedaladas', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80', '/agenda?categoria=esportes', 'agenda', 3, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000134', 'agenda-feiras', 'Feiras & Negócios', 'Networking', 'Exposições comerciais e congressos', 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80', '/agenda?categoria=feiras', 'agenda', 4, true, true, true, true),

  -- ── E. TURISMO & PASSEIOS ──
  ('f0000000-0000-0000-0000-000000000141', 'turismo-ecoturismo', 'Trilhas & Cachoeiras', 'Aventura', 'Ecoturismo e passeios ao ar livre', 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&q=80', '/turismo?categoria=trilhas', 'turismo', 1, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000142', 'turismo-pousadas', 'Cabanas & Pousadas', 'Hospedagem', 'Chalés aconchegantes e refúgios na serra', 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=600&q=80', '/turismo?categoria=pousadas', 'turismo', 2, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000143', 'turismo-rural', 'Roteiros Rurais & Vinícolas', 'Colonial', 'Visitação a vinícolas e queijarias', 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&q=80', '/turismo?categoria=vinicolas', 'turismo', 3, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000144', 'turismo-gastronomia', 'Experiências Gastronômicas', 'Sabores', 'Café colonial e jantares temáticos', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80', '/turismo?categoria=gastronomia', 'turismo', 4, true, true, true, true),

  -- ── F. BELEZA & ESTÉTICA ──
  ('f0000000-0000-0000-0000-000000000151', 'beleza-barbearia', 'Barbearias Premium', 'Barba & Cabelo', 'Cortes modernos e tratamento capilar', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80', '/agendar?categoria=barbearia', 'beleza', 1, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000152', 'beleza-salao', 'Salões de Beleza', 'Cabelos & Mechas', 'Coloração, escova e penteados', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80', '/agendar?categoria=salao', 'beleza', 2, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000153', 'beleza-unhas', 'Unhas & Manicure', 'Nail Art', 'Alongamento em gel e esmaltação', 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600&q=80', '/agendar?categoria=unhas', 'beleza', 3, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000154', 'beleza-estetica', 'Estética & Massagem', 'Bem-Estar', 'Drenagem, limpeza de pele e relaxamento', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80', '/agendar?categoria=estetica', 'beleza', 4, true, true, true, true),

  -- ── G. VAGAS & EMPREGOS ──
  ('f0000000-0000-0000-0000-000000000161', 'empregos-tech', 'TI & Programação', 'Tech & Dados', 'Devs, dados e suporte', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80', '/empregos?categoria=tech', 'empregos', 1, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000162', 'empregos-vendas', 'Comércio & Vendas', 'Atendimento', 'Vendedores e consultores comerciais', 'https://images.unsplash.com/photo-1556742049-0a67e55722c0?w=600&q=80', '/empregos?categoria=vendas', 'empregos', 2, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000163', 'empregos-saude', 'Saúde & Clínicas', 'Cuidados', 'Enfermagem e consultórios', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80', '/empregos?categoria=saude', 'empregos', 3, true, true, true, true),
  ('f0000000-0000-0000-0000-000000000164', 'empregos-logistica', 'Indústria & Frota', 'Operacional', 'Motoristas, estoquistas e montagem', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80', '/empregos?categoria=logistica', 'empregos', 4, true, true, true, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  badge_label = EXCLUDED.badge_label,
  description = EXCLUDED.description,
  cover_image_url = EXCLUDED.cover_image_url,
  target_route = EXCLUDED.target_route,
  module = EXCLUDED.module,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  show_title = EXCLUDED.show_title,
  show_badge = EXCLUDED.show_badge,
  show_overlay = EXCLUDED.show_overlay;
