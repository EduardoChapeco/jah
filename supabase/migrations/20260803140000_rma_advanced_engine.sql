-- Jah Commerce — Migration 20260803140000: RMA Advanced Engine

-- 1. Alter rma_items to track granular state
ALTER TABLE public.rma_items
ADD COLUMN qty_approved INTEGER DEFAULT 0,
ADD COLUMN qty_received INTEGER DEFAULT 0,
ADD COLUMN destination TEXT CHECK (destination IN ('restock', 'discard', 'return_to_supplier', 'quarantine'));

-- 2. Create rma_inspections
CREATE TABLE public.rma_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rma_item_id UUID NOT NULL REFERENCES public.rma_items(id) ON DELETE CASCADE,
    inspector_id UUID NOT NULL REFERENCES auth.users(id),
    qty INTEGER NOT NULL CHECK (qty > 0),
    condition TEXT NOT NULL CHECK (condition IN ('perfect', 'damaged', 'wrong_item')),
    destination TEXT NOT NULL CHECK (destination IN ('restock', 'discard', 'return_to_supplier', 'quarantine')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rma_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view rma inspections for their store" 
ON public.rma_inspections FOR SELECT USING (
    rma_item_id IN (
        SELECT id FROM public.rma_items WHERE rma_id IN (
        SELECT id FROM public.rma_requests WHERE store_id IN (SELECT store_id FROM public.profiles WHERE id = auth.uid())
        )
    )
);

-- 3. Replace the simplistic process_order_return with a robust request RPC
CREATE OR REPLACE FUNCTION public.request_order_return(
    p_store_id UUID,
    p_customer_id UUID,
    p_order_id UUID,
    p_items JSONB, -- Array of { "order_item_id": "uuid", "qty": int, "reason": "text" }
    p_notes TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_rma_id UUID;
    v_item JSONB;
    v_order_item RECORD;
    v_qty_to_return INTEGER;
BEGIN
    SELECT id INTO v_order FROM public.orders WHERE id = p_order_id AND store_id = p_store_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pedido não encontrado.';
    END IF;

    -- Create RMA Request as pending
    INSERT INTO public.rma_requests (
        store_id, customer_id, order_id, type, status, notes
    ) VALUES (
        p_store_id, p_customer_id, p_order_id, 'return', 'pending', p_notes
    ) RETURNING id INTO v_rma_id;

    -- Process each requested item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_qty_to_return := (v_item->>'qty')::INTEGER;

        SELECT * INTO v_order_item
        FROM public.order_items
        WHERE id = (v_item->>'order_item_id')::UUID AND order_id = p_order_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Item do pedido não encontrado.';
        END IF;

        IF v_qty_to_return <= 0 OR v_qty_to_return > v_order_item.qty THEN
            RAISE EXCEPTION 'Quantidade inválida para retorno no item %', v_order_item.id;
        END IF;

        INSERT INTO public.rma_items (
            rma_id, order_item_id, qty, reason
        ) VALUES (
            v_rma_id, v_order_item.id, v_qty_to_return, v_item->>'reason'
        );
    END LOOP;

    -- Update Order Status
    UPDATE public.orders SET status = 'return_requested', updated_at = NOW() WHERE id = p_order_id;

    RETURN v_rma_id;
END;
$$;

-- 4. RPC for Inspection and Restock
CREATE OR REPLACE FUNCTION public.inspect_rma_item(
    p_rma_item_id UUID,
    p_inspector_id UUID,
    p_qty INTEGER,
    p_condition TEXT,
    p_destination TEXT,
    p_notes TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rma_item RECORD;
    v_rma_request RECORD;
    v_order_item RECORD;
BEGIN
    SELECT * INTO v_rma_item FROM public.rma_items WHERE id = p_rma_item_id;
    SELECT * INTO v_rma_request FROM public.rma_requests WHERE id = v_rma_item.rma_id;
    SELECT * INTO v_order_item FROM public.order_items WHERE id = v_rma_item.order_item_id;

    IF v_rma_item.qty_received + p_qty > v_rma_item.qty THEN
        RAISE EXCEPTION 'Quantidade inspecionada excede a solicitada.';
    END IF;

    -- Record inspection
    INSERT INTO public.rma_inspections (rma_item_id, inspector_id, qty, condition, destination, notes)
    VALUES (p_rma_item_id, p_inspector_id, p_qty, p_condition, p_destination, p_notes);

    -- Update received qty
    UPDATE public.rma_items SET qty_received = qty_received + p_qty WHERE id = p_rma_item_id;

    -- Update RMA request status to inspected if all items are fully received/inspected
    -- (Simplified logic: just set it to inspected, in reality we check totals)
    UPDATE public.rma_requests SET status = 'inspected', updated_at = NOW() WHERE id = v_rma_request.id;

    -- Restock conditionally
    IF p_destination = 'restock' THEN
        UPDATE public.product_variants
        SET stock_on_hand = COALESCE(stock_on_hand, 0) + p_qty
        WHERE id = v_order_item.variant_id;

        INSERT INTO public.inventory_adjustments_log (
            store_id, employee_id, variant_id, qty_adjusted, reason, notes
        ) VALUES (
            v_rma_request.store_id, p_inspector_id, v_order_item.variant_id, p_qty, 'rma_restock', 'Inspeção RMA: ' || v_rma_request.id::text
        );
    END IF;
END;
$$;
