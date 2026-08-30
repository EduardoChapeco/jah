-- ============================================================================
-- Wider / Jah Platform: MINING PIPELINE & CONTENT FACTORY
-- Migration Unificada, Idempotente e Resiliente a Tabelas Preexistentes
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Tabela crawl_queue (Fila de URLs para Extração)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crawl_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crawl_queue
  ADD COLUMN IF NOT EXISTS url TEXT,
  ADD COLUMN IF NOT EXISTS domain TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS discovered_via TEXT,
  ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'news',
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS store_id UUID,
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'news',
  ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_retries INT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_error TEXT,
  ADD COLUMN IF NOT EXISTS mined_article_id UUID,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_crawl_queue_priority ON public.crawl_queue(priority ASC, created_at ASC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_crawl_queue_status ON public.crawl_queue(status, created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Tabela rss_feeds (Fontes de Feeds RSS Monitoradas)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rss_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  feed_url TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rss_feeds
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS feed_url TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'Geral/Nacional',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS items_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_fetched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS store_id UUID,
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'news',
  ADD COLUMN IF NOT EXISTS auto_publish BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_enqueue BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS quality_threshold INT NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS fetch_interval_minutes INT NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS max_items_per_fetch INT NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS error_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS last_success_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS items_published_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS items_rejected_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Enhancements em news_articles
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS quality_score INT,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_keywords TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ai_sentiment TEXT,
  ADD COLUMN IF NOT EXISTS curation_status TEXT NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS curator_profile_id UUID,
  ADD COLUMN IF NOT EXISTS curated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_breaking BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS author_name TEXT,
  ADD COLUMN IF NOT EXISTS rss_feed_id UUID,
  ADD COLUMN IF NOT EXISTS crawl_queue_id UUID,
  ADD COLUMN IF NOT EXISTS mined_article_id UUID;

CREATE INDEX IF NOT EXISTS idx_news_articles_source_type ON public.news_articles(source_type);
CREATE INDEX IF NOT EXISTS idx_news_articles_curation ON public.news_articles(curation_status, created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Tabela mined_articles (Staging de Curadoria Intermediária)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mined_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mined_articles
  ADD COLUMN IF NOT EXISTS crawl_queue_id UUID,
  ADD COLUMN IF NOT EXISTS rss_feed_id UUID,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_domain TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'crawl',
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS raw_html TEXT,
  ADD COLUMN IF NOT EXISTS extracted_markdown TEXT,
  ADD COLUMN IF NOT EXISTS raw_title TEXT,
  ADD COLUMN IF NOT EXISTS raw_description TEXT,
  ADD COLUMN IF NOT EXISTS ai_structured_title TEXT,
  ADD COLUMN IF NOT EXISTS ai_structured_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS ai_structured_sections JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_suggested_kicker TEXT,
  ADD COLUMN IF NOT EXISTS ai_suggested_category TEXT,
  ADD COLUMN IF NOT EXISTS ai_suggested_tags TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ai_suggested_cover_url TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_sentiment TEXT,
  ADD COLUMN IF NOT EXISTS ai_keywords TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ai_estimated_reading_time INT,
  ADD COLUMN IF NOT EXISTS quality_score INT,
  ADD COLUMN IF NOT EXISTS quality_flags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS word_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_cover_image BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS duplicate_of UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS curator_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS curator_notes TEXT,
  ADD COLUMN IF NOT EXISTS curated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_article_id UUID,
  ADD COLUMN IF NOT EXISTS tokens_consumed INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_error TEXT,
  ADD COLUMN IF NOT EXISTS ai_provider_used TEXT,
  ADD COLUMN IF NOT EXISTS firecrawl_used BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_mined_articles_status ON public.mined_articles(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mined_articles_store ON public.mined_articles(store_id, status);
CREATE INDEX IF NOT EXISTS idx_mined_articles_quality ON public.mined_articles(quality_score DESC) WHERE quality_score IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Tabela rss_feed_items (Itens de Feeds RSS)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rss_feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rss_feed_id UUID NOT NULL REFERENCES public.rss_feeds(id) ON DELETE CASCADE,
  item_guid TEXT NOT NULL,
  item_hash TEXT NOT NULL,
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rss_feed_items
  ADD COLUMN IF NOT EXISTS rss_feed_id UUID,
  ADD COLUMN IF NOT EXISTS item_guid TEXT,
  ADD COLUMN IF NOT EXISTS item_hash TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS full_content TEXT,
  ADD COLUMN IF NOT EXISTS link TEXT,
  ADD COLUMN IF NOT EXISTS author TEXT,
  ADD COLUMN IF NOT EXISTS pub_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS crawl_queue_id UUID,
  ADD COLUMN IF NOT EXISTS mined_article_id UUID,
  ADD COLUMN IF NOT EXISTS skip_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_rss_feed_items_feed_status ON public.rss_feed_items(rss_feed_id, status, pub_date DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. Tabela scraper_configs (Configuração de Scrapers e Domínios)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scraper_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scraper_configs
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS domain TEXT,
  ADD COLUMN IF NOT EXISTS domain_pattern TEXT,
  ADD COLUMN IF NOT EXISTS label TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS requires_javascript BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS request_delay_ms INT NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS max_requests_per_hour INT NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS css_title TEXT,
  ADD COLUMN IF NOT EXISTS css_description TEXT,
  ADD COLUMN IF NOT EXISTS css_body TEXT,
  ADD COLUMN IF NOT EXISTS css_cover_image TEXT,
  ADD COLUMN IF NOT EXISTS css_author TEXT,
  ADD COLUMN IF NOT EXISTS css_date TEXT,
  ADD COLUMN IF NOT EXISTS css_categories TEXT,
  ADD COLUMN IF NOT EXISTS reliability_score INT NOT NULL DEFAULT 75,
  ADD COLUMN IF NOT EXISTS source_credibility TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'pt-BR',
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS total_scraped INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_published INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_failed INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN
  ALTER TABLE public.scraper_configs ALTER COLUMN name DROP NOT NULL;
  ALTER TABLE public.scraper_configs ALTER COLUMN domain_pattern DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Unique constraint no domain se não existir
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_scraper_configs_domain'
  ) THEN
    UPDATE public.scraper_configs SET domain = 'unknown-' || id::text WHERE domain IS NULL;
    ALTER TABLE public.scraper_configs ADD CONSTRAINT uq_scraper_configs_domain UNIQUE (domain);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_scraper_configs_domain ON public.scraper_configs(domain, is_active);
CREATE INDEX IF NOT EXISTS idx_scraper_configs_active ON public.scraper_configs(is_active, is_blocked);

INSERT INTO public.scraper_configs (name, domain, domain_pattern, label, description, source_credibility, reliability_score, css_title, css_body, css_cover_image, css_author, css_date)
VALUES
  ('G1 Globo', 'g1.globo.com', 'g1.globo.com', 'G1 Globo', 'Portal de notícias da Globo', 'high', 90,
   'h1.content-head__title', 'p.content-text__container', 'img.content-media-figure__image', '.content-publication-data__from', 'time'),
  ('GaúchaZH', 'gauchazh.clicrbs.com.br', 'gauchazh.clicrbs.com.br', 'GaúchaZH', 'Portal GaúchaZH RBS', 'high', 85,
   'h1', 'div[itemprop="articleBody"]', 'figure img', '[rel="author"]', 'time[itemprop="datePublished"]'),
  ('NSC Total', 'nsctotal.com.br', 'nsctotal.com.br', 'NSC Total', 'NSC Comunicação Santa Catarina', 'high', 85,
   'h1', '.article-content', '.article-header img', '.author-name', 'time'),
  ('Prefeitura Chapecó', 'chapeco.sc.gov.br', 'chapeco.sc.gov.br', 'Prefeitura Chapecó', 'Site oficial Prefeitura de Chapecó', 'high', 95,
   'h1', '.field-items', '.field-name-field-imagem img', NULL, 'time')
ON CONFLICT (domain) DO NOTHING;

-- ────────────────────────────────────────────────────────────────────────────
-- 7. Expandir token_ledger_transactions
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.token_ledger_transactions
  DROP CONSTRAINT IF EXISTS token_ledger_transactions_action_type_check;

ALTER TABLE public.token_ledger_transactions
  ADD CONSTRAINT token_ledger_transactions_action_type_check
    CHECK (action_type IN (
      'welcome_bonus', 'package_purchase', 'admin_grant', 'curation_reward', 'refund',
      'burn_feed_view', 'burn_visibility_boost', 'burn_whatsapp_alert', 'burn_push_notification',
      'burn_lead_unlock', 'burn_ai_agent_chat', 'burn_verified_daily', 'burn_market_insight',
      'burn_scrape_url', 'burn_rss_import', 'burn_ai_curate', 'burn_ai_rewrite',
      'burn_ai_summarize', 'burn_content_import_url', 'burn_batch_crawl'
    ));

-- ────────────────────────────────────────────────────────────────────────────
-- 8. RPC process_mined_article (Curadoria e Publicação Transacional)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_mined_article(
  p_mined_article_id UUID,
  p_curator_profile_id UUID,
  p_action TEXT,
  p_curator_notes TEXT DEFAULT NULL,
  p_title_override TEXT DEFAULT NULL,
  p_kicker_override TEXT DEFAULT NULL,
  p_category_override TEXT DEFAULT NULL,
  p_store_id_override UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mined RECORD;
  v_store_id UUID;
  v_article_id UUID;
  v_slug TEXT;
  v_base_slug TEXT;
  v_slug_counter INT := 0;
BEGIN
  SELECT * INTO v_mined
  FROM public.mined_articles
  WHERE id = p_mined_article_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'MINED_ARTICLE_NOT_FOUND');
  END IF;

  IF v_mined.status NOT IN ('pending_review', 'failed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_STATUS', 'current_status', v_mined.status);
  END IF;

  IF p_action = 'reject' THEN
    UPDATE public.mined_articles
    SET status = 'rejected', curator_profile_id = p_curator_profile_id,
        curator_notes = p_curator_notes, curated_at = now(), updated_at = now()
    WHERE id = p_mined_article_id;
    RETURN jsonb_build_object('success', true, 'action', 'rejected');
  END IF;

  v_store_id := COALESCE(p_store_id_override, v_mined.store_id);
  IF v_store_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'STORE_REQUIRED_FOR_PUBLISH');
  END IF;

  v_base_slug := lower(regexp_replace(
    unaccent(COALESCE(p_title_override, v_mined.ai_structured_title, v_mined.raw_title, 'artigo')),
    '[^a-z0-9]+', '-', 'g'
  ));
  v_base_slug := regexp_replace(v_base_slug, '(^-|-$)', '', 'g');
  v_slug := v_base_slug;

  WHILE EXISTS (SELECT 1 FROM public.news_articles WHERE store_id = v_store_id AND slug = v_slug) LOOP
    v_slug_counter := v_slug_counter + 1;
    v_slug := v_base_slug || '-' || v_slug_counter;
  END LOOP;

  INSERT INTO public.news_articles (
    store_id, author_profile_id, title, slug, kicker, subtitle,
    content_sections, cover_media_url, cover_media_type, category, tags,
    reading_time_minutes, status, published_at, source_url, source_type,
    mined_article_id, quality_score, ai_summary, curation_status, curator_profile_id, curated_at
  ) VALUES (
    v_store_id, p_curator_profile_id,
    COALESCE(p_title_override, v_mined.ai_structured_title, v_mined.raw_title, 'Sem título'),
    v_slug,
    COALESCE(p_kicker_override, v_mined.ai_suggested_kicker),
    v_mined.ai_structured_subtitle,
    COALESCE(v_mined.ai_structured_sections, '[]'::jsonb),
    v_mined.ai_suggested_cover_url, 'image',
    COALESCE(p_category_override, v_mined.ai_suggested_category, 'geral'),
    COALESCE(v_mined.ai_suggested_tags, '{}'::text[]),
    COALESCE(v_mined.ai_estimated_reading_time, 3),
    'published', now(),
    v_mined.source_url, v_mined.source_type,
    v_mined.id, v_mined.quality_score, v_mined.ai_summary,
    'approved', p_curator_profile_id, now()
  )
  RETURNING id INTO v_article_id;

  UPDATE public.mined_articles
  SET status = 'published', published_article_id = v_article_id,
      curator_profile_id = p_curator_profile_id, curator_notes = p_curator_notes,
      curated_at = now(), updated_at = now()
  WHERE id = p_mined_article_id;

  RETURN jsonb_build_object('success', true, 'action', 'approved',
    'article_id', v_article_id, 'slug', v_slug);
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 9. Helper Function is_store_staff (usando target_store_id)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_store_staff(target_store_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE store_id = target_store_id AND profile_id = auth.uid()
  );
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 10. RLS Policies
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.mined_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mined_articles_staff_read" ON public.mined_articles;
CREATE POLICY "mined_articles_staff_read" ON public.mined_articles FOR SELECT USING (
  (store_id IS NOT NULL AND public.is_store_staff(store_id))
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('platform_admin', 'master', 'admin'))
);

DROP POLICY IF EXISTS "mined_articles_staff_write" ON public.mined_articles;
CREATE POLICY "mined_articles_staff_write" ON public.mined_articles FOR ALL USING (
  (store_id IS NOT NULL AND public.is_store_staff(store_id))
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('platform_admin', 'master', 'admin'))
);

DROP POLICY IF EXISTS "rss_feed_items_public_read" ON public.rss_feed_items;
CREATE POLICY "rss_feed_items_public_read" ON public.rss_feed_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "rss_feed_items_admin_write" ON public.rss_feed_items;
CREATE POLICY "rss_feed_items_admin_write" ON public.rss_feed_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('platform_admin', 'master', 'admin'))
);

DROP POLICY IF EXISTS "scraper_configs_public_read" ON public.scraper_configs;
CREATE POLICY "scraper_configs_public_read" ON public.scraper_configs FOR SELECT USING (is_active = true AND is_blocked = false);

DROP POLICY IF EXISTS "scraper_configs_admin_all" ON public.scraper_configs;
CREATE POLICY "scraper_configs_admin_all" ON public.scraper_configs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('platform_admin', 'master', 'admin'))
);

-- ────────────────────────────────────────────────────────────────────────────
-- 11. Triggers updated_at
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_mined_articles_updated_at') THEN
    CREATE TRIGGER trigger_mined_articles_updated_at
      BEFORE UPDATE ON public.mined_articles
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_rss_feed_items_updated_at') THEN
    CREATE TRIGGER trigger_rss_feed_items_updated_at
      BEFORE UPDATE ON public.rss_feed_items
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_scraper_configs_updated_at') THEN
    CREATE TRIGGER trigger_scraper_configs_updated_at
      BEFORE UPDATE ON public.scraper_configs
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
