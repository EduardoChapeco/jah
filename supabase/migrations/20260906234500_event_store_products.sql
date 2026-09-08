-- =============================================================================
-- MIGRATION: 20260906234500_event_store_products.sql
-- ECOSSISTEMA JAH: PRODUTOS & LOJA DO EVENTO (BAR, MERCHANDISE, COMBOS & BUNDLES)
-- TRANSFUSÃO NATIVIZADA DE PERSONA-NEXUS / EVENTIO
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.event_store_products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  event_id            UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  subpanel_id         UUID REFERENCES public.event_subpanels(id) ON DELETE SET NULL,
  nome                TEXT NOT NULL CHECK (char_length(nome) >= 2),
  descricao           TEXT,
  price_cents         INT NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  estoque_atual       INT NOT NULL DEFAULT 0 CHECK (estoque_atual >= 0),
  imagem_url          TEXT,
  is_bundle           BOOLEAN NOT NULL DEFAULT false,
  bundle_items        JSONB DEFAULT '[]'::jsonb,
  ativo               BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_store_products_event ON public.event_store_products(event_id);
CREATE INDEX IF NOT EXISTS idx_event_store_products_store ON public.event_store_products(store_id);
CREATE INDEX IF NOT EXISTS idx_event_store_products_subpanel ON public.event_store_products(subpanel_id);

-- View para retrocompatibilidade com produtos_evento (persona-nexus)
CREATE OR REPLACE VIEW public.produtos_evento AS
SELECT 
  id,
  store_id,
  event_id AS evento_id,
  subpanel_id,
  nome,
  descricao,
  ROUND(price_cents / 100.0, 2) AS preco,
  price_cents,
  estoque_atual,
  imagem_url,
  is_bundle,
  bundle_items,
  ativo,
  created_at,
  updated_at
FROM public.event_store_products;

-- RLS
ALTER TABLE public.event_store_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_manage_event_store_products ON public.event_store_products;
CREATE POLICY staff_manage_event_store_products
  ON public.event_store_products FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS public_read_event_store_products ON public.event_store_products;
CREATE POLICY public_read_event_store_products
  ON public.event_store_products FOR SELECT
  USING (ativo = true);
