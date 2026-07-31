
-- ============================================================================
-- Jah Commerce — Refatoração de Identidade e Tenancy
-- ============================================================================

BEGIN;

-- 1. Create workspace_members pivot table
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('owner','admin','manager','seller','stock','finance','content','support','customer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, store_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- 2. Migrate existing profiles to workspace_members (where store_id is not null)
INSERT INTO public.workspace_members (profile_id, store_id, role, created_at, updated_at)
SELECT id, store_id, role, created_at, updated_at
FROM public.profiles
WHERE store_id IS NOT NULL
ON CONFLICT (profile_id, store_id) DO NOTHING;

-- 3. Replace is_store_staff function to use workspace_members instead of profiles
CREATE OR REPLACE FUNCTION public.is_store_staff(target_store_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.workspace_members
  WHERE profile_id = auth.uid()
    AND store_id = target_store_id
    AND role != 'customer';
  
  RETURN v_count > 0;
END;
$$;

-- 4. Helper function for specific roles
CREATE OR REPLACE FUNCTION public.has_workspace_role(target_store_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.workspace_members
  WHERE profile_id = auth.uid()
    AND store_id = target_store_id
    AND role = ANY(allowed_roles);
  
  RETURN v_count > 0;
END;
$$;

-- 5. Drop policies that depend on profiles.store_id or profiles.role
DROP POLICY IF EXISTS "product_types_staff_read" ON public.product_types;
DROP POLICY IF EXISTS "product_types_manager_write" ON public.product_types;
DROP POLICY IF EXISTS "categories_staff_write" ON public.categories;
DROP POLICY IF EXISTS "products_staff_read" ON public.products;
DROP POLICY IF EXISTS "products_staff_write" ON public.products;
DROP POLICY IF EXISTS "stock_movements_staff_read" ON public.stock_movements;
DROP POLICY IF EXISTS "orders_staff_read" ON public.orders;
DROP POLICY IF EXISTS "orders_staff_update" ON public.orders;
DROP POLICY IF EXISTS "payments_staff_read" ON public.payments;
DROP POLICY IF EXISTS "pages_staff_all" ON public.pages;
DROP POLICY IF EXISTS "reviews_staff_all" ON public.reviews;
DROP POLICY IF EXISTS "shipping_options_staff_all" ON public.shipping_options;
DROP POLICY IF EXISTS "customers_crm_staff_all" ON public.customers_crm;
DROP POLICY IF EXISTS "exchanges_staff_all" ON public.exchanges;
DROP POLICY IF EXISTS "cash_registers_staff_all" ON public.cash_registers;
DROP POLICY IF EXISTS "cash_register_entries_staff_all" ON public.cash_register_entries;
DROP POLICY IF EXISTS "commissions_management_all" ON public.commissions;
DROP POLICY IF EXISTS "giftcards_staff_select" ON public.gift_cards;
DROP POLICY IF EXISTS "giftcards_management_all" ON public.gift_cards;
DROP POLICY IF EXISTS "installment_plans_staff_all" ON public.installment_plans;
DROP POLICY IF EXISTS "installments_staff_all" ON public.installments;
DROP POLICY IF EXISTS "collections_staff_write" ON public.collections;
DROP POLICY IF EXISTS "theme_settings_staff_write" ON public.theme_settings;
DROP POLICY IF EXISTS "navigation_menus_staff_write" ON public.navigation_menus;
DROP POLICY IF EXISTS "link_in_bio_staff_write" ON public.link_in_bio;
DROP POLICY IF EXISTS "stories_staff_write" ON public.stories;
DROP POLICY IF EXISTS "chat_threads_staff_all" ON public.chat_threads;
DROP POLICY IF EXISTS "chat_messages_staff_all" ON public.chat_messages;
DROP POLICY IF EXISTS "coupons_staff_all" ON public.coupons;
DROP POLICY IF EXISTS "shipping_zones_staff_all" ON public.shipping_zones;
DROP POLICY IF EXISTS "shipping_rates_staff_all" ON public.shipping_rates;
DROP POLICY IF EXISTS "integrations_owner_all" ON public.integration_credentials;

-- 6. Drop columns from profiles
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS store_id CASCADE,
  DROP COLUMN IF EXISTS organization_id CASCADE,
  DROP COLUMN IF EXISTS role CASCADE;

-- 7. Recreate modified policies
CREATE POLICY "product_types_staff_read" ON public.product_types FOR SELECT
  USING (
    public.is_store_staff(store_id)
  );
CREATE POLICY "product_types_manager_write" ON public.product_types FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'content'])
  );
CREATE POLICY "categories_staff_write" ON public.categories FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'content'])
  );
CREATE POLICY "products_staff_read" ON public.products FOR SELECT
  USING (
    public.is_store_staff(store_id)
  );
CREATE POLICY "products_staff_write" ON public.products FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'content'])
  );
CREATE POLICY "stock_movements_staff_read" ON public.stock_movements FOR SELECT
  USING (
    public.is_store_staff(store_id)
  );
CREATE POLICY "orders_staff_read" ON public.orders FOR SELECT
  USING (
    public.is_store_staff(store_id)
  );
CREATE POLICY "orders_staff_update" ON public.orders FOR UPDATE
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'seller'])
  );
CREATE POLICY "payments_staff_read" ON public.payments FOR SELECT
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'finance'])
  );
CREATE POLICY "pages_staff_all" ON public.pages FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'content'])
  );
CREATE POLICY "reviews_staff_all" ON public.reviews FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'content'])
  );
CREATE POLICY "shipping_options_staff_all" ON public.shipping_options FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager'])
  );
CREATE POLICY "customers_crm_staff_all" ON public.customers_crm FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'seller'])
  );
CREATE POLICY "exchanges_staff_all" ON public.exchanges FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'seller', 'finance'])
  );
CREATE POLICY "cash_registers_staff_all" ON public.cash_registers FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'seller', 'finance'])
  );
CREATE POLICY "cash_register_entries_staff_all" ON public.cash_register_entries FOR ALL
  USING (
    register_id IN (
      SELECT id FROM public.cash_registers WHERE public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'seller', 'finance'])
    )
  );
CREATE POLICY "commissions_management_all" ON public.commissions FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'finance'])
  );
CREATE POLICY "giftcards_staff_select" ON public.gift_cards FOR SELECT
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'seller', 'finance'])
  );
CREATE POLICY "giftcards_management_all" ON public.gift_cards FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'finance'])
  );
CREATE POLICY "installment_plans_staff_all" ON public.installment_plans FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'seller', 'finance'])
  );
CREATE POLICY "installments_staff_all" ON public.installments FOR ALL
  USING (
    plan_id IN (
      SELECT id FROM public.installment_plans WHERE public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'seller', 'finance'])
    )
  );
CREATE POLICY "collections_staff_write" ON public.collections FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'content'])
  );
CREATE POLICY "theme_settings_staff_write" ON public.theme_settings FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'content'])
  );
CREATE POLICY "navigation_menus_staff_write" ON public.navigation_menus FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'content'])
  );
CREATE POLICY "link_in_bio_staff_write" ON public.link_in_bio FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'content'])
  );
CREATE POLICY "stories_staff_write" ON public.stories FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'content'])
  );
CREATE POLICY "chat_threads_staff_all" ON public.chat_threads FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'seller'])
  );
CREATE POLICY "chat_messages_staff_all" ON public.chat_messages FOR ALL
  USING (
    thread_id IN (
      SELECT id FROM public.chat_threads WHERE public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'seller'])
    )
  );
CREATE POLICY "coupons_staff_all" ON public.coupons FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager', 'finance'])
  );
CREATE POLICY "shipping_zones_staff_all" ON public.shipping_zones FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager'])
  );
CREATE POLICY "shipping_rates_staff_all" ON public.shipping_rates FOR ALL
  USING (
    zone_id IN (
      SELECT id FROM public.shipping_zones WHERE public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager'])
    )
  );
CREATE POLICY "integrations_owner_all" ON public.integration_credentials FOR ALL
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "profiles_read_staff" ON public.profiles;
DROP POLICY IF EXISTS "profiles_store_read" ON public.profiles;

CREATE POLICY "profiles_read_staff" ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.profile_id = profiles.id
      AND public.is_store_staff(wm.store_id)
  )
  OR
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.customer_id = profiles.id
      AND public.is_store_staff(orders.store_id)
  )
);

-- ============================================================================
-- 8. Fix handle_new_user trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_count INTEGER;
  default_org_id UUID;
  default_store_id UUID;
  user_role TEXT;
BEGIN
  -- Count how many 'owner' profiles exist globally (now in workspace_members)
  SELECT count(*) INTO v_admin_count FROM public.workspace_members WHERE role = 'owner';
  
  IF v_admin_count < 2 THEN
    user_role := 'owner';
    
    SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'jah-org' LIMIT 1;
    IF default_org_id IS NULL THEN
      INSERT INTO public.organizations (name, slug) VALUES ('Jah Organization', 'jah-org') RETURNING id INTO default_org_id;
    END IF;
    
    SELECT id INTO default_store_id FROM public.stores WHERE slug = 'jah' AND organization_id = default_org_id LIMIT 1;
    IF default_store_id IS NULL THEN
      INSERT INTO public.stores (organization_id, name, slug) VALUES (default_org_id, 'Jah', 'jah') RETURNING id INTO default_store_id;
    END IF;
  ELSE
    SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'jah-org' LIMIT 1;
    SELECT id INTO default_store_id FROM public.stores WHERE slug = 'jah' AND organization_id = default_org_id LIMIT 1;
    user_role := 'customer';
  END IF;

  -- Create the public profiles entry (without tenant info)
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'full_name', '')
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Create the workspace member entry
  IF default_store_id IS NOT NULL THEN
    INSERT INTO public.workspace_members (profile_id, store_id, role)
    VALUES (NEW.id, default_store_id, user_role)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- ============================================================================
-- 9. Fix execute_hard_refresh RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.execute_hard_refresh(p_confirm_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store_id UUID;
  v_role TEXT;
  v_total_orders INT;
  v_total_products INT;
  v_total_customers INT;
BEGIN
  -- 1. Authorization
  SELECT store_id, role INTO v_store_id, v_role
  FROM public.workspace_members
  WHERE profile_id = auth.uid() AND role = 'owner' LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado. Apenas proprietários da loja (owner) podem executar um reset.';
  END IF;

  -- 2. Validation
  IF p_confirm_text != 'LIMPAR-TUDO-AGORA' THEN
    RAISE EXCEPTION 'Confirmação incorreta.';
  END IF;

  -- Collect stats before deletion
  SELECT COUNT(*) INTO v_total_orders FROM public.orders WHERE store_id = v_store_id;
  SELECT COUNT(*) INTO v_total_products FROM public.products WHERE store_id = v_store_id;
  SELECT COUNT(*) INTO v_total_customers FROM public.workspace_members WHERE store_id = v_store_id AND role = 'customer';

  -- Disable trigger to avoid updated_at errors during mass delete
  ALTER TABLE public.orders DISABLE TRIGGER orders_updated_at;
  
  -- Cascade delete order items via orders
  DELETE FROM public.orders WHERE store_id = v_store_id;
  
  -- Delete all products (cascades to variants, inventory)
  DELETE FROM public.products WHERE store_id = v_store_id;
  
  -- Delete all categories
  DELETE FROM public.categories WHERE store_id = v_store_id;
  
  ALTER TABLE public.orders ENABLE TRIGGER orders_updated_at;

  -- Delete all customer roles (keep staff)
  DELETE FROM public.workspace_members WHERE store_id = v_store_id AND role = 'customer';

  -- Audit Log
  INSERT INTO public.system_wipe_logs (actor_id, store_id, details)
  VALUES (
    auth.uid(),
    v_store_id,
    jsonb_build_object(
      'orders_deleted', v_total_orders,
      'products_deleted', v_total_products,
      'customers_deleted', v_total_customers
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Dados da loja limpos com sucesso.',
    'orders_deleted', v_total_orders,
    'products_deleted', v_total_products,
    'customers_deleted', v_total_customers
  );
END;
$$;

COMMIT;
