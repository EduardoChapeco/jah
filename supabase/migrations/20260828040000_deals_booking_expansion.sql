-- Migration: Deals Booking Expansion
-- Protocolo V3 - Adição de suporte a Locações por Temporada (Silent Gap Fix)

-- 1. Adicionar novas colunas em deals
ALTER TABLE public.deals 
  ADD COLUMN IF NOT EXISTS nights_count INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS daily_rate_cents BIGINT,
  ADD COLUMN IF NOT EXISTS cleaning_fee_cents BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_price_cents BIGINT,
  ADD COLUMN IF NOT EXISTS guests_count INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_direct_booking BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS booking_status TEXT 
    CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed'));

-- 2. Atualizar a constraint de event_type na tabela deal_events
-- O PostgreSQL exige remover a constraint antiga e criar uma nova
ALTER TABLE public.deal_events
  DROP CONSTRAINT IF EXISTS deal_events_event_type_check;

ALTER TABLE public.deal_events
  ADD CONSTRAINT deal_events_event_type_check 
  CHECK (event_type IN (
    'message', 
    'proposal', 
    'counter_proposal', 
    'accept', 
    'reject', 
    'cancel', 
    'contract_created',
    'direct_booking',
    'confirm_dates'
  ));
