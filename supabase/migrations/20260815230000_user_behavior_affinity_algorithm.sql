-- Migration: 20260815230000_user_behavior_affinity_algorithm.sql
-- Description: Motor de Telemetria Comportamental, Pontuação de Afinidade e Algoritmo de Recomendação Preditiva.

-- 1. Tabela de Eventos de Comportamento Atômicos
CREATE TABLE IF NOT EXISTS public.user_behavior_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'view_item', 'search', 'click_banner', 'click_whatsapp',
    'add_to_cart', 'quote_request', 'booking_complete', 'order_complete'
  )),
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'product', 'store', 'classified', 'job', 'tourism', 'directory', 'service'
  )),
  entity_id UUID,
  category_slug TEXT,
  niche TEXT,
  weight_score INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavior_user ON public.user_behavior_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_session ON public.user_behavior_events(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_niche ON public.user_behavior_events(niche, event_type);

-- 2. Tabela de Afinidade Agregada por Usuário / Sessão e Nicho
CREATE TABLE IF NOT EXISTS public.user_category_affinity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  niche TEXT NOT NULL,
  total_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  interaction_count INTEGER NOT NULL DEFAULT 1,
  last_interacted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_niche UNIQUE (user_id, niche),
  CONSTRAINT uq_session_niche UNIQUE (session_id, niche)
);

CREATE INDEX IF NOT EXISTS idx_affinity_user ON public.user_category_affinity(user_id, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_affinity_session ON public.user_category_affinity(session_id, total_score DESC);

-- 3. RLS
ALTER TABLE public.user_behavior_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_category_affinity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir inserção anônima e autenticada de eventos"
  ON public.user_behavior_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuário lê seus próprios eventos"
  ON public.user_behavior_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Permitir leitura de afinidade pelo próprio usuário ou anon"
  ON public.user_category_affinity FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 4. Função Atômica para Gravar Evento e Recalcular Afinidade (com Exponential Decay)
CREATE OR REPLACE FUNCTION public.record_user_behavior_event(
  p_user_id UUID,
  p_session_id TEXT,
  p_event_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_category_slug TEXT,
  p_niche TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_weight INTEGER := 1;
  v_niche TEXT := COALESCE(p_niche, 'geral');
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Definir peso por evento
  CASE p_event_type
    WHEN 'view_item' THEN v_weight := 1;
    WHEN 'search' THEN v_weight := 2;
    WHEN 'click_banner' THEN v_weight := 2;
    WHEN 'click_whatsapp' THEN v_weight := 5;
    WHEN 'add_to_cart' THEN v_weight := 5;
    WHEN 'quote_request' THEN v_weight := 10;
    WHEN 'booking_complete' THEN v_weight := 15;
    WHEN 'order_complete' THEN v_weight := 20;
    ELSE v_weight := 1;
  END CASE;

  -- 1. Inserir evento atômico
  INSERT INTO public.user_behavior_events (
    user_id, session_id, event_type, entity_type, entity_id, category_slug, niche, weight_score, metadata, created_at
  ) VALUES (
    p_user_id, p_session_id, p_event_type, p_entity_type, p_entity_id, p_category_slug, v_niche, v_weight, p_metadata, v_now
  );

  -- 2. Atualizar ou criar registro de afinidade para Usuário Autenticado
  IF p_user_id IS NOT NULL THEN
    INSERT INTO public.user_category_affinity (
      user_id, niche, total_score, interaction_count, last_interacted_at
    ) VALUES (
      p_user_id, v_niche, v_weight, 1, v_now
    )
    ON CONFLICT (user_id, niche) DO UPDATE SET
      total_score = ROUND(((public.user_category_affinity.total_score * 0.95) + v_weight)::numeric, 2),
      interaction_count = public.user_category_affinity.interaction_count + 1,
      last_interacted_at = v_now;
  -- 3. Atualizar ou criar para Sessão Anônima
  ELSIF p_session_id IS NOT NULL THEN
    INSERT INTO public.user_category_affinity (
      session_id, niche, total_score, interaction_count, last_interacted_at
    ) VALUES (
      p_session_id, v_niche, v_weight, 1, v_now
    )
    ON CONFLICT (session_id, niche) DO UPDATE SET
      total_score = ROUND(((public.user_category_affinity.total_score * 0.95) + v_weight)::numeric, 2),
      interaction_count = public.user_category_affinity.interaction_count + 1,
      last_interacted_at = v_now;
  END IF;

  RETURN jsonb_build_object('success', true, 'weight', v_weight, 'niche', v_niche);
END;
$$;

-- 5. Função para Buscar Top Afinidades de um Usuário / Sessão
CREATE OR REPLACE FUNCTION public.get_user_top_affinities(
  p_user_id UUID,
  p_session_id TEXT,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  niche TEXT,
  total_score NUMERIC,
  interaction_count INTEGER,
  last_interacted_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    uca.niche,
    uca.total_score,
    uca.interaction_count,
    uca.last_interacted_at
  FROM public.user_category_affinity uca
  WHERE (p_user_id IS NOT NULL AND uca.user_id = p_user_id)
     OR (p_user_id IS NULL AND p_session_id IS NOT NULL AND uca.session_id = p_session_id)
  ORDER BY uca.total_score DESC, uca.last_interacted_at DESC
  LIMIT p_limit;
$$;
