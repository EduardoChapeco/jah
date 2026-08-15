-- Migration 0090: Product Modifier Engine (Foodyman Benchmark)
-- Protocolo V3 - Grupos de Modificadores, Adicionais e Personalização de Alimentos

CREATE TABLE IF NOT EXISTS public.product_modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  min_selections INT NOT NULL DEFAULT 0,
  max_selections INT NOT NULL DEFAULT 1,
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.product_modifier_groups(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  price_delta_cents BIGINT NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_modifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modifier_groups_public_select" ON public.product_modifier_groups
  FOR SELECT USING (true);

CREATE POLICY "modifiers_public_select" ON public.product_modifiers
  FOR SELECT USING (true);

CREATE POLICY "modifier_groups_manage_policy" ON public.product_modifier_groups
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "modifiers_manage_policy" ON public.product_modifiers
  FOR ALL USING (auth.role() = 'authenticated');


CREATE INDEX IF NOT EXISTS modifier_groups_prod_idx ON public.product_modifier_groups(product_id);
CREATE INDEX IF NOT EXISTS modifiers_group_idx ON public.product_modifiers(group_id);
