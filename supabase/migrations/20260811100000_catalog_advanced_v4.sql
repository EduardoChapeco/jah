-- ============================================================================
-- Jah Commerce — Migration V4: Advanced Catalog & Option Groups
-- ============================================================================
-- Elevating the catalog to support complex logic (iFood/Neutto style):
-- 1. Adds `max_quantity_per_option` to option_values (e.g., up to 3 extra cheeses).
-- 2. Adds `franchise_included` to option_groups (e.g., first 2 flavors free).
-- 3. Adds `availability_channels` to products for omnichannel toggling.
-- 4. Unifies "products" as the "Universal Offer".
-- ============================================================================

-- 1. Enhance `option_groups` (from 20260810160000_reusable_option_groups.sql)
ALTER TABLE public.option_groups
ADD COLUMN IF NOT EXISTS franchise_included INTEGER DEFAULT 0 CHECK (franchise_included >= 0),
ADD COLUMN IF NOT EXISTS availability_channels JSONB DEFAULT '["all"]';

-- 2. Enhance `option_values`
ALTER TABLE public.option_values
ADD COLUMN IF NOT EXISTS max_quantity INTEGER DEFAULT 1 CHECK (max_quantity >= 1),
ADD COLUMN IF NOT EXISTS sku_reference TEXT, -- Optional physical SKU reference
ADD COLUMN IF NOT EXISTS availability_channels JSONB DEFAULT '["all"]';

-- 3. Enhance `products` (The Universal Offer)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS availability_channels JSONB DEFAULT '["all"]';

-- 4. Create an Advanced Option Group View for BFF ease of use
CREATE OR REPLACE VIEW public.vw_catalog_option_groups AS
SELECT 
  og.id,
  og.store_id,
  og.internal_name,
  og.display_name,
  og.selection_type,
  og.min_selections,
  og.max_selections,
  og.franchise_included,
  og.is_required,
  og.availability_channels,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ov.id,
        'label', ov.label,
        'price_modifier_cents', ov.price_modifier_cents,
        'is_default', ov.is_default,
        'is_active', ov.is_active,
        'max_quantity', ov.max_quantity,
        'sku_reference', ov.sku_reference,
        'sort_order', ov.sort_order
      ) ORDER BY ov.sort_order ASC
    ) FILTER (WHERE ov.id IS NOT NULL), 
    '[]'::jsonb
  ) as options
FROM public.option_groups og
LEFT JOIN public.option_values ov ON ov.group_id = og.id
GROUP BY og.id;
