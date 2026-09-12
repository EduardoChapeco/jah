-- ============================================================================
-- Migration: 20261016000000_marketplace_hub_fiscal_and_feeds.sql
-- Description: Hub de Integrações Multicanal (Mercado Livre, iFood, Shopee, Magalu, Amazon),
--              Módulo Fiscal Unificado (NF-e, NFS-e, Emissor Nacional),
--              Rastreabilidade de Canais (Caixa & Estoque), Telemetria CAPI & Feeds
-- Author: Conselho Executivo de BigTech
-- ============================================================================

-- 1. marketplace_connectors
CREATE TABLE IF NOT EXISTS public.marketplace_connectors (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id             UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  platform             TEXT NOT NULL CHECK (platform IN (
                         'mercadolivre', 'ifood', 'shopee', 'magalu', 'amazon',
                         'rappi', 'amodelivery', 'melhorenvio', 'correios'
                       )),
  name                 TEXT NOT NULL,
  external_account_id  TEXT,
  account_nickname     TEXT,
  access_token         TEXT,
  refresh_token        TEXT,
  token_expires_at     TIMESTAMPTZ,
  credentials          JSONB NOT NULL DEFAULT '{}'::jsonb,
  status               TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN (
                         'connected', 'disconnected', 'error', 'pending'
                       )),
  sync_status          TEXT NOT NULL DEFAULT 'idle' CHECK (sync_status IN (
                         'idle', 'syncing', 'success', 'error', 'partial'
                       )),
  last_sync_at         TIMESTAMPTZ,
  error_message        TEXT,
  settings             JSONB NOT NULL DEFAULT '{
    "auto_accept_orders": false,
    "sync_products": true,
    "sync_orders": true,
    "sync_stock": true,
    "sync_prices": true,
    "price_margin_percent": 0
  }'::jsonb,
  metadata             JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_marketplace_connector_store_platform UNIQUE (store_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_connectors_store ON public.marketplace_connectors(store_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_connectors_platform ON public.marketplace_connectors(platform);
CREATE INDEX IF NOT EXISTS idx_marketplace_connectors_status ON public.marketplace_connectors(status);

ALTER TABLE public.marketplace_connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketplace_connectors_store_staff_all"
  ON public.marketplace_connectors FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- 2. marketplace_external_orders
CREATE TABLE IF NOT EXISTS public.marketplace_external_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id              UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  connector_id          UUID REFERENCES public.marketplace_connectors(id) ON DELETE SET NULL,
  order_id              UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  platform              TEXT NOT NULL,
  external_order_id     TEXT NOT NULL,
  external_status       TEXT NOT NULL,
  buyer_name            TEXT,
  buyer_document        TEXT,
  buyer_email           TEXT,
  buyer_phone           TEXT,
  shipping_address      JSONB DEFAULT '{}'::jsonb,
  subtotal_cents        INTEGER NOT NULL DEFAULT 0,
  shipping_cost_cents   INTEGER NOT NULL DEFAULT 0,
  marketplace_fee_cents INTEGER NOT NULL DEFAULT 0,
  net_payout_cents      INTEGER NOT NULL DEFAULT 0,
  total_amount_cents    INTEGER NOT NULL DEFAULT 0,
  payment_method        TEXT,
  shipping_method       TEXT,
  tracking_number       TEXT,
  estimated_delivery    TIMESTAMPTZ,
  items                 JSONB NOT NULL DEFAULT '[]'::jsonb,
  import_status         TEXT NOT NULL DEFAULT 'imported' CHECK (import_status IN (
                          'pending', 'imported', 'error', 'skipped'
                        )),
  raw_data              JSONB,
  imported_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_marketplace_ext_order UNIQUE (store_id, platform, external_order_id)
);

CREATE INDEX IF NOT EXISTS idx_ext_orders_store ON public.marketplace_external_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_ext_orders_platform ON public.marketplace_external_orders(platform);
CREATE INDEX IF NOT EXISTS idx_ext_orders_status ON public.marketplace_external_orders(import_status);

ALTER TABLE public.marketplace_external_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketplace_external_orders_store_staff_all"
  ON public.marketplace_external_orders FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- 3. marketplace_sync_logs
CREATE TABLE IF NOT EXISTS public.marketplace_sync_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  connector_id     UUID REFERENCES public.marketplace_connectors(id) ON DELETE CASCADE,
  platform         TEXT NOT NULL,
  sync_type        TEXT NOT NULL CHECK (sync_type IN ('catalog', 'stock', 'orders', 'prices', 'full')),
  direction        TEXT NOT NULL DEFAULT 'import' CHECK (direction IN ('import', 'export', 'bidirectional')),
  status           TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed', 'error', 'partial')),
  items_processed  INTEGER NOT NULL DEFAULT 0,
  items_created    INTEGER NOT NULL DEFAULT 0,
  items_updated    INTEGER NOT NULL DEFAULT 0,
  items_failed     INTEGER NOT NULL DEFAULT 0,
  duration_ms      INTEGER,
  errors           JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_store_created ON public.marketplace_sync_logs(store_id, created_at DESC);

ALTER TABLE public.marketplace_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketplace_sync_logs_store_staff_select"
  ON public.marketplace_sync_logs FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- 4. store_nfe_configs
CREATE TABLE IF NOT EXISTS public.store_nfe_configs (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id                 UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  provider                 TEXT NOT NULL DEFAULT 'focus_nfe' CHECK (provider IN (
                             'focus_nfe', 'nuvem_fiscal', 'nfs_nacional', 'plugnotas'
                           )),
  api_token                TEXT,
  environment              TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  cnpj                     TEXT NOT NULL,
  inscricao_municipal      TEXT,
  inscricao_estadual       TEXT,
  razao_social             TEXT NOT NULL,
  nome_fantasia            TEXT,
  regime_tributario        TEXT NOT NULL DEFAULT 'simples_nacional' CHECK (
                             regime_tributario IN ('simples_nacional', 'lucro_presumido', 'lucro_real', 'mei')
                           ),
  aliquota_iss             DECIMAL(5,2) DEFAULT 2.00,
  codigo_servico_municipal TEXT,
  serie_nfe                TEXT DEFAULT '1',
  proximo_numero           INTEGER DEFAULT 1,
  certificate_vault_id     TEXT,
  is_active                BOOLEAN NOT NULL DEFAULT true,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_store_nfe_config UNIQUE (store_id)
);

CREATE INDEX IF NOT EXISTS idx_store_nfe_configs_store ON public.store_nfe_configs(store_id);

ALTER TABLE public.store_nfe_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_nfe_configs_store_staff_all"
  ON public.store_nfe_configs FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 5. store_nfe_invoices
CREATE TABLE IF NOT EXISTS public.store_nfe_invoices (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id           UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id           UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  invoice_type       TEXT NOT NULL DEFAULT 'nfe' CHECK (invoice_type IN ('nfe', 'nfse', 'nfce')),
  nfe_number         TEXT,
  nfe_serie          TEXT,
  nfe_key            TEXT, -- Chave de acesso de 44 dígitos
  danfe_pdf_url      TEXT,
  xml_url            TEXT,
  status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                       'pending', 'processing', 'issued', 'cancelled', 'error'
                     )),
  valor_total_cents  INTEGER NOT NULL DEFAULT 0,
  tomador_documento  TEXT,
  tomador_nome       TEXT,
  tomador_email      TEXT,
  error_message      TEXT,
  issued_at          TIMESTAMPTZ,
  cancelled_at       TIMESTAMPTZ,
  metadata           JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_nfe_invoices_store ON public.store_nfe_invoices(store_id);
CREATE INDEX IF NOT EXISTS idx_store_nfe_invoices_order ON public.store_nfe_invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_store_nfe_invoices_status ON public.store_nfe_invoices(status);

ALTER TABLE public.store_nfe_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_nfe_invoices_store_staff_all"
  ON public.store_nfe_invoices FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- 6. lead_conversion_telemetry (Registro determinístico de conversões CAPI / Google)
CREATE TABLE IF NOT EXISTS public.lead_conversion_telemetry (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  event_name       TEXT NOT NULL,
  event_id         TEXT NOT NULL,
  channel          TEXT NOT NULL CHECK (channel IN ('meta_capi', 'google_ads', 'tiktok')),
  status           TEXT NOT NULL DEFAULT 'dispatched' CHECK (status IN ('dispatched', 'delivered', 'failed')),
  payload_sha      TEXT,
  response_data    JSONB,
  dispatched_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_store_event ON public.lead_conversion_telemetry(store_id, event_id);

ALTER TABLE public.lead_conversion_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_conversion_telemetry_staff_select"
  ON public.lead_conversion_telemetry FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- 7. Adição de rastreabilidade de canais em cash_register_entries & stock_movements
ALTER TABLE public.cash_register_entries
  ADD COLUMN IF NOT EXISTS channel_source TEXT NOT NULL DEFAULT 'storefront',
  ADD COLUMN IF NOT EXISTS marketplace_fee_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_payout_cents INTEGER,
  ADD COLUMN IF NOT EXISTS external_reference_id TEXT;

ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS channel_source TEXT NOT NULL DEFAULT 'storefront',
  ADD COLUMN IF NOT EXISTS external_order_id TEXT;
