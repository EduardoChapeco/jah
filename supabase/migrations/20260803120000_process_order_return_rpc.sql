-- ============================================================================
-- Jah Commerce — Migration: process_order_return RPC (RMA)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_order_return(
    p_store_id UUID,
    p_user_id UUID, -- seller or admin
    p_order_id UUID,
    p_items JSONB, -- Array of { "order_item_id": "uuid", "qty": int, "reason": "text", "restock": boolean }
    p_refund_amount_cents INTEGER,
    p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_customer_id UUID;
    v_rma_id UUID;
    v_item JSONB;
    v_order_item RECORD;
    v_variant_id UUID;
    v_qty_to_return INTEGER;
    v_restock BOOLEAN;
BEGIN
    -- 1. Validate order
    SELECT id, customer_id INTO v_order
    FROM public.orders
    WHERE id = p_order_id AND store_id = p_store_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pedido não encontrado na loja.';
    END IF;
    
    v_customer_id := v_order.customer_id;

    -- 2. Create RMA Request
    INSERT INTO public.rma_requests (
        store_id, customer_id, order_id, type, status, resolution, refund_amount_cents, notes
    ) VALUES (
        p_store_id, v_customer_id, p_order_id, 'return', 'resolved', 'refund', p_refund_amount_cents, p_notes
    ) RETURNING id INTO v_rma_id;

    -- 3. Process each item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_qty_to_return := (v_item->>'qty')::INTEGER;
        v_restock := (v_item->>'restock')::BOOLEAN;

        SELECT * INTO v_order_item
        FROM public.order_items
        WHERE id = (v_item->>'order_item_id')::UUID AND order_id = p_order_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Item do pedido não encontrado: %', v_item->>'order_item_id';
        END IF;

        IF v_qty_to_return <= 0 OR v_qty_to_return > v_order_item.qty THEN
            RAISE EXCEPTION 'Quantidade inválida para retorno no item %', v_order_item.id;
        END IF;

        -- Create RMA Item
        INSERT INTO public.rma_items (
            rma_id, order_item_id, qty, reason
        ) VALUES (
            v_rma_id, v_order_item.id, v_qty_to_return, v_item->>'reason'
        );

        -- Restock if requested
        IF v_restock THEN
            v_variant_id := v_order_item.variant_id;
            
            -- Increment stock
            UPDATE public.product_variants
            SET stock_quantity = COALESCE(stock_quantity, 0) + v_qty_to_return
            WHERE id = v_variant_id AND store_id = p_store_id;

            -- Log adjustment
            INSERT INTO public.inventory_adjustments_log (
                store_id, employee_id, variant_id, qty_adjusted, reason, notes
            ) VALUES (
                p_store_id, p_user_id, v_variant_id, v_qty_to_return, 'rma_restock', 'Reestocagem via RMA: ' || v_rma_id::text
            );
        END IF;
    END LOOP;

    -- 4. Update Order Status
    UPDATE public.orders
    SET status = 'returned',
        updated_at = NOW()
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'status', 'success',
        'rma_id', v_rma_id
    );
END;
$$;
