-- ============================================================================
-- Jah Commerce — Fix CMS RLS
-- ============================================================================

BEGIN;

-- Fix workspace_members missing policies (CRITICAL FIX)
DROP POLICY IF EXISTS "workspace_members_self_read" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_store_read" ON public.workspace_members;
CREATE POLICY "workspace_members_self_read"
  ON public.workspace_members FOR SELECT
  USING (profile_id = auth.uid());

-- Fix pages
DROP POLICY IF EXISTS "pages_staff_all" ON public.pages;

CREATE POLICY "pages_staff_all"
  ON public.pages FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.workspace_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'content')
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM public.workspace_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );

-- Fix page_sections
DROP POLICY IF EXISTS "page_sections_staff_all" ON public.page_sections;

CREATE POLICY "page_sections_staff_all"
  ON public.page_sections FOR ALL
  USING (
    page_id IN (
      SELECT p.id FROM public.pages p
      JOIN public.workspace_members wm ON wm.store_id = p.store_id
      WHERE wm.profile_id = auth.uid() AND wm.role IN ('owner', 'admin', 'manager', 'content')
    )
  )
  WITH CHECK (
    page_id IN (
      SELECT p.id FROM public.pages p
      JOIN public.workspace_members wm ON wm.store_id = p.store_id
      WHERE wm.profile_id = auth.uid() AND wm.role IN ('owner', 'admin', 'manager', 'content')
    )
  );

-- Fix reviews
DROP POLICY IF EXISTS "reviews_staff_all" ON public.reviews;

CREATE POLICY "reviews_staff_all"
  ON public.reviews FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.workspace_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'content')
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM public.workspace_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );

COMMIT;
