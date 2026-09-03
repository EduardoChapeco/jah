-- Migration: Classifieds Canonical Sources & Rich Categorized Schema (Microfase 77B)
-- Expands classifieds with real columns for deal_type, real estate, vehicles, smartphones, jobs and attributes.
-- Creates canonical databases for brands, models and job occupations to enable market analytics and measurement.

ALTER TABLE public.classifieds
  ADD COLUMN IF NOT EXISTS deal_type text,
  ADD COLUMN IF NOT EXISTS property_type text,
  ADD COLUMN IF NOT EXISTS bedrooms integer,
  ADD COLUMN IF NOT EXISTS bathrooms integer,
  ADD COLUMN IF NOT EXISTS suites integer,
  ADD COLUMN IF NOT EXISTS parking_spots integer,
  ADD COLUMN IF NOT EXISTS area_sqm integer,
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS max_guests integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS cleaning_fee_cents integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rental_period text DEFAULT 'mensal',
  ADD COLUMN IF NOT EXISTS contact_whatsapp text,
  ADD COLUMN IF NOT EXISTS location_name text,
  ADD COLUMN IF NOT EXISTS location_text text,
  ADD COLUMN IF NOT EXISTS location_lat double precision,
  ADD COLUMN IF NOT EXISTS location_lng double precision,
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS condition text,
  ADD COLUMN IF NOT EXISTS negotiable boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS attributes jsonb DEFAULT '{}'::jsonb;

-- Canonical Device Brands & Models
CREATE TABLE IF NOT EXISTS public.canonical_device_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'smartphones',
  logo_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.canonical_device_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.canonical_device_brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  release_year integer,
  storage_options text[] DEFAULT '{64GB,128GB,256GB,512GB,1TB}',
  screen_size text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(brand_id, name)
);

-- Canonical Vehicle Brands & Models
CREATE TABLE IF NOT EXISTS public.canonical_vehicle_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  vehicle_type text NOT NULL DEFAULT 'car',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.canonical_vehicle_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.canonical_vehicle_brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  vehicle_type text NOT NULL DEFAULT 'car',
  created_at timestamptz DEFAULT now(),
  UNIQUE(brand_id, name)
);

-- Canonical Job Occupations
CREATE TABLE IF NOT EXISTS public.canonical_job_occupations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL UNIQUE,
  cbo_code text,
  category text NOT NULL DEFAULT 'geral',
  created_at timestamptz DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_classifieds_category ON public.classifieds (category);
CREATE INDEX IF NOT EXISTS idx_classifieds_status ON public.classifieds (status);
CREATE INDEX IF NOT EXISTS idx_classifieds_author ON public.classifieds (author_profile_id);
