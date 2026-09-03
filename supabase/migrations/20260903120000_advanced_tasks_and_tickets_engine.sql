-- ==============================================================================
-- MIGRAÇÃO: EXPANSÃO BIGTECH DE TAREFAS (ENTERPRISE KANBAN/CALENDAR) & SUPORTE
-- ==============================================================================

-- 1. ADICIONAR CAMPOS AVANÇADOS NA TABELA PUBLIC.WORKSPACE_TASKS
ALTER TABLE public.workspace_tasks
    ADD COLUMN IF NOT EXISTS task_code TEXT,
    ADD COLUMN IF NOT EXISTS timer_seconds INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_timer_running BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS recurrence TEXT NOT NULL DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS context_label TEXT,
    ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS kanban_column_id TEXT NOT NULL DEFAULT 'todo';

-- Gerar task_code para tarefas que ainda não possuem
UPDATE public.workspace_tasks
SET task_code = 'TSK-' || UPPER(SUBSTRING(id::text, 1, 6))
WHERE task_code IS NULL;

-- Criar índices de performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_tasks_code ON public.workspace_tasks(store_id, task_code);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_recurrence ON public.workspace_tasks(store_id, recurrence);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_timer ON public.workspace_tasks(store_id, is_timer_running);

-- 2. TABELA DE COLUNAS CUSTOMIZÁVEIS DO KANBAN POR LOJA
CREATE TABLE IF NOT EXISTS public.workspace_task_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    column_key TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    sort_order INTEGER NOT NULL DEFAULT 0,
    limit_wip INTEGER NOT NULL DEFAULT 0,
    is_done_column BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(store_id, column_key)
);

CREATE INDEX IF NOT EXISTS idx_workspace_task_columns_store ON public.workspace_task_columns(store_id, sort_order);

ALTER TABLE public.workspace_task_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members manage task columns"
    ON public.workspace_task_columns
    FOR ALL
    TO authenticated
    USING (
        store_id IN (
            SELECT store_id FROM public.workspace_members WHERE profile_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin')
        )
    );

-- 3. EXPANSÃO DE SUPORTE (OPERATOR_SUPPORT_TICKETS)
ALTER TABLE public.operator_support_tickets
    ADD COLUMN IF NOT EXISTS ticket_code TEXT,
    ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS customer_name TEXT,
    ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS booking_id UUID,
    ADD COLUMN IF NOT EXISTS tour_id UUID,
    ADD COLUMN IF NOT EXISTS attachment_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sla_minutes INTEGER NOT NULL DEFAULT 1440,
    ADD COLUMN IF NOT EXISTS timer_spent_seconds INTEGER NOT NULL DEFAULT 0;

-- Atualizar ticket_code para tickets existentes
UPDATE public.operator_support_tickets
SET ticket_code = 'TKT-' || UPPER(SUBSTRING(id::text, 1, 6))
WHERE ticket_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_operator_support_tickets_code ON public.operator_support_tickets(store_id, ticket_code);
CREATE INDEX IF NOT EXISTS idx_operator_support_tickets_order ON public.operator_support_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_operator_support_tickets_customer ON public.operator_support_tickets(customer_id);
