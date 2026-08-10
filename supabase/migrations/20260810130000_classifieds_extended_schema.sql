-- ============================================================================
-- Jah Community Platform — Microfase C
-- Migration 0084: Classifieds Extended Schema
-- ============================================================================
-- Expande a tabela classifieds com campos de imagens, localização, expiração,
-- condição, negociável e atributos dinâmicos por nicho.
-- Expande também o enum de categoria para cobrir mais tipos de anúncio.
-- ============================================================================

BEGIN;

-- 1. Campos de mídia e contato
ALTER TABLE public.classifieds
  ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT;

-- 2. Localização (texto livre — sem forçar geocoding agora)
ALTER TABLE public.classifieds
  ADD COLUMN IF NOT EXISTS location_text TEXT;

-- 3. Expiração automática
ALTER TABLE public.classifieds
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 4. Condição e negociação
ALTER TABLE public.classifieds
  ADD COLUMN IF NOT EXISTS negotiable BOOLEAN NOT NULL DEFAULT true;

-- 5. Atributos dinâmicos por nicho (job_offer, real_estate, vehicle, etc.)
ALTER TABLE public.classifieds
  ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}';

-- 6. Expandir enum de category (remover constraint antiga, criar nova mais ampla)
ALTER TABLE public.classifieds
  DROP CONSTRAINT IF EXISTS classifieds_category_check;

-- Adicionar coluna condition (nova, sem conflito com category)
ALTER TABLE public.classifieds
  ADD COLUMN IF NOT EXISTS condition TEXT;

ALTER TABLE public.classifieds
  ADD CONSTRAINT classifieds_condition_check
    CHECK (condition IN ('new', 'used', 'refurbished') OR condition IS NULL);

-- Expandir category enum
ALTER TABLE public.classifieds
  ADD CONSTRAINT classifieds_category_check
    CHECK (category IN (
      'job',         -- vaga de emprego (legado + novo)
      'job_offer',   -- oferta de trabalho formal
      'sale',        -- venda de produto
      'trade',       -- troca/permuta
      'service',     -- serviço/freelancer
      'real_estate', -- imóvel
      'vehicle',     -- veículo
      'event',       -- evento/show (link para events)
      'donation'     -- doação
    ));

-- 7. Índices para busca e descoberta
CREATE INDEX IF NOT EXISTS classifieds_status_idx ON public.classifieds (status);
CREATE INDEX IF NOT EXISTS classifieds_category_idx ON public.classifieds (category);
CREATE INDEX IF NOT EXISTS classifieds_expires_at_idx ON public.classifieds (expires_at)
  WHERE expires_at IS NOT NULL;

-- 8. FTS index para busca federada
ALTER TABLE public.classifieds
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('portuguese',
        coalesce(title, '') || ' ' ||
        coalesce(content, '') || ' ' ||
        coalesce(location_text, '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS classifieds_fts_idx ON public.classifieds USING GIN (search_vector);

-- 9. RLS: staff da plataforma pode moderar
CREATE POLICY IF NOT EXISTS "classifieds_admin_all" ON public.classifieds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- 10. Trigger updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'classifieds_updated_at'
  ) THEN
    CREATE TRIGGER classifieds_updated_at
      BEFORE UPDATE ON public.classifieds
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

COMMIT;
