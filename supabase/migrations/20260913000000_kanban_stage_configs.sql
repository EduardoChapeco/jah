-- ========================================================================================
-- MIGRATION: CONFIGURAÇÃO DE COLUNAS & ESTÁGIOS DE KANBAN CUSTOMIZÁVEIS POR LOJA / NÍVEL
-- ========================================================================================

CREATE TABLE IF NOT EXISTS public.kanban_stage_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  module text NOT NULL, -- 'tasks', 'commercial_leads', 'quotes', 'proposals', 'support_tickets', 'orders'
  stage_key text NOT NULL, -- chave técnica imutável (ex: 'todo', 'in_progress', 'won', 'lost')
  title text NOT NULL, -- nome customizável exibido na coluna
  purpose text NOT NULL DEFAULT 'in_progress', -- 'inbox', 'in_progress', 'review', 'won', 'lost', 'archived'
  color text NOT NULL DEFAULT '#64748b',
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_store_module_stage UNIQUE (store_id, module, stage_key)
);

-- Habilitar e forçar RLS
ALTER TABLE public.kanban_stage_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_stage_configs FORCE ROW LEVEL SECURITY;

-- Políticas de RLS Multi-Tenant estritas
DROP POLICY IF EXISTS "store_access_kanban_stage_configs" ON public.kanban_stage_configs;
CREATE POLICY "store_access_kanban_stage_configs" ON public.kanban_stage_configs
  FOR ALL USING (
    store_id IN (
      SELECT store_id FROM public.workspace_members
      WHERE profile_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('platform_admin', 'master')
    )
  );

-- Índices de alta performance
CREATE INDEX IF NOT EXISTS idx_kanban_stages_store_module 
  ON public.kanban_stage_configs (store_id, module, sort_order);
