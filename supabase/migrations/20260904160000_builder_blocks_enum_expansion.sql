-- ============================================================================
-- Jah Commerce — Migration 20260904160000: Builder Blocks Enum Expansion
-- ============================================================================
-- Expands public.builder_block_type ENUM to support all modern platform blocks:
-- Biolink, Tourism, Gastronomy, Services, Commerce specials, and Custom sections.
-- ============================================================================

ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'biolink_profile_header';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'biolink_action_buttons';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'biolink_pix_card';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'location_map_card';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'newsletter_capture';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'tourism_quote_hero';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'tourism_services_grid';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'tourism_destinations_carousel';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'food_menu_streamlined';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'food_menu_tabs';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'chef_special_banner';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'restaurant_hours_delivery';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'table_booking_card';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'table_order_comanda';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'curated_hits_rail';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'shop_the_look_hotspots';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'size_guide_table';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'specialist_team_grid';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'service_pricing_table';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'property_features_grid';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'flash_sale_hero';
ALTER TYPE public.builder_block_type ADD VALUE IF NOT EXISTS 'custom_section';
