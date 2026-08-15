-- Migration: 20260813110000_couriers_fleet_management.sql
-- Propósito: Gestão de entregadores (fixos e avulsos), link mágico,
-- evidências de entrega e controle financeiro de fatura de entregadores.

-- ============================================================
-- 1. Enum de status do entregador
-- ============================================================
DO $$ BEGIN
  CREATE TYPE courier_status AS ENUM ('available', 'on_route', 'offline', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type AS ENUM ('motorcycle', 'bicycle', 'car', 'van', 'on_foot', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE delivery_proof_type AS ENUM ('photo_package', 'photo_recipient', 'photo_location', 'signature');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. Tabela de entregadores cadastrados
-- ============================================================
CREATE TABLE IF NOT EXISTS couriers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Pode ou não ter conta na plataforma
  user_id         UUID REFERENCES auth.users(id),

  -- Dados pessoais
  name            TEXT NOT NULL,
  phone           TEXT,
  cpf             TEXT, -- Armazenado sem formatação
  vehicle_type    vehicle_type NOT NULL DEFAULT 'motorcycle',
  vehicle_plate   TEXT,

  status          courier_status NOT NULL DEFAULT 'available',

  -- Remuneração padrão por entrega (em centavos). Pode ser sobrescrito por entrega.
  default_fee_cents INTEGER NOT NULL DEFAULT 0,

  -- Metadados
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_couriers_store_id ON couriers(store_id);
CREATE INDEX IF NOT EXISTS idx_couriers_user_id ON couriers(user_id);
CREATE INDEX IF NOT EXISTS idx_couriers_status ON couriers(status);

-- ============================================================
-- 3. Link Mágico de Entrega (para entregadores avulsos)
-- ============================================================
CREATE TABLE IF NOT EXISTS delivery_magic_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Referência ao registro de entrega/fulfillment (tabela existente)
  fulfillment_id  UUID, -- Referência a order_fulfillments ou deliveries

  -- Token assinado (opaque, não reversível para o payload)
  token           TEXT NOT NULL UNIQUE,

  -- Metadados do entregador avulso (preenchidos ao acessar o link)
  courier_name    TEXT,
  courier_phone   TEXT,
  courier_cpf     TEXT,

  -- Controle
  expires_at      TIMESTAMPTZ NOT NULL,
  used_at         TIMESTAMPTZ,
  delivery_confirmed_at TIMESTAMPTZ,

  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_magic_links_token ON delivery_magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_store_id ON delivery_magic_links(store_id);

-- ============================================================
-- 4. Evidências de Entrega (provas fotográficas)
-- ============================================================
CREATE TABLE IF NOT EXISTS delivery_proofs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pode referenciar um fulfillment ou um magic link
  magic_link_id   UUID REFERENCES delivery_magic_links(id),
  fulfillment_id  UUID,

  proof_type      delivery_proof_type NOT NULL,

  -- URL do arquivo no Storage (signed URL gerada ao exibir)
  storage_path    TEXT NOT NULL,

  -- GPS no momento da captura
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,

  notes           TEXT,
  captured_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_proofs_magic_link ON delivery_proofs(magic_link_id);
CREATE INDEX IF NOT EXISTS idx_delivery_proofs_fulfillment ON delivery_proofs(fulfillment_id);

-- ============================================================
-- 5. Fatura / Acerto de Entregador
-- ============================================================
DO $$ BEGIN
  CREATE TYPE courier_payout_status AS ENUM ('pending', 'approved', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS courier_payouts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  courier_id        UUID NOT NULL REFERENCES couriers(id),

  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,

  -- Calculado no fechamento
  deliveries_count  INTEGER NOT NULL DEFAULT 0,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,

  status            courier_payout_status NOT NULL DEFAULT 'pending',

  paid_at           TIMESTAMPTZ,
  paid_by           UUID REFERENCES auth.users(id),

  -- Referência ao lançamento no caixa (se integrado)
  cash_entry_id     UUID,

  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courier_payouts_store_id ON courier_payouts(store_id);
CREATE INDEX IF NOT EXISTS idx_courier_payouts_courier_id ON courier_payouts(courier_id);

-- ============================================================
-- 6. Trigger: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_courier_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS couriers_updated_at ON couriers;
CREATE TRIGGER couriers_updated_at
  BEFORE UPDATE ON couriers
  FOR EACH ROW EXECUTE FUNCTION set_courier_updated_at();

-- ============================================================
-- 7. RPC: generate_delivery_magic_link
-- ============================================================
CREATE OR REPLACE FUNCTION generate_delivery_magic_link(
  p_store_id       UUID,
  p_fulfillment_id UUID,
  p_expires_hours  INTEGER DEFAULT 48
)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token TEXT;
  v_link_id UUID;
BEGIN
  -- Token criptograficamente seguro (32 bytes hex)
  v_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO delivery_magic_links (
    store_id, fulfillment_id, token, expires_at, created_by
  ) VALUES (
    p_store_id,
    p_fulfillment_id,
    v_token,
    now() + (p_expires_hours || ' hours')::INTERVAL,
    auth.uid()
  ) RETURNING id INTO v_link_id;

  RETURN v_token;
END;
$$;

-- ============================================================
-- 8. RLS
-- ============================================================
ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE courier_payouts ENABLE ROW LEVEL SECURITY;

-- Staff da loja pode gerenciar entregadores
CREATE POLICY "staff_couriers" ON couriers
  FOR ALL USING (
    store_id IN (
      SELECT store_id FROM workspace_members
      WHERE profile_id = auth.uid()
        AND role IN ('owner','admin','manager')
    )
  );

-- Staff da loja pode gerenciar links mágicos
CREATE POLICY "staff_magic_links" ON delivery_magic_links
  FOR ALL USING (
    store_id IN (
      SELECT store_id FROM workspace_members
      WHERE profile_id = auth.uid()
        AND role IN ('owner','admin','manager','seller')
    )
  );

-- Evidências podem ser lidas por staff
CREATE POLICY "staff_delivery_proofs" ON delivery_proofs
  FOR SELECT USING (
    magic_link_id IN (
      SELECT id FROM delivery_magic_links dml
      WHERE dml.store_id IN (
        SELECT store_id FROM workspace_members
        WHERE profile_id = auth.uid()
          AND role IN ('owner','admin','manager','seller')
      )
    )
  );

-- Link mágico permite inserir evidência (via token — acesso por API pública)
CREATE POLICY "magic_link_insert_proof" ON delivery_proofs
  FOR INSERT WITH CHECK (TRUE); -- Validação do token acontece na RPC/API

-- Staff pode gerenciar faturas de entregadores
CREATE POLICY "staff_courier_payouts" ON courier_payouts
  FOR ALL USING (
    store_id IN (
      SELECT store_id FROM workspace_members
      WHERE profile_id = auth.uid()
        AND role IN ('owner','admin','manager','finance')
    )
  );
