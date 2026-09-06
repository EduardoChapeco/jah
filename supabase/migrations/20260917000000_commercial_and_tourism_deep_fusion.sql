-- ==============================================================================
-- MIGRAÇÃO NÃO-DESTRUTIVA: FUSÃO CANÔNICA DE DADOS DO COMERCIAL E TURISMO
-- Superconjunto idempotente que harmoniza o CRM de Negociação com a Malha de Turismo.
-- ==============================================================================

-- 1. EXTENSÃO DA TABELA leads_crm (Preserva dados históricos e adiciona inteligência)
ALTER TABLE IF EXISTS leads_crm 
  ADD COLUMN IF NOT EXISTS algorithmic_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS budget_profile text DEFAULT 'moderado',
  ADD COLUMN IF NOT EXISTS destination_of_interest text,
  ADD COLUMN IF NOT EXISTS passenger_count integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS acquisition_channel text DEFAULT 'direto',
  ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb;

-- Índices otimizados para busca e ordenação no Kanban Full-Viewport
CREATE INDEX IF NOT EXISTS idx_leads_crm_score ON leads_crm(algorithmic_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_crm_destination ON leads_crm(destination_of_interest);
CREATE INDEX IF NOT EXISTS idx_leads_crm_channel ON leads_crm(acquisition_channel);

-- 2. EXTENSÃO DA TABELA tourism_trips (Vínculo formal com assentos, hotéis e vouchers)
ALTER TABLE IF EXISTS tourism_trips 
  ADD COLUMN IF NOT EXISTS bus_layout_id uuid REFERENCES vehicle_layouts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hotel_inventory_ids text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS vouchers_issued_count integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_tourism_trips_bus_layout ON tourism_trips(bus_layout_id);

-- 3. EXTENSÃO DA TABELA quotes (Propostas Comerciais e Turísticas)
ALTER TABLE IF EXISTS quotes
  ADD COLUMN IF NOT EXISTS destination_of_interest text,
  ADD COLUMN IF NOT EXISTS passenger_count integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS budget_profile text DEFAULT 'moderado';

-- 4. POLÍTICAS RLS DENY-BY-DEFAULT E ISOLAMENTO MULTI-TENANT
ALTER TABLE IF EXISTS leads_crm ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tourism_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quotes ENABLE ROW LEVEL SECURITY;

-- Política de leitura segura para membros da loja em leads_crm
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads_crm' AND policyname = 'leads_crm_store_isolation_select'
  ) THEN
    CREATE POLICY leads_crm_store_isolation_select ON leads_crm
      FOR SELECT
      USING (
        store_id IN (
          SELECT store_id FROM workspace_members WHERE profile_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads_crm' AND policyname = 'leads_crm_store_isolation_all'
  ) THEN
    CREATE POLICY leads_crm_store_isolation_all ON leads_crm
      FOR ALL
      USING (
        store_id IN (
          SELECT store_id FROM workspace_members WHERE profile_id = auth.uid()
        )
      );
  END IF;
END $$;
