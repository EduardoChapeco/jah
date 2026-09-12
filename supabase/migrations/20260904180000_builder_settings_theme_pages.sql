-- ============================================================================
-- Waesy Commerce — Migration 20260904180000: Builder Settings (Theme & Pages)
-- ============================================================================
-- Adds settings JSONB column to experience_documents to persist:
-- 1. theme: Global Brand Kit (primaryColor, backgroundColor, textColor, fonts, radius, surface)
-- 2. pages: Multi-page site hierarchy with slugs, titles, and SEO meta tags
-- ============================================================================

BEGIN;

  -- 1. Add settings column to experience_documents
  ALTER TABLE public.experience_documents
    ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

  -- 2. Initialize default theme and home page for existing documents if empty
  UPDATE public.experience_documents
  SET settings = jsonb_build_object(
    'theme', jsonb_build_object(
      'primaryColor', '#09090b',
      'backgroundColor', '#ffffff',
      'textColor', '#09090b',
      'headingFont', 'Inter, sans-serif',
      'bodyFont', 'Inter, sans-serif',
      'borderRadius', 'xl',
      'surfaceStyle', 'clean'
    ),
    'pages', jsonb_build_array(
      jsonb_build_object(
        'id', 'home',
        'title', COALESCE(title, 'Página Inicial'),
        'slug', '/',
        'is_home', true,
        'seo_title', COALESCE(title, 'Início'),
        'seo_description', 'Página principal da vitrine'
      )
    )
  )
  WHERE settings IS NULL OR settings = '{}'::jsonb;

COMMIT;
