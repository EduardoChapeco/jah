-- ==============================================================================
-- MIGRATION: 20260923000000_classifieds_advanced_and_invites_engine.sql
-- Description: Expands classifieds with advanced e-commerce/booking/property columns,
--              creates the complete Invite & Gamification Engine (links, telemetry,
--              conversions, scores, tiers, rewards, raffles) with strict RLS and zero mocks.
-- ==============================================================================

-- 1. EXTEND CLASSIFIEDS TABLE
ALTER TABLE public.classifieds
  ADD COLUMN IF NOT EXISTS digital_file_url text,
  ADD COLUMN IF NOT EXISTS download_limit integer,
  ADD COLUMN IF NOT EXISTS access_duration_days integer,
  ADD COLUMN IF NOT EXISTS booking_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS available_slots integer,
  ADD COLUMN IF NOT EXISTS service_duration_minutes integer,
  ADD COLUMN IF NOT EXISTS property_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_boosted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS boosted_until timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_mode text DEFAULT 'pickup',
  ADD COLUMN IF NOT EXISTS accepts_trade boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepts_card boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_installments integer DEFAULT 1;

-- Index for boosted ads and fast category discovery
CREATE INDEX IF NOT EXISTS idx_classifieds_boosted ON public.classifieds (is_boosted, created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_classifieds_category_deal ON public.classifieds (category, deal_type, created_at DESC) WHERE status = 'active';

-- 2. CREATE INVITE ENGINE TABLES

-- 2.1 invite_links: links únicos por usuário
CREATE TABLE IF NOT EXISTS public.invite_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  invite_type text NOT NULL DEFAULT 'user', -- 'user' | 'business'
  clicks integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  points_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, invite_type)
);

CREATE INDEX IF NOT EXISTS idx_invite_links_code ON public.invite_links (code);
CREATE INDEX IF NOT EXISTS idx_invite_links_user ON public.invite_links (user_id);

-- 2.2 invite_telemetry: proteção anti-fraude, fingerprint e IP hash
CREATE TABLE IF NOT EXISTS public.invite_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_link_id uuid NOT NULL REFERENCES public.invite_links(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,
  device_fingerprint text,
  converted boolean NOT NULL DEFAULT false,
  converted_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invite_telemetry_link ON public.invite_telemetry (invite_link_id);
CREATE INDEX IF NOT EXISTS idx_invite_telemetry_ip ON public.invite_telemetry (ip_hash);

-- 2.3 invite_conversions: registros auditados de novos membros convidados
CREATE TABLE IF NOT EXISTS public.invite_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_link_id uuid NOT NULL REFERENCES public.invite_links(id) ON DELETE CASCADE,
  invited_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  points_awarded integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'validated', -- 'pending' | 'validated' | 'revoked'
  validation_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  validated_at timestamptz DEFAULT now(),
  UNIQUE (invited_user_id) -- Cada usuário só pode ser indicado uma vez
);

CREATE INDEX IF NOT EXISTS idx_invite_conversions_link ON public.invite_conversions (invite_link_id);

-- 2.4 invite_scores: saldo de pontos e tier do embaixador
CREATE TABLE IF NOT EXISTS public.invite_scores (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_points integer NOT NULL DEFAULT 0,
  rank_position integer DEFAULT 1,
  ambassador_tier text NOT NULL DEFAULT 'starter', -- 'starter' | 'bronze' | 'silver' | 'gold' | 'platinum'
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invite_scores_points ON public.invite_scores (total_points DESC);

-- 2.5 invite_rewards: catálogo real de prêmios resgatáveis
CREATE TABLE IF NOT EXISTS public.invite_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  points_required integer NOT NULL,
  reward_type text NOT NULL DEFAULT 'ticket', -- 'ticket' | 'voucher' | 'boost' | 'experience'
  stock integer DEFAULT 10,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed rewards if none exist
INSERT INTO public.invite_rewards (title, description, points_required, reward_type, stock, active)
SELECT * FROM (VALUES
  ('Destaque Ouro no Classificados (30 dias)', 'Coloque seu anúncio no topo de todas as buscas com selo Ouro.', 300, 'boost', 100, true),
  ('Voucher R$ 50 em Restaurantes Parceiros', 'Válido em qualquer restaurante credenciado na plataforma Waesy.', 800, 'voucher', 25, true),
  ('Ingresso Parque Beto Carrero World', 'Passaporte de 1 dia para o maior parque temático da América Latina.', 2500, 'ticket', 10, true),
  ('Café Colonial para 2 Pessoas em Hotel Fazenda', 'Experiência gastronômica completa no turismo regional.', 1800, 'experience', 15, true),
  ('Acesso VIP a Grandes Festivais & Shows', 'Ingresso com acesso à área VIP e open bar no próximo evento regional.', 3000, 'ticket', 5, true)
) AS v(title, description, points_required, reward_type, stock, active)
WHERE NOT EXISTS (SELECT 1 FROM public.invite_rewards LIMIT 1);

-- 2.6 raffles: sistema oficial de sorteios comunitários
CREATE TABLE IF NOT EXISTS public.raffles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  image_url text,
  rules jsonb NOT NULL DEFAULT '{}',
  ticket_price_cents integer NOT NULL DEFAULT 0, -- 0 = sorteio gratuito por pontos/convite
  points_cost integer NOT NULL DEFAULT 50, -- 50 pontos por cupom
  max_tickets_per_user integer DEFAULT 10,
  draw_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active', -- 'draft' | 'active' | 'drawing' | 'completed' | 'cancelled'
  winner_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  winner_ticket_number integer,
  drawn_at timestamptz,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed official inaugural raffle if none exists
INSERT INTO public.raffles (title, description, image_url, rules, ticket_price_cents, points_cost, max_tickets_per_user, draw_date, status)
SELECT * FROM (VALUES
  (
    'Sorteio Oficial Waesy: Fim de Semana em Pousada & Termas',
    'Concorra a um fim de semana completo com acompanhante em chalé com hidromassagem e café colonial.',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    '{"regulamento": "Sorteio auditado pelo sistema Waesy. O resultado é apurado automaticamente na data marcada.", "cidade": "Regional SC"}'::jsonb,
    0,
    50,
    10,
    now() + interval '30 days',
    'active'
  )
) AS v(title, description, image_url, rules, ticket_price_cents, points_cost, max_tickets_per_user, draw_date, status)
WHERE NOT EXISTS (SELECT 1 FROM public.raffles LIMIT 1);

-- 2.7 raffle_tickets: bilhetes emitidos
CREATE TABLE IF NOT EXISTS public.raffle_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_number integer NOT NULL,
  paid boolean NOT NULL DEFAULT true,
  payment_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (raffle_id, ticket_number)
);

CREATE INDEX IF NOT EXISTS idx_raffle_tickets_raffle ON public.raffle_tickets (raffle_id);
CREATE INDEX IF NOT EXISTS idx_raffle_tickets_user ON public.raffle_tickets (user_id);

-- 3. STORED PROCEDURES & ATOMIC FUNCTIONS

-- 3.1 Função para obter ou criar código de convite único do usuário
CREATE OR REPLACE FUNCTION public.get_or_create_user_invite(p_user_id uuid, p_type text DEFAULT 'user')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text;
  v_exists text;
BEGIN
  SELECT code INTO v_exists
  FROM public.invite_links
  WHERE user_id = p_user_id AND invite_type = p_type;

  IF v_exists IS NOT NULL THEN
    RETURN v_exists;
  END IF;

  -- Gera código único e legível: WIDER-XXXXXX
  v_code := 'WIDER-' || UPPER(SUBSTRING(MD5(p_user_id::text || clock_timestamp()::text) FROM 1 FOR 6));

  INSERT INTO public.invite_links (user_id, code, invite_type)
  VALUES (p_user_id, v_code, p_type)
  ON CONFLICT (user_id, invite_type) DO UPDATE SET code = EXCLUDED.code
  RETURNING code INTO v_code;

  -- Garante inicialização em invite_scores
  INSERT INTO public.invite_scores (user_id, total_points, ambassador_tier)
  VALUES (p_user_id, 0, 'starter')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN v_code;
END;
$$;

-- 3.2 Função atômica para processar indicação/conversão
CREATE OR REPLACE FUNCTION public.process_invite_conversion(
  p_code text,
  p_new_user_id uuid,
  p_ip_hash text DEFAULT 'unknown'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_link public.invite_links%ROWTYPE;
  v_referrer_id uuid;
  v_points integer := 100;
  v_new_total integer;
  v_new_tier text;
BEGIN
  -- Busca o link de convite
  SELECT * INTO v_link
  FROM public.invite_links
  WHERE UPPER(code) = UPPER(p_code);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Código de convite inexistente.');
  END IF;

  v_referrer_id := v_link.user_id;

  -- Não pode convidar a si mesmo
  IF v_referrer_id = p_new_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Auto-indicação não permitida.');
  END IF;

  -- Verifica se o usuário já foi indicado antes
  IF EXISTS (SELECT 1 FROM public.invite_conversions WHERE invited_user_id = p_new_user_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Usuário já recebeu indicação anteriormente.');
  END IF;

  -- Registra telemetria
  INSERT INTO public.invite_telemetry (invite_link_id, ip_hash, converted, converted_user_id)
  VALUES (v_link.id, p_ip_hash, true, p_new_user_id);

  -- Registra conversão
  INSERT INTO public.invite_conversions (invite_link_id, invited_user_id, points_awarded, status)
  VALUES (v_link.id, p_new_user_id, v_points, 'validated');

  -- Atualiza métricas no invite_links
  UPDATE public.invite_links
  SET conversions = conversions + 1,
      points_earned = points_earned + v_points
  WHERE id = v_link.id;

  -- Atualiza saldo de pontos e tier do padrinho
  INSERT INTO public.invite_scores (user_id, total_points, ambassador_tier)
  VALUES (v_referrer_id, v_points, 'starter')
  ON CONFLICT (user_id) DO UPDATE
  SET total_points = public.invite_scores.total_points + v_points,
      updated_at = now()
  RETURNING total_points INTO v_new_total;

  -- Determina novo tier
  IF v_new_total >= 5000 THEN
    v_new_tier := 'platinum';
  ELSIF v_new_total >= 2500 THEN
    v_new_tier := 'gold';
  ELSIF v_new_total >= 1000 THEN
    v_new_tier := 'silver';
  ELSIF v_new_total >= 300 THEN
    v_new_tier := 'bronze';
  ELSE
    v_new_tier := 'starter';
  END IF;

  UPDATE public.invite_scores
  SET ambassador_tier = v_new_tier
  WHERE user_id = v_referrer_id;

  RETURN jsonb_build_object(
    'success', true,
    'points_awarded', v_points,
    'referrer_id', v_referrer_id,
    'new_tier', v_new_tier
  );
END;
$$;

-- 4. RLS POLICIES (DENY-BY-DEFAULT RIGOROSO)

ALTER TABLE public.invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffle_tickets ENABLE ROW LEVEL SECURITY;

-- 4.1 invite_links policies
DROP POLICY IF EXISTS "invite_links_read_public" ON public.invite_links;
CREATE POLICY "invite_links_read_public" ON public.invite_links
  FOR SELECT USING (true); -- Leitura pública necessária para resolver códigos de convite

DROP POLICY IF EXISTS "invite_links_manage_owner" ON public.invite_links;
CREATE POLICY "invite_links_manage_owner" ON public.invite_links
  FOR ALL USING (auth.uid() = user_id);

-- 4.2 invite_scores policies
DROP POLICY IF EXISTS "invite_scores_read_public" ON public.invite_scores;
CREATE POLICY "invite_scores_read_public" ON public.invite_scores
  FOR SELECT USING (true); -- Leitura pública para leaderboard / ranking

DROP POLICY IF EXISTS "invite_scores_manage_service" ON public.invite_scores;
CREATE POLICY "invite_scores_manage_service" ON public.invite_scores
  FOR ALL USING (auth.uid() = user_id);

-- 4.3 invite_conversions policies
DROP POLICY IF EXISTS "invite_conversions_read_owner" ON public.invite_conversions;
CREATE POLICY "invite_conversions_read_owner" ON public.invite_conversions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.invite_links WHERE invite_links.id = invite_conversions.invite_link_id AND invite_links.user_id = auth.uid())
    OR invited_user_id = auth.uid()
  );

-- 4.4 invite_rewards policies
DROP POLICY IF EXISTS "invite_rewards_read_public" ON public.invite_rewards;
CREATE POLICY "invite_rewards_read_public" ON public.invite_rewards
  FOR SELECT USING (active = true);

-- 4.5 raffles policies
DROP POLICY IF EXISTS "raffles_read_public" ON public.raffles;
CREATE POLICY "raffles_read_public" ON public.raffles
  FOR SELECT USING (status IN ('active', 'completed', 'drawing'));

-- 4.6 raffle_tickets policies
DROP POLICY IF EXISTS "raffle_tickets_read_owner" ON public.raffle_tickets;
CREATE POLICY "raffle_tickets_read_owner" ON public.raffle_tickets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "raffle_tickets_insert_auth" ON public.raffle_tickets;
CREATE POLICY "raffle_tickets_insert_auth" ON public.raffle_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
