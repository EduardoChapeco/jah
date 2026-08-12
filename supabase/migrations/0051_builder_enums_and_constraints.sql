-- ============================================================================
-- Jah Commerce — Migration 0051: Builder Enums and Constraints
-- ============================================================================
-- Transforms the Builder node_type and block_type from blind TEXT into
-- strict ENUMs to guarantee schema integrity at the database level.
-- Introduces layout_type to formalize variants without duplicating blocks.
-- ============================================================================

BEGIN;

  -- 1. Create Enums
  CREATE TYPE public.builder_node_type AS ENUM (
    'section',
    'container',
    'element',
    'composition'
  );

  CREATE TYPE public.builder_block_type AS ENUM (
    'section',
    'container',
    'rich_text',
    'hero_carousel',
    'bento_grid',
    'countdown_timer',
    'stories_ring',
    'trust_badges',
    'product_rail',
    'announcement_bar',
    'video_section',
    'contact_form',
    'booking_calendar',
    'gallery_grid',
    'info_cards',
    'mosaic_banners',
    'social_grid',
    'faq_accordion',
    'testimonial_carousel',
    'timeline_history',
    'product_carousel',
    'product_grid',
    'split_banner',
    'store_profile_hero',
    'store_hours',
    'store_contact',
    'image_hotspots',
    'routine_steps',
    'ingredient_spotlight',
    'before_after_slider',
    'event_rail',
    'community_feed'
  );

  -- 2. Alter Table Columns to use ENUMs
  -- We cast existing text to the new enums. If any data violates this, the migration will fail,
  -- proving the strictness of our new schema.
  
  ALTER TABLE public.experience_nodes
    ALTER COLUMN node_type TYPE public.builder_node_type 
    USING node_type::public.builder_node_type;

  ALTER TABLE public.experience_nodes
    ALTER COLUMN block_type TYPE public.builder_block_type 
    USING block_type::public.builder_block_type;

  -- 3. Formalize Layout Registry
  -- Adds an explicit column for layout variant (e.g., 'grid', 'carousel', 'masonry')
  -- This prevents "JSON cego" for layouts and standardizes them.
  ALTER TABLE public.experience_nodes
    ADD COLUMN IF NOT EXISTS layout_variant TEXT;

COMMIT;
