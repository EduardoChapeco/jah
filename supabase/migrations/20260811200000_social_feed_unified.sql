-- Migration 20260811200000_social_feed_unified.sql
-- Description: Creates the unified posts timeline for the community feed.

-- 1. Create ENUM for reference types if not exists
DO $$ BEGIN
    CREATE TYPE public.post_reference_type AS ENUM ('product', 'event', 'classified', 'ad', 'job', 'none');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE, -- null if posting as personal profile
    
    content_text TEXT,
    media_urls TEXT[] DEFAULT '{}',
    
    reference_type public.post_reference_type DEFAULT 'none'::public.post_reference_type,
    reference_id UUID, -- References the item (product_id, event_id, etc)
    
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'hidden', 'archived')),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for timeline feed (cursor-based pagination)
CREATE INDEX IF NOT EXISTS idx_posts_timeline ON public.posts(created_at DESC) WHERE status = 'active';

-- 3. Create post_likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, profile_id)
);

-- 4. Create post_comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for posts
CREATE POLICY "Posts are viewable by everyone if active" ON public.posts
    FOR SELECT USING (status = 'active' OR auth.uid() = author_profile_id);

CREATE POLICY "Users can create posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = author_profile_id);

CREATE POLICY "Users can update their own posts" ON public.posts
    FOR UPDATE USING (auth.uid() = author_profile_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
    FOR DELETE USING (auth.uid() = author_profile_id);

-- 7. RLS Policies for post_likes
CREATE POLICY "Likes are viewable by everyone" ON public.post_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON public.post_likes
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can unlike posts" ON public.post_likes
    FOR DELETE USING (auth.uid() = profile_id);

-- 8. RLS Policies for post_comments
CREATE POLICY "Comments are viewable by everyone if active" ON public.post_comments
    FOR SELECT USING (status = 'active' OR auth.uid() = profile_id);

CREATE POLICY "Users can create comments" ON public.post_comments
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own comments" ON public.post_comments
    FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own comments" ON public.post_comments
    FOR DELETE USING (auth.uid() = profile_id);

-- 9. Trigger for updated_at
CREATE TRIGGER set_updated_at_posts
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_updated_at_post_comments
    BEFORE UPDATE ON public.post_comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
