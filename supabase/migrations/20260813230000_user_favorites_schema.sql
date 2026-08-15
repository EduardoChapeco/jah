-- ============================================================================
-- JAH COMMUNITY PLATFORM — USER FAVORITES / BOOKMARKS SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('classified', 'post', 'event', 'product')),
  entity_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_favorites_unique UNIQUE (profile_id, entity_type, entity_id)
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_user_favorites_profile ON public.user_favorites(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_favorites_entity ON public.user_favorites(entity_type, entity_id);

-- Enable RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own favorites
CREATE POLICY "user_favorites_self_select"
  ON public.user_favorites
  FOR SELECT
  USING (profile_id = auth.uid());

-- Policy 2: Users can insert their own favorites
CREATE POLICY "user_favorites_self_insert"
  ON public.user_favorites
  FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- Policy 3: Users can delete their own favorites
CREATE POLICY "user_favorites_self_delete"
  ON public.user_favorites
  FOR DELETE
  USING (profile_id = auth.uid());
