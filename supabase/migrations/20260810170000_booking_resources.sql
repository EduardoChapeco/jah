-- Migration: Booking Resources Engine

-- 1. Create Resources
CREATE TABLE IF NOT EXISTS public.booking_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    resource_type TEXT NOT NULL DEFAULT 'person' CHECK (resource_type IN ('person', 'room', 'equipment')),
    capacity INTEGER NOT NULL DEFAULT 1, -- How many simultaneous appointments it can handle
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Link Services to Resources (Pivot)
CREATE TABLE IF NOT EXISTS public.booking_service_resources (
    service_id UUID NOT NULL REFERENCES public.booking_services(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.booking_resources(id) ON DELETE CASCADE,
    PRIMARY KEY (service_id, resource_id)
);

-- 3. Resource Availability Matrix (Recurring Weekly blocks)
CREATE TABLE IF NOT EXISTS public.booking_resource_availabilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL REFERENCES public.booking_resources(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CHECK (start_time < end_time)
);

-- 4. Alter existing appointments table to require a resource lock
ALTER TABLE public.booking_appointments 
  ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES public.booking_resources(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 60;

-- 5. Enable RLS
ALTER TABLE public.booking_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_service_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_resource_availabilities ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Public read access to active resources & their availabilities
CREATE POLICY "Public can read active resources" 
  ON public.booking_resources FOR SELECT 
  USING (status = 'active');

CREATE POLICY "Public can read active resource links" 
  ON public.booking_service_resources FOR SELECT 
  USING (true);

CREATE POLICY "Public can read active availabilities" 
  ON public.booking_resource_availabilities FOR SELECT 
  USING (true);

-- Store staff access
CREATE POLICY "Store staff can manage booking resources"
  ON public.booking_resources FOR ALL TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Store staff can manage booking service resources"
  ON public.booking_service_resources FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.booking_services s 
      WHERE s.id = service_id 
      AND s.store_id IN (
        SELECT store_id FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
      )
    )
  );

CREATE POLICY "Store staff can manage booking resource availabilities"
  ON public.booking_resource_availabilities FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.booking_resources r 
      WHERE r.id = resource_id 
      AND r.store_id IN (
        SELECT store_id FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
      )
    )
  );
