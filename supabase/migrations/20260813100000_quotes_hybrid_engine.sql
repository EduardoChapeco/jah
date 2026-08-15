-- Migration: 20260813100000_quotes_hybrid_engine.sql
-- Propósito: Cria o módulo de Orçamentos (Quotes) com suporte a itens híbridos
-- (produto físico, serviço, locação de equipamento, item avulso).
-- Invariante: preço do pedido derivado é snapshot imutável do quote aprovado.

-- ============================================================
-- 1. Enum de tipos de item
-- ============================================================
DO $$ BEGIN
  CREATE TYPE quote_item_type AS ENUM ('product_variant', 'service', 'rental_equipment', 'manual_item');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'negotiating', 'approved', 'rejected', 'expired', 'converted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. Tabela principal: quotes
-- ============================================================
CREATE TABLE IF NOT EXISTS quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES auth.users(id),
  -- Para clientes que ainda não se cadastraram:
  guest_name      TEXT,
  guest_email     TEXT,
  guest_phone     TEXT,

  -- Numeração amigável (ex: ORC-2026-0001)
  quote_number    TEXT NOT NULL,

  status          quote_status NOT NULL DEFAULT 'draft',

  -- Snapshot financeiro (preenchido ao aprovar)
  subtotal_cents        INTEGER NOT NULL DEFAULT 0,
  discount_cents        INTEGER NOT NULL DEFAULT 0,
  total_cents           INTEGER NOT NULL DEFAULT 0,

  -- Validade
  valid_until     TIMESTAMPTZ,

  -- Condições e observações
  conditions      TEXT,
  internal_notes  TEXT,

  -- Controle de versão (incrementado a cada revisão)
  version         INTEGER NOT NULL DEFAULT 1,

  -- Rastreabilidade
  created_by      UUID REFERENCES auth.users(id),
  approved_by     UUID REFERENCES auth.users(id),
  approved_at     TIMESTAMPTZ,
  rejected_at     TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Referência ao pedido gerado (após conversão)
  converted_order_id UUID,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quotes_store_id ON quotes(store_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_number_per_store ON quotes(store_id, quote_number);

-- ============================================================
-- 3. Itens do orçamento: quote_items
-- ============================================================
CREATE TABLE IF NOT EXISTS quote_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id          UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,

  item_type         quote_item_type NOT NULL,

  -- Referências opcionais por tipo (pode ser nulo para manual_item)
  product_variant_id UUID REFERENCES product_variants(id),
  service_id        UUID, -- Referência a booking_services (sem FK rígida para permitir serviços deletados)
  resource_id       UUID, -- Referência a booking_resources

  -- Descrição snapshot (obrigatório — capturado no momento da criação do item)
  name              TEXT NOT NULL,
  description       TEXT,
  sku               TEXT,

  -- Preço unitário snapshot (em centavos)
  unit_price_cents  INTEGER NOT NULL,
  quantity          INTEGER NOT NULL DEFAULT 1,
  discount_cents    INTEGER NOT NULL DEFAULT 0,
  total_cents       INTEGER NOT NULL, -- (unit_price * qty) - discount

  -- Para serviços e locações
  duration_minutes  INTEGER,
  scheduled_start   TIMESTAMPTZ,
  scheduled_end     TIMESTAMPTZ,

  -- Metadados extras (ex: cor, tamanho da variante)
  metadata          JSONB,

  position          INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);

-- ============================================================
-- 4. Mensagens do orçamento (negociação)
-- ============================================================
CREATE TABLE IF NOT EXISTS quote_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES auth.users(id),
  body        TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE, -- true = visível apenas para equipe
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_messages_quote_id ON quote_messages(quote_id);

-- ============================================================
-- 5. Trigger: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION set_quote_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quotes_updated_at ON quotes;
CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION set_quote_updated_at();

-- ============================================================
-- 6. Função para gerar número sequencial de orçamento
-- ============================================================
CREATE OR REPLACE FUNCTION generate_quote_number(p_store_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  next_seq INTEGER;
  year_str TEXT := to_char(now(), 'YYYY');
BEGIN
  SELECT COALESCE(MAX(
    CAST(substring(quote_number FROM '[0-9]+$') AS INTEGER)
  ), 0) + 1
  INTO next_seq
  FROM quotes
  WHERE store_id = p_store_id
    AND quote_number LIKE 'ORC-' || year_str || '-%';

  RETURN 'ORC-' || year_str || '-' || lpad(next_seq::TEXT, 4, '0');
END;
$$;

-- ============================================================
-- 7. RPC: create_quote (transação atômica)
-- ============================================================
CREATE OR REPLACE FUNCTION create_quote(
  p_store_id       UUID,
  p_customer_id    UUID DEFAULT NULL,
  p_guest_name     TEXT DEFAULT NULL,
  p_guest_email    TEXT DEFAULT NULL,
  p_guest_phone    TEXT DEFAULT NULL,
  p_valid_until    TIMESTAMPTZ DEFAULT NULL,
  p_conditions     TEXT DEFAULT NULL,
  p_internal_notes TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_quote_id UUID;
  v_number   TEXT;
BEGIN
  v_number := generate_quote_number(p_store_id);

  INSERT INTO quotes (
    store_id, customer_id, guest_name, guest_email, guest_phone,
    quote_number, valid_until, conditions, internal_notes,
    created_by
  ) VALUES (
    p_store_id, p_customer_id, p_guest_name, p_guest_email, p_guest_phone,
    v_number, p_valid_until, p_conditions, p_internal_notes,
    auth.uid()
  ) RETURNING id INTO v_quote_id;

  RETURN v_quote_id;
END;
$$;

-- ============================================================
-- 8. RPC: approve_quote — snapshot financeiro + conversão atômica
-- ============================================================
CREATE OR REPLACE FUNCTION approve_quote(p_quote_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_quote       quotes%ROWTYPE;
  v_subtotal    INTEGER := 0;
  v_total       INTEGER := 0;
BEGIN
  -- Lock para evitar dupla aprovação
  SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id FOR UPDATE;

  IF v_quote.status NOT IN ('sent', 'negotiating') THEN
    RAISE EXCEPTION 'Quote não pode ser aprovado no status atual: %', v_quote.status;
  END IF;

  IF v_quote.valid_until IS NOT NULL AND v_quote.valid_until < now() THEN
    -- Marcar como expirado
    UPDATE quotes SET status = 'expired' WHERE id = p_quote_id;
    RAISE EXCEPTION 'Orçamento expirou em %', v_quote.valid_until;
  END IF;

  -- Calcular totais a partir dos itens
  SELECT COALESCE(SUM(total_cents), 0) INTO v_subtotal
  FROM quote_items WHERE quote_id = p_quote_id;

  v_total := v_subtotal - v_quote.discount_cents;

  -- Atualizar quote
  UPDATE quotes SET
    status         = 'approved',
    subtotal_cents = v_subtotal,
    total_cents    = v_total,
    approved_by    = auth.uid(),
    approved_at    = now()
  WHERE id = p_quote_id;

  RETURN jsonb_build_object(
    'quote_id',       p_quote_id,
    'subtotal_cents', v_subtotal,
    'total_cents',    v_total,
    'status',         'approved'
  );
END;
$$;

-- ============================================================
-- 9. RLS
-- ============================================================
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_messages ENABLE ROW LEVEL SECURITY;

-- Staff pode ver/editar orçamentos da própria loja
CREATE POLICY "staff_quotes_own_store" ON quotes
  FOR ALL USING (
    store_id IN (
      SELECT store_id FROM workspace_members
      WHERE profile_id = auth.uid()
        AND role IN ('owner','admin','manager','seller','finance')
    )
  );

-- Cliente pode ver seus próprios orçamentos
CREATE POLICY "customer_view_own_quotes" ON quotes
  FOR SELECT USING (customer_id = auth.uid());

-- Items e messages herdam acesso via quote
CREATE POLICY "staff_quote_items" ON quote_items
  FOR ALL USING (
    quote_id IN (
      SELECT id FROM quotes WHERE store_id IN (
        SELECT store_id FROM workspace_members
        WHERE profile_id = auth.uid()
          AND role IN ('owner','admin','manager','seller','finance')
      )
    )
  );

CREATE POLICY "staff_quote_messages" ON quote_messages
  FOR ALL USING (
    quote_id IN (
      SELECT id FROM quotes WHERE store_id IN (
        SELECT store_id FROM workspace_members
        WHERE profile_id = auth.uid()
          AND role IN ('owner','admin','manager','seller','finance')
      )
    )
  );

-- Cliente pode ver mensagens públicas dos seus orçamentos
CREATE POLICY "customer_quote_messages" ON quote_messages
  FOR SELECT USING (
    is_internal = FALSE AND
    quote_id IN (SELECT id FROM quotes WHERE customer_id = auth.uid())
  );
