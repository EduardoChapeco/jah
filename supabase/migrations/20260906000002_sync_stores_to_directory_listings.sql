-- =============================================================================
-- Migration: 20260906000002_sync_stores_to_directory_listings.sql
-- Sincronização Bidirecional Automática entre stores e directory_listings
-- =============================================================================

-- 1. Garantir colunas completas em directory_listings
ALTER TABLE public.directory_listings ALTER COLUMN store_id DROP NOT NULL;

ALTER TABLE public.directory_listings
ADD COLUMN IF NOT EXISTS author_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

-- Garantir índice único para store_id em directory_listings para suportar ON CONFLICT (store_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'directory_listings_store_id_key'
  ) THEN
    BEGIN
      ALTER TABLE public.directory_listings ADD CONSTRAINT directory_listings_store_id_key UNIQUE (store_id);
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- 2. Tabela de Inquiries se não existir
CREATE TABLE IF NOT EXISTS public.directory_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.directory_listings(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_needed TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'quoted', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.directory_inquiries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'directory_inquiries' AND policyname = 'inquiries_public_insert') THEN
    CREATE POLICY inquiries_public_insert ON public.directory_inquiries FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'directory_inquiries' AND policyname = 'inquiries_select') THEN
    CREATE POLICY inquiries_select ON public.directory_inquiries FOR SELECT USING (
      auth.uid() = profile_id
      OR EXISTS (
        SELECT 1 FROM public.directory_listings dl
        WHERE dl.id = listing_id AND dl.author_profile_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 3. Função que sincroniza stores para directory_listings
CREATE OR REPLACE FUNCTION public.sync_store_to_directory()
RETURNS TRIGGER AS $$
DECLARE
  v_niche TEXT;
  v_category TEXT := 'servicos';
  v_address TEXT;
  v_avatar TEXT;
  v_banner TEXT;
  v_phone TEXT;
  v_whatsapp TEXT;
  v_working_hours JSONB;
BEGIN
  v_niche := coalesce(
    NEW.settings->>'niche',
    NEW.settings->>'type',
    NEW.settings->>'segment',
    'servicos'
  );

  IF v_niche ILIKE '%turis%' OR v_niche ILIKE '%viag%' OR v_niche ILIKE '%tour%' OR v_niche ILIKE '%hotel%' THEN
    v_category := 'turismo';
  ELSIF v_niche ILIKE '%gastro%' OR v_niche ILIKE '%rest%' OR v_niche ILIKE '%lanch%' OR v_niche ILIKE '%bar%' OR v_niche ILIKE '%cafe%' THEN
    v_category := 'gastronomia';
  ELSIF v_niche ILIKE '%saude%' OR v_niche ILIKE '%clin%' OR v_niche ILIKE '%fisi%' OR v_niche ILIKE '%odonto%' OR v_niche ILIKE '%psico%' THEN
    v_category := 'saude';
  ELSIF v_niche ILIKE '%auto%' OR v_niche ILIKE '%mecan%' OR v_niche ILIKE '%car%' OR v_niche ILIKE '%moto%' THEN
    v_category := 'auto';
  ELSIF v_niche ILIKE '%pet%' OR v_niche ILIKE '%vet%' THEN
    v_category := 'pet';
  ELSIF v_niche ILIKE '%reform%' OR v_niche ILIKE '%obra%' OR v_niche ILIKE '%const%' OR v_niche ILIKE '%eletric%' OR v_niche ILIKE '%hidraul%' THEN
    v_category := 'reformas';
  ELSIF v_niche ILIKE '%moda%' OR v_niche ILIKE '%roup%' OR v_niche ILIKE '%calc%' OR v_niche ILIKE '%mercado%' OR v_niche ILIKE '%comerc%' THEN
    v_category := 'comercio';
  ELSE
    v_category := 'servicos';
  END IF;

  v_address := coalesce(
    NEW.address,
    CASE 
      WHEN NEW.settings->>'street' IS NOT NULL THEN
        concat_ws(', ', 
          NEW.settings->>'street', 
          coalesce(NEW.settings->>'number', 'S/N'),
          NEW.settings->>'neighborhood',
          concat_ws(' - ', NEW.city, NEW.state)
        )
      ELSE concat_ws(' - ', NEW.city, NEW.state)
    END,
    'Regional'
  );

  v_avatar := coalesce(NEW.logo_url, NEW.settings->>'logoUrl', NEW.settings->>'logo_url');
  v_banner := coalesce(NEW.settings->>'bannerUrl', NEW.settings->>'banner_url');
  v_phone := coalesce(NEW.phone, NEW.settings->>'phone');
  v_whatsapp := regexp_replace(coalesce(v_phone, ''), '[^0-9]', '', 'g');
  v_working_hours := coalesce(NEW.settings->'working_hours', '{"weekdays": "08:30 - 18:00"}'::jsonb);

  INSERT INTO public.directory_listings (
    store_id,
    business_name,
    category,
    description,
    specialties,
    address,
    contact_phone,
    contact_whatsapp,
    contact_email,
    working_hours,
    is_verified,
    rating,
    reviews_count,
    avatar_url,
    banner_url,
    status
  ) VALUES (
    NEW.id,
    NEW.name,
    v_category,
    coalesce(NEW.settings->>'description', 'Empresa oficial cadastrada no ecossistema Waesy.'),
    ARRAY[v_category, 'Atendimento Oficial'],
    v_address,
    v_phone,
    v_whatsapp,
    NEW.email,
    v_working_hours,
    true,
    5.0,
    1,
    v_avatar,
    v_banner,
    'active'
  )
  ON CONFLICT (store_id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    category = EXCLUDED.category,
    address = EXCLUDED.address,
    contact_phone = EXCLUDED.contact_phone,
    contact_whatsapp = EXCLUDED.contact_whatsapp,
    contact_email = EXCLUDED.contact_email,
    avatar_url = coalesce(EXCLUDED.avatar_url, directory_listings.avatar_url),
    banner_url = coalesce(EXCLUDED.banner_url, directory_listings.banner_url),
    status = 'active',
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4. Trigger na tabela stores
DROP TRIGGER IF EXISTS trg_sync_store_to_directory ON public.stores;
CREATE TRIGGER trg_sync_store_to_directory
  AFTER INSERT OR UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_store_to_directory();

-- 5. Sincronizar todas as stores existentes agora
DO $$
DECLARE
  r RECORD;
  v_cat TEXT;
BEGIN
  FOR r IN SELECT * FROM public.stores LOOP
    v_cat := CASE 
      WHEN (r.settings->>'niche') ILIKE '%turis%' OR (r.settings->>'type') ILIKE '%turis%' THEN 'turismo'
      WHEN (r.settings->>'niche') ILIKE '%gastro%' OR (r.settings->>'type') ILIKE '%gastro%' THEN 'gastronomia'
      WHEN (r.settings->>'niche') ILIKE '%saude%' THEN 'saude'
      WHEN (r.settings->>'niche') ILIKE '%auto%' THEN 'auto'
      WHEN (r.settings->>'niche') ILIKE '%pet%' THEN 'pet'
      WHEN (r.settings->>'niche') ILIKE '%reform%' THEN 'reformas'
      WHEN (r.settings->>'niche') ILIKE '%moda%' THEN 'comercio'
      ELSE 'servicos'
    END;

    INSERT INTO public.directory_listings (
      store_id,
      business_name,
      category,
      description,
      specialties,
      address,
      contact_phone,
      contact_whatsapp,
      contact_email,
      working_hours,
      is_verified,
      rating,
      reviews_count,
      avatar_url,
      banner_url,
      status
    ) VALUES (
      r.id,
      r.name,
      v_cat,
      coalesce(r.settings->>'description', 'Empresa oficial cadastrada no ecossistema Waesy.'),
      ARRAY[v_cat, 'Atendimento Oficial'],
      coalesce(r.address, concat_ws(' - ', r.city, r.state), 'Regional'),
      coalesce(r.phone, r.settings->>'phone'),
      regexp_replace(coalesce(r.phone, r.settings->>'phone', ''), '[^0-9]', '', 'g'),
      r.email,
      coalesce(r.settings->'working_hours', '{"weekdays": "08:30 - 18:00"}'::jsonb),
      true,
      5.0,
      1,
      coalesce(r.logo_url, r.settings->>'logoUrl', r.settings->>'logo_url'),
      coalesce(r.settings->>'bannerUrl', r.settings->>'banner_url'),
      'active'
    )
    ON CONFLICT (store_id) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      category = EXCLUDED.category,
      address = EXCLUDED.address,
      contact_phone = EXCLUDED.contact_phone,
      contact_whatsapp = EXCLUDED.contact_whatsapp,
      contact_email = EXCLUDED.contact_email,
      avatar_url = coalesce(EXCLUDED.avatar_url, directory_listings.avatar_url),
      banner_url = coalesce(EXCLUDED.banner_url, directory_listings.banner_url),
      status = 'active',
      updated_at = now();
  END LOOP;
END $$;