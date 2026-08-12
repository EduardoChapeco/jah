-- Migration: Phase 4 Advanced Operations
-- Includes: Cash Registers, Exchanges (RMA), Commissions, Gift Cards

-- 1. Cash Registers (Caixa)
DROP TABLE IF EXISTS public.cash_register_entries CASCADE;
DROP TABLE IF EXISTS public.cash_registers CASCADE;
CREATE TABLE public.cash_registers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL REFERENCES auth.users(id),
  closed_by uuid REFERENCES auth.users(id),
  opened_at timestamp with time zone NOT NULL DEFAULT now(),
  closed_at timestamp with time zone,
  initial_balance_cents integer NOT NULL DEFAULT 0,
  expected_closing_balance_cents integer,
  actual_closing_balance_cents integer,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.cash_register_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cash_register_id uuid NOT NULL REFERENCES public.cash_registers(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('sale', 'refund', 'in', 'out', 'initial')),
  payment_method text,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- 2. Exchanges / RMA (Trocas e Devoluções)
DROP TABLE IF EXISTS public.exchanges CASCADE;
CREATE TABLE public.exchanges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  original_order_id uuid NOT NULL REFERENCES public.orders(id),
  customer_id uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'received', 'completed', 'rejected')),
  resolution_type text CHECK (resolution_type IN ('store_credit', 'refund', 'replacement')),
  total_value_cents integer NOT NULL DEFAULT 0,
  reason text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- 3. Commissions (Comissões de Vendedoras)
DROP TABLE IF EXISTS public.commissions CASCADE;
CREATE TABLE public.commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES auth.users(id),
  commission_base_cents integer NOT NULL,
  commission_rate_percent numeric(5,2) NOT NULL,
  commission_amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid', 'reversed')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- 4. Gift Cards / Store Credit (Vales-Presente)
DROP TABLE IF EXISTS public.gift_cards CASCADE;
CREATE TABLE public.gift_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code text NOT NULL,
  initial_value_cents integer NOT NULL,
  current_balance_cents integer NOT NULL,
  customer_id uuid REFERENCES auth.users(id),
  issued_from_exchange_id uuid REFERENCES public.exchanges(id),
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (store_id, code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cash_registers_store ON public.cash_registers(store_id);
CREATE INDEX IF NOT EXISTS idx_cash_register_entries_register ON public.cash_register_entries(cash_register_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_store ON public.exchanges(store_id);
CREATE INDEX IF NOT EXISTS idx_commissions_store ON public.commissions(store_id);
CREATE INDEX IF NOT EXISTS idx_commissions_employee ON public.commissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_store ON public.gift_cards(store_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON public.gift_cards(code);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_phase4_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER cash_registers_updated_at BEFORE UPDATE ON public.cash_registers FOR EACH ROW EXECUTE PROCEDURE update_phase4_updated_at_column();
CREATE TRIGGER exchanges_updated_at BEFORE UPDATE ON public.exchanges FOR EACH ROW EXECUTE PROCEDURE update_phase4_updated_at_column();
CREATE TRIGGER commissions_updated_at BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE PROCEDURE update_phase4_updated_at_column();
CREATE TRIGGER gift_cards_updated_at BEFORE UPDATE ON public.gift_cards FOR EACH ROW EXECUTE PROCEDURE update_phase4_updated_at_column();

-- RLS Policies
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_register_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

-- 1. Cash Registers (Only store staff can view and manage)
CREATE POLICY "cash_registers_staff_all" ON public.cash_registers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members sm
      WHERE sm.store_id = cash_registers.store_id
      AND sm.profile_id = auth.uid()
    )
  );

CREATE POLICY "cash_register_entries_staff_all" ON public.cash_register_entries
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cash_registers cr
      JOIN public.workspace_members sm ON sm.store_id = cr.store_id
      WHERE cr.id = cash_register_entries.cash_register_id
      AND sm.profile_id = auth.uid()
    )
  );

-- 2. Exchanges (Staff can manage all in their store, Customers can view their own)
CREATE POLICY "exchanges_staff_all" ON public.exchanges
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members sm
      WHERE sm.store_id = exchanges.store_id
      AND sm.profile_id = auth.uid()
    )
  );

CREATE POLICY "exchanges_customer_read" ON public.exchanges
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

-- 3. Commissions (Store managers/owners can manage, employees can read their own)
CREATE POLICY "commissions_managers_all" ON public.commissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members sm
      WHERE sm.store_id = commissions.store_id
      AND sm.profile_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "commissions_employee_read" ON public.commissions
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid());

-- 4. Gift Cards (Staff can manage all in their store, Customers can view their own if linked)
CREATE POLICY "gift_cards_staff_all" ON public.gift_cards
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members sm
      WHERE sm.store_id = gift_cards.store_id
      AND sm.profile_id = auth.uid()
    )
  );

CREATE POLICY "gift_cards_customer_read" ON public.gift_cards
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());
