-- Migration: 20260815200000_booking_categories_and_real_services.sql
-- Description: Adiciona segmentação categórica estrita a booking_services (Barbearia, Salão, Unhas, Estética) e dados canônicos reais.

-- 1. Colunas de Categoria e Segmento de Gênero em booking_services
ALTER TABLE public.booking_services
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'geral',
ADD COLUMN IF NOT EXISTS gender_target TEXT NOT NULL DEFAULT 'todos',
ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE INDEX IF NOT EXISTS idx_booking_services_category ON public.booking_services(category) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_booking_services_gender ON public.booking_services(gender_target) WHERE status = 'active';

-- 2. Seeds Canônicos Reais para Barbearias, Salões, Manicures e Estéticas
DO $$
DECLARE
  v_store_id UUID;
BEGIN
  -- Busca ou cria uma loja de referência para serviços
  SELECT id INTO v_store_id FROM public.stores LIMIT 1;
  
  IF v_store_id IS NOT NULL THEN
    -- BARBEARIA & MASCULINO
    INSERT INTO public.booking_services (
      id, store_id, title, description, duration_minutes, price_cents, category, gender_target, status
    ) VALUES
    (
      'd0000000-0000-0000-0000-000000000001',
      v_store_id,
      'Corte de Cabelo Masculino & Fade/Degradê',
      'Corte personalizado com visagismo, máquina e tesoura, finalização com pomada matte e lavagem com massagem capilar.',
      40,
      5500,
      'barbearia',
      'masculino',
      'active'
    ),
    (
      'd0000000-0000-0000-0000-000000000002',
      v_store_id,
      'Barba Terapia Tradicional com Toalha Quente',
      'Alinhamento e modelagem da barba com navalha, aplicação de toalha quente, óleos essenciais hidratantes e pós-barba refrescante.',
      35,
      4500,
      'barbearia',
      'masculino',
      'active'
    ),
    (
      'd0000000-0000-0000-0000-000000000003',
      v_store_id,
      'Combo Completo: Cabelo + Barba + Sobrancelha',
      'Experiência completa de barbearia com corte, barboterapia com toalha quente e alinhamento de sobrancelha com navalhete.',
      70,
      9000,
      'barbearia',
      'masculino',
      'active'
    ),

    -- SALÃO & CABELO FEMININO
    (
      'd0000000-0000-0000-0000-000000000004',
      v_store_id,
      'Corte Feminino com Visagismo & Escova',
      'Análise de formato de rosto, corte contemporâneo (camadas, reto, bob ou long bob), lavagem com shampoo premium e escova modelada.',
      60,
      12000,
      'salao_cabelo',
      'feminino',
      'active'
    ),
    (
      'd0000000-0000-0000-0000-000000000005',
      v_store_id,
      'Tratamento Cronograma Capilar & Nutrição Profunda',
      'Tratamento intensivo com máscaras importadas (Kérastase/Wella) para recuperação de fios danificados, ressecados ou pós-química.',
      50,
      15000,
      'salao_cabelo',
      'feminino',
      'active'
    ),
    (
      'd0000000-0000-0000-0000-000000000006',
      v_store_id,
      'Mechas Iluminadas / Balayage & Tonalização',
      'Técnica de morena iluminada ou loiro dos sonhos com produtos de descoloração sem agressão, tonalização e reconstrução.',
      180,
      38000,
      'salao_cabelo',
      'feminino',
      'active'
    ),

    -- UNHAS & MANICURE
    (
      'd0000000-0000-0000-0000-000000000007',
      v_store_id,
      'Manicure & Pedicure Clássica com Spa dos Pés',
      'Cutilagem perfeita, esfoliação com sais minerais, massagem relaxante nos pés e esmaltação impecável de alta durabilidade.',
      60,
      7500,
      'unhas_manicure',
      'feminino',
      'active'
    ),
    (
      'd0000000-0000-0000-0000-000000000008',
      v_store_id,
      'Alongamento em Gel com Fibra de Vidro (Aplicação)',
      'Extensão de unhas resistentes e com aspecto natural em fibra de vidro, formato personalizado (amendoada, quadrada ou stiletto).',
      120,
      18000,
      'unhas_manicure',
      'feminino',
      'active'
    ),

    -- ESTÉTICA & MASSAGEM
    (
      'd0000000-0000-0000-0000-000000000009',
      v_store_id,
      'Limpeza de Pele Profunda com Peeling Ultrassônico',
      'Higienização, emoliência, extração de cravos sem dor, alta frequência bactericida, máscara calmante e hidratação profunda.',
      75,
      14000,
      'estetica_massagem',
      'unissex',
      'active'
    ),
    (
      'd0000000-0000-0000-0000-000000000010',
      v_store_id,
      'Massagem Relaxante com Pedras Quentes e Aromaterapia',
      'Sessão terapêutica de 60 minutos para alívio de tensões musculares, estresse e ansiedade com óleos essenciais puros e pedras vulcânicas.',
      60,
      16000,
      'estetica_massagem',
      'unissex',
      'active'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
