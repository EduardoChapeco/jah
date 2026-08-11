-- Migration: Support Product Options in Cart Items

-- 1. Drop the unique constraint on (cart_id, variant_id) since the same variant 
-- can be added multiple times with different selected options.
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_cart_id_variant_id_key;

-- 2. Add selected_options column
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS selected_options JSONB DEFAULT NULL;

-- 3. We create a new unique constraint over cart, variant, and options so that identical configurations merge qty.
-- Since JSONB equality works in Postgres, this is safe.
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_cart_variant_options_idx 
ON public.cart_items (cart_id, variant_id, COALESCE(selected_options, '{}'::jsonb));

-- 4. Update the RPC to accept options
CREATE OR REPLACE FUNCTION public.add_to_cart_atomic_v5(
  p_store_id      UUID,
  p_customer_id   UUID,
  p_session_token UUID,
  p_seller_id     UUID,
  p_variant_id    UUID,
  p_qty           INTEGER,
  p_options       JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cart_id UUID;
  v_available INTEGER;
  v_allow_backorder BOOLEAN;
  v_existing_qty INTEGER;
  v_price_cents INTEGER;
BEGIN
  -- 1. Get or Create active Cart
  IF p_customer_id IS NOT NULL THEN
    SELECT id INTO v_cart_id FROM public.carts 
    WHERE customer_id = p_customer_id AND status = 'active'
    ORDER BY created_at DESC LIMIT 1;
  ELSE
    SELECT id INTO v_cart_id FROM public.carts 
    WHERE session_token = p_session_token AND status = 'active'
    ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF v_cart_id IS NULL THEN
    INSERT INTO public.carts (store_id, customer_id, session_token, seller_id, status)
    VALUES (p_store_id, p_customer_id, p_session_token, p_seller_id, 'active')
    RETURNING id INTO v_cart_id;
  ELSIF p_seller_id IS NOT NULL THEN
    UPDATE public.carts SET seller_id = p_seller_id WHERE id = v_cart_id AND seller_id IS DISTINCT FROM p_seller_id;
  END IF;

  -- [NEW] Acquire Transaction-Level Advisory Lock based on cart_id and variant_id
  PERFORM pg_advisory_xact_lock(hashtext(v_cart_id::text || p_variant_id::text));

  -- 2. Validate Stock Availability, Tenant Isolation, AND Variant Status
  SELECT pv.stock_on_hand, pv.allow_backorder, COALESCE(pv.price_override_cents, p.price_cents)
  INTO v_available, v_allow_backorder, v_price_cents
  FROM public.product_variants pv
  JOIN public.products p ON p.id = pv.product_id
  WHERE pv.id = p_variant_id 
    AND p.store_id = p_store_id 
    AND pv.status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variante não encontrada, inativa ou não pertence a esta loja.';
  END IF;

  -- 3. Check requested quantity across ALL matching cart items (regardless of options) to respect total stock limit
  SELECT COALESCE(SUM(qty), 0) INTO v_existing_qty
  FROM public.cart_items
  WHERE cart_id = v_cart_id AND variant_id = p_variant_id;

  IF (v_existing_qty + p_qty) > v_available AND NOT COALESCE(v_allow_backorder, false) THEN
    RAISE EXCEPTION 'Estoque insuficiente para esta variação.';
  END IF;

  -- 4. Upsert (Insert or Update) based on exact option match
  INSERT INTO public.cart_items (cart_id, variant_id, qty, price_snapshot_cents, selected_options)
  VALUES (v_cart_id, p_variant_id, p_qty, v_price_cents, p_options)
  ON CONFLICT (cart_id, variant_id, COALESCE(selected_options, '{}'::jsonb))
  DO UPDATE SET
    qty = cart_items.qty + EXCLUDED.qty,
    price_snapshot_cents = EXCLUDED.price_snapshot_cents,
    updated_at = now();

  -- 5. Return the cart_id to the caller
  RETURN v_cart_id;
END;
$$;
