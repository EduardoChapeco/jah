-- Migration: 20260815250000_real_estate_maintenance_and_pudo_network.sql
-- Motor de Chamados de Manutenção Imobiliária & Rede de Pontos de Retirada (PUDO Pick Up & Drop Off)

-- 1. TABELA DE CHAMADOS DE MANUTENÇÃO IMOBILIÁRIA (property_maintenance_requests)
CREATE TABLE IF NOT EXISTS public.property_maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.classifieds(id) ON DELETE CASCADE,
  tenant_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  landlord_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'hidraulica' CHECK (category IN ('hidraulica', 'eletrica', 'alvenaria', 'pintura', 'eletrodomesticos', 'telhado', 'outros')),
  urgency TEXT NOT NULL DEFAULT 'media' CHECK (urgency IN ('baixa', 'media', 'alta', 'emergencia')),
  description TEXT NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'quote_approved', 'in_progress', 'resolved', 'cancelled')),
  estimated_cost_cents BIGINT,
  resolved_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maint_property ON public.property_maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_maint_tenant ON public.property_maintenance_requests(tenant_profile_id);
CREATE INDEX IF NOT EXISTS idx_maint_landlord ON public.property_maintenance_requests(landlord_profile_id);

-- 2. TABELA DE PONTOS DE RETIRADA PARCEIROS (pudo_partner_locations)
CREATE TABLE IF NOT EXISTS public.pudo_partner_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Chapecó',
  state TEXT NOT NULL DEFAULT 'SC',
  lat NUMERIC(10, 6),
  lng NUMERIC(10, 6),
  opening_hours TEXT NOT NULL DEFAULT 'Segunda a Sábado: 08h às 19h',
  fee_per_package_cents INTEGER NOT NULL DEFAULT 250,
  max_storage_capacity INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pudo_store ON public.pudo_partner_locations(store_id);

-- 3. TABELA DE PACOTES NO PONTO DE COLETA / RETIRADA (pudo_packages)
CREATE TABLE IF NOT EXISTS public.pudo_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  pudo_location_id UUID NOT NULL REFERENCES public.pudo_partner_locations(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_document TEXT,
  security_pickup_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_transit' CHECK (status IN ('in_transit', 'received_at_hub', 'ready_for_pickup', 'delivered_to_customer', 'overdue', 'return_requested', 'returned_to_hub')),
  received_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  picked_up_at TIMESTAMPTZ,
  has_damage BOOLEAN NOT NULL DEFAULT false,
  damage_notes TEXT,
  damage_photos TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pudo_packages_location ON public.pudo_packages(pudo_location_id);
CREATE INDEX IF NOT EXISTS idx_pudo_packages_tracking ON public.pudo_packages(tracking_code);
CREATE INDEX IF NOT EXISTS idx_pudo_packages_status ON public.pudo_packages(status);

-- 4. POLICIES RLS (Deny-by-default)
ALTER TABLE public.property_maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pudo_partner_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pudo_packages ENABLE ROW LEVEL SECURITY;

-- Manutenção RLS
CREATE POLICY "Leitura de chamados por inquilino ou proprietário"
  ON public.property_maintenance_requests FOR SELECT
  TO authenticated
  USING (
    auth.uid() = tenant_profile_id 
    OR auth.uid() = landlord_profile_id
    OR EXISTS (
      SELECT 1 FROM public.classifieds c
      WHERE c.id = property_id AND c.author_profile_id = auth.uid()
    )
  );

CREATE POLICY "Inquilinos criam chamados"
  ON public.property_maintenance_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Atualização de chamados por proprietário ou inquilino"
  ON public.property_maintenance_requests FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = tenant_profile_id 
    OR auth.uid() = landlord_profile_id
    OR EXISTS (
      SELECT 1 FROM public.classifieds c
      WHERE c.id = property_id AND c.author_profile_id = auth.uid()
    )
  );

-- PUDO Locations RLS
CREATE POLICY "Leitura pública de pontos de retirada ativos"
  ON public.pudo_partner_locations FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Lojistas gerenciam seus pontos de retirada"
  ON public.pudo_partner_locations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = pudo_partner_locations.store_id
    )
  );

-- PUDO Packages RLS
CREATE POLICY "Lojistas gerenciam pacotes do seu ponto PUDO"
  ON public.pudo_packages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pudo_partner_locations l
      WHERE l.id = pudo_packages.pudo_location_id
    )
  );

-- Seeds Canônicos com UUIDs hex válidos
DO $$
DECLARE
  v_store_id UUID;
  v_property_id UUID;
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_store_id FROM public.stores LIMIT 1;
  SELECT id INTO v_property_id FROM public.classifieds WHERE category = 'real_estate' LIMIT 1;
  SELECT id INTO v_profile_id FROM public.profiles LIMIT 1;

  IF v_store_id IS NOT NULL THEN
    INSERT INTO public.pudo_partner_locations (
      id, store_id, name, address, city, state, lat, lng, opening_hours, fee_per_package_cents, max_storage_capacity, is_active, contact_phone
    ) VALUES (
      'd0000000-0000-0000-0000-000000000001',
      v_store_id,
      'Ponto de Retirada Central — Farmácia Santa Tereza',
      'Av. Getúlio Vargas, 1420 - Centro',
      'Chapecó',
      'SC',
      -27.1002,
      -52.6152,
      'Segunda a Sábado: 07h30 às 22h | Domingo: 08h às 20h',
      300,
      80,
      true,
      '49988112233'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.pudo_packages (
      id, tracking_code, pudo_location_id, sender_name, recipient_name, recipient_phone, recipient_document, security_pickup_code, status, has_damage
    ) VALUES (
      'da000000-0000-0000-0000-000000000001',
      'JAH-PUDO-88219',
      'd0000000-0000-0000-0000-000000000001',
      'Tech Express Chapecó',
      'Mariana Silveira',
      '49999887766',
      '089.***.***-20',
      '8492',
      'ready_for_pickup',
      false
    ) ON CONFLICT (id) DO NOTHING;
  END IF;

  IF v_property_id IS NOT NULL AND v_profile_id IS NOT NULL THEN
    INSERT INTO public.property_maintenance_requests (
      id, property_id, tenant_profile_id, landlord_profile_id, title, category, urgency, description, status, photos
    ) VALUES (
      'cb000000-0000-0000-0000-000000000001',
      v_property_id,
      v_profile_id,
      v_profile_id,
      'Vazamento no sifão da pia da cozinha',
      'hidraulica',
      'media',
      'O sifão plástico da cuba dupla da cozinha começou a pingar após uso contínuo. Necessário reaperto ou troca da vedação.',
      'open',
      ARRAY['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80']
    ) ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
