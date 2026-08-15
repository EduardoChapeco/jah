-- Migration: Fix process_pos_sale_transaction for Phase 4 schemas
-- Drops the old function and recreates it with the correct table columns.

DROP FUNCTION IF EXISTS public.process_pos_sale_transaction(UUID, UUID, UUID, TEXT, UUID, TEXT, INTEGER, JSONB, TEXT);

CREATE OR REPLACE FUNCTION public.process_pos_sale_transaction(
  p_register_id UUID,
  p_store_id UUID,
  p_seller_id UUID,
  p_customer_name TEXT,
  p_customer_id UUID,
  p_payment_method TEXT,
  p_discount_cents INTEGER,
  p_items JSONB,
  p_idempotency_key TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_register RECORD;
  v_item RECORD;
  v_subtotal_cents INTEGER := 0;
  v_total_cents INTEGER := 0;
  v_order_id UUID;
  v_order_public_token TEXT;
  v_items_snapshot JSONB := '[]'::JSONB;
  v_payment_method_db TEXT;
  v_cash_entry_id UUID;
  v_has_negative_stock BOOLEAN := false;
  v_current_stock INTEGER;
  
  v_seller_rate DECIMAL(5,2);
  v_commission_amount INTEGER := 0;
BEGIN
  -- 1. Checagem de Idempotência
  SELECT o.public_token, o.id INTO v_order_public_token, v_order_id
  FROM public.payments p
  JOIN public.orders o ON o.id = p.order_id
  WHERE p.idempotency_key = p_idempotency_key
  LIMIT 1;
  
  IF v_order_public_token IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'success', 'orderId', v_order_id, 'orderToken', v_order_public_token, 'is_idempotent_replay', true
    );
  END IF;

  -- 2. Validação transacional do Caixa (deve estar aberto)
  SELECT * INTO v_register
  FROM public.cash_registers
  WHERE id = p_register_id AND store_id = p_store_id AND status = 'open'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caixa inválido, fechado ou não pertence a esta loja.';
  END IF;

  -- 3. Cálculo do Total e Construção de Snapshot
  FOR v_item IN (SELECT el AS item_json FROM jsonb_array_elements(p_items) AS el) LOOP
    v_subtotal_cents := v_subtotal_cents + ((v_item.item_json->>'qty')::INTEGER * (v_item.item_json->>'priceCents')::INTEGER);
    v_items_snapshot := v_items_snapshot || jsonb_build_object(
      'variant_id', v_item.item_json->>'variantId', 'qty', (v_item.item_json->>'qty')::INTEGER,
      'unit_price_cents', (v_item.item_json->>'priceCents')::INTEGER, 'total_cents', ((v_item.item_json->>'qty')::INTEGER * (v_item.item_json->>'priceCents')::INTEGER),
      'product_title', v_item.item_json->>'title', 'variant_sku', v_item.item_json->>'sku'
    );
  END LOOP;

  v_total_cents := GREATEST(0, v_subtotal_cents - COALESCE(p_discount_cents, 0));

  -- 4. Criação de Pedido do PDV (Status completed e delivered_at now() porque é entrega física de balcão)
  INSERT INTO public.orders (
    store_id, customer_id, status, items_snapshot,
    subtotal_cents, shipping_cents, discount_cents, total_cents,
    shipping_method, seller_id, paid_at, delivered_at, customer_snapshot
  ) VALUES (
    p_store_id, p_customer_id, 'completed', v_items_snapshot,
    v_subtotal_cents, 0, COALESCE(p_discount_cents, 0), v_total_cents,
    'pickup', p_seller_id, now(), now(),
    jsonb_build_object('name', COALESCE(p_customer_name, 'Cliente Avulso'))
  ) RETURNING id, public_token INTO v_order_id, v_order_public_token;

  -- 5. Inserção de order_items e baixa física de estoque
  FOR v_item IN (SELECT el AS item_json FROM jsonb_array_elements(v_items_snapshot) AS el) LOOP
    INSERT INTO public.order_items (
      order_id, variant_id, product_title, variant_sku, variant_attributes, image_url, qty, unit_price_cents, total_cents
    ) VALUES (
      v_order_id, (v_item.item_json->>'variant_id')::UUID, v_item.item_json->>'product_title', v_item.item_json->>'variant_sku', '{}'::JSONB, NULL, 
      (v_item.item_json->>'qty')::INTEGER, (v_item.item_json->>'unit_price_cents')::INTEGER, (v_item.item_json->>'total_cents')::INTEGER
    );
    
    INSERT INTO public.stock_movements (
      variant_id, store_id, movement_type, qty, reference_type, reference_id, note, actor_id
    ) VALUES (
      (v_item.item_json->>'variant_id')::UUID, p_store_id, 'sale', -1 * (v_item.item_json->>'qty')::INTEGER, 'order', v_order_id, 'PDV #' || v_order_public_token, p_seller_id
    );
    
    UPDATE public.product_variants
    SET stock_on_hand = stock_on_hand - (v_item.item_json->>'qty')::INTEGER
    WHERE id = (v_item.item_json->>'variant_id')::UUID
    RETURNING stock_on_hand INTO v_current_stock;
    
    IF v_current_stock < 0 THEN v_has_negative_stock := true; END IF;
  END LOOP;

  -- 6. Registro de Pagamento do PDV
  IF p_payment_method = 'pix' THEN v_payment_method_db := 'pix';
  ELSIF p_payment_method IN ('credit', 'debit', 'credit_card') THEN v_payment_method_db := 'credit_card';
  ELSE v_payment_method_db := 'manual'; END IF;

  INSERT INTO public.payments (
    order_id, store_id, method, status, amount_cents, idempotency_key, paid_at, provider_name
  ) VALUES (
    v_order_id, p_store_id, v_payment_method_db::public.payment_method, 'paid', v_total_cents, p_idempotency_key, now(), 'PDV Balcão'
  );

  -- 7. Lançamento no Fluxo de Caixa Físico (Updated for Phase 4 schemas)
  INSERT INTO public.cash_register_entries (
    cash_register_id, order_id, amount_cents, entry_type, payment_method, notes, created_by
  ) VALUES (
    p_register_id, v_order_id, v_total_cents, 'sale', p_payment_method,
    'Venda PDV (' || COALESCE(p_customer_name, 'Cliente Avulso') || ') - Pedido: ' || v_order_public_token,
    p_seller_id
  ) RETURNING id INTO v_cash_entry_id;

  -- 8. Motor de Comissões (Updated for Phase 4 schemas)
  IF p_seller_id IS NOT NULL AND v_total_cents > 0 THEN
    SELECT commission_rate INTO v_seller_rate FROM public.profiles WHERE id = p_seller_id;
    IF v_seller_rate IS NOT NULL AND v_seller_rate > 0 THEN
      v_commission_amount := floor(v_total_cents * (v_seller_rate / 100.0))::INTEGER;
      
      INSERT INTO public.commissions (
        store_id, order_id, employee_id, commission_base_cents, commission_rate_percent, commission_amount_cents, status
      ) VALUES (
        p_store_id, v_order_id, p_seller_id, v_total_cents, v_seller_rate, v_commission_amount, 'pending'
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'status', 'success', 'receiptId', v_cash_entry_id, 'orderId', v_order_id,
    'orderToken', v_order_public_token, 'subtotalCents', v_subtotal_cents,
    'discountCents', COALESCE(p_discount_cents, 0), 'totalCents', v_total_cents,
    'hasNegativeStock', v_has_negative_stock, 'is_idempotent_replay', false
  );
END;
$$;
