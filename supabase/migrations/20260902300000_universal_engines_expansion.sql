-- Migration: 20260902300000_universal_engines_expansion.sql
-- Unificação dos Grandes Motores Transversais (Universal Tasks, Universal Contracts e Entidades Polimórficas)

-- 1. EXPANSÃO DE CONTEXTO DAS TAREFAS (WORKSPACE_TASKS)
-- Permite vincular tarefas a processos jurídicos, contratos, ordens de serviços, veículos e imóveis
ALTER TABLE public.workspace_tasks
    DROP CONSTRAINT IF EXISTS workspace_tasks_context_type_check;

ALTER TABLE public.workspace_tasks
    ADD CONSTRAINT workspace_tasks_context_type_check
    CHECK (context_type IN (
        'general',
        'order',
        'lead',
        'group_tour',
        'table',
        'customer',
        'inventory',
        'lawsuit',
        'contract',
        'service',
        'vehicle',
        'real_estate'
    ));

-- 2. EXPANSÃO DO MOTOR DE CONTRATOS (CONTRACT_TEMPLATES & CONTRACTS)
-- Permite contratos em todos os setores (veículos, imóveis, advocacia, turismo, saúde/estética)
ALTER TABLE public.contract_templates
    DROP CONSTRAINT IF EXISTS contract_templates_category_check;

ALTER TABLE public.contract_templates
    ADD CONSTRAINT contract_templates_category_check
    CHECK (category IN (
        'real_estate_rental',
        'real_estate_sale',
        'vehicle_sale',
        'vehicle_consignation',
        'service_agreement',
        'employment',
        'general_deal',
        'legal_retainer',
        'tourism_package',
        'medical_aesthetic_consent'
    ));

-- 3. VINCULAÇÃO POLIMÓRFICA DE CONTRATOS A QUALQUER ENTIDADE DE NEGÓCIO
ALTER TABLE public.contracts
    ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS entity_type TEXT,
    ADD COLUMN IF NOT EXISTS entity_id TEXT;

CREATE INDEX IF NOT EXISTS idx_contracts_entity ON public.contracts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_contracts_store ON public.contracts(store_id);
