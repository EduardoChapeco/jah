-- 20260825184500_relax_banners_and_hotpages_constraints.sql
-- Garante que todas as 25 vitrines e nichos de mercado sejam aceitos sem falha de check constraint no PostgreSQL

-- 1. Banners: remove restrições antigas de placement e target_type
ALTER TABLE public.banners
  DROP CONSTRAINT IF EXISTS banners_placement_check,
  DROP CONSTRAINT IF EXISTS banners_target_type_check;

-- Adiciona novas colunas caso não existam
ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS show_title BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_description BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_overlay BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_badge BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_cta BOOLEAN DEFAULT FALSE;

-- 2. Hotpages: adiciona colunas visuais completas de mídia e textura
ALTER TABLE public.hotpages
  ADD COLUMN IF NOT EXISTS module TEXT DEFAULT 'home',
  ADD COLUMN IF NOT EXISTS target_route TEXT,
  ADD COLUMN IF NOT EXISTS bg_media_type TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS bg_media_url TEXT,
  ADD COLUMN IF NOT EXISTS bg_color TEXT,
  ADD COLUMN IF NOT EXISTS bg_overlay_opacity NUMERIC DEFAULT 35,
  ADD COLUMN IF NOT EXISTS bg_texture TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS icon_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_icon_url TEXT,
  ADD COLUMN IF NOT EXISTS show_title BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_description BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_overlay BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_badge BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS template_type TEXT DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS rule_preset TEXT DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS hero_stat_badge TEXT,
  ADD COLUMN IF NOT EXISTS hero_secondary_badge TEXT,
  ADD COLUMN IF NOT EXISTS hero_floating_render_url TEXT,
  ADD COLUMN IF NOT EXISTS featured_rail_title TEXT;

-- 3. Índices de alta performance
CREATE INDEX IF NOT EXISTS idx_banners_placement_store ON public.banners(placement, store_id, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_hotpages_module_active ON public.hotpages(module, is_active, sort_order);
