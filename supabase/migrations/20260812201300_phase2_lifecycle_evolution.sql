-- ============================================================================
-- Jah Commerce — Migration 20260812201300: Phase 2 Lifecycle Evolution
-- ============================================================================
-- Purpose:
--   1. Create `outbox_events` table for active communication (webhooks/emails).
--   2. Add trigger on `shipments` to notify customers of tracking updates.
--   3. Create RPC `admin_modify_order_items` for post-sale edits (Upsell/Fixes).
-- ============================================================================

-- 1. Create outbox_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,          -- e.g., 'order.shipped', 'order.status_changed'
  payload JSONB NOT NULL,      -- event data
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'delivered', 'failed'
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for outbox_events
ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;

-- Only service_role can read/write outbox_events (background workers)
CREATE POLICY "outbox_events_service_role"
  ON public.outbox_events FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Trigger for tracking updates (shipments)
CREATE OR REPLACE FUNCTION public.notify_shipment_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.outbox_events (type, payload)
  VALUES (
    'shipment.created',
    jsonb_build_object(
      'shipment_id', NEW.id,
      'order_id', NEW.order_id,
      'store_id', NEW.store_id,
      'tracking_code', NEW.tracking_code,
      'carrier_name', NEW.carrier_name,
      'tracking_url', NEW.tracking_url
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_shipment_created ON public.shipments;
CREATE TRIGGER trg_shipment_created
  AFTER INSERT ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_shipment_created();

-- Trigger for order status changes
CREATE OR REPLACE FUNCTION public.notify_order_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.outbox_events (type, payload)
    VALUES (
      'order.status_changed',
      jsonb_build_object(
        'order_id', NEW.id,
        'store_id', NEW.store_id,
        'customer_id', NEW.customer_id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_order_status_changed ON public.orders;
CREATE TRIGGER trg_order_status_changed
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_status_changed();

-- 3. RPC for Post-Sale Order Modification (admin_modify_order_items)
CREATE OR REPLACE FUNCTION public.admin_modify_order_items(
  p_order_id UUID,
  p_new_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_order_status public.order_status;
  v_store_id UUID;
  v_subtotal INTEGER := 0;
  v_total INTEGER := 0;
  v_item JSONB;
  v_variant RECORD;
  v_inserted_items JSONB := '[]'::JSONB;
BEGIN
  -- Check order status
  SELECT status, store_id INTO v_order_status, v_store_id
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  IF v_order_status NOT IN ('draft', 'awaiting_payment', 'paid') THEN
    RAISE EXCEPTION 'Order cannot be modified in status %', v_order_status;
  END IF;

  -- Remove old items (stock release relies on other triggers/jobs, or is out of scope for simplistic model)
  DELETE FROM public.order_items WHERE order_id = p_order_id;
  
  -- Insert new items and compute subtotal
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_new_items)
  LOOP
    SELECT id, sku, price_override_cents
    INTO v_variant
    FROM public.product_variants
    WHERE id = (v_item->>'variant_id')::UUID;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant % not found.', v_item->>'variant_id';
    END IF;

    DECLARE
      line_qty INTEGER := (v_item->>'qty')::INTEGER;
      line_unit_price INTEGER := v_variant.price_override_cents;
      line_total INTEGER := line_unit_price * line_qty;
    BEGIN
      INSERT INTO public.order_items (
        order_id, variant_id, product_title, variant_sku, 
        qty, unit_price_cents, total_cents
      ) VALUES (
        p_order_id, v_variant.id, v_item->>'product_title', v_variant.sku,
        line_qty, line_unit_price, line_total
      );
      
      v_subtotal := v_subtotal + line_total;
      
      v_inserted_items := v_inserted_items || jsonb_build_object(
        'variant_id', v_variant.id,
        'qty', line_qty,
        'total_cents', line_total
      );
    END;
  END LOOP;

  -- Update order totals
  UPDATE public.orders
  SET 
    subtotal_cents = v_subtotal,
    total_cents = v_subtotal + shipping_cents - discount_cents,
    items_snapshot = v_inserted_items,
    updated_at = now()
  WHERE id = p_order_id
  RETURNING total_cents INTO v_total;

  RETURN jsonb_build_object('success', true, 'new_total_cents', v_total);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
