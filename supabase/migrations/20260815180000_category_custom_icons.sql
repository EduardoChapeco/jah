-- Migration: 20260815180000_category_custom_icons.sql
-- Permite upload e customização de ícones/imagens para categorias e hotpages no Admin Master

ALTER TABLE IF EXISTS categories
  ADD COLUMN IF NOT EXISTS icon_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_icon_url TEXT,
  ADD COLUMN IF NOT EXISTS icon_name TEXT;

ALTER TABLE IF EXISTS hotpages
  ADD COLUMN IF NOT EXISTS icon_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_icon_url TEXT,
  ADD COLUMN IF NOT EXISTS icon_name TEXT;

-- Update existing default master categories with curated vector names and icon references
UPDATE hotpages SET icon_name = 'Storefront' WHERE slug = 'mercado';
UPDATE hotpages SET icon_name = 'Heartbeat' WHERE slug = 'farmacia';
UPDATE hotpages SET icon_name = 'ForkKnife' WHERE slug = 'gastronomia';
UPDATE hotpages SET icon_name = 'Coffee' WHERE slug = 'conveniencia';
UPDATE hotpages SET icon_name = 'TShirt' WHERE slug = 'moda';
UPDATE hotpages SET icon_name = 'Key' WHERE slug = 'aluguel';
UPDATE hotpages SET icon_name = 'Briefcase' WHERE slug = 'empregos';
UPDATE hotpages SET icon_name = 'CalendarDots' WHERE slug = 'eventos' OR slug = 'agenda';
UPDATE hotpages SET icon_name = 'CarProfile' WHERE slug = 'mobilidade' OR slug = 'veiculos';
UPDATE hotpages SET icon_name = 'Tag' WHERE slug = 'classificados' OR slug = 'ofertas';
UPDATE hotpages SET icon_name = 'Scissors' WHERE slug = 'beleza';
UPDATE hotpages SET icon_name = 'Wrench' WHERE slug = 'servicos' OR slug = 'diretorio';
