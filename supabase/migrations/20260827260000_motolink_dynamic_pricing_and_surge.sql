-- ============================================================================
-- WIDER PLATFORM: MOTOLINK DYNAMIC SURGE PRICING & COURIER AUTONOMY ENGINE
-- Gestão Autônoma de Tarifas para Entregadores, Regras de Chuva/Pico e Políticas para Lojas
-- ============================================================================

-- 1. Tabela de Regras de Precificação Dinâmica por Entregador / Motoboy
CREATE TABLE IF NOT EXISTS public.courier_surge_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  min_fee_cents INTEGER NOT NULL DEFAULT 800 CHECK (min_fee_cents >= 500), -- Mínimo R$ 8,00
  base_km_fee_cents INTEGER NOT NULL DEFAULT 250 CHECK (base_km_fee_cents >= 100), -- R$ 2,50 por km
  rain_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.30 CHECK (rain_multiplier >= 1.00 AND rain_multiplier <= 2.50), -- +30% em chuva
  peak_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.20 CHECK (peak_multiplier >= 1.00 AND peak_multiplier <= 2.00), -- +20% em pico
  night_fee_cents INTEGER NOT NULL DEFAULT 300 CHECK (night_fee_cents >= 0), -- R$ 3,00 após as 22h
  auto_surge_enabled BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_courier_surge_active ON public.courier_surge_pricing_rules(courier_id) WHERE is_active = true;

-- 2. Tabela de Políticas de Absorção de Frete por Loja
CREATE TABLE IF NOT EXISTS public.store_delivery_surge_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  absorb_courier_surge_percent INTEGER NOT NULL DEFAULT 50 CHECK (absorb_courier_surge_percent >= 0 AND absorb_courier_surge_percent <= 100),
  max_customer_delivery_fee_cents INTEGER NOT NULL DEFAULT 2500, -- Teto de R$ 25,00 para o consumidor final
  subsidize_free_delivery_above_cents INTEGER DEFAULT 10000, -- Frete grátis para compras acima de R$ 100,00
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- RLS
ALTER TABLE public.courier_surge_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_delivery_surge_policies ENABLE ROW LEVEL SECURITY;

-- Políticas para Entregadores
DROP POLICY IF EXISTS "Entregadores leem suas proprias regras" ON public.courier_surge_pricing_rules;
CREATE POLICY "Entregadores leem suas proprias regras"
  ON public.courier_surge_pricing_rules FOR SELECT
  USING (
    courier_id = (SELECT auth.uid())
    OR (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin'))
  );

DROP POLICY IF EXISTS "Entregadores atualizam suas regras" ON public.courier_surge_pricing_rules;
CREATE POLICY "Entregadores atualizam suas regras"
  ON public.courier_surge_pricing_rules FOR ALL
  USING (courier_id = (SELECT auth.uid()));

-- Políticas para Lojas
DROP POLICY IF EXISTS "Lojas gerenciam suas politicas de frete" ON public.store_delivery_surge_policies;
CREATE POLICY "Lojas gerenciam suas politicas de frete"
  ON public.store_delivery_surge_policies FOR ALL
  USING (
    store_id IN (SELECT store_id FROM public.workspace_members WHERE profile_id = (SELECT auth.uid()))
    OR (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin'))
  );

-- 3. Stored Procedure ACID: Cotação Dinâmica de Frete MotoLink
CREATE OR REPLACE FUNCTION public.calculate_dynamic_motolink_quote(
  p_store_id UUID,
  p_distance_km NUMERIC,
  p_is_raining BOOLEAN DEFAULT false,
  p_is_peak_hour BOOLEAN DEFAULT false,
  p_is_night_time BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store_policy RECORD;
  v_base_fee INTEGER;
  v_raw_fee NUMERIC;
  v_rain_mult NUMERIC := 1.00;
  v_peak_mult NUMERIC := 1.00;
  v_night_add INTEGER := 0;
  v_final_courier_cents INTEGER;
  v_customer_fee_cents INTEGER;
  v_store_absorbed_cents INTEGER;
BEGIN
  -- 1. Buscar política da loja se existir
  SELECT * INTO v_store_policy
  FROM public.store_delivery_surge_policies
  WHERE store_id = p_store_id;

  -- 2. Definir multiplicadores
  IF p_is_raining THEN
    v_rain_mult := 1.30;
  END IF;

  IF p_is_peak_hour THEN
    v_peak_mult := 1.20;
  END IF;

  IF p_is_night_time THEN
    v_night_add := 300; -- R$ 3,00
  END IF;

  -- 3. Cálculo base: R$ 8,00 + R$ 2,50 por km
  v_base_fee := 800 + ROUND(p_distance_km * 250);
  v_raw_fee := (v_base_fee * v_rain_mult * v_peak_mult) + v_night_add;
  v_final_courier_cents := ROUND(v_raw_fee);

  -- 4. Divisão de custo (Absorção da Loja vs Consumidor)
  IF v_store_policy.id IS NOT NULL THEN
    v_store_absorbed_cents := ROUND(v_final_courier_cents * (v_store_policy.absorb_courier_surge_percent / 100.0));
    v_customer_fee_cents := v_final_courier_cents - v_store_absorbed_cents;

    IF v_customer_fee_cents > v_store_policy.max_customer_delivery_fee_cents THEN
      v_customer_fee_cents := v_store_policy.max_customer_delivery_fee_cents;
      v_store_absorbed_cents := v_final_courier_cents - v_customer_fee_cents;
    END IF;
  ELSE
    v_store_absorbed_cents := 0;
    v_customer_fee_cents := v_final_courier_cents;
  END IF;

  RETURN jsonb_build_object(
    'distance_km', p_distance_km,
    'courier_total_cents', v_final_courier_cents,
    'customer_fee_cents', v_customer_fee_cents,
    'store_absorbed_cents', v_store_absorbed_cents,
    'applied_surge', jsonb_build_object(
      'is_raining', p_is_raining,
      'rain_multiplier', v_rain_mult,
      'is_peak_hour', p_is_peak_hour,
      'peak_multiplier', v_peak_mult,
      'is_night_time', p_is_night_time,
      'night_addition_cents', v_night_add
    )
  );
END;
$$;
