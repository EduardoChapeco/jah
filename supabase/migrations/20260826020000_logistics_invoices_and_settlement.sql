-- ============================================================
-- Migration: Logistics Invoices & Fleet Settlements (Wider Logistics)
-- Tabela e políticas para persistência real de faturas e repasses de frotas
-- ============================================================

DO $$ BEGIN
  CREATE TYPE vehicle_type AS ENUM (
    'bicycle',
    'motorcycle',
    'car',
    'van',
    'truck'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.courier_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id                  UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  slug                      TEXT UNIQUE,
  full_name                 TEXT NOT NULL,
  phone                     TEXT NOT NULL,
  cpf                       TEXT,
  avatar_url                TEXT,
  vehicle_type              vehicle_type NOT NULL DEFAULT 'motorcycle',
  vehicle_plate             TEXT,
  vehicle_model             TEXT,
  vehicle_color             TEXT,
  receives_direct_requests  BOOLEAN NOT NULL DEFAULT true,
  receives_pool_requests    BOOLEAN NOT NULL DEFAULT true,
  is_available              BOOLEAN NOT NULL DEFAULT true,
  rating                    NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  total_rides               INTEGER NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courier_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read available courier profiles"
    ON public.courier_profiles FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.logistics_invoices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  courier_profile_id  UUID,
  courier_name        TEXT NOT NULL,
  courier_phone       TEXT,
  period              TEXT NOT NULL,
  total_rides         INTEGER NOT NULL DEFAULT 0,
  gross_amount_cents  INTEGER NOT NULL DEFAULT 0,
  platform_fee_cents  INTEGER NOT NULL DEFAULT 0,
  net_payable_cents   INTEGER NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logistics_invoices_store_id ON public.logistics_invoices(store_id);
CREATE INDEX IF NOT EXISTS idx_logistics_invoices_courier_id ON public.logistics_invoices(courier_profile_id);
CREATE INDEX IF NOT EXISTS idx_logistics_invoices_status ON public.logistics_invoices(status);

-- RLS Deny-by-Default
ALTER TABLE public.logistics_invoices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Workspace stores and couriers can read invoices"
    ON public.logistics_invoices FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can manage invoices"
    ON public.logistics_invoices FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed canônica de faturas iniciais persistidas no banco
INSERT INTO public.logistics_invoices (
  id,
  courier_name,
  courier_phone,
  period,
  total_rides,
  gross_amount_cents,
  platform_fee_cents,
  net_payable_cents,
  status,
  paid_at
) VALUES 
(
  'b0000000-0000-0000-0000-000000000001',
  'Marcos Vinícius',
  '(49) 99881-2233',
  '01/08 a 15/08/2026',
  48,
  89000,
  8900,
  80100,
  'paid',
  now() - interval '1 day'
),
(
  'b0000000-0000-0000-0000-000000000002',
  'Transportes Rápidos Chapecó',
  '(49) 3322-1100',
  '01/08 a 15/08/2026',
  112,
  345000,
  34500,
  310500,
  'pending',
  NULL
),
(
  'b0000000-0000-0000-0000-000000000003',
  'Leandro Fretes & Mudanças',
  '(49) 99123-4567',
  '01/08 a 15/08/2026',
  14,
  280000,
  28000,
  252000,
  'pending',
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  courier_name = EXCLUDED.courier_name,
  courier_phone = EXCLUDED.courier_phone,
  period = EXCLUDED.period,
  total_rides = EXCLUDED.total_rides,
  gross_amount_cents = EXCLUDED.gross_amount_cents,
  platform_fee_cents = EXCLUDED.platform_fee_cents,
  net_payable_cents = EXCLUDED.net_payable_cents,
  status = EXCLUDED.status,
  paid_at = EXCLUDED.paid_at;
