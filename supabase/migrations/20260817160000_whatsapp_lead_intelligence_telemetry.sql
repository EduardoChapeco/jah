-- Migration: 20260817160000_whatsapp_lead_intelligence_telemetry.sql
-- Description: Motor de Mensuração, Rastreabilidade e Telemetria de Conversão para WhatsApp (Leads, Orçamentos e Contatos).

-- 1. Tabela de Leads e Conversões de WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_lead_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  lead_code TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'store', 'product', 'classified', 'job', 'tourism', 'directory', 'event', 'quote', 'custom'
  )),
  entity_id TEXT,
  entity_title TEXT,
  phone_target TEXT NOT NULL,
  origin_url TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  visitor_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  device_type TEXT DEFAULT 'mobile',
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN (
    'initiated', 'opened', 'responded', 'converted', 'lost'
  )),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_wa_leads_store ON public.whatsapp_lead_conversions(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_leads_code ON public.whatsapp_lead_conversions(lead_code);
CREATE INDEX IF NOT EXISTS idx_wa_leads_entity ON public.whatsapp_lead_conversions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_wa_leads_created_at ON public.whatsapp_lead_conversions(created_at DESC);

-- 2. RLS (Row Level Security)
ALTER TABLE public.whatsapp_lead_conversions ENABLE ROW LEVEL SECURITY;

-- Permitir inserção pública de leads/cliques (anônimo e autenticado)
CREATE POLICY "Permitir inserção de cliques WhatsApp por qualquer visitante"
  ON public.whatsapp_lead_conversions FOR INSERT
  WITH CHECK (true);

-- Lojistas leem os leads direcionados para sua loja via helper canônico is_store_staff
CREATE POLICY "Lojistas gerenciam leads de sua própria loja"
  ON public.whatsapp_lead_conversions FOR SELECT
  USING (
    store_id IS NOT NULL AND public.is_store_staff(store_id)
  );

-- Lojistas podem atualizar status e notas dos seus leads
CREATE POLICY "Lojistas atualizam status dos seus leads"
  ON public.whatsapp_lead_conversions FOR UPDATE
  USING (
    store_id IS NOT NULL AND public.is_store_staff(store_id)
  );

-- Anunciantes pessoas físicas podem ver leads dos seus próprios classificados
CREATE POLICY "Anunciante pessoa física visualiza leads do seu anúncio"
  ON public.whatsapp_lead_conversions FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- 3. Função RPC Atômica para Gravar Lead de WhatsApp
CREATE OR REPLACE FUNCTION public.record_whatsapp_lead(
  p_store_id UUID,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_entity_title TEXT,
  p_phone_target TEXT,
  p_origin_url TEXT DEFAULT NULL,
  p_utm_source TEXT DEFAULT NULL,
  p_utm_medium TEXT DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL,
  p_visitor_id TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_device_type TEXT DEFAULT 'mobile',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead_code TEXT;
  v_new_id UUID;
  v_random_suffix TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Gera um código human-readable único, ex: JAH-W8F39
  v_random_suffix := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5));
  v_lead_code := 'JAH-W' || v_random_suffix;

  -- 1. Inserir na tabela de conversões
  INSERT INTO public.whatsapp_lead_conversions (
    store_id,
    lead_code,
    entity_type,
    entity_id,
    entity_title,
    phone_target,
    origin_url,
    utm_source,
    utm_medium,
    utm_campaign,
    visitor_id,
    user_id,
    device_type,
    metadata,
    created_at
  ) VALUES (
    p_store_id,
    v_lead_code,
    p_entity_type,
    p_entity_id,
    p_entity_title,
    p_phone_target,
    p_origin_url,
    p_utm_source,
    p_utm_medium,
    p_utm_campaign,
    p_visitor_id,
    p_user_id,
    COALESCE(p_device_type, 'mobile'),
    p_metadata,
    v_now
  )
  RETURNING id INTO v_new_id;

  -- 2. Alimentar também o motor de afinidade comportamental
  INSERT INTO public.user_behavior_events (
    user_id,
    session_id,
    event_type,
    entity_type,
    category_slug,
    niche,
    weight_score,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_visitor_id,
    'click_whatsapp',
    CASE
      WHEN p_entity_type IN ('product', 'store', 'classified', 'job', 'tourism', 'directory', 'service') THEN p_entity_type
      ELSE 'store'
    END,
    p_entity_type,
    COALESCE(p_metadata->>'niche', 'geral'),
    5,
    p_metadata || jsonb_build_object('lead_code', v_lead_code, 'lead_id', v_new_id),
    v_now
  );

  RETURN jsonb_build_object(
    'success', true,
    'id', v_new_id,
    'lead_code', v_lead_code,
    'phone_target', p_phone_target,
    'created_at', v_now
  );
END;
$$;

-- 4. Função RPC para Buscar Analytics de Leads de WhatsApp da Loja
CREATE OR REPLACE FUNCTION public.get_store_whatsapp_analytics(
  p_store_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_since TIMESTAMPTZ := NOW() - (p_days || ' days')::INTERVAL;
  v_total_leads INTEGER := 0;
  v_responded_leads INTEGER := 0;
  v_converted_leads INTEGER := 0;
  v_entity_distribution JSONB;
  v_top_items JSONB;
  v_daily_trend JSONB;
BEGIN
  -- Total de leads no período
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status IN ('responded', 'converted')),
    COUNT(*) FILTER (WHERE status = 'converted')
  INTO
    v_total_leads,
    v_responded_leads,
    v_converted_leads
  FROM public.whatsapp_lead_conversions
  WHERE store_id = p_store_id
    AND created_at >= v_since;

  -- Distribuição por tipo de entidade
  SELECT jsonb_agg(d)
  INTO v_entity_distribution
  FROM (
    SELECT entity_type, COUNT(*) as count
    FROM public.whatsapp_lead_conversions
    WHERE store_id = p_store_id AND created_at >= v_since
    GROUP BY entity_type
    ORDER BY count DESC
  ) d;

  -- Top 5 itens mais chamados no WhatsApp
  SELECT jsonb_agg(t)
  INTO v_top_items
  FROM (
    SELECT
      entity_id,
      entity_type,
      COALESCE(entity_title, 'Loja / Contato Geral') as title,
      COUNT(*) as clicks
    FROM public.whatsapp_lead_conversions
    WHERE store_id = p_store_id AND created_at >= v_since
    GROUP BY entity_id, entity_type, entity_title
    ORDER BY clicks DESC
    LIMIT 5
  ) t;

  -- Tendência diária
  SELECT jsonb_agg(trend)
  INTO v_daily_trend
  FROM (
    SELECT
      TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as date,
      COUNT(*) as count
    FROM public.whatsapp_lead_conversions
    WHERE store_id = p_store_id AND created_at >= v_since
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY DATE_TRUNC('day', created_at) ASC
  ) trend;

  RETURN jsonb_build_object(
    'total_leads', v_total_leads,
    'responded_leads', v_responded_leads,
    'converted_leads', v_converted_leads,
    'conversion_rate', CASE WHEN v_total_leads > 0 THEN ROUND(((v_converted_leads::NUMERIC / v_total_leads::NUMERIC) * 100), 1) ELSE 0 END,
    'entity_distribution', COALESCE(v_entity_distribution, '[]'::jsonb),
    'top_items', COALESCE(v_top_items, '[]'::jsonb),
    'daily_trend', COALESCE(v_daily_trend, '[]'::jsonb)
  );
END;
$$;
