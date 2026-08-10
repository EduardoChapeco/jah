-- Jah Commerce — Migration 20260803130000: WMS Picking Audit and Enforcement

-- 1. Create wms_picking_sessions
CREATE TABLE public.wms_picking_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id),
    order_id UUID NOT NULL REFERENCES public.orders(id),
    operator_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'cancelled')) DEFAULT 'in_progress',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT wms_picking_sessions_single_active UNIQUE (order_id, status) -- Prevent multiple active sessions for same order (if status is not cancelled or completed)
);
-- We use a partial unique index for 'in_progress' to truly prevent concurrent active sessions.
CREATE UNIQUE INDEX idx_wms_picking_sessions_active ON public.wms_picking_sessions (order_id) WHERE status = 'in_progress';

-- 2. Create wms_picking_items
CREATE TABLE public.wms_picking_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.wms_picking_sessions(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES public.order_items(id),
    qty_expected INTEGER NOT NULL,
    qty_picked INTEGER NOT NULL DEFAULT 0,
    picked_at TIMESTAMPTZ,
    missing_reason TEXT,
    CONSTRAINT wms_picking_items_unique_item UNIQUE (session_id, order_item_id)
);

-- RLS
ALTER TABLE public.wms_picking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wms_picking_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view picking sessions for their store" 
ON public.wms_picking_sessions FOR SELECT USING (
    store_id IN (SELECT store_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Staff can view picking items for their store" 
ON public.wms_picking_items FOR SELECT USING (
    session_id IN (SELECT id FROM public.wms_picking_sessions WHERE store_id IN (SELECT store_id FROM public.profiles WHERE id = auth.uid()))
);

-- Note: Mutations will be done via RPC or Service Role from the BFF.

-- 3. RPC: Start Picking Session
-- Returns existing active session or creates a new one, populating expected items.
CREATE OR REPLACE FUNCTION public.start_wms_picking(
    p_order_id UUID,
    p_operator_id UUID,
    p_store_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id UUID;
    v_order_status TEXT;
BEGIN
    -- Validate order
    SELECT status INTO v_order_status FROM public.orders WHERE id = p_order_id AND store_id = p_store_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pedido não encontrado.';
    END IF;

    IF v_order_status NOT IN ('paid', 'processing') THEN
        RAISE EXCEPTION 'O pedido deve estar pago ou em processamento para iniciar a separação.';
    END IF;

    -- Check if there's already an active session
    SELECT id INTO v_session_id FROM public.wms_picking_sessions 
    WHERE order_id = p_order_id AND status = 'in_progress';

    IF FOUND THEN
        RETURN v_session_id; -- Resume existing session
    END IF;

    -- Start new session
    INSERT INTO public.wms_picking_sessions (store_id, order_id, operator_id)
    VALUES (p_store_id, p_order_id, p_operator_id)
    RETURNING id INTO v_session_id;

    -- Populate items
    INSERT INTO public.wms_picking_items (session_id, order_item_id, qty_expected)
    SELECT v_session_id, id, qty
    FROM public.order_items
    WHERE order_id = p_order_id;

    RETURN v_session_id;
END;
$$;

-- 4. RPC: Pick Item
CREATE OR REPLACE FUNCTION public.pick_wms_item(
    p_session_id UUID,
    p_order_item_id UUID,
    p_qty INTEGER
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT status INTO v_status FROM public.wms_picking_sessions WHERE id = p_session_id;
    IF v_status != 'in_progress' THEN
        RAISE EXCEPTION 'Sessão de separação não está ativa.';
    END IF;

    UPDATE public.wms_picking_items
    SET qty_picked = qty_picked + p_qty,
        picked_at = now()
    WHERE session_id = p_session_id AND order_item_id = p_order_item_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item não encontrado nesta sessão de separação.';
    END IF;
END;
$$;

-- 5. RPC: Complete Picking
CREATE OR REPLACE FUNCTION public.complete_wms_picking(
    p_session_id UUID,
    p_operator_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_unpicked_count INTEGER;
BEGIN
    SELECT * INTO v_session FROM public.wms_picking_sessions WHERE id = p_session_id;
    
    IF v_session.status != 'in_progress' THEN
        RAISE EXCEPTION 'Sessão já está %', v_session.status;
    END IF;

    -- Verify that all items are picked matching expected quantities
    SELECT COUNT(*) INTO v_unpicked_count
    FROM public.wms_picking_items
    WHERE session_id = p_session_id AND qty_picked < qty_expected;

    IF v_unpicked_count > 0 THEN
        RAISE EXCEPTION 'Existem % itens pendentes de conferência. O despacho está bloqueado.', v_unpicked_count;
    END IF;

    -- Transition the order status securely
    UPDATE public.orders
    SET status = 'shipped', updated_at = now()
    WHERE id = v_session.order_id AND status IN ('paid', 'processing');

    -- Close the session
    UPDATE public.wms_picking_sessions
    SET status = 'completed', completed_at = now()
    WHERE id = p_session_id;
END;
$$;
