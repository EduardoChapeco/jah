-- Migration: Atomic order confirmation and stock deduction

CREATE OR REPLACE FUNCTION public.confirm_order_and_deduct_stock(
  p_order_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status VARCHAR;
  v_item RECORD;
BEGIN
  -- 1. Lock the order to prevent concurrent updates
  SELECT status INTO v_current_status
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- 2. Idempotency check: if already processing or fulfilled, return true
  IF v_current_status IN ('processing', 'shipped', 'delivered', 'fulfilled') THEN
    RETURN TRUE;
  END IF;

  IF v_current_status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot confirm a cancelled order';
  END IF;

  -- 3. Deduct stock for each item
  FOR v_item IN (SELECT variant_id, qty FROM public.order_items WHERE order_id = p_order_id) LOOP
    UPDATE public.product_variants
    SET stock_on_hand = stock_on_hand - v_item.qty
    WHERE id = v_item.variant_id;
  END LOOP;

  -- 4. Update order status
  UPDATE public.orders
  SET status = 'processing', updated_at = now()
  WHERE id = p_order_id;

  RETURN TRUE;
END;
$$;
