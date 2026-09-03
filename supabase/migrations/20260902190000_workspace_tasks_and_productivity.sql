-- ==============================================================================
-- MIGRAÇÃO: MÓDULO UNIVERSAL DE TAREFAS, PRODUTIVIDADE & CHECKLISTS DO OPERADOR
-- ==============================================================================

-- 1. TABELA PRINCIPAL DE TAREFAS
CREATE TABLE IF NOT EXISTS public.workspace_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_to_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'archived')),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    context_type TEXT NOT NULL DEFAULT 'general' CHECK (context_type IN ('general', 'order', 'lead', 'group_tour', 'table', 'customer', 'inventory')),
    context_id TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_my_day BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABELA DE ITENS DE CHECKLIST DA TAREFA
CREATE TABLE IF NOT EXISTS public.workspace_task_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.workspace_tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABELA DE COMENTÁRIOS E HISTÓRICO DA TAREFA
CREATE TABLE IF NOT EXISTS public.workspace_task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.workspace_tasks(id) ON DELETE CASCADE,
    author_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_store_status ON public.workspace_tasks(store_id, status);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_assigned ON public.workspace_tasks(assigned_to_profile_id);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_due_date ON public.workspace_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_context ON public.workspace_tasks(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_workspace_task_checklists_task ON public.workspace_task_checklists(task_id);
CREATE INDEX IF NOT EXISTS idx_workspace_task_comments_task ON public.workspace_task_comments(task_id);

-- RLS Deny-by-default
ALTER TABLE public.workspace_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_task_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_task_comments ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para workspace_tasks
CREATE POLICY "Workspace members manage store tasks"
    ON public.workspace_tasks
    FOR ALL
    TO authenticated
    USING (
        store_id IN (
            SELECT store_id FROM public.workspace_members WHERE profile_id = auth.uid()
        )
        OR created_by_profile_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin')
        )
    );

-- Políticas de acesso para workspace_task_checklists
CREATE POLICY "Workspace members manage task checklists"
    ON public.workspace_task_checklists
    FOR ALL
    TO authenticated
    USING (
        task_id IN (
            SELECT id FROM public.workspace_tasks WHERE store_id IN (
                SELECT store_id FROM public.workspace_members WHERE profile_id = auth.uid()
            )
            OR created_by_profile_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin')
            )
        )
    );

-- Políticas de acesso para workspace_task_comments
CREATE POLICY "Workspace members manage task comments"
    ON public.workspace_task_comments
    FOR ALL
    TO authenticated
    USING (
        task_id IN (
            SELECT id FROM public.workspace_tasks WHERE store_id IN (
                SELECT store_id FROM public.workspace_members WHERE profile_id = auth.uid()
            )
            OR created_by_profile_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin')
            )
        )
    );
