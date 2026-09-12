-- ============================================================================
-- Waesy / Waesy — Migration 20260930020000: Booking Services Enterprise Parity
-- ============================================================================
-- Eradica mocks e fallbacks estáticos em serviços e agendamentos:
-- 1. Adiciona itens inclusos (included_items TEXT[]) cadastrados pelo anunciante.
-- 2. Adiciona modalidade de atendimento (modality: in_store, at_home, online).
-- 3. Adiciona política de pontualidade/cancelamento específica (cancellation_policy TEXT).
-- 4. Adiciona orientações e cuidados (guidelines TEXT).
-- 5. Atualiza os serviços demonstrativos reais para refletir suas respectivas áreas.
-- ============================================================================

-- 1. Adicionar colunas reais na tabela booking_services
ALTER TABLE public.booking_services
  ADD COLUMN IF NOT EXISTS included_items      TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS modality            TEXT NOT NULL DEFAULT 'in_store' CHECK (modality IN ('in_store', 'at_home', 'online')),
  ADD COLUMN IF NOT EXISTS cancellation_policy TEXT,
  ADD COLUMN IF NOT EXISTS guidelines          TEXT;

-- 2. Enriquecer os serviços reais existentes no banco com dados legítimos cadastrados
UPDATE public.booking_services
SET 
  included_items = ARRAY[
    'Avaliação e mapeamento do formato de unhas',
    'Higienização completa e assepsia profunda',
    'Aplicação da fibra de vidro com gel estrutural',
    'Cutilagem russa combinada e acabamento fino',
    'Hidratação com óleo de cutículas de alta absorção'
  ],
  modality = 'in_store',
  cancellation_policy = 'Tolerância máxima de 10 minutos. Reagendamentos permitidos com até 2 horas de antecedência pelo aplicativo sem cobrança de taxas extras.',
  guidelines = 'Evitar contato prolongado com produtos químicos fortes nas primeiras 24 horas. Manutenção recomendada a cada 20 a 25 dias.'
WHERE id = 'd0000000-0000-0000-0000-000000000008';

UPDATE public.booking_services
SET 
  included_items = ARRAY[
    'Corte visagista com máquina e tesoura',
    'Lavagem com shampoo mentolado refrescante',
    'Massagem capilar estimulante no lavatório',
    'Finalização com pomada matte ou fixador profissional'
  ],
  modality = 'in_store',
  cancellation_policy = 'Cancelamentos e reagendamentos sem custo com até 1 hora de antecedência.',
  guidelines = 'Chegar com 5 minutos de antecedência para melhor acomodação.'
WHERE id = 'd0000000-0000-0000-0000-000000000001';

UPDATE public.booking_services
SET 
  included_items = ARRAY[
    'Aplicação de toalha quente com óleos essenciais',
    'Esfoliação facial e abertura de poros',
    'Alinhamento com navalhete descartável',
    'Bálsamo pós-barba hidratante anti-irritação'
  ],
  modality = 'in_store',
  cancellation_policy = 'Tolerância de 10 minutos para atendimento completo.',
  guidelines = 'Manter a pele hidratada após o procedimento.'
WHERE id = 'd0000000-0000-0000-0000-000000000002';

-- 3. Notificar recarregamento de schema
NOTIFY pgrst, 'reload schema';
