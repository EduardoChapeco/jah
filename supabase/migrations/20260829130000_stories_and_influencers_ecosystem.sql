-- ==============================================================================
-- 20260829130000_stories_and_influencers_ecosystem.sql
-- Módulo Master de Stories Contextuais, Ads Intercalados e Plataforma de Influenciadores
-- ==============================================================================

-- 1. EXPANSÃO DA TABELA DE STORIES
DO $$ 
BEGIN
  -- Criação da tabela stories se não existir
  CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    link_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived', 'draft')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- Adição de novas colunas para o player avançado, SEO, nicho e agendamento
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='duration_seconds') THEN
    ALTER TABLE public.stories ADD COLUMN duration_seconds INTEGER NOT NULL DEFAULT 15;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='is_long_format') THEN
    ALTER TABLE public.stories ADD COLUMN is_long_format BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='niche') THEN
    ALTER TABLE public.stories ADD COLUMN niche TEXT NOT NULL DEFAULT 'geral';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='hashtags') THEN
    ALTER TABLE public.stories ADD COLUMN hashtags TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='seo_keywords') THEN
    ALTER TABLE public.stories ADD COLUMN seo_keywords TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='product_id') THEN
    ALTER TABLE public.stories ADD COLUMN product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='link_cta') THEN
    ALTER TABLE public.stories ADD COLUMN link_cta TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='author_profile_id') THEN
    ALTER TABLE public.stories ADD COLUMN author_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='creator_id') THEN
    ALTER TABLE public.stories ADD COLUMN creator_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='is_sponsored') THEN
    ALTER TABLE public.stories ADD COLUMN is_sponsored BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='campaign_id') THEN
    ALTER TABLE public.stories ADD COLUMN campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='scheduled_at') THEN
    ALTER TABLE public.stories ADD COLUMN scheduled_at TIMESTAMPTZ DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='expires_at') THEN
    ALTER TABLE public.stories ADD COLUMN expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours');
  END IF;
END $$;

-- 2. TABELA DE CRIADORES DE CONTEÚDO & INFLUENCIADORES REGIONAIS
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  niche TEXT NOT NULL DEFAULT 'geral',
  is_official_ambassador BOOLEAN NOT NULL DEFAULT false,
  ambassador_badge_label TEXT DEFAULT 'Embaixador Regional',
  city TEXT,
  state TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  engagement_score NUMERIC(5,2) DEFAULT 0.00,
  verified_by_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_approval', 'suspended', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de busca e ordenação
CREATE INDEX IF NOT EXISTS idx_creator_profiles_handle ON public.creator_profiles(handle);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_ambassador ON public.creator_profiles(is_official_ambassador) WHERE is_official_ambassador = true;
CREATE INDEX IF NOT EXISTS idx_creator_profiles_niche ON public.creator_profiles(niche);

-- 3. TABELA DE CO-PUBLICAÇÃO (COLLABS CRIADOR <-> LOJA)
CREATE TABLE IF NOT EXISTS public.story_collabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  allow_store_repost BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_story_collab UNIQUE(story_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_story_collabs_store ON public.story_collabs(store_id, status);
CREATE INDEX IF NOT EXISTS idx_story_collabs_creator ON public.story_collabs(creator_id);

-- 4. TABELA DE TELEMETRIA & ANALYTICS DE STORIES
CREATE TABLE IF NOT EXISTS public.story_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_session_id TEXT,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'watch_time', 'tap_forward', 'tap_back', 'click_cta', 'click_product', 'skipped')),
  watch_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_story_analytics_story_event ON public.story_analytics_events(story_id, event_type);
CREATE INDEX IF NOT EXISTS idx_story_analytics_created ON public.story_analytics_events(created_at DESC);

-- 5. SEGURANÇA & RLS (DENY-BY-DEFAULT)
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_collabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_analytics_events ENABLE ROW LEVEL SECURITY;

-- Stories: leitura pública de stories ativos que não expiraram
DROP POLICY IF EXISTS "stories_public_active_read" ON public.stories;
CREATE POLICY "stories_public_active_read" ON public.stories
  FOR SELECT USING (
    status = 'active' 
    AND (scheduled_at IS NULL OR scheduled_at <= now())
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Stories: escrita por membros da loja ou criador
DROP POLICY IF EXISTS "stories_store_staff_write" ON public.stories;
CREATE POLICY "stories_store_staff_write" ON public.stories
  FOR ALL USING (
    store_id IN (
      SELECT store_id FROM public.workspace_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'content')
    )
    OR author_profile_id = auth.uid()
  );

-- Creator Profiles: Leitura pública de criadores ativos
DROP POLICY IF EXISTS "creator_profiles_public_read" ON public.creator_profiles;
CREATE POLICY "creator_profiles_public_read" ON public.creator_profiles
  FOR SELECT USING (status = 'active');

-- Creator Profiles: Edição do próprio perfil
DROP POLICY IF EXISTS "creator_profiles_owner_write" ON public.creator_profiles;
CREATE POLICY "creator_profiles_owner_write" ON public.creator_profiles
  FOR ALL USING (user_id = auth.uid());

-- Creator Profiles: Admin Master tem controle total (conceder selo de embaixador)
DROP POLICY IF EXISTS "creator_profiles_admin_master" ON public.creator_profiles;
CREATE POLICY "creator_profiles_admin_master" ON public.creator_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('platform_admin', 'master')
    )
  );

-- Story Collabs: Leitura pública de collabs aprovadas
DROP POLICY IF EXISTS "story_collabs_public_read" ON public.story_collabs;
CREATE POLICY "story_collabs_public_read" ON public.story_collabs
  FOR SELECT USING (status = 'approved');

-- Story Collabs: Gestão pela loja ou pelo criador
DROP POLICY IF EXISTS "story_collabs_staff_manage" ON public.story_collabs;
CREATE POLICY "story_collabs_staff_manage" ON public.story_collabs
  FOR ALL USING (
    store_id IN (
      SELECT store_id FROM public.workspace_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'content')
    )
    OR creator_id IN (
      SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()
    )
  );

-- Story Analytics: Inserção anônima ou autenticada de eventos
DROP POLICY IF EXISTS "story_analytics_insert" ON public.story_analytics_events;
CREATE POLICY "story_analytics_insert" ON public.story_analytics_events
  FOR INSERT WITH CHECK (true);

-- Story Analytics: Leitura das métricas pela loja do story
DROP POLICY IF EXISTS "story_analytics_store_read" ON public.story_analytics_events;
CREATE POLICY "story_analytics_store_read" ON public.story_analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      JOIN public.workspace_members wm ON wm.store_id = s.store_id
      WHERE s.id = story_analytics_events.story_id
        AND wm.profile_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager', 'content')
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('platform_admin', 'master')
    )
  );

-- Triggers de atualização
CREATE OR REPLACE TRIGGER creator_profiles_updated_at
  BEFORE UPDATE ON public.creator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
