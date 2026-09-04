-- ==============================================================================
-- MIGRATION: 20260905000000_tourism_enterprise_transfusion_modules.sql
-- Módulos Transfundidos de TravelAgencias & TurisAgencias:
-- Fornecedores (Suppliers), Vistos (Visas), Vouchers, Kanban de Embarques e Formulários
-- ==============================================================================

-- 1. Tabela: travel_suppliers (Fornecedores, DMCs, Operadoras, Cias Aéreas)
CREATE TABLE IF NOT EXISTS public.travel_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  legal_name TEXT,
  kind TEXT NOT NULL DEFAULT 'operator', -- operator, airline, hotel, car_rental, insurance, transfer, visa, other
  document TEXT,
  commission_rate NUMERIC DEFAULT 0,
  notes TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Brasil',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela: travel_visas (Processos de Vistos Consulares & Passaportes)
CREATE TABLE IF NOT EXISTS public.travel_visas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  client_id UUID,
  client_name TEXT NOT NULL,
  client_passport TEXT,
  country TEXT NOT NULL,
  visa_category TEXT NOT NULL DEFAULT 'Turismo',
  status TEXT NOT NULL DEFAULT 'coleta_documentos', -- coleta_documentos, formulario_preenchido, entrevista_agendada, em_analise_consular, aprovado, negado
  interview_date TIMESTAMPTZ,
  expected_date TIMESTAMPTZ,
  documents JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela: travel_vouchers (Vouchers de Embarque, Hospedagem e Transfers)
CREATE TABLE IF NOT EXISTS public.travel_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  trip_id UUID,
  voucher_number TEXT NOT NULL UNIQUE,
  voucher_type TEXT NOT NULL DEFAULT 'flight', -- flight, hotel, transfer, package, insurance, tour
  title TEXT NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_document TEXT,
  qr_code_hash TEXT,
  flight_data JSONB DEFAULT '{}'::jsonb,
  hotel_data JSONB DEFAULT '{}'::jsonb,
  transfer_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'issued', -- draft, issued, used, cancelled
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela: travel_departures_kanban (Kanban Operacional de Embarques e Pós-Venda)
CREATE TABLE IF NOT EXISTS public.travel_departures_kanban (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  trip_id UUID,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  destination TEXT NOT NULL,
  departure_date TIMESTAMPTZ NOT NULL,
  return_date TIMESTAMPTZ,
  stage TEXT NOT NULL DEFAULT 'booked', -- booked, vouchers_ready, checkin_48h, traveling, post_trip, completed
  passengers_count INT DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabela: traveler_forms (Formulário Público do Passageiro / Coleta Segura)
CREATE TABLE IF NOT EXISTS public.traveler_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  trip_id UUID,
  full_name TEXT,
  cpf TEXT,
  rg TEXT,
  birth_date DATE,
  gender TEXT,
  nationality TEXT DEFAULT 'Brasileira',
  passport_number TEXT,
  passport_expiry DATE,
  phone TEXT,
  email TEXT,
  emergency_name TEXT,
  emergency_phone TEXT,
  seat_preference TEXT,
  meal_preference TEXT,
  special_needs TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitação de RLS
ALTER TABLE public.travel_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_visas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_departures_kanban ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traveler_forms ENABLE ROW LEVEL SECURITY;

-- Políticas Idempotentes
DO $$
BEGIN
  -- travel_suppliers
  DROP POLICY IF EXISTS "travel_suppliers_store_manage" ON public.travel_suppliers;
  CREATE POLICY "travel_suppliers_store_manage" ON public.travel_suppliers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "travel_suppliers_anon_read" ON public.travel_suppliers;
  CREATE POLICY "travel_suppliers_anon_read" ON public.travel_suppliers
    FOR SELECT TO anon USING (true);

  -- travel_visas
  DROP POLICY IF EXISTS "travel_visas_store_manage" ON public.travel_visas;
  CREATE POLICY "travel_visas_store_manage" ON public.travel_visas
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- travel_vouchers
  DROP POLICY IF EXISTS "travel_vouchers_store_manage" ON public.travel_vouchers;
  CREATE POLICY "travel_vouchers_store_manage" ON public.travel_vouchers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "travel_vouchers_public_read" ON public.travel_vouchers;
  CREATE POLICY "travel_vouchers_public_read" ON public.travel_vouchers
    FOR SELECT TO anon USING (status IN ('issued', 'used'));

  -- travel_departures_kanban
  DROP POLICY IF EXISTS "travel_departures_kanban_store_manage" ON public.travel_departures_kanban;
  CREATE POLICY "travel_departures_kanban_store_manage" ON public.travel_departures_kanban
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- traveler_forms
  DROP POLICY IF EXISTS "traveler_forms_store_manage" ON public.traveler_forms;
  CREATE POLICY "traveler_forms_store_manage" ON public.traveler_forms
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "traveler_forms_public_access" ON public.traveler_forms;
  CREATE POLICY "traveler_forms_public_access" ON public.traveler_forms
    FOR ALL TO anon USING (true) WITH CHECK (true);
END $$;
