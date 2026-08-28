-- ============================================================================
-- WIDER PLATFORM: MOTOR ALGORTÍMICO PARAMETRIZÁVEL & BUSCA INSTANTÂNEA
-- Governança de Pesos Multi-Sinal (Geo, Aberto Agora, Afinidade, Recência, Qualidade e Tokens)
-- ============================================================================

-- 1. Tabela de Parâmetros do Algoritmo Global (100% Editável no Admin Master)
CREATE TABLE IF NOT EXISTS public.platform_algorithm_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  name TEXT NOT NULL DEFAULT 'Configuração Padrão de Equilíbrio Urbano',
  description TEXT DEFAULT 'Balanceamento dinâmico entre proximidade física, lojas abertas, histórico do usuário e impulsos de tokens.',
  
  -- Pesos dos 6 Sinais (Soma = 1.00 ou 100%)
  weight_geo NUMERIC(4, 2) NOT NULL DEFAULT 0.25 CHECK (weight_geo >= 0 AND weight_geo <= 1.00),
  weight_open_status NUMERIC(4, 2) NOT NULL DEFAULT 0.20 CHECK (weight_open_status >= 0 AND weight_open_status <= 1.00),
  weight_user_affinity NUMERIC(4, 2) NOT NULL DEFAULT 0.20 CHECK (weight_user_affinity >= 0 AND weight_user_affinity <= 1.00),
  weight_freshness NUMERIC(4, 2) NOT NULL DEFAULT 0.15 CHECK (weight_freshness >= 0 AND weight_freshness <= 1.00),
  weight_store_quality NUMERIC(4, 2) NOT NULL DEFAULT 0.10 CHECK (weight_store_quality >= 0 AND weight_store_quality <= 1.00),
  weight_token_boost NUMERIC(4, 2) NOT NULL DEFAULT 0.10 CHECK (weight_token_boost >= 0 AND weight_token_boost <= 1.00),
  
  -- Parâmetros de Filtro Espacial
  max_radius_km NUMERIC(5, 1) NOT NULL DEFAULT 15.0,
  decay_half_life_days NUMERIC(4, 1) NOT NULL DEFAULT 7.0, -- Meia-vida da recência em dias
  
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Inserir registro padrão único se não existir
INSERT INTO public.platform_algorithm_parameters (
  id, name, weight_geo, weight_open_status, weight_user_affinity, weight_freshness, weight_store_quality, weight_token_boost
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Algoritmo Canônico Wider Pulse v1',
  0.25, 0.20, 0.20, 0.15, 0.10, 0.10
)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.platform_algorithm_parameters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública dos parâmetros do algoritmo" ON public.platform_algorithm_parameters;
CREATE POLICY "Leitura pública dos parâmetros do algoritmo"
  ON public.platform_algorithm_parameters FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Apenas Admin Master pode atualizar pesos do algoritmo" ON public.platform_algorithm_parameters;
CREATE POLICY "Apenas Admin Master pode atualizar pesos do algoritmo"
  ON public.platform_algorithm_parameters FOR ALL
  USING (
    (SELECT auth.uid()) IN (
      SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin')
    )
  );

-- 2. Stored Procedure: Busca Instantânea de Typeahead (com Lojas Abertas, Produtos e Sugestões)
CREATE OR REPLACE FUNCTION public.search_typeahead_instant(
  p_query TEXT,
  p_limit INTEGER DEFAULT 6
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_terms JSONB := '[]'::JSONB;
  v_stores JSONB := '[]'::JSONB;
  v_products JSONB := '[]'::JSONB;
  v_clean_query TEXT := trim(p_query);
BEGIN
  IF length(v_clean_query) < 2 THEN
    RETURN jsonb_build_object(
      'query', v_clean_query,
      'suggestions', '[]'::JSONB,
      'stores', '[]'::JSONB,
      'products', '[]'::JSONB
    );
  END IF;

  -- 1. Lojas & Negócios Correspondentes
  SELECT jsonb_agg(s_data) INTO v_stores
  FROM (
    SELECT
      s.id,
      s.name,
      s.slug,
      s.logo_url,
      s.city,
      COALESCE(s.settings->>'isOpenNow', 'true')::boolean AS is_open,
      COALESCE(s.rating, 5.0) AS rating,
      COALESCE(s.reviews_count, 0) AS reviews_count
    FROM public.stores s
    WHERE (s.name ILIKE '%' || v_clean_query || '%' OR s.slug ILIKE '%' || v_clean_query || '%')
    ORDER BY
      (s.name ILIKE v_clean_query || '%') DESC,
      s.created_at DESC
    LIMIT p_limit
  ) s_data;

  -- 2. Produtos em Destaque
  SELECT jsonb_agg(p_data) INTO v_products
  FROM (
    SELECT
      p.id,
      p.title,
      p.slug,
      p.price_cents,
      p.cover_url,
      p.store_id,
      s.name AS store_name,
      s.slug AS store_slug
    FROM public.products p
    JOIN public.stores s ON s.id = p.store_id
    WHERE (p.title ILIKE '%' || v_clean_query || '%' OR p.description ILIKE '%' || v_clean_query || '%')
      AND p.status = 'active'
    ORDER BY
      (p.title ILIKE v_clean_query || '%') DESC,
      p.created_at DESC
    LIMIT p_limit
  ) p_data;

  -- 3. Sugestões de Termos
  SELECT jsonb_agg(t.term) INTO v_terms
  FROM (
    SELECT DISTINCT title AS term
    FROM public.products
    WHERE title ILIKE v_clean_query || '%' AND status = 'active'
    LIMIT 4
  ) t;

  RETURN jsonb_build_object(
    'query', v_clean_query,
    'suggestions', COALESCE(v_terms, '[]'::JSONB),
    'stores', COALESCE(v_stores, '[]'::JSONB),
    'products', COALESCE(v_products, '[]'::JSONB)
  );
END;
$$;
