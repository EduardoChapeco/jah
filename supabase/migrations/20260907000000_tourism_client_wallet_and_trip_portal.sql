-- ========================================================================================
-- FASE 8: CARTEIRA DIGITAL ESTILO APPLE WALLET & PORTAL DO VIAJANTE COM MEMÓRIAS
-- ========================================================================================

-- 1. PASSES DA CARTEIRA DIGITAL (APPLE WALLET PASSES)
CREATE TABLE IF NOT EXISTS public.client_wallet_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  client_id uuid,
  trip_id uuid,
  pass_type text NOT NULL DEFAULT 'voucher', -- 'boarding_pass', 'ticket', 'insurance', 'voucher'
  title text NOT NULL,
  subtitle text,
  barcode_value text NOT NULL,
  qr_code_url text,
  color text DEFAULT '#0f172a',
  status text NOT NULL DEFAULT 'active', -- 'active', 'used', 'expired'
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. MEMÓRIAS FOTOGRÁFICAS E REGISTROS DA VIAGEM
CREATE TABLE IF NOT EXISTS public.trip_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  trip_id uuid NOT NULL,
  uploader_name text DEFAULT 'Viajante',
  media_url text NOT NULL,
  media_type text DEFAULT 'image', -- 'image', 'video'
  caption text,
  location_name text,
  taken_at timestamptz DEFAULT now(),
  is_featured boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- HABILITAR RLS
ALTER TABLE public.client_wallet_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_memories ENABLE ROW LEVEL SECURITY;

-- POLICIES MULTI-TENANT POR STORE_ID
DROP POLICY IF EXISTS "Staff and clients access wallet passes" ON public.client_wallet_passes;
CREATE POLICY "Staff and clients access wallet passes" ON public.client_wallet_passes
  FOR ALL USING (store_id IS NOT NULL);

DROP POLICY IF EXISTS "Staff and clients access trip memories" ON public.trip_memories;
CREATE POLICY "Staff and clients access trip memories" ON public.trip_memories
  FOR ALL USING (store_id IS NOT NULL);
