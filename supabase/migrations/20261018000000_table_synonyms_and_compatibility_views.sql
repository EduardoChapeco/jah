-- ============================================================================
-- Migration: Table Synonyms, Compatibility Views and Atomic Counter RPCs
-- Ensures 100% database compatibility with legacy/alternate names across
-- workspace_members, classifieds, stores, reviews, and ticket/sponsor RPCs.
-- ============================================================================

-- 1. store_members compatibility view aliasing workspace_members
CREATE OR REPLACE VIEW public.store_members AS
  SELECT 
    id,
    profile_id,
    profile_id AS user_id,
    store_id,
    role,
    created_at,
    updated_at
  FROM public.workspace_members;

-- 2. classified_ads compatibility view aliasing classifieds
CREATE OR REPLACE VIEW public.classified_ads AS
  SELECT *
  FROM public.classifieds;

-- 3. companies compatibility view aliasing stores
CREATE OR REPLACE VIEW public.companies AS
  SELECT *
  FROM public.stores;

-- 4. store_reviews compatibility view aliasing deal_reviews
CREATE OR REPLACE VIEW public.store_reviews AS
  SELECT *
  FROM public.deal_reviews;

-- 5. store_integrations compatibility view aliasing integration_credentials
CREATE OR REPLACE VIEW public.store_integrations AS
  SELECT 
    id,
    store_id,
    provider,
    credentials AS config,
    CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status,
    created_at,
    updated_at
  FROM public.integration_credentials;

-- 6. Atomic RPC: increment_lot_sold_count
CREATE OR REPLACE FUNCTION public.increment_lot_sold_count(p_lot_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ticket_lots
  SET sold_count = sold_count + 1,
      updated_at = now()
  WHERE id = p_lot_id;
END;
$$;

-- 7. Atomic RPC: increment_ticket_sold
CREATE OR REPLACE FUNCTION public.increment_ticket_sold(p_lot_id UUID, p_qty INT DEFAULT 1)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ticket_lots
  SET sold_count = sold_count + GREATEST(1, p_qty),
      updated_at = now()
  WHERE id = p_lot_id;
END;
$$;

-- 8. Atomic RPC: increment_sponsor_impressions
CREATE OR REPLACE FUNCTION public.increment_sponsor_impressions(p_sponsor_id UUID, p_placement TEXT DEFAULT 'feed')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sponsors
  SET views_count = COALESCE(views_count, 0) + 1,
      updated_at = now()
  WHERE id = p_sponsor_id;
END;
$$;

-- Grants
GRANT SELECT ON public.store_members TO authenticated, anon, service_role;
GRANT SELECT ON public.classified_ads TO authenticated, anon, service_role;
GRANT SELECT ON public.companies TO authenticated, anon, service_role;
GRANT SELECT ON public.store_reviews TO authenticated, anon, service_role;
GRANT SELECT ON public.store_integrations TO authenticated, anon, service_role;

GRANT EXECUTE ON FUNCTION public.increment_lot_sold_count(UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.increment_ticket_sold(UUID, INT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.increment_sponsor_impressions(UUID, TEXT) TO authenticated, anon, service_role;
