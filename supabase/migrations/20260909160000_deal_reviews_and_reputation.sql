-- ============================================================================
-- Waesy Platform — Migration: Deal Reviews & Verified Company Reputation
-- Protocolo Harvard / SEC-Driven Engineering & Apple HIG
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.deal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  classified_id UUID REFERENCES public.classifieds(id) ON DELETE SET NULL,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  response_comment TEXT,
  responded_at TIMESTAMPTZ,
  is_verified_deal BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'hidden', 'flagged')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_deal_review UNIQUE (deal_id, reviewer_id)
);

-- Índices de alta performance para consulta por loja, classificado e vendedor
CREATE INDEX IF NOT EXISTS idx_deal_reviews_store_id ON public.deal_reviews (store_id);
CREATE INDEX IF NOT EXISTS idx_deal_reviews_seller_id ON public.deal_reviews (seller_id);
CREATE INDEX IF NOT EXISTS idx_deal_reviews_classified_id ON public.deal_reviews (classified_id);
CREATE INDEX IF NOT EXISTS idx_deal_reviews_deal_id ON public.deal_reviews (deal_id);

-- RLS Deny-by-Default
ALTER TABLE public.deal_reviews ENABLE ROW LEVEL SECURITY;

-- 1. Qualquer visitante pode ler reviews aprovados (Social Proof Público)
CREATE POLICY "deal_reviews_public_read"
  ON public.deal_reviews FOR SELECT
  USING (status = 'approved');

-- 2. Somente o comprador participante do deal pode criar a avaliação
CREATE POLICY "deal_reviews_buyer_insert"
  ON public.deal_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deal_reviews.deal_id
      AND deals.buyer_id = auth.uid()
    )
  );

-- 3. O vendedor / lojista pode responder à avaliação
CREATE POLICY "deal_reviews_seller_update_response"
  ON public.deal_reviews FOR UPDATE
  USING (
    auth.uid() = seller_id
    OR (
      store_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.store_members
        WHERE store_members.store_id = deal_reviews.store_id
        AND store_members.profile_id = auth.uid()
      )
    )
  );

-- 4. Função agregadora de métricas de reputação para a empresa
CREATE OR REPLACE FUNCTION public.get_company_reputation_stats(p_store_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_avg_rating numeric;
  v_total_reviews integer;
  v_5_stars integer;
  v_4_stars integer;
  v_3_stars integer;
  v_low_stars integer;
BEGIN
  SELECT
    ROUND(AVG(rating), 1),
    COUNT(*),
    COUNT(*) FILTER (WHERE rating = 5),
    COUNT(*) FILTER (WHERE rating = 4),
    COUNT(*) FILTER (WHERE rating = 3),
    COUNT(*) FILTER (WHERE rating <= 2)
  INTO
    v_avg_rating,
    v_total_reviews,
    v_5_stars,
    v_4_stars,
    v_3_stars,
    v_low_stars
  FROM public.deal_reviews
  WHERE store_id = p_store_id AND status = 'approved';

  RETURN jsonb_build_object(
    'average_rating', COALESCE(v_avg_rating, 5.0),
    'total_reviews', COALESCE(v_total_reviews, 0),
    'count_5_stars', COALESCE(v_5_stars, 0),
    'count_4_stars', COALESCE(v_4_stars, 0),
    'count_3_stars', COALESCE(v_3_stars, 0),
    'count_low_stars', COALESCE(v_low_stars, 0),
    'verified_percentage', 100
  );
END;
$$;
