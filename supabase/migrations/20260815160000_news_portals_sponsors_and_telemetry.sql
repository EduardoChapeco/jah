-- ============================================================================
-- Jah Platform — Migration: News Portals, Articles, Sponsors & Telemetry
-- ============================================================================

-- 1. TABELA DE ARTIGOS / NOTÍCIAS
CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  author_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  kicker TEXT, -- Chapéu / Mini-categoria (ex: "POLÍTICA", "ECONOMIA LOCAL")
  subtitle TEXT, -- Lead / Resumo
  content_sections JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de blocos [{type: 'paragraph'|'heading'|'quote'|'gallery'|'video', content: text|array}]
  cover_media_url TEXT,
  cover_media_type TEXT NOT NULL DEFAULT 'image' CHECK (cover_media_type IN ('image', 'video', 'gif')),
  category TEXT NOT NULL DEFAULT 'geral',
  tags TEXT[] DEFAULT '{}'::text[],
  reading_time_minutes INT NOT NULL DEFAULT 3,
  views_count INT NOT NULL DEFAULT 0,
  unique_views_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT news_articles_slug_store_unique UNIQUE (store_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_news_articles_status_published ON public.news_articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON public.news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_store ON public.news_articles(store_id);

-- 2. TABELA DE PATROCINADORES REAIS
CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  video_url TEXT,
  website_url TEXT,
  cta_label TEXT DEFAULT 'Saiba Mais',
  description TEXT,
  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('gold', 'silver', 'standard', 'supporter')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sponsors_store ON public.sponsors(store_id, active);

-- 3. TABELA DE POSICIONAMENTOS DE PATROCINADORES
CREATE TABLE IF NOT EXISTS public.sponsor_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE,
  placement_type TEXT NOT NULL CHECK (placement_type IN ('news_top', 'news_in_article', 'news_footer', 'story_moment', 'portal_sidebar', 'global_feed')),
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sponsor_placements_article ON public.sponsor_placements(article_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_placements_sponsor ON public.sponsor_placements(sponsor_id);

-- 4. TABELA DE TELEMETRIA DE AUDIÊNCIA, SCROLL E IMPRESSÕES ANTIFRAUDE
CREATE TABLE IF NOT EXISTS public.ad_telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  sponsor_id UUID REFERENCES public.sponsors(id) ON DELETE SET NULL,
  article_id UUID REFERENCES public.news_articles(id) ON DELETE SET NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view_impression', 'view_unique', 'view_duration', 'scroll_depth', 'click')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_hash TEXT NOT NULL,
  duration_seconds INT DEFAULT 0,
  scroll_percentage INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_telemetry_events_sponsor ON public.ad_telemetry_events(sponsor_id, event_type);
CREATE INDEX IF NOT EXISTS idx_ad_telemetry_events_article ON public.ad_telemetry_events(article_id, event_type);
CREATE INDEX IF NOT EXISTS idx_ad_telemetry_created_at ON public.ad_telemetry_events(created_at);

-- 5. TABELA DE COMENTÁRIOS REAIS EM NOTÍCIAS
CREATE TABLE IF NOT EXISTS public.news_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'flagged')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_comments_article ON public.news_comments(article_id, created_at DESC);

-- 6. TABELA DE LIKES ÚNICOS EM NOTÍCIAS (PK COMPOSTA ANTIFRAUDE)
CREATE TABLE IF NOT EXISTS public.news_likes (
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (article_id, user_id)
);

-- ============================================================================
-- RLS (ROW LEVEL SECURITY)
-- ============================================================================
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_likes ENABLE ROW LEVEL SECURITY;

-- Policies para news_articles
CREATE POLICY "news_articles_public_read" ON public.news_articles
  FOR SELECT USING (status = 'published' OR public.is_store_staff(store_id));

CREATE POLICY "news_articles_staff_all" ON public.news_articles
  FOR ALL USING (public.is_store_staff(store_id));

-- Policies para sponsors
CREATE POLICY "sponsors_public_read" ON public.sponsors
  FOR SELECT USING (active = true OR public.is_store_staff(store_id));

CREATE POLICY "sponsors_staff_all" ON public.sponsors
  FOR ALL USING (public.is_store_staff(store_id));

-- Policies para sponsor_placements
CREATE POLICY "sponsor_placements_public_read" ON public.sponsor_placements
  FOR SELECT USING (active = true);

CREATE POLICY "sponsor_placements_staff_all" ON public.sponsor_placements
  FOR ALL USING (true);

-- Policies para ad_telemetry_events
CREATE POLICY "ad_telemetry_insert_public" ON public.ad_telemetry_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "ad_telemetry_staff_read" ON public.ad_telemetry_events
  FOR SELECT USING (public.is_store_staff(store_id));

-- Policies para news_comments
CREATE POLICY "news_comments_public_read" ON public.news_comments
  FOR SELECT USING (status = 'active');

CREATE POLICY "news_comments_auth_insert" ON public.news_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "news_comments_owner_delete" ON public.news_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Policies para news_likes
CREATE POLICY "news_likes_public_read" ON public.news_likes
  FOR SELECT USING (true);

CREATE POLICY "news_likes_auth_all" ON public.news_likes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- STORED PROCEDURES (RPCs) PARA TELEMETRIA ATÔMICA
-- ============================================================================
CREATE OR REPLACE FUNCTION public.record_ad_telemetry(
  p_store_id UUID,
  p_sponsor_id UUID DEFAULT NULL,
  p_article_id UUID DEFAULT NULL,
  p_post_id UUID DEFAULT NULL,
  p_event_type TEXT DEFAULT 'view_impression',
  p_session_hash TEXT DEFAULT '',
  p_duration_seconds INT DEFAULT 0,
  p_scroll_percentage INT DEFAULT 0
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.ad_telemetry_events (
    store_id,
    sponsor_id,
    article_id,
    post_id,
    event_type,
    user_id,
    session_hash,
    duration_seconds,
    scroll_percentage
  ) VALUES (
    p_store_id,
    p_sponsor_id,
    p_article_id,
    p_post_id,
    p_event_type,
    auth.uid(),
    p_session_hash,
    p_duration_seconds,
    p_scroll_percentage
  );

  -- Atualiza contagem acumulada no artigo se for impressão
  IF p_article_id IS NOT NULL AND p_event_type = 'view_impression' THEN
    UPDATE public.news_articles
    SET views_count = views_count + 1
    WHERE id = p_article_id;
  END IF;

  IF p_article_id IS NOT NULL AND p_event_type = 'view_unique' THEN
    UPDATE public.news_articles
    SET unique_views_count = unique_views_count + 1
    WHERE id = p_article_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
