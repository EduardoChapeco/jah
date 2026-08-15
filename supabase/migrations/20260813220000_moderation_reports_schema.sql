-- ============================================================================
-- JAH COMMUNITY PLATFORM — MODERATION REPORTS & TRUST & SAFETY SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('classified', 'post', 'event', 'product', 'profile', 'comment')),
  entity_id TEXT NOT NULL,
  entity_title TEXT,
  entity_snapshot JSONB DEFAULT '{}'::jsonb,
  reporter_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_ip_hash TEXT,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'fraud', 'inappropriate', 'illegal', 'offensive', 'misleading', 'other')),
  description TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved_removed', 'resolved_dismissed', 'resolved_warned')),
  moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderator_notes TEXT,
  action_taken TEXT DEFAULT 'none' CHECK (action_taken IN ('none', 'content_removed', 'content_hidden', 'author_warned', 'author_banned', 'dismissed')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for fast query and filtering in the Admin Moderation Queue
CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON public.moderation_reports(status);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_entity ON public.moderation_reports(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_created ON public.moderation_reports(created_at DESC);

-- Enable RLS
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;

-- Policy 1: Any user (or anonymous) can submit a report
CREATE POLICY "Allow public insert of moderation reports"
  ON public.moderation_reports
  FOR INSERT
  WITH CHECK (true);

-- Policy 2: Only administrators/moderators can view all reports
CREATE POLICY "Admins can view and manage moderation reports"
  ON public.moderation_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE profile_id = auth.uid()
      AND role IN ('owner', 'admin', 'master', 'moderator')
    )
  );

-- Policy 3: Reporters can view their own submitted reports
CREATE POLICY "Users can view their own reports"
  ON public.moderation_reports
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND reporter_profile_id = auth.uid()
  );
