-- ============================================================================
-- Migration: 20261019000000_store_promotional_flyers.sql
-- Encartes & Tabloides Promocionais para Mercados, Atacados e Conveniências
-- Suporte a vigência temporal, hotspots de produtos e temas visuais
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.store_promotional_flyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  theme text NOT NULL DEFAULT 'clean' CHECK (theme IN ('clean', 'retro_mercado', 'atacado_neon', 'ofertas_relampago')),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  hotspots jsonb NOT NULL DEFAULT '[]'::jsonb,
  views_count integer NOT NULL DEFAULT 0,
  clicks_count integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_flyers_store_validity 
  ON public.store_promotional_flyers (store_id, status, valid_from, valid_until);

ALTER TABLE public.store_promotional_flyers ENABLE ROW LEVEL SECURITY;

-- Leitura pública para encartes ativos e dentro da vigência temporal
DROP POLICY IF EXISTS "store_flyers_public_read" ON public.store_promotional_flyers;
CREATE POLICY "store_flyers_public_read" ON public.store_promotional_flyers
  FOR SELECT
  USING (
    status = 'active'
    AND valid_from <= now()
    AND (valid_until IS NULL OR valid_until >= now())
  );

-- Gestores da loja possuem acesso irrestrito aos seus encartes
DROP POLICY IF EXISTS "store_flyers_manage_own" ON public.store_promotional_flyers;
CREATE POLICY "store_flyers_manage_own" ON public.store_promotional_flyers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = store_promotional_flyers.store_id
        AND wm.profile_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = store_promotional_flyers.store_id
        AND wm.profile_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

-- Atualiza restrição de tipo de seção em store_page_sections para aceitar 'promotional_flyers'
DO $$
BEGIN
  ALTER TABLE public.store_page_sections 
    DROP CONSTRAINT IF EXISTS store_page_sections_section_type_check;
  ALTER TABLE public.store_page_sections 
    ADD CONSTRAINT store_page_sections_section_type_check CHECK (
      section_type IN (
        'banner_carousel',
        'highlight_cards',
        'featured_services',
        'custom_text_block',
        'infinite_feed',
        'contact_hours',
        'coupons_grid',
        'promotional_flyers'
      )
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
