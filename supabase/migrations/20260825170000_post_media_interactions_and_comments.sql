-- Migration 20260825170000_post_media_interactions_and_comments.sql
-- Description: Suporte a curtidas individuais por foto de post, comentários vinculados a mídias específicas e respostas encadeadas.

-- 1. Tabela de curtidas por mídia individual do post
CREATE TABLE IF NOT EXISTS public.post_media_likes (
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, media_url, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_post_media_likes_post ON public.post_media_likes(post_id, media_url);

-- 2. Alterar post_comments para suportar media_url, parent_id e likes_count
ALTER TABLE public.post_comments 
ADD COLUMN IF NOT EXISTS media_url TEXT NULL,
ADD COLUMN IF NOT EXISTS parent_id UUID NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS likes_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_post_comments_media ON public.post_comments(post_id, media_url) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON public.post_comments(parent_id) WHERE status = 'active';

-- 3. Tabela de curtidas em comentários
CREATE TABLE IF NOT EXISTS public.post_comment_likes (
    comment_id UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (comment_id, profile_id)
);

-- 4. Habilitar RLS
ALTER TABLE public.post_media_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comment_likes ENABLE ROW LEVEL SECURITY;

-- 5. Policies para post_media_likes
DO $$ BEGIN
    DROP POLICY IF EXISTS "Media likes are viewable by everyone" ON public.post_media_likes;
    DROP POLICY IF EXISTS "Users can like media" ON public.post_media_likes;
    DROP POLICY IF EXISTS "Users can unlike media" ON public.post_media_likes;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "Media likes are viewable by everyone" ON public.post_media_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like media" ON public.post_media_likes
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can unlike media" ON public.post_media_likes
    FOR DELETE USING (auth.uid() = profile_id);

-- 6. Policies para post_comment_likes
DO $$ BEGIN
    DROP POLICY IF EXISTS "Comment likes are viewable by everyone" ON public.post_comment_likes;
    DROP POLICY IF EXISTS "Users can like comments" ON public.post_comment_likes;
    DROP POLICY IF EXISTS "Users can unlike comments" ON public.post_comment_likes;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "Comment likes are viewable by everyone" ON public.post_comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like comments" ON public.post_comment_likes
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can unlike comments" ON public.post_comment_likes
    FOR DELETE USING (auth.uid() = profile_id);
