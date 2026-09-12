-- ============================================================================
-- Waesy / Waesy — Migration 20260904130000: CRM Leads Enterprise Parity (TravelAgências Standard)
-- ============================================================================
-- Enriquece a tabela public.leads_crm com todas as dimensões ricas do travelagencias:
-- - Destino, tipo de interesse e período flexível
-- - Datas previstas de ida e volta (travel_start / travel_end)
-- - Composição de passageiros detalhada (pax_count, pax_adults, pax_children, pax_infants, pax_ages)
-- - Tags dinâmicas e Checklist interativo de tarefas do atendimento
-- - Canal detalhado (lead_source_detail) e motivo de perda (lost_reason)
-- - Auditoria de contato e inatividade (last_contacted_at)
-- - Expansão do status do funil: new, contacted, qualified, proposal, negotiation, won, lost, converted
-- ============================================================================

-- 1. Remove constraint antiga restritiva de status se existir
DO $$
BEGIN
  ALTER TABLE public.leads_crm DROP CONSTRAINT IF EXISTS leads_crm_status_check;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Adiciona colunas enterprise do travelagencias
ALTER TABLE public.leads_crm
  ADD COLUMN IF NOT EXISTS title               TEXT,
  ADD COLUMN IF NOT EXISTS destination         TEXT,
  ADD COLUMN IF NOT EXISTS interest_type       TEXT,
  ADD COLUMN IF NOT EXISTS interest_period     TEXT,
  ADD COLUMN IF NOT EXISTS travel_start        DATE,
  ADD COLUMN IF NOT EXISTS travel_end          DATE,
  ADD COLUMN IF NOT EXISTS pax_count           INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS pax_adults          INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS pax_children        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pax_infants         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pax_ages            JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tags                TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS checklist           JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS attachments         JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS lost_reason         TEXT,
  ADD COLUMN IF NOT EXISTS closed_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_contacted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS lead_source_detail  TEXT,
  ADD COLUMN IF NOT EXISTS custom_fields       JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 3. Adiciona nova constraint de status completa
ALTER TABLE public.leads_crm
  ADD CONSTRAINT leads_crm_status_check
  CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'converted'));

-- 4. Índices para performance em alta escala
CREATE INDEX IF NOT EXISTS idx_leads_crm_store_status
  ON public.leads_crm(store_id, status);

CREATE INDEX IF NOT EXISTS idx_leads_crm_destination
  ON public.leads_crm(store_id, destination)
  WHERE destination IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_crm_last_contact
  ON public.leads_crm(store_id, last_contacted_at);

-- 5. Recarrega o cache do PostgREST
NOTIFY pgrst, 'reload schema';
