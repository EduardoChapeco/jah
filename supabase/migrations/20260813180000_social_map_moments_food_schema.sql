-- Migration 20260813180000_social_map_moments_food_schema.sql
-- Description: Adds rich post types, geolocation for moments/social map, terms acceptance, and preparation times for food products.

-- 1. Updates to posts table
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'simple',
  ADD COLUMN IF NOT EXISTS location_name TEXT,
  ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Index for moments map queries
CREATE INDEX IF NOT EXISTS idx_posts_geo_location 
  ON public.posts(location_lat, location_lng) 
  WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL AND status = 'active';

-- 2. Updates to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- 3. Updates to products table for food preparation metrics
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS preparation_time_minutes INTEGER DEFAULT NULL;

-- 4. Updates to classifieds table for rich media and location
ALTER TABLE public.classifieds
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS location_name TEXT,
  ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;
