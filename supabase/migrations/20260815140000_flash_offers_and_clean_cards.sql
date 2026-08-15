-- Migration: flash_offers_and_clean_cards
-- Adds customization flags for banners/hotpages and flash offer automation fields for products.

ALTER TABLE IF EXISTS banners
  ADD COLUMN IF NOT EXISTS show_title boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_description boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_overlay boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_badge boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_cta boolean DEFAULT true;

ALTER TABLE IF EXISTS hotpages
  ADD COLUMN IF NOT EXISTS show_title boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_description boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_overlay boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_badge boolean DEFAULT true;

ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS has_flash_offer boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS flash_offer_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS flash_offer_stock_limit integer,
  ADD COLUMN IF NOT EXISTS flash_offer_sold_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flash_offer_auto_renew boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS flash_offer_renew_stock_amount integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS flash_offer_renew_interval_hours integer DEFAULT 24;

-- Seed / Update initial sample banners to showcase both clean & overlay modes
UPDATE banners
SET 
  show_title = true,
  show_description = true,
  show_overlay = true,
  show_badge = true,
  show_cta = true
WHERE show_title IS NULL;
