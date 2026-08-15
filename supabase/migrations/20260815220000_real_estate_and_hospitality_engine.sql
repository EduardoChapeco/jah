-- Migration: 20260815220000_real_estate_and_hospitality_engine.sql
-- Description: Motor canônico de Imóveis e Hospedagem por Temporada (Airbnb-style) com subcategorias (Aluguel, Venda, Temporada).

-- 1. Colunas especializadas de Imóveis e Hospedagem em classifieds
ALTER TABLE public.classifieds
ALTER COLUMN author_profile_id DROP NOT NULL;

ALTER TABLE public.classifieds
ADD COLUMN IF NOT EXISTS deal_type TEXT NOT NULL DEFAULT 'venda',
ADD COLUMN IF NOT EXISTS property_type TEXT,
ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS suites INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS parking_spots INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS area_sqm INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS max_guests INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS cleaning_fee_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rental_period TEXT DEFAULT 'mensal';

CREATE INDEX IF NOT EXISTS idx_classifieds_deal_type ON public.classifieds(deal_type) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_classifieds_property_type ON public.classifieds(property_type) WHERE status = 'active';

-- 2. Seeds Canônicos Reais para Imóveis (Venda, Aluguel Mensal e Hospedagem por Temporada)
DO $$
DECLARE
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id FROM public.profiles LIMIT 1;

  INSERT INTO public.classifieds (
    id, author_profile_id, category, deal_type, property_type, title, content, price_cents,
    rental_period, bedrooms, bathrooms, suites, parking_spots, area_sqm,
    amenities, max_guests, cleaning_fee_cents, images, whatsapp, contact_whatsapp,
    location_name, location_text, condition, negotiable, status
  ) VALUES
  (
    'e0000000-0000-0000-0000-000000000001',
    v_profile_id,
    'real_estate',
    'venda',
    'apartamento',
    'Apartamento Alto Padrão 3 Suítes com Varanda Gourmet — Jardim Itália',
    'Espetacular apartamento em andar alto com vista panorâmica definitiva. Conta com 3 suítes amplas, living integrado com churrasqueira a carvão, piso aquecido nos banheiros, automação residencial e 3 vagas de garagem paralelas.',
    125000000, -- R$ 1.250.000,00
    'mensal',
    3,
    4,
    3,
    3,
    168,
    ARRAY['Piscina Aquecida', 'Academia Completa', 'Varanda Gourmet', 'Automação', 'Portaria 24h', 'Salão de Festas'],
    6,
    0,
    ARRAY[
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80'
    ],
    '49991223344',
    '49991223344',
    'Jardim Itália — Chapecó',
    'Chapecó, SC',
    'new',
    true,
    'active'
  ),
  (
    'e0000000-0000-0000-0000-000000000002',
    v_profile_id,
    'real_estate',
    'aluguel',
    'casa',
    'Casa Contemporânea 3 Quartos com Quintal & Espaço Gourmet — Santa Maria',
    'Casa térrea moderna e recém-construída em rua tranquila e arborizada. Possui sala com pé direito duplo, cozinha gourmet com ilha, suíte master com closet, jardim privativo e garagem coberta para 2 carros.',
    380000, -- R$ 3.800,00/mês
    'mensal',
    3,
    2,
    1,
    2,
    145,
    ARRAY['Quintal Privativo', 'Churrasqueira', 'Ar Condicionado', 'Pet Friendly', 'Cerca Elétrica'],
    5,
    0,
    ARRAY[
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80'
    ],
    '49999334455',
    '49999334455',
    'Santa Maria — Chapecó',
    'Chapecó, SC',
    'new',
    false,
    'active'
  ),
  (
    'e0000000-0000-0000-0000-000000000003',
    v_profile_id,
    'real_estate',
    'temporada',
    'chale_sitio',
    'Chalé dos Vales com Jacuzzi Aquecida & Vista para as Montanhas — Vale do Uruguai',
    'Hospedagem exclusiva estilo Airbnb para casais e pequenas famílias. Deck panorâmico com jacuzzi aquecida sob as estrelas, lareira a lenha, cama queen com lençóis de algodão egípcio, adega climatizada e café da manhã artesanal incluso.',
    48000, -- R$ 480,00 / diária
    'diaria',
    1,
    1,
    1,
    2,
    65,
    ARRAY['Jacuzzi Aquecida', 'Lareira a Lenha', 'Wi-Fi 500MB', 'Café da Manhã Incluso', 'Cozinha Completa', 'Vista Panorâmica', 'Adega'],
    3,
    12000, -- Taxa de limpeza: R$ 120,00
    ARRAY[
      'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=1200&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80'
    ],
    '49998112299',
    '49998112299',
    'Vale do Rio Uruguai — Chapecó / Goio-Ên',
    'Chapecó, SC',
    'new',
    false,
    'active'
  ),
  (
    'e0000000-0000-0000-0000-000000000004',
    v_profile_id,
    'real_estate',
    'temporada',
    'flat_studio',
    'Studio Executive Smart Home no Centro de Chapecó com Garagem & Wi-Fi Rápido',
    'Apartamento estúdio totalmente equipado para viagens de negócios, eventos na Efapi ou estadias curtas. Check-in 100% autônomo por fechadura digital, workstation ergonômica com Wi-Fi 600MB, ar condicionado inverter e enxoval completo.',
    21000, -- R$ 210,00 / diária
    'diaria',
    1,
    1,
    0,
    1,
    38,
    ARRAY['Fechadura Digital', 'Wi-Fi 600MB', 'Smart TV 50"', 'Workstation', 'Ar Condicionado', 'Garagem Coberta', 'Máquina Lava e Seca'],
    2,
    8000, -- Taxa de limpeza: R$ 80,00
    ARRAY[
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80'
    ],
    '49998812233',
    '49998812233',
    'Centro — Chapecó',
    'Chapecó, SC',
    'new',
    false,
    'active'
  ),
  (
    'e0000000-0000-0000-0000-000000000005',
    v_profile_id,
    'real_estate',
    'aluguel',
    'comercial',
    'Sala Comercial Corporativa 72m² no Edifício Plaza — Centro',
    'Sala pronta para escritórios de tecnologia, advocacia ou consultórios. Conta com recepção montada, 2 salas de atendimento, copa privativa, lavabo e 1 vaga de garagem privativa.',
    280000, -- R$ 2.800,00/mês
    'mensal',
    0,
    1,
    0,
    1,
    72,
    ARRAY['Recepção', 'Ar Condicionado Central', 'Elevador Inteligente', 'Portaria e Catracas', 'Copa'],
    10,
    0,
    ARRAY[
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80'
    ],
    '49991223344',
    '49991223344',
    'Centro — Chapecó',
    'Chapecó, SC',
    'new',
    true,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    deal_type = EXCLUDED.deal_type,
    property_type = EXCLUDED.property_type,
    bedrooms = EXCLUDED.bedrooms,
    bathrooms = EXCLUDED.bathrooms,
    suites = EXCLUDED.suites,
    parking_spots = EXCLUDED.parking_spots,
    area_sqm = EXCLUDED.area_sqm,
    amenities = EXCLUDED.amenities,
    max_guests = EXCLUDED.max_guests,
    cleaning_fee_cents = EXCLUDED.cleaning_fee_cents,
    rental_period = EXCLUDED.rental_period;
END $$;
