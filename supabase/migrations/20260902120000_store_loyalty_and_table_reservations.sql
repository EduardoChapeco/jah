-- ============================================================================
-- Migration: Store Loyalty Programs (Cartões de Selo Digital) & Table Reservations
-- ============================================================================

-- 1. Programas de Fidelidade da Loja
CREATE TABLE IF NOT EXISTS public.store_loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_stamps INTEGER NOT NULL DEFAULT 10 CHECK (target_stamps BETWEEN 3 AND 30),
  welcome_stamps INTEGER NOT NULL DEFAULT 0 CHECK (welcome_stamps >= 0),
  reward_description TEXT NOT NULL,
  mechanic_type TEXT NOT NULL DEFAULT 'per_order' CHECK (mechanic_type IN ('per_order', 'per_spent_amount')),
  min_spent_cents INTEGER DEFAULT 0 CHECK (min_spent_cents >= 0),
  card_bg_color TEXT NOT NULL DEFAULT '#18181B',
  card_text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  stamp_icon TEXT NOT NULL DEFAULT 'star',
  banner_url TEXT,
  logo_url TEXT,
  proximity_alerts_enabled BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Cartões de Fidelidade dos Clientes (Progresso individual de selos)
CREATE TABLE IF NOT EXISTS public.customer_loyalty_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.store_loyalty_programs(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT NOT NULL,
  card_token TEXT NOT NULL UNIQUE,
  current_stamps INTEGER NOT NULL DEFAULT 0 CHECK (current_stamps >= 0),
  total_stamps_earned INTEGER NOT NULL DEFAULT 0 CHECK (total_stamps_earned >= 0),
  total_rewards_redeemed INTEGER NOT NULL DEFAULT 0 CHECK (total_rewards_redeemed >= 0),
  last_stamped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Reservas de Mesas & Lugares
CREATE TABLE IF NOT EXISTS public.store_table_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  party_size INTEGER NOT NULL DEFAULT 2 CHECK (party_size BETWEEN 1 AND 50),
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'seated', 'cancelled', 'no_show')),
  special_requests TEXT,
  assigned_table TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_store_loyalty_store ON public.store_loyalty_programs(store_id);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_store ON public.customer_loyalty_cards(store_id, customer_phone);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_token ON public.customer_loyalty_cards(card_token);
CREATE INDEX IF NOT EXISTS idx_store_reservations_date ON public.store_table_reservations(store_id, reservation_date, reservation_time);

-- Habilitar RLS
ALTER TABLE public.store_loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_table_reservations ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Policies: store_loyalty_programs
-- -----------------------------------------------------------------------------
CREATE POLICY "Public read active loyalty programs"
  ON public.store_loyalty_programs FOR SELECT
  USING (status = 'active');

CREATE POLICY "Staff manage loyalty programs"
  ON public.store_loyalty_programs FOR ALL
  TO authenticated
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager'])
  );

-- -----------------------------------------------------------------------------
-- Policies: customer_loyalty_cards
-- -----------------------------------------------------------------------------
CREATE POLICY "Public create or view loyalty cards by token"
  ON public.customer_loyalty_cards FOR SELECT
  USING (true);

CREATE POLICY "Public insert loyalty card"
  ON public.customer_loyalty_cards FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff manage customer loyalty cards"
  ON public.customer_loyalty_cards FOR ALL
  TO authenticated
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'cashier'])
  );

-- -----------------------------------------------------------------------------
-- Policies: store_table_reservations
-- -----------------------------------------------------------------------------
CREATE POLICY "Public insert table reservations"
  ON public.store_table_reservations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff manage table reservations"
  ON public.store_table_reservations FOR ALL
  TO authenticated
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'cashier', 'hostess'])
  );
