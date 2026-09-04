-- =============================================================================
-- MIGRATION: 20260904210000_events_subpanels_staff_contractors_inventory.sql
-- ECOSSISTEMA JAH: SUBPAINÉIS DE EVENTOS COM TOKEN, EQUIPE, TERCEIRIZADOS & INVENTÁRIO
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. event_contractors (Terceirizados e Fornecedores do Evento)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_contractors (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name                TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 160),
  service_category    TEXT NOT NULL 
                        CHECK (service_category IN ('seguranca', 'limpeza', 'buffet', 'som_iluminacao', 'fotografia', 'cenografia', 'brigadistas', 'atendimento', 'outro')),
  document_number     TEXT,
  contact_phone       TEXT,
  contact_email       TEXT,
  hourly_rate_cents   INT NOT NULL DEFAULT 0 CHECK (hourly_rate_cents >= 0),
  fixed_fee_cents     INT NOT NULL DEFAULT 0 CHECK (fixed_fee_cents >= 0),
  pix_key             TEXT,
  bank_info           JSONB NOT NULL DEFAULT '{}'::jsonb,
  rating              NUMERIC(3,2) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contractors_store ON public.event_contractors(store_id);
CREATE INDEX IF NOT EXISTS idx_contractors_category ON public.event_contractors(store_id, service_category);

-- ---------------------------------------------------------------------------
-- 2. event_subpanels (Subpainéis / Pontos de Venda Isolados do Evento)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_subpanels (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  event_id            UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name                TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  panel_type          TEXT NOT NULL DEFAULT 'bar' 
                        CHECK (panel_type IN ('bar', 'foodtruck', 'restaurant', 'merchandise', 'ticketing_box', 'vip_lounge', 'security_checkpoint', 'other')),
  manager_name        TEXT,
  manager_contact     TEXT,
  access_token        TEXT UNIQUE,
  token_expires_at    TIMESTAMPTZ,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  config              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subpanels_store_event ON public.event_subpanels(store_id, event_id);
CREATE INDEX IF NOT EXISTS idx_subpanels_token ON public.event_subpanels(access_token) WHERE access_token IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. event_staff_allocations (Escala da Equipe Interna e Terceirizados)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_staff_allocations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  event_id            UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  subpanel_id         UUID REFERENCES public.event_subpanels(id) ON DELETE SET NULL,
  employee_id         UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  contractor_id       UUID REFERENCES public.event_contractors(id) ON DELETE SET NULL,
  role_title          TEXT NOT NULL CHECK (char_length(role_title) >= 2),
  shift_name          TEXT NOT NULL DEFAULT 'Geral',
  start_time          TIMESTAMPTZ,
  end_time            TIMESTAMPTZ,
  remuneration_cents  INT NOT NULL DEFAULT 0 CHECK (remuneration_cents >= 0),
  is_confirmed        BOOLEAN NOT NULL DEFAULT false,
  check_in_at         TIMESTAMPTZ,
  check_out_at        TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_allocations_event ON public.event_staff_allocations(event_id);
CREATE INDEX IF NOT EXISTS idx_staff_allocations_subpanel ON public.event_staff_allocations(subpanel_id);
CREATE INDEX IF NOT EXISTS idx_staff_allocations_employee ON public.event_staff_allocations(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_allocations_contractor ON public.event_staff_allocations(contractor_id);

-- ---------------------------------------------------------------------------
-- 4. event_assets_inventory (Inventário e Insumos do Evento / Persona Nexus)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_assets_inventory (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  event_id            UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  subpanel_id         UUID REFERENCES public.event_subpanels(id) ON DELETE SET NULL,
  item_name           TEXT NOT NULL CHECK (char_length(item_name) >= 2),
  category            TEXT NOT NULL DEFAULT 'equipment' 
                        CHECK (category IN ('equipment', 'beverage_stock', 'food_stock', 'merchandise', 'furniture', 'credential_badges', 'other')),
  quantity_planned    INT NOT NULL DEFAULT 1 CHECK (quantity_planned >= 0),
  quantity_delivered  INT NOT NULL DEFAULT 0 CHECK (quantity_delivered >= 0),
  quantity_consumed   INT NOT NULL DEFAULT 0 CHECK (quantity_consumed >= 0),
  quantity_returned   INT NOT NULL DEFAULT 0 CHECK (quantity_returned >= 0),
  unit_cost_cents     INT NOT NULL DEFAULT 0 CHECK (unit_cost_cents >= 0),
  rental_supplier     TEXT,
  status              TEXT NOT NULL DEFAULT 'planned' 
                        CHECK (status IN ('planned', 'dispatched', 'in_use', 'returned', 'damaged', 'lost')),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_assets_event ON public.event_assets_inventory(event_id);
CREATE INDEX IF NOT EXISTS idx_event_assets_subpanel ON public.event_assets_inventory(subpanel_id);

-- ---------------------------------------------------------------------------
-- 5. RPC: Geração de Token de Acesso Seguro para Subpainel Externo
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_event_subpanel_token(p_subpanel_id UUID, p_expire_days INT DEFAULT 30)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  v_token := 'SP_' || encode(gen_random_bytes(24), 'hex');
  
  UPDATE public.event_subpanels
  SET 
    access_token = v_token,
    token_expires_at = now() + (p_expire_days || ' days')::interval,
    updated_at = now()
  WHERE id = p_subpanel_id;
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.generate_event_subpanel_token(UUID, INT) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS (ROW LEVEL SECURITY)
-- ---------------------------------------------------------------------------
ALTER TABLE public.event_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_subpanels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_staff_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_assets_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_manage_event_contractors ON public.event_contractors;
CREATE POLICY staff_manage_event_contractors
  ON public.event_contractors FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_event_subpanels ON public.event_subpanels;
CREATE POLICY staff_manage_event_subpanels
  ON public.event_subpanels FOR ALL
  USING (public.is_store_staff(store_id));

-- Subpainéis podem ser lidos publicamente caso tenham token válido não expirado
DROP POLICY IF EXISTS public_read_subpanel_by_token ON public.event_subpanels;
CREATE POLICY public_read_subpanel_by_token
  ON public.event_subpanels FOR SELECT
  USING (
    access_token IS NOT NULL 
    AND (token_expires_at IS NULL OR token_expires_at > now())
  );

DROP POLICY IF EXISTS staff_manage_staff_allocations ON public.event_staff_allocations;
CREATE POLICY staff_manage_staff_allocations
  ON public.event_staff_allocations FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_event_assets ON public.event_assets_inventory;
CREATE POLICY staff_manage_event_assets
  ON public.event_assets_inventory FOR ALL
  USING (public.is_store_staff(store_id));

-- ---------------------------------------------------------------------------
-- Triggers para updated_at automático
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_event_contractors_updated_at ON public.event_contractors;
CREATE TRIGGER trg_event_contractors_updated_at
  BEFORE UPDATE ON public.event_contractors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_event_subpanels_updated_at ON public.event_subpanels;
CREATE TRIGGER trg_event_subpanels_updated_at
  BEFORE UPDATE ON public.event_subpanels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_event_staff_allocations_updated_at ON public.event_staff_allocations;
CREATE TRIGGER trg_event_staff_allocations_updated_at
  BEFORE UPDATE ON public.event_staff_allocations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_event_assets_inventory_updated_at ON public.event_assets_inventory;
CREATE TRIGGER trg_event_assets_inventory_updated_at
  BEFORE UPDATE ON public.event_assets_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
