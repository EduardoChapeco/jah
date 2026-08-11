-- ============================================================================
-- Jah Commerce — Migration V4: Delivery V4 (Agnostic Logistics)
-- ============================================================================

-- Add new fields to shipping_zones to support Radius and Polygons
ALTER TABLE public.shipping_zones 
ADD COLUMN IF NOT EXISTS zone_type VARCHAR(20) NOT NULL DEFAULT 'zipcode' CHECK (zone_type IN ('zipcode', 'radius', 'polygon')),
ADD COLUMN IF NOT EXISTS base_lat NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS base_lng NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS radius_km NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS polygon_points JSONB DEFAULT '[]'; -- Array of {lat, lng} objects

-- Create a spatial index using PostGIS (if available) or just simple bounding box
-- For now, Jah standard uses pure Postgres or application-layer math, so we just add standard indexes on store_id and type.
CREATE INDEX IF NOT EXISTS idx_shipping_zones_type ON public.shipping_zones(store_id, zone_type);

-- Extend shipping_rates for dynamic delivery logic (e.g., specific rules for motoboy)
ALTER TABLE public.shipping_rates
ADD COLUMN IF NOT EXISTS base_price_cents INTEGER, -- Fixed starting price
ADD COLUMN IF NOT EXISTS price_per_km_cents INTEGER; -- Variable rate for radius
