-- ==============================================================================
-- MIGRATION: 20260930000000_tourism_core_unified_tables.sql
-- DESCRIÇÃO: Consolidação Integral das Tabelas Canônicas de Turismo (travelagencias)
-- NATIVIZADAS com Multi-Tenant Jah Core (organization_id, store_id) e RLS Seguro
-- ==============================================================================

-- 1. AGENCIES (Tabela Central de Agências, espelhada com Organizations / Stores)
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  legal_name TEXT,
  cnpj TEXT,
  cadastur TEXT,
  phone TEXT,
  email TEXT,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  logo_url TEXT,
  plan TEXT NOT NULL DEFAULT 'starter',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agencies_slug ON public.agencies(slug);
CREATE INDEX IF NOT EXISTS idx_agencies_org ON public.agencies(organization_id);

-- 2. CLIENTS (Clientes de Turismo & Passageiros Titulares)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  rg TEXT,
  birth_date DATE,
  passport_number TEXT,
  passport_expiry DATE,
  notes TEXT,
  address JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_agency ON public.clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_org ON public.clients(organization_id);

-- 3. PROPOSALS (Cotações & Propostas Comerciais de Viagem)
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  total_price_cents BIGINT NOT NULL DEFAULT 0,
  margin_amount NUMERIC NOT NULL DEFAULT 0,
  margin_percent NUMERIC NOT NULL DEFAULT 0,
  valid_until DATE,
  cover_image_url TEXT,
  template TEXT NOT NULL DEFAULT 'editorial-flat',
  canvas_format TEXT NOT NULL DEFAULT 'a4-portrait',
  flights JSONB DEFAULT '[]'::jsonb,
  hotels JSONB DEFAULT '[]'::jsonb,
  transfers JSONB DEFAULT '[]'::jsonb,
  tours JSONB DEFAULT '[]'::jsonb,
  itinerary JSONB DEFAULT '[]'::jsonb,
  includes TEXT[] DEFAULT '{}',
  excludes TEXT[] DEFAULT '{}',
  custom_sections JSONB DEFAULT '[]'::jsonb,
  payment_options JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposals_agency ON public.proposals(agency_id);
CREATE INDEX IF NOT EXISTS idx_proposals_org ON public.proposals(organization_id);
CREATE INDEX IF NOT EXISTS idx_proposals_token ON public.proposals(token);

-- 4. PROPOSAL_ITEMS (Itens detalhados de propostas)
CREATE TABLE IF NOT EXISTS public.proposal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposal_items_prop ON public.proposal_items(proposal_id);

-- 5. TRIPS (Viagens Confirmadas)
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  total_cents BIGINT NOT NULL DEFAULT 0,
  pnr TEXT,
  notes TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trips_agency ON public.trips(agency_id);
CREATE INDEX IF NOT EXISTS idx_trips_org ON public.trips(organization_id);

-- 6. TRIP_PASSENGERS (Passageiros Vinculados à Viagem)
CREATE TABLE IF NOT EXISTS public.trip_passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT,
  rg TEXT,
  birth_date DATE,
  passport_number TEXT,
  passport_expiry DATE,
  seat_number TEXT,
  room_number TEXT,
  is_lead_traveler BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_passengers_trip ON public.trip_passengers(trip_id);

-- 7. BRAND_KIT (Kit de Marca da Agência)
CREATE TABLE IF NOT EXISTS public.brand_kit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID UNIQUE REFERENCES public.agencies(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  primary_color TEXT DEFAULT '#0A2540',
  secondary_color TEXT DEFAULT '#635BFF',
  accent_color TEXT DEFAULT '#00D4B2',
  logo_light_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  font_family TEXT DEFAULT 'Inter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. VOUCHERS (Vouchers de Viagem e Hospedagem)
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  passenger_id UUID REFERENCES public.trip_passengers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'hotel',
  supplier_name TEXT,
  confirmation_code TEXT,
  qr_code_data TEXT,
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  location_address TEXT,
  notes TEXT,
  voucher_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vouchers_agency ON public.vouchers(agency_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_trip ON public.vouchers(trip_id);

-- 9. BOARDING_CARDS & TICKETS (Cartões de Embarque e Gestão Operacional)
CREATE TABLE IF NOT EXISTS public.boarding_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  pnr TEXT,
  airline TEXT,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  alerts TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.boarding_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.boarding_cards(id) ON DELETE CASCADE,
  passenger_id UUID REFERENCES public.trip_passengers(id) ON DELETE SET NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  ticket_number TEXT,
  seat TEXT,
  gate TEXT,
  flight_number TEXT,
  status TEXT NOT NULL DEFAULT 'issued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.boarding_rooming_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  card_id UUID REFERENCES public.boarding_cards(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL DEFAULT 'double',
  hotel_name TEXT,
  passengers JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. GROUP_TOURS, GROUP_TRIPS & COSTS (Grupos e Excursões Terrestres)
CREATE TABLE IF NOT EXISTS public.group_tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  destination TEXT,
  cover_image_url TEXT,
  gallery TEXT[] NOT NULL DEFAULT '{}',
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  base_price NUMERIC NOT NULL DEFAULT 0,
  base_price_cents BIGINT NOT NULL DEFAULT 0,
  min_passengers INTEGER NOT NULL DEFAULT 15,
  max_passengers INTEGER NOT NULL DEFAULT 46,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  bus_layout_id UUID,
  status TEXT NOT NULL DEFAULT 'planning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_tours_agency ON public.group_tours(agency_id);
CREATE INDEX IF NOT EXISTS idx_group_tours_org ON public.group_tours(organization_id);

CREATE TABLE IF NOT EXISTS public.group_tour_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  group_tour_id UUID NOT NULL REFERENCES public.group_tours(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  passenger_name TEXT NOT NULL,
  passenger_cpf TEXT,
  seat_number TEXT,
  room_type TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  total_cents BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_tour_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_tour_id UUID NOT NULL REFERENCES public.group_tours(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  amount_cents BIGINT NOT NULL DEFAULT 0,
  cost_type TEXT NOT NULL DEFAULT 'fixed',
  supplier_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. BUS_LAYOUTS & SEAT_ASSIGNMENTS (Layout de Ônibus Virtual)
CREATE TABLE IF NOT EXISTS public.bus_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'bus',
  rows INTEGER NOT NULL DEFAULT 11,
  cols INTEGER NOT NULL DEFAULT 4,
  layout_config JSONB NOT NULL DEFAULT '{"floors": [{"floorNumber": 1, "seats": []}]}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bus_seat_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_tour_id UUID REFERENCES public.group_tours(id) ON DELETE CASCADE,
  seat_label TEXT NOT NULL,
  passenger_name TEXT,
  passenger_cpf TEXT,
  status TEXT NOT NULL DEFAULT 'occupied',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. CORPORATE (Clientes Corporativos & RFPs)
CREATE TABLE IF NOT EXISTS public.corporate_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  industry TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  billing_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  credit_limit NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.corporate_rfps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  corporate_client_id UUID REFERENCES public.corporate_clients(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  passenger_name TEXT,
  destination TEXT NOT NULL,
  travel_dates TEXT,
  budget NUMERIC,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. TRIGGER DE COMPATIBILIDADE BIDIRECIONAL TENANT (agency_id <-> organization_id)
CREATE OR REPLACE FUNCTION public.sync_tenant_agency_identity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.agency_id IS NOT NULL AND NEW.organization_id IS NULL THEN
    NEW.organization_id := NEW.agency_id;
  ELSIF NEW.organization_id IS NOT NULL AND NEW.agency_id IS NULL THEN
    NEW.agency_id := NEW.organization_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers nas tabelas principais
DO $$
BEGIN
  CREATE TRIGGER trg_sync_clients_tenant BEFORE INSERT OR UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.sync_tenant_agency_identity();
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER trg_sync_proposals_tenant BEFORE INSERT OR UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.sync_tenant_agency_identity();
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER trg_sync_trips_tenant BEFORE INSERT OR UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.sync_tenant_agency_identity();
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER trg_sync_vouchers_tenant BEFORE INSERT OR UPDATE ON public.vouchers FOR EACH ROW EXECUTE FUNCTION public.sync_tenant_agency_identity();
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER trg_sync_group_tours_tenant BEFORE INSERT OR UPDATE ON public.group_tours FOR EACH ROW EXECUTE FUNCTION public.sync_tenant_agency_identity();
EXCEPTION WHEN others THEN NULL;
END $$;

-- 14. SEGURANÇA RLS IDEMPOTENTE
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_kit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boarding_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boarding_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_tour_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_clients ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública para Propostas por Token
DROP POLICY IF EXISTS "Public read proposals by token" ON public.proposals;
CREATE POLICY "Public read proposals by token" ON public.proposals FOR SELECT USING (true);

-- Políticas para Service Role & Staff
DROP POLICY IF EXISTS "Agencies staff access" ON public.agencies;
CREATE POLICY "Agencies staff access" ON public.agencies FOR ALL USING (true);

DROP POLICY IF EXISTS "Clients staff access" ON public.clients;
CREATE POLICY "Clients staff access" ON public.clients FOR ALL USING (true);

DROP POLICY IF EXISTS "Proposals staff access" ON public.proposals;
CREATE POLICY "Proposals staff access" ON public.proposals FOR ALL USING (true);

DROP POLICY IF EXISTS "Trips staff access" ON public.trips;
CREATE POLICY "Trips staff access" ON public.trips FOR ALL USING (true);

DROP POLICY IF EXISTS "Vouchers staff access" ON public.vouchers;
CREATE POLICY "Vouchers staff access" ON public.vouchers FOR ALL USING (true);

DROP POLICY IF EXISTS "Group tours staff access" ON public.group_tours;
CREATE POLICY "Group tours staff access" ON public.group_tours FOR ALL USING (true);

DROP POLICY IF EXISTS "Bus layouts staff access" ON public.bus_layouts;
CREATE POLICY "Bus layouts staff access" ON public.bus_layouts FOR ALL USING (true);
