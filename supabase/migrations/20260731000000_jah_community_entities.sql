-- ============================================================================
-- Jah Community Platform — Microfase 2 (Community Entities)
-- Migration 0081: Events, Tickets, Classifieds, Directory
-- ============================================================================

BEGIN;

DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.ticket_lots CASCADE;
DROP TABLE IF EXISTS public.classifieds CASCADE;
DROP TABLE IF EXISTS public.directory_listings CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;

-- 1. Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
  cover_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_public_read_published" ON public.events
  FOR SELECT USING (status = 'published');

CREATE POLICY "events_staff_read" ON public.events
  FOR SELECT USING (public.is_store_staff(store_id));

CREATE POLICY "events_staff_write" ON public.events
  FOR ALL USING (public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'content']));

-- 2. Ticket Lots Table
CREATE TABLE IF NOT EXISTS public.ticket_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_cents INT NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  capacity INT NOT NULL DEFAULT 0 CHECK (capacity >= 0),
  reserved_count INT NOT NULL DEFAULT 0 CHECK (reserved_count >= 0),
  sold_count INT NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold_out')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Invariant: sold + reserved cannot exceed capacity (unless over-selling is intended, but for tickets usually strict)
  CHECK (sold_count + reserved_count <= capacity)
);

ALTER TABLE public.ticket_lots ENABLE ROW LEVEL SECURITY;

-- Only public can read if event is published
CREATE POLICY "ticket_lots_public_read" ON public.ticket_lots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = ticket_lots.event_id AND e.status = 'published'
    )
  );

-- Staff can do everything on lots
CREATE POLICY "ticket_lots_staff_all" ON public.ticket_lots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = ticket_lots.event_id AND public.has_workspace_role(e.store_id, ARRAY['owner', 'admin', 'manager'])
    )
  );

-- 3. Tickets (Issued) Table
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES public.ticket_lots(id) ON DELETE RESTRICT,
  owner_profile_id UUID NOT NULL REFERENCES public.profiles(id),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL, -- tied to purchase flow
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'revoked')),
  qr_hash TEXT, -- hashed code for validation
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Owner can read their own tickets
CREATE POLICY "tickets_owner_read" ON public.tickets
  FOR SELECT USING (owner_profile_id = auth.uid());

-- Staff of the event can read/update (e.g., check-in)
CREATE POLICY "tickets_staff_read_update" ON public.tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = tickets.event_id AND public.is_store_staff(e.store_id)
    )
  );
  
CREATE POLICY "tickets_staff_update" ON public.tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = tickets.event_id AND public.has_workspace_role(e.store_id, ARRAY['owner', 'admin', 'manager', 'seller'])
    )
  );

-- 4. Classifieds Table (Community Zine)
CREATE TABLE IF NOT EXISTS public.classifieds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('job', 'sale', 'trade', 'service')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  price_cents INT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'expired', 'banned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.classifieds ENABLE ROW LEVEL SECURITY;

-- Public can read active classifieds
CREATE POLICY "classifieds_public_read" ON public.classifieds
  FOR SELECT USING (status = 'active');

-- Author can CRUD their own
CREATE POLICY "classifieds_author_all" ON public.classifieds
  FOR ALL USING (author_profile_id = auth.uid());

-- 5. Directory Listings (Yellow Pages)
CREATE TABLE IF NOT EXISTS public.directory_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  address TEXT,
  -- PostGIS geometry could be used, but for simplicity storing lat/lng for now or raw text
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  contact_phone TEXT,
  working_hours JSONB,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);

ALTER TABLE public.directory_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "directory_public_read" ON public.directory_listings
  FOR SELECT USING (status = 'active');

CREATE POLICY "directory_staff_all" ON public.directory_listings
  FOR ALL USING (public.is_store_staff(store_id));

-- Triggers for updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ticket_lots_updated_at BEFORE UPDATE ON public.ticket_lots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_classifieds_updated_at BEFORE UPDATE ON public.classifieds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_directory_listings_updated_at BEFORE UPDATE ON public.directory_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
