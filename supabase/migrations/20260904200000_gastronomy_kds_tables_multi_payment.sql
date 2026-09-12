-- =============================================================================
-- MIGRATION: 20260904200000_gastronomy_kds_tables_multi_payment.sql
-- ECOSSISTEMA Waesy: GASTRONOMIA, KDS COZINHA, MESAS DE SALÃO & MULTI-PAGAMENTO PDV
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. kds_stations (Estações de Cozinha / Praças de Preparo)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kds_stations (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id                   UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name                       TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  slug                       TEXT NOT NULL CHECK (char_length(slug) BETWEEN 2 AND 100),
  color_code                 TEXT NOT NULL DEFAULT '#F97316',
  icon                       TEXT NOT NULL DEFAULT 'ChefHat',
  target_prep_time_minutes   INT NOT NULL DEFAULT 15 CHECK (target_prep_time_minutes > 0),
  warning_threshold_minutes  INT NOT NULL DEFAULT 10 CHECK (warning_threshold_minutes > 0),
  critical_threshold_minutes INT NOT NULL DEFAULT 20 CHECK (critical_threshold_minutes > 0),
  is_active                  BOOLEAN NOT NULL DEFAULT true,
  assigned_categories        TEXT[] NOT NULL DEFAULT '{}',
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_kds_stations_store_slug UNIQUE (store_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_kds_stations_store ON public.kds_stations(store_id);

-- ---------------------------------------------------------------------------
-- 2. restaurant_tables (Mesas de Salão & Mapa Visual de Atendimento)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id             UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  table_number         INT NOT NULL CHECK (table_number > 0),
  table_name           TEXT,
  zone                 TEXT NOT NULL DEFAULT 'salao',
  capacity             INT NOT NULL DEFAULT 4 CHECK (capacity >= 1),
  status               TEXT NOT NULL DEFAULT 'available' 
                         CHECK (status IN ('available', 'occupied', 'reserved', 'billing', 'cleaning', 'blocked')),
  active_order_id      UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  assigned_waiter_id   UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  pos_x                INT NOT NULL DEFAULT 0,
  pos_y                INT NOT NULL DEFAULT 0,
  current_guests_count INT NOT NULL DEFAULT 0 CHECK (current_guests_count >= 0),
  opened_at            TIMESTAMPTZ,
  metadata             JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_restaurant_tables_store_num UNIQUE (store_id, table_number)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_tables_store ON public.restaurant_tables(store_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_status ON public.restaurant_tables(store_id, status);

-- ---------------------------------------------------------------------------
-- 3. kds_orders (Tickets / Comandas de Cozinha em Tempo Real)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kds_orders (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id                 UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id                 UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  table_id                 UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
  daily_ticket_number      INT NOT NULL DEFAULT 1 CHECK (daily_ticket_number > 0),
  comanda_identifier       TEXT NOT NULL DEFAULT 'Mesa / Balcão',
  service_type             TEXT NOT NULL DEFAULT 'dine_in' 
                             CHECK (service_type IN ('dine_in', 'takeout', 'delivery', 'drive_thru')),
  priority                 TEXT NOT NULL DEFAULT 'normal' 
                             CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status                   TEXT NOT NULL DEFAULT 'pending' 
                             CHECK (status IN ('pending', 'in_preparation', 'ready', 'collected', 'cancelled')),
  waiter_name              TEXT,
  customer_notes           TEXT,
  prep_started_at          TIMESTAMPTZ,
  prep_completed_at        TIMESTAMPTZ,
  collected_at             TIMESTAMPTZ,
  total_prep_time_seconds  INT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kds_orders_store_status ON public.kds_orders(store_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_kds_orders_table ON public.kds_orders(table_id);
CREATE INDEX IF NOT EXISTS idx_kds_orders_order ON public.kds_orders(order_id);

-- ---------------------------------------------------------------------------
-- 4. kds_order_items (Itens Roteados para Estações Específicas)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kds_order_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id           UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  kds_order_id       UUID NOT NULL REFERENCES public.kds_orders(id) ON DELETE CASCADE,
  station_id         UUID REFERENCES public.kds_stations(id) ON DELETE SET NULL,
  product_id         UUID,
  product_name       TEXT NOT NULL CHECK (char_length(product_name) >= 1),
  quantity           INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes              TEXT,
  modifiers          JSONB NOT NULL DEFAULT '[]'::jsonb,
  status             TEXT NOT NULL DEFAULT 'pending' 
                       CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
  started_at         TIMESTAMPTZ,
  finished_at        TIMESTAMPTZ,
  prep_time_seconds  INT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kds_items_order ON public.kds_order_items(kds_order_id);
CREATE INDEX IF NOT EXISTS idx_kds_items_station ON public.kds_order_items(station_id, status);

-- ---------------------------------------------------------------------------
-- 5. pos_multi_payments (Split de Pagamentos Multi-Forma no Caixa)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pos_multi_payments (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id               UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id               UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  cash_register_id       UUID REFERENCES public.cash_registers(id) ON DELETE SET NULL,
  payment_method         TEXT NOT NULL 
                           CHECK (payment_method IN ('cash', 'pix', 'credit_card', 'debit_card', 'meal_voucher', 'store_credit', 'cryptocurrency', 'other')),
  amount_cents           INT NOT NULL CHECK (amount_cents > 0),
  change_cents           INT NOT NULL DEFAULT 0 CHECK (change_cents >= 0),
  installments           INT NOT NULL DEFAULT 1 CHECK (installments >= 1),
  card_brand             TEXT,
  authorization_code     TEXT,
  payer_name             TEXT,
  payer_document_masked  TEXT,
  status                 TEXT NOT NULL DEFAULT 'approved' 
                           CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'cancelled')),
  received_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata               JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_multi_payments_order ON public.pos_multi_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_multi_payments_store ON public.pos_multi_payments(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_multi_payments_register ON public.pos_multi_payments(cash_register_id);

-- ---------------------------------------------------------------------------
-- RLS (ROW LEVEL SECURITY)
-- ---------------------------------------------------------------------------
ALTER TABLE public.kds_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kds_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kds_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_multi_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_manage_kds_stations ON public.kds_stations;
CREATE POLICY staff_manage_kds_stations
  ON public.kds_stations FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_restaurant_tables ON public.restaurant_tables;
CREATE POLICY staff_manage_restaurant_tables
  ON public.restaurant_tables FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_kds_orders ON public.kds_orders;
CREATE POLICY staff_manage_kds_orders
  ON public.kds_orders FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_kds_order_items ON public.kds_order_items;
CREATE POLICY staff_manage_kds_order_items
  ON public.kds_order_items FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_pos_multi_payments ON public.pos_multi_payments;
CREATE POLICY staff_manage_pos_multi_payments
  ON public.pos_multi_payments FOR ALL
  USING (public.is_store_staff(store_id));

-- ---------------------------------------------------------------------------
-- Triggers para updated_at automático
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_kds_stations_updated_at ON public.kds_stations;
CREATE TRIGGER trg_kds_stations_updated_at
  BEFORE UPDATE ON public.kds_stations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_restaurant_tables_updated_at ON public.restaurant_tables;
CREATE TRIGGER trg_restaurant_tables_updated_at
  BEFORE UPDATE ON public.restaurant_tables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_kds_orders_updated_at ON public.kds_orders;
CREATE TRIGGER trg_kds_orders_updated_at
  BEFORE UPDATE ON public.kds_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
