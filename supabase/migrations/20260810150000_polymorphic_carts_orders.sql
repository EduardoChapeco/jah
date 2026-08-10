-- Migration: Add polymorphic item types to cart_items and order_items

-- 1. Add item_type and item_id to cart_items
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS item_type text DEFAULT 'product' CHECK (item_type IN ('product', 'event', 'classified', 'service')),
  ADD COLUMN IF NOT EXISTS item_id uuid;

-- 2. Migrate existing data (assuming variant_id was used as the primary reference)
UPDATE public.cart_items 
SET item_id = variant_id 
WHERE item_id IS NULL AND variant_id IS NOT NULL;

-- 3. Make variant_id optional to allow events/services that don't use the variant matrix
ALTER TABLE public.cart_items ALTER COLUMN variant_id DROP NOT NULL;

-- 4. Do the same for order_items
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS item_type text DEFAULT 'product' CHECK (item_type IN ('product', 'event', 'classified', 'service')),
  ADD COLUMN IF NOT EXISTS item_id uuid;

UPDATE public.order_items 
SET item_id = variant_id 
WHERE item_id IS NULL AND variant_id IS NOT NULL;

ALTER TABLE public.order_items ALTER COLUMN variant_id DROP NOT NULL;
