-- ============================================================
-- MIGRATION: Criar tabela logistics_price_tables com RLS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.logistics_price_tables (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  service_type text NOT NULL CHECK (service_type IN (
    'ride_car', 'ride_moto', 'delivery_express', 'moving_truck', 'freight_van'
  )),
  base_fee_cents integer NOT NULL DEFAULT 0,
  km_rate_cents integer NOT NULL DEFAULT 0,
  minute_rate_cents integer NOT NULL DEFAULT 0,
  helper_fee_cents integer NOT NULL DEFAULT 0,
  min_fare_cents integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS logistics_price_tables_store_idx ON public.logistics_price_tables (store_id, is_active);

-- Habilitar RLS
ALTER TABLE public.logistics_price_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_price_tables FORCE ROW LEVEL SECURITY;

-- Leitura pública para cálculo de frete / cotação
DROP POLICY IF EXISTS "logistics_price_tables_select" ON public.logistics_price_tables;
CREATE POLICY "logistics_price_tables_select" ON public.logistics_price_tables
  FOR SELECT USING (true);

-- Escrita restrita ao owner/admin da store ou platform_admin
DROP POLICY IF EXISTS "logistics_price_tables_write" ON public.logistics_price_tables;
CREATE POLICY "logistics_price_tables_write" ON public.logistics_price_tables
  FOR ALL USING (
    public.is_platform_admin() OR
    store_id = ANY(public.auth_user_store_ids())
  );

-- Revogar grants de anon
REVOKE INSERT, UPDATE, DELETE ON public.logistics_price_tables FROM anon;
