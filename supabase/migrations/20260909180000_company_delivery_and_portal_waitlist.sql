-- Migration: 20260909180000_company_delivery_and_portal_waitlist.sql
-- Propósito: Configuração de taxas de entrega para empresas em classificados,
-- despachos de motoboy via Magic Link, e Lista VIP de migração para o Workspace Pro.

-- ============================================================
-- 1. Tabela de Configurações de Entrega da Empresa
-- ============================================================
CREATE TABLE IF NOT EXISTS company_delivery_settings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id                    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
  has_own_couriers            BOOLEAN NOT NULL DEFAULT false,
  fixed_delivery_fee_cents    INTEGER NOT NULL DEFAULT 0,
  free_delivery_above_cents   INTEGER,
  neighborhoods_rates         JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ neighborhood: string, fee_cents: number, active: boolean }]
  motoboy_instructions       TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_delivery_store_id ON company_delivery_settings(store_id);

ALTER TABLE company_delivery_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_delivery_settings_select_public" ON company_delivery_settings
  FOR SELECT USING (true);

CREATE POLICY "company_delivery_settings_manage_owner" ON company_delivery_settings
  FOR ALL USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM store_members sm
      WHERE sm.store_id = company_delivery_settings.store_id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin', 'manager')
    )
  );

-- ============================================================
-- 2. Tabela de Despachos de Entrega de Classificados / Negócios (Magic Link)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE classified_dispatch_status AS ENUM (
    'pending',
    'accepted',
    'picked_up',
    'delivered',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS classified_delivery_dispatches (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id                    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  deal_id                     UUID REFERENCES deals(id) ON DELETE SET NULL,
  classified_id               UUID REFERENCES classifieds(id) ON DELETE SET NULL,
  
  -- Destinatário e Endereço de Entrega
  customer_name               TEXT NOT NULL,
  customer_phone              TEXT NOT NULL,
  delivery_address            TEXT NOT NULL,
  delivery_neighborhood       TEXT,
  delivery_city               TEXT,
  
  -- Valores Financeiros
  delivery_fee_cents          INTEGER NOT NULL DEFAULT 0,
  order_amount_cents          INTEGER NOT NULL DEFAULT 0,
  payment_method              TEXT,
  
  -- Magic Link Token Único
  token                       TEXT NOT NULL UNIQUE,
  
  -- Entregador Vinculado
  courier_id                  UUID REFERENCES couriers(id) ON DELETE SET NULL,
  courier_name                TEXT,
  courier_phone               TEXT,
  
  -- Ciclo de Vida da Entrega
  status                      classified_dispatch_status NOT NULL DEFAULT 'pending',
  notes                       TEXT,
  proof_photo_url             TEXT,
  confirmation_pin            TEXT,
  
  accepted_at                 TIMESTAMPTZ,
  delivered_at                TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classified_dispatches_store_id ON classified_delivery_dispatches(store_id);
CREATE INDEX IF NOT EXISTS idx_classified_dispatches_token ON classified_delivery_dispatches(token);
CREATE INDEX IF NOT EXISTS idx_classified_dispatches_status ON classified_delivery_dispatches(status);

ALTER TABLE classified_delivery_dispatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classified_dispatches_select_token" ON classified_delivery_dispatches
  FOR SELECT USING (true);

CREATE POLICY "classified_dispatches_update_token" ON classified_delivery_dispatches
  FOR UPDATE USING (true);

CREATE POLICY "classified_dispatches_manage_store" ON classified_delivery_dispatches
  FOR ALL USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM store_members sm
      WHERE sm.store_id = classified_delivery_dispatches.store_id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin', 'manager')
    )
  );

-- ============================================================
-- 3. Tabela de Inscrições na Lista VIP do Portal Completo (Workspace Pro)
-- ============================================================
CREATE TABLE IF NOT EXISTS portal_pro_waitlist (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id                    UUID REFERENCES stores(id) ON DELETE CASCADE,
  user_id                     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name                TEXT NOT NULL,
  contact_email               TEXT,
  contact_phone               TEXT,
  primary_niche               TEXT,
  interested_modules          TEXT[] DEFAULT '{}',
  current_monthly_orders      INTEGER DEFAULT 0,
  status                      TEXT NOT NULL DEFAULT 'waiting', -- waiting, invited, migrated, declined
  notes                       TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  migrated_at                 TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_portal_waitlist_store_id ON portal_pro_waitlist(store_id);
CREATE INDEX IF NOT EXISTS idx_portal_waitlist_status ON portal_pro_waitlist(status);

ALTER TABLE portal_pro_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portal_waitlist_insert_auth" ON portal_pro_waitlist
  FOR INSERT WITH CHECK (true);

CREATE POLICY "portal_waitlist_select_owner_or_admin" ON portal_pro_waitlist
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM store_members sm
        WHERE sm.store_id = portal_pro_waitlist.store_id
          AND sm.user_id = auth.uid()
      ) OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('platform_admin', 'master')
      )
    )
  );

CREATE TABLE IF NOT EXISTS workspace_pro_waitlist (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id                    UUID REFERENCES stores(id) ON DELETE CASCADE,
  user_id                     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name                TEXT NOT NULL,
  contact_email               TEXT,
  contact_whatsapp            TEXT,
  niche                       TEXT,
  notes                       TEXT,
  status                      TEXT NOT NULL DEFAULT 'waiting',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspace_waitlist_store_id ON workspace_pro_waitlist(store_id);
ALTER TABLE workspace_pro_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_waitlist_all_policy" ON workspace_pro_waitlist FOR ALL USING (true);
