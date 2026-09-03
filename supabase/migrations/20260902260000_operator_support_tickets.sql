-- ==============================================================================
-- MIGRAÇÃO: HELPDESK & TICKETS DE SUPORTE DO OPERADOR
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.operator_support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ticket_number SERIAL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other',
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_store ON public.operator_support_tickets(store_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.operator_support_tickets(status);

CREATE TABLE IF NOT EXISTS public.operator_support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.operator_support_tickets(id) ON DELETE CASCADE,
    sender_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_staff_reply BOOLEAN NOT NULL DEFAULT false,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.operator_support_messages(ticket_id);

-- RLS
ALTER TABLE public.operator_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members manage support tickets"
    ON public.operator_support_tickets
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

CREATE POLICY "Store members manage support messages"
    ON public.operator_support_messages
    FOR ALL
    TO authenticated
    USING (
        ticket_id IN (
            SELECT id FROM public.operator_support_tickets WHERE store_id IN (
                SELECT store_id FROM public.workspace_members WHERE profile_id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin')
        )
    );
