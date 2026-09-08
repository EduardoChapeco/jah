-- ==============================================================================
-- MIGRATION: 20260925000000_classifieds_metrics_and_boosting.sql
-- Description: Adds metrics columns (views_count, clicks_count, proposals_count),
--              indexes and atomic increment functions for real analytics & boosting.
-- ==============================================================================

-- 1. ADD METRICS COLUMNS TO CLASSIFIEDS
ALTER TABLE public.classifieds
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicks_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS proposals_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boost_plan text,
  ADD COLUMN IF NOT EXISTS boosted_at timestamptz;

-- 2. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_classifieds_metrics_views ON public.classifieds (views_count DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_classifieds_boosted_until ON public.classifieds (is_boosted, boosted_until DESC) WHERE status = 'active';

-- 3. ATOMIC INCREMENT FUNCTIONS (IDEMPOTENT & SAFE)
CREATE OR REPLACE FUNCTION public.increment_classified_view(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.classifieds
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = ad_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_classified_click(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.classifieds
  SET clicks_count = COALESCE(clicks_count, 0) + 1
  WHERE id = ad_id;
END;
$$;

-- Grant execute permissions to anon and authenticated
GRANT EXECUTE ON FUNCTION public.increment_classified_view(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_classified_click(uuid) TO anon, authenticated, service_role;
