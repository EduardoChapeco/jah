-- 20260817190000_enhanced_member_profiles_and_posts.sql
-- Ampliação das capacidades do perfil comunitário 360° (Wider / Waesy) e timeline social

-- 1. Enriquecer tabela public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'personal' CHECK (profile_type IN ('personal', 'creator', 'professional', 'collective')),
  ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- 2. Índices para busca de perfis e usernames
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_occupation ON public.profiles(occupation);
CREATE INDEX IF NOT EXISTS idx_profiles_city_state ON public.profiles(city, state);

-- 3. Garantir RLS robusto em profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
CREATE POLICY "profiles_self_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Garantir índices e colunas em posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS author_store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS layout_style TEXT DEFAULT 'grid',
  ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'simple';

CREATE INDEX IF NOT EXISTS idx_posts_author_profile ON public.posts(author_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_store ON public.posts(author_store_id, created_at DESC);
