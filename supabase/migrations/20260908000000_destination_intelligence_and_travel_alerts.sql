
-- ============================================================
-- Microfase 9.1: Inteligência de Destinos & Alertas de Viagem
-- Tabelas: destination_intelligence, travel_alerts, destination_reviews
-- ============================================================

CREATE TABLE IF NOT EXISTS public.destination_intelligence (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id        uuid NOT NULL,
  destination     text NOT NULL,
  country_code    char(2) NOT NULL DEFAULT 'BR',
  continent       text NOT NULL DEFAULT 'America',
  demand_score    integer NOT NULL DEFAULT 50 CHECK (demand_score BETWEEN 0 AND 100),
  trend           text NOT NULL DEFAULT 'stable' CHECK (trend IN ('rising','stable','falling')),
  best_months     text[] DEFAULT '{}',
  peak_season     text,
  avg_temp_celsius numeric(4,1),
  avg_package_brl  numeric(12,2),
  avg_daily_rate_brl numeric(10,2),
  min_budget_brl   numeric(12,2),
  is_featured      boolean NOT NULL DEFAULT false,
  is_visa_required boolean NOT NULL DEFAULT false,
  safety_level     text NOT NULL DEFAULT 'safe' CHECK (safety_level IN ('safe','moderate','caution','warning')),
  currency_code    char(3) DEFAULT 'USD',
  exchange_rate_brl numeric(8,4),
  image_url        text,
  tags             text[] DEFAULT '{}',
  highlights       text[] DEFAULT '{}',
  created_at       timestamptz DEFAULT now() NOT NULL,
  updated_at       timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.destination_intelligence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_staff_manage_destinations" ON public.destination_intelligence;
DROP POLICY IF EXISTS "public_read_destinations" ON public.destination_intelligence;
DROP POLICY IF EXISTS "store_access_dest_intelligence" ON public.destination_intelligence;

CREATE POLICY "store_access_dest_intelligence"
  ON public.destination_intelligence FOR ALL
  USING (store_id IS NOT NULL);

-- Alertas de viagem por destino
CREATE TABLE IF NOT EXISTS public.travel_alerts (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id     uuid NOT NULL,
  destination  text NOT NULL,
  severity     text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  category     text NOT NULL DEFAULT 'operational'
    CHECK (category IN ('health','security','weather','operational','visa','currency')),
  title        text NOT NULL,
  description  text NOT NULL,
  source_url   text,
  is_active    boolean NOT NULL DEFAULT true,
  expires_at   timestamptz,
  created_at   timestamptz DEFAULT now() NOT NULL,
  updated_at   timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.travel_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_staff_manage_alerts" ON public.travel_alerts;
DROP POLICY IF EXISTS "store_access_travel_alerts" ON public.travel_alerts;

CREATE POLICY "store_access_travel_alerts"
  ON public.travel_alerts FOR ALL
  USING (store_id IS NOT NULL);

-- Avaliações de destino por viajante
CREATE TABLE IF NOT EXISTS public.destination_reviews (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id       uuid NOT NULL,
  destination    text NOT NULL,
  reviewer_name  text NOT NULL,
  reviewer_email text,
  trip_id        uuid,
  rating         integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        text,
  aspects        jsonb DEFAULT '{}',
  is_featured    boolean NOT NULL DEFAULT false,
  created_at     timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.destination_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_staff_manage_reviews" ON public.destination_reviews;
DROP POLICY IF EXISTS "public_read_reviews" ON public.destination_reviews;
DROP POLICY IF EXISTS "store_access_dest_reviews" ON public.destination_reviews;

CREATE POLICY "store_access_dest_reviews"
  ON public.destination_reviews FOR ALL
  USING (store_id IS NOT NULL);

-- Indices
CREATE INDEX IF NOT EXISTS idx_dest_intel_store_id ON public.destination_intelligence (store_id);
CREATE INDEX IF NOT EXISTS idx_dest_intel_demand ON public.destination_intelligence (demand_score DESC);
CREATE INDEX IF NOT EXISTS idx_dest_intel_featured ON public.destination_intelligence (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_travel_alerts_store ON public.travel_alerts (store_id);
CREATE INDEX IF NOT EXISTS idx_travel_alerts_active ON public.travel_alerts (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_dest_reviews_store ON public.destination_reviews (store_id);
