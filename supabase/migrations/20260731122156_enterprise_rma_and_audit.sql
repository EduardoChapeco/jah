-- ============================================================================
-- Jah Commerce — Migration: Enterprise RMA, Audit & HR
-- ============================================================================

-- 1. Create RMA Requests table (replaces basic exchanges)
CREATE TABLE IF NOT EXISTS public.rma_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id),
    order_id UUID NOT NULL REFERENCES public.orders(id),
    
    type TEXT NOT NULL CHECK (type IN ('exchange', 'return', 'warranty')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'shipped_back', 'received', 'inspected', 'resolved', 'rejected')),
    resolution TEXT CHECK (resolution IN ('store_credit', 'refund', 'replacement')),
    
    shipping_responsibility TEXT CHECK (shipping_responsibility IN ('store', 'customer')),
    shipping_cost_cents INTEGER DEFAULT 0,
    refund_amount_cents INTEGER DEFAULT 0,
    
    expires_at TIMESTAMPTZ, -- Deadline for the customer to ship back
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create RMA Items table (specific products being returned)
CREATE TABLE IF NOT EXISTS public.rma_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rma_id UUID NOT NULL REFERENCES public.rma_requests(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES public.order_items(id),
    
    qty INTEGER NOT NULL CHECK (qty > 0),
    reason TEXT NOT NULL,
    condition TEXT,
    photos_jsonb JSONB DEFAULT '[]'::JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create Inventory Adjustments Log
CREATE TABLE IF NOT EXISTS public.inventory_adjustments_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES auth.users(id),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id),
    
    qty_adjusted INTEGER NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('rma_restock', 'rma_damaged', 'supplier_return', 'loss', 'correction', 'pos_sale')),
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Employee Financial Records (Payroll & Advances)
CREATE TABLE IF NOT EXISTS public.employee_financial_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES auth.users(id),
    authorized_by UUID REFERENCES auth.users(id),
    
    type TEXT NOT NULL CHECK (type IN ('advance_payment', 'salary', 'commission_payout')),
    amount_cents INTEGER NOT NULL,
    description TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Universal Audit Logs (Immutable)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    payload_snapshot JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Ticketing System (Omnichannel Helpdesk)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id),
    assigned_employee_id UUID REFERENCES auth.users(id),
    
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
    context_type TEXT CHECK (context_type IN ('order', 'rma', 'general')),
    context_id UUID,
    subject TEXT NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id), -- Can be customer or employee
    
    content TEXT NOT NULL,
    attachments_jsonb JSONB DEFAULT '[]'::JSONB,
    is_internal_note BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- Enable RLS & Base Policies (Secure by Default)
-- We use the identity-pivot strategy (BFF + Server Functions) so we can keep
-- the DB highly restrictive to anon/authenticated client connections.
-- ============================================================================

ALTER TABLE public.rma_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rma_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustments_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Customers can view their own RMA requests
CREATE POLICY "Customers can view own RMA requests" ON public.rma_requests
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can view own RMA items" ON public.rma_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.rma_requests r
            WHERE r.id = rma_items.rma_id AND r.customer_id = auth.uid()
        )
    );

-- Customers can view their own Tickets and send messages
CREATE POLICY "Customers can view own tickets" ON public.support_tickets
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can view ticket messages" ON public.ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets t
            WHERE t.id = ticket_messages.ticket_id AND t.customer_id = auth.uid()
        ) AND is_internal_note = false
    );

-- Employees and Staff access is handled via Server Functions & RPCs
-- bypassing RLS using service_role or SECURITY DEFINER functions.
-- Therefore, we don't need complex cyclical RLS policies here!

-- Migrate legacy exchanges to rma_requests (if any exist)
INSERT INTO public.rma_requests (id, store_id, customer_id, order_id, type, status, refund_amount_cents, requested_at, created_at, updated_at)
SELECT 
    id, store_id, customer_id, order_id, 
    'exchange', 
    CASE 
        WHEN status = 'requested' THEN 'pending'
        WHEN status = 'approved' THEN 'authorized'
        WHEN status = 'rejected' THEN 'rejected'
        WHEN status = 'refunded' THEN 'resolved'
        ELSE 'pending'
    END,
    refund_amount_cents, requested_at, requested_at, now()
FROM public.exchanges
ON CONFLICT DO NOTHING;
