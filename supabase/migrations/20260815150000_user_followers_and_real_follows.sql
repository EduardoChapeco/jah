-- ============================================================================
-- Jah Platform — Migration: User Followers & Real Social Follows
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_followers (
  following_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follower_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (following_user_id, follower_user_id),
  CONSTRAINT user_followers_no_self_follow CHECK (following_user_id <> follower_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_followers_following ON public.user_followers(following_user_id);
CREATE INDEX IF NOT EXISTS idx_user_followers_follower ON public.user_followers(follower_user_id);

ALTER TABLE public.user_followers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_followers' AND policyname = 'user_followers_public_read'
  ) THEN
    CREATE POLICY "user_followers_public_read"
      ON public.user_followers FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_followers' AND policyname = 'user_followers_manage'
  ) THEN
    CREATE POLICY "user_followers_manage"
      ON public.user_followers FOR ALL
      USING (follower_user_id = auth.uid())
      WITH CHECK (follower_user_id = auth.uid());
  END IF;
END $$;
