-- ============================================================================
-- WIDER 3.0: OMNICHANNEL CHAT-FIRST CONVERSATIONAL COMMERCE & SAC/RMA
-- Server-Side Secure Messaging, Department Routing, RBAC, Order Cards & Customer 360
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSÃO DAS TABELAS DE CHAT (THREADS & MESSAGES)
-- ----------------------------------------------------------------------------

ALTER TABLE public.chat_threads ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'suporte';
ALTER TABLE public.chat_threads ADD COLUMN IF NOT EXISTS assigned_to_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.chat_threads ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE public.chat_threads ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE public.chat_threads ADD COLUMN IF NOT EXISTS satisfaction_rating INT;
ALTER TABLE public.chat_threads ADD COLUMN IF NOT EXISTS internal_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_chat_threads_store_dept ON public.chat_threads(store_id, department);
CREATE INDEX IF NOT EXISTS idx_chat_threads_assigned ON public.chat_threads(assigned_to_profile_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_order ON public.chat_threads(order_id);

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON public.chat_messages(thread_id, message_type);

-- ----------------------------------------------------------------------------
-- 2. TABELA DE TICKETS DE SAC, TROCAS, DEVOLUÇÕES (RMA) & CONTESTAÇÕES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.store_support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES public.chat_threads(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ticket_type TEXT NOT NULL DEFAULT 'return_exchange', -- return_exchange, missing_item, defect_complaint, delivery_issue, billing_pix, other
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    photo_urls JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'open', -- open, under_review, action_required, refunded, resolved, rejected
    priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
    resolution_notes TEXT,
    refund_amount_cents BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_store ON public.store_support_tickets(store_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer ON public.store_support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_order ON public.store_support_tickets(order_id);

-- ----------------------------------------------------------------------------
-- 3. RLS POLICIES PARA CHAT & TICKETS (DENY-BY-DEFAULT)
-- ----------------------------------------------------------------------------

ALTER TABLE public.store_support_tickets ENABLE ROW LEVEL SECURITY;

-- Clientes podem visualizar e criar seus próprios tickets
CREATE POLICY "customer_support_tickets_select" ON public.store_support_tickets
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "customer_support_tickets_insert" ON public.store_support_tickets
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Membros da loja (Staff) podem visualizar e gerenciar tickets da sua loja
CREATE POLICY "store_staff_support_tickets_all" ON public.store_support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm 
            WHERE wm.store_id = store_support_tickets.store_id AND wm.profile_id = auth.uid()
        )
    );

-- Admin Master bypass
CREATE POLICY "admin_master_all_access_support_tickets" ON public.store_support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'master', 'platform_admin')
        )
    );
