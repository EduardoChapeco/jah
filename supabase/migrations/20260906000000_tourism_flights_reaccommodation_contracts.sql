-- ========================================================================================
-- FASE 7: MÓDULOS DE MALHA AÉREA, REACOMODAÇÃO ANAC 400, CARNÊS E CERTIFICADO DE CONTRATO
-- ========================================================================================

-- 1. ITINERÁRIOS DE VOO
CREATE TABLE IF NOT EXISTS public.travel_flight_itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  trip_id uuid,
  title text NOT NULL DEFAULT 'Itinerário de Voo',
  version integer NOT NULL DEFAULT 1,
  itinerary_type text NOT NULL DEFAULT 'original',
  status text NOT NULL DEFAULT 'draft',
  total_duration_minutes integer DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. TRECHOS DE VOO (SEGMENTOS)
CREATE TABLE IF NOT EXISTS public.travel_flight_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  itinerary_id uuid NOT NULL REFERENCES public.travel_flight_itineraries(id) ON DELETE CASCADE,
  segment_order integer NOT NULL DEFAULT 1,
  airline_code text NOT NULL,
  airline_name text,
  flight_number text NOT NULL,
  origin_iata text NOT NULL,
  origin_city text,
  destination_iata text NOT NULL,
  destination_city text,
  departure_at timestamptz NOT NULL,
  arrival_at timestamptz NOT NULL,
  duration_minutes integer,
  cabin text NOT NULL DEFAULT 'economy',
  baggage text DEFAULT '1x 23kg',
  record_locator text,
  ticket_number text,
  airport_terminal text,
  aircraft_model text,
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. CASOS DE REACOMODAÇÃO DE VOO (CONTINGÊNCIA ANAC 400)
CREATE TABLE IF NOT EXISTS public.travel_flight_change_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  trip_id uuid,
  original_itinerary_id uuid REFERENCES public.travel_flight_itineraries(id) ON DELETE SET NULL,
  change_reason text NOT NULL DEFAULT 'schedule_change',
  priority text NOT NULL DEFAULT 'normal',
  workflow_status text NOT NULL DEFAULT 'pending_analysis',
  passenger_notes text,
  internal_notes text,
  anac_rights_summary jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. ALTERNATIVAS DE VOO PARA REACOMODAÇÃO
CREATE TABLE IF NOT EXISTS public.travel_flight_alternatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  change_case_id uuid NOT NULL REFERENCES public.travel_flight_change_cases(id) ON DELETE CASCADE,
  itinerary_id uuid REFERENCES public.travel_flight_itineraries(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'manual',
  is_selected boolean NOT NULL DEFAULT false,
  difference_summary text,
  cost_difference numeric(12,2) DEFAULT 0.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. CARNÊS E PARCELAS DE VIAGEM
CREATE TABLE IF NOT EXISTS public.travel_booking_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  trip_id uuid,
  client_id uuid,
  passenger_name text NOT NULL,
  installment_number integer NOT NULL DEFAULT 1,
  total_installments integer NOT NULL DEFAULT 1,
  amount numeric(12,2) NOT NULL DEFAULT 0.00,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  payment_method text,
  transaction_reference text,
  receipt_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. CERTIFICADOS DE CONTRATOS DIGITAIS E AUTENTICIDADE
CREATE TABLE IF NOT EXISTS public.travel_contract_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  serial text NOT NULL UNIQUE,
  token text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT 'Contrato de Prestação de Serviços Turísticos',
  parties_masked text NOT NULL,
  signer_name text,
  signer_cpf text,
  signer_ip text,
  signer_user_agent text,
  signed_at timestamptz,
  content_hash text NOT NULL,
  signed_hash text,
  issuer text NOT NULL DEFAULT 'JAH Turismo Autenticações',
  status text NOT NULL DEFAULT 'pending',
  contract_html text,
  geolocation jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE public.travel_flight_itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_flight_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_flight_change_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_flight_alternatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_booking_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_contract_certificates ENABLE ROW LEVEL SECURITY;

-- POLICIES MULTI-TENANT POR STORE_ID
DROP POLICY IF EXISTS "Staff access flight itineraries" ON public.travel_flight_itineraries;
CREATE POLICY "Staff access flight itineraries" ON public.travel_flight_itineraries
  FOR ALL USING (store_id IS NOT NULL);

DROP POLICY IF EXISTS "Staff access flight segments" ON public.travel_flight_segments;
CREATE POLICY "Staff access flight segments" ON public.travel_flight_segments
  FOR ALL USING (store_id IS NOT NULL);

DROP POLICY IF EXISTS "Staff access flight change cases" ON public.travel_flight_change_cases;
CREATE POLICY "Staff access flight change cases" ON public.travel_flight_change_cases
  FOR ALL USING (store_id IS NOT NULL);

DROP POLICY IF EXISTS "Staff access flight alternatives" ON public.travel_flight_alternatives;
CREATE POLICY "Staff access flight alternatives" ON public.travel_flight_alternatives
  FOR ALL USING (store_id IS NOT NULL);

DROP POLICY IF EXISTS "Staff access booking installments" ON public.travel_booking_installments;
CREATE POLICY "Staff access booking installments" ON public.travel_booking_installments
  FOR ALL USING (store_id IS NOT NULL);

DROP POLICY IF EXISTS "Staff access contract certificates" ON public.travel_contract_certificates;
CREATE POLICY "Staff access contract certificates" ON public.travel_contract_certificates
  FOR ALL USING (store_id IS NOT NULL);

-- POLICIES PÚBLICAS PARA TOKEN E SERIAL
DROP POLICY IF EXISTS "Public access contract by token" ON public.travel_contract_certificates;
CREATE POLICY "Public access contract by token" ON public.travel_contract_certificates
  FOR SELECT TO anon, authenticated
  USING (true);

-- RPC PÚBLICA DE VERIFICAÇÃO DE CERTIDÃO
CREATE OR REPLACE FUNCTION public.verify_travel_certificate(_serial text)
RETURNS TABLE (
  serial text,
  title text,
  parties_masked text,
  signed_at timestamptz,
  content_hash text,
  signed_hash text,
  issuer text,
  status text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.serial,
    c.title,
    c.parties_masked,
    c.signed_at,
    c.content_hash,
    c.signed_hash,
    c.issuer,
    c.status
  FROM public.travel_contract_certificates c
  WHERE upper(trim(c.serial)) = upper(trim(_serial))
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_travel_certificate(text) TO anon, authenticated;
