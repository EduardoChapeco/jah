-- ============================================================================
-- Jah Community Platform — Migration 20260810190000: Seed Jah Default Store Identity
-- ============================================================================
-- Popula os dados de identidade visual e tema da loja padrão Jah no banco novo.
-- Garante que a plataforma renderize com o Design System Jah correto desde o
-- primeiro acesso, sem depender de configuração manual pelo admin.
--
-- Store ID padrão: 00000000-0000-0000-0000-000000000002
-- (definido em 20260725260000_seed_default_tenant.sql)
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Enriquecer dados da loja padrão com identidade Jah
-- ---------------------------------------------------------------------------
UPDATE public.stores
SET
  name     = 'Jah',
  slug     = 'jah',
  settings = jsonb_build_object(
    'logoUrl',    '',
    'faviconUrl', '/favicon.ico',
    'description', 'Identidade, Comunidade, Eventos, Classificados e Lojas',
    'socialLinks', '{}'::jsonb
  ),
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000002';

-- ---------------------------------------------------------------------------
-- 2. Seed do tema Jah — Design System da Rua
-- ---------------------------------------------------------------------------
-- Fontes: Oswald (display/editorial) + Inter (UI/leitura)
-- Cores: paper (#F4F4F0), ink (#1A1A14), poster-red (#E60000)
-- Border radius: 0px (brutalismo afiado)
-- ---------------------------------------------------------------------------
INSERT INTO public.theme_settings (
  store_id,
  primary_color,
  background_color,
  text_color,
  font_heading,
  font_body,
  border_radius
)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '#E60000',   -- poster-red (acento principal brutalista)
  '#F4F4F0',   -- paper (fundo creme quente — não branco absoluto)
  '#1A1A14',   -- ink (preto carvão quente)
  'Oswald',    -- display/editorial condensada pesada
  'Inter',     -- UI/leitura limpa
  '0px'        -- zero radius — cantos afiados, estética impressa
)
ON CONFLICT (store_id) DO UPDATE SET
  primary_color    = EXCLUDED.primary_color,
  background_color = EXCLUDED.background_color,
  text_color       = EXCLUDED.text_color,
  font_heading     = EXCLUDED.font_heading,
  font_body        = EXCLUDED.font_body,
  border_radius    = EXCLUDED.border_radius,
  updated_at       = now();

-- ---------------------------------------------------------------------------
-- 3. Seed do menu de navegação principal
-- ---------------------------------------------------------------------------
INSERT INTO public.navigation_menus (store_id, handle, name, items)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'main',
  'Menu Principal',
  '[
    {"label": "Início",       "url": "/",           "type": "link"},
    {"label": "Mercado",      "url": "/mercado",    "type": "link"},
    {"label": "Mural",        "url": "/mural",      "type": "link"},
    {"label": "Agenda",       "url": "/agenda",     "type": "link"},
    {"label": "Diretório",    "url": "/diretorio",  "type": "link"}
  ]'::jsonb
)
ON CONFLICT (store_id, handle) DO UPDATE SET
  items      = EXCLUDED.items,
  updated_at = now();

COMMIT;
