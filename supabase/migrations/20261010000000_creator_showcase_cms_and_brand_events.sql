-- ==============================================================================
-- Migration: 20261010000000_creator_showcase_cms_and_brand_events.sql
-- Propósito: Adiciona suporte ao CMS da Vitrine do Criador (Banner, Ordem das Camadas,
-- Lojas Parceiras Conectadas) e vinculação de Eventos ao @handle do Criador/Marca.
-- ==============================================================================

-- 1. Campos de CMS e Vitrine em creator_profiles
ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS banner_title text,
  ADD COLUMN IF NOT EXISTS banner_link text,
  ADD COLUMN IF NOT EXISTS showcase_order text[] DEFAULT ARRAY['banner', 'stores', 'products', 'events']::text[],
  ADD COLUMN IF NOT EXISTS partner_store_ids uuid[] DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS featured_event_ids uuid[] DEFAULT '{}'::uuid[];

-- 2. Campo de vinculação de Criador/Marca em events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS creator_handle text;

-- 3. Índices de performance
CREATE INDEX IF NOT EXISTS idx_events_creator_handle
  ON public.events(creator_handle)
  WHERE creator_handle IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_creator_profiles_partner_stores
  ON public.creator_profiles USING GIN(partner_store_ids);
