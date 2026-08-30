-- ============================================================
-- MIGRATION: Security Hardening — RLS Deny-by-Default
-- Fase 1 Crítica: Todas as tabelas sensíveis recebem RLS.
-- Princípio: DENY ALL por padrão, permitir apenas o necessário.
-- ============================================================

-- ─────────────────────────────────────────────
-- HELPER: Função para obter o store_id ativo do usuário
-- Usada nas políticas RLS para contexto multi-tenant
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.auth_user_store_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(ARRAY(
    SELECT store_id FROM public.workspace_members
    WHERE profile_id = (SELECT auth.uid())
  ), ARRAY[]::uuid[]);
$$;

-- Helper: verificar se uid é platform_admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('platform_admin', 'master')
  );
$$;

-- Helper: verificar se uid é membro de uma store específica
CREATE OR REPLACE FUNCTION public.is_store_member(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE profile_id = (SELECT auth.uid())
      AND store_id = p_store_id
  );
$$;

-- Helper: obter role do uid numa store específica
CREATE OR REPLACE FUNCTION public.get_store_role(p_store_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.workspace_members
  WHERE profile_id = (SELECT auth.uid())
    AND store_id = p_store_id
  LIMIT 1;
$$;

-- ─────────────────────────────────────────────
-- 1. TABELA: profiles
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_platform_admin_all" ON public.profiles;

-- Qualquer um pode ver perfis básicos (marketplace público)
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

-- Usuário pode editar apenas seu próprio perfil
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);

-- Platform admin: acesso total
CREATE POLICY "profiles_platform_admin_all" ON public.profiles
  FOR ALL USING (public.is_platform_admin());

-- ─────────────────────────────────────────────
-- 2. TABELA: stores
-- ─────────────────────────────────────────────
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stores_select_public" ON public.stores;
DROP POLICY IF EXISTS "stores_update_owner" ON public.stores;
DROP POLICY IF EXISTS "stores_platform_admin_all" ON public.stores;
DROP POLICY IF EXISTS "stores_insert_authenticated" ON public.stores;
DROP POLICY IF EXISTS "stores_delete_platform_admin" ON public.stores;

-- Lojas ativas são públicas (vitrine)
CREATE POLICY "stores_select_public" ON public.stores
  FOR SELECT USING (true);

-- Apenas owner/admin da loja pode editar
CREATE POLICY "stores_update_owner" ON public.stores
  FOR UPDATE USING (
    public.is_platform_admin() OR
    public.get_store_role(id) IN ('owner', 'admin')
  );

-- Insert de loja: apenas autenticados
CREATE POLICY "stores_insert_authenticated" ON public.stores
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Delete: apenas platform_admin
CREATE POLICY "stores_delete_platform_admin" ON public.stores
  FOR DELETE USING (public.is_platform_admin());

-- ─────────────────────────────────────────────
-- 3. TABELA: workspace_members
-- ─────────────────────────────────────────────
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wm_select_own_stores" ON public.workspace_members;
DROP POLICY IF EXISTS "wm_insert_owner" ON public.workspace_members;
DROP POLICY IF EXISTS "wm_update_owner" ON public.workspace_members;
DROP POLICY IF EXISTS "wm_delete_owner" ON public.workspace_members;
DROP POLICY IF EXISTS "wm_platform_admin_all" ON public.workspace_members;

-- Membros podem ver os membros das suas próprias lojas
CREATE POLICY "wm_select_own_stores" ON public.workspace_members
  FOR SELECT USING (
    public.is_platform_admin() OR
    store_id = ANY(public.auth_user_store_ids()) OR
    profile_id = (SELECT auth.uid())
  );

-- Apenas owner da loja pode adicionar membros
CREATE POLICY "wm_insert_owner" ON public.workspace_members
  FOR INSERT WITH CHECK (
    public.is_platform_admin() OR
    public.get_store_role(store_id) IN ('owner', 'admin')
  );

-- Apenas owner pode atualizar
CREATE POLICY "wm_update_owner" ON public.workspace_members
  FOR UPDATE USING (
    public.is_platform_admin() OR
    public.get_store_role(store_id) IN ('owner', 'admin')
  );

-- Apenas owner pode remover
CREATE POLICY "wm_delete_owner" ON public.workspace_members
  FOR DELETE USING (
    public.is_platform_admin() OR
    public.get_store_role(store_id) IN ('owner', 'admin')
  );

-- ─────────────────────────────────────────────
-- 4. TABELA: orders
-- ─────────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_select_store_member" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_authenticated" ON public.orders;
DROP POLICY IF EXISTS "orders_update_store_member" ON public.orders;
DROP POLICY IF EXISTS "orders_platform_admin_all" ON public.orders;

-- Cliente vê seus pedidos; membro da loja vê pedidos da loja
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (
    public.is_platform_admin() OR
    customer_id = (SELECT auth.uid()) OR
    store_id = ANY(public.auth_user_store_ids())
  );

-- Qualquer autenticado pode criar pedido
CREATE POLICY "orders_insert_authenticated" ON public.orders
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Apenas membros da loja podem atualizar status
CREATE POLICY "orders_update_store_member" ON public.orders
  FOR UPDATE USING (
    public.is_platform_admin() OR
    store_id = ANY(public.auth_user_store_ids())
  );

-- ─────────────────────────────────────────────
-- 5. TABELA: order_items
-- ─────────────────────────────────────────────
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_store" ON public.order_items;

CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT USING (
    public.is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (o.customer_id = (SELECT auth.uid()) OR o.store_id = ANY(public.auth_user_store_ids()))
    )
  );

CREATE POLICY "order_items_insert" ON public.order_items
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "order_items_update_store" ON public.order_items
  FOR UPDATE USING (
    public.is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.store_id = ANY(public.auth_user_store_ids())
    )
  );

-- ─────────────────────────────────────────────
-- 6. TABELA: payments
-- ─────────────────────────────────────────────
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select" ON public.payments;
DROP POLICY IF EXISTS "payments_insert" ON public.payments;
DROP POLICY IF EXISTS "payments_update" ON public.payments;
DROP POLICY IF EXISTS "payments_update_admin" ON public.payments;

CREATE POLICY "payments_select" ON public.payments
  FOR SELECT USING (
    public.is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (o.customer_id = (SELECT auth.uid()) OR o.store_id = ANY(public.auth_user_store_ids()))
    )
  );

CREATE POLICY "payments_insert" ON public.payments
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "payments_update_admin" ON public.payments
  FOR UPDATE USING (public.is_platform_admin());

-- ─────────────────────────────────────────────
-- 7. TABELA: financial_transactions
-- ─────────────────────────────────────────────
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fin_txn_select" ON public.financial_transactions;
DROP POLICY IF EXISTS "fin_txn_insert" ON public.financial_transactions;
DROP POLICY IF EXISTS "fin_txn_insert_admin" ON public.financial_transactions;

CREATE POLICY "fin_txn_select" ON public.financial_transactions
  FOR SELECT USING (
    public.is_platform_admin() OR
    store_id = ANY(public.auth_user_store_ids())
  );

CREATE POLICY "fin_txn_insert_admin" ON public.financial_transactions
  FOR INSERT WITH CHECK (public.is_platform_admin());

-- ─────────────────────────────────────────────
-- 8. TABELA: secret_vault (MÁXIMA RESTRIÇÃO)
-- ─────────────────────────────────────────────
ALTER TABLE public.secret_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_vault FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "secret_vault_platform_admin_only" ON public.secret_vault;

CREATE POLICY "secret_vault_platform_admin_only" ON public.secret_vault
  FOR ALL USING (public.is_platform_admin());

-- ─────────────────────────────────────────────
-- 9. TABELA: user_token_wallets
-- ─────────────────────────────────────────────
ALTER TABLE public.user_token_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_token_wallets FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "token_wallet_own" ON public.user_token_wallets;
DROP POLICY IF EXISTS "token_wallet_admin" ON public.user_token_wallets;
DROP POLICY IF EXISTS "token_wallet_admin_all" ON public.user_token_wallets;

CREATE POLICY "token_wallet_own" ON public.user_token_wallets
  FOR SELECT USING (
    public.is_platform_admin() OR
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "token_wallet_admin_all" ON public.user_token_wallets
  FOR ALL USING (public.is_platform_admin());

-- ─────────────────────────────────────────────
-- 10. TABELA: user_token_transactions
-- ─────────────────────────────────────────────
ALTER TABLE public.user_token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_token_transactions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "token_txn_own" ON public.user_token_transactions;
DROP POLICY IF EXISTS "token_txn_insert_admin" ON public.user_token_transactions;

CREATE POLICY "token_txn_own" ON public.user_token_transactions
  FOR SELECT USING (
    public.is_platform_admin() OR
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "token_txn_insert_admin" ON public.user_token_transactions
  FOR INSERT WITH CHECK (public.is_platform_admin());

-- ─────────────────────────────────────────────
-- 11. TABELA: notifications
-- ─────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_own" ON public.notifications;
DROP POLICY IF EXISTS "notif_update_own" ON public.notifications;

CREATE POLICY "notif_own" ON public.notifications
  FOR SELECT USING (
    public.is_platform_admin() OR
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "notif_update_own" ON public.notifications
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- ─────────────────────────────────────────────
-- 12. TABELA: products + product_variants
-- ─────────────────────────────────────────────
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_public" ON public.products;
DROP POLICY IF EXISTS "products_write_store" ON public.products;

CREATE POLICY "products_select_public" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "products_write_store" ON public.products
  FOR ALL USING (
    public.is_platform_admin() OR
    store_id = ANY(public.auth_user_store_ids())
  );

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_variants_select_public" ON public.product_variants;
DROP POLICY IF EXISTS "product_variants_write_store" ON public.product_variants;

CREATE POLICY "product_variants_select_public" ON public.product_variants
  FOR SELECT USING (true);

CREATE POLICY "product_variants_write_store" ON public.product_variants
  FOR ALL USING (
    public.is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND p.store_id = ANY(public.auth_user_store_ids())
    )
  );

-- ─────────────────────────────────────────────
-- 13. TABELA: carts + cart_items
-- ─────────────────────────────────────────────
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carts_own" ON public.carts;

CREATE POLICY "carts_own" ON public.carts
  FOR ALL USING (
    public.is_platform_admin() OR
    customer_id = (SELECT auth.uid()) OR
    session_token IS NOT NULL
  );

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart_items_own" ON public.cart_items;

CREATE POLICY "cart_items_own" ON public.cart_items
  FOR ALL USING (
    public.is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_id
        AND (c.customer_id = (SELECT auth.uid()) OR c.session_token IS NOT NULL)
    )
  );

-- ─────────────────────────────────────────────
-- 14. TABELA: integration_credentials (SEGREDO)
-- ─────────────────────────────────────────────
ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_credentials FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "integration_creds_store_owner" ON public.integration_credentials;

CREATE POLICY "integration_creds_store_owner" ON public.integration_credentials
  FOR ALL USING (
    public.is_platform_admin() OR
    public.get_store_role(store_id) IN ('owner', 'admin')
  );

-- ─────────────────────────────────────────────
-- 15. TABELA: audit_logs + audit_log + forensic_audit_events
-- ─────────────────────────────────────────────
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_admin_only" ON public.audit_logs;

CREATE POLICY "audit_logs_admin_only" ON public.audit_logs
  FOR ALL USING (public.is_platform_admin());

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_admin_only" ON public.audit_log;

CREATE POLICY "audit_log_admin_only" ON public.audit_log
  FOR ALL USING (public.is_platform_admin());

ALTER TABLE public.forensic_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forensic_audit_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "forensic_audit_admin_only" ON public.forensic_audit_events;

CREATE POLICY "forensic_audit_admin_only" ON public.forensic_audit_events
  FOR ALL USING (public.is_platform_admin());

-- ─────────────────────────────────────────────
-- 16. TABELA: security_audit_events
-- ─────────────────────────────────────────────
ALTER TABLE public.security_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sec_audit_admin_only" ON public.security_audit_events;

CREATE POLICY "sec_audit_admin_only" ON public.security_audit_events
  FOR ALL USING (public.is_platform_admin());

-- ─────────────────────────────────────────────
-- 17. TABELAS: store_token_wallets + store_token_billing_invoices
-- ─────────────────────────────────────────────
ALTER TABLE public.store_token_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_token_wallets FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_token_wallets_own" ON public.store_token_wallets;
DROP POLICY IF EXISTS "store_token_wallets_admin_write" ON public.store_token_wallets;

CREATE POLICY "store_token_wallets_own" ON public.store_token_wallets
  FOR SELECT USING (
    public.is_platform_admin() OR
    store_id = ANY(public.auth_user_store_ids())
  );

CREATE POLICY "store_token_wallets_admin_write" ON public.store_token_wallets
  FOR ALL USING (public.is_platform_admin());

ALTER TABLE public.store_token_billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_token_billing_invoices FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_billing_own" ON public.store_token_billing_invoices;

CREATE POLICY "store_billing_own" ON public.store_token_billing_invoices
  FOR SELECT USING (
    public.is_platform_admin() OR
    store_id = ANY(public.auth_user_store_ids())
  );

-- ─────────────────────────────────────────────
-- 18. TABELAS: api_key_pools (SEGREDO)
-- ─────────────────────────────────────────────
ALTER TABLE public.api_key_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key_pools FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "api_keys_admin_only" ON public.api_key_pools;

CREATE POLICY "api_keys_admin_only" ON public.api_key_pools
  FOR ALL USING (public.is_platform_admin());

-- ─────────────────────────────────────────────
-- 19. TABELAS DE CONTEÚDO PÚBLICO (leitura livre, escrita controlada)
-- ─────────────────────────────────────────────
DO $$
DECLARE
  tbl text;
  public_read_tables text[] := ARRAY[
    'categories', 'collections', 'banners', 'news_articles',
    'events', 'posts', 'stories', 'hotpages', 'pages', 'page_sections',
    'directory_listings', 'classifieds', 'jobs', 'tourism_experiences',
    'navigation_menus', 'marketplace_sections', 'marketplace_surfaces',
    'promotions', 'deals', 'reviews', 'seller_showcases'
  ];
BEGIN
  FOREACH tbl IN ARRAY public_read_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', tbl);
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "%s_select_public" ON public.%I', tbl, tbl);
    EXCEPTION WHEN OTHERS THEN NULL; END;
    EXECUTE format(
      'CREATE POLICY "%s_select_public" ON public.%I FOR SELECT USING (true)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ─────────────────────────────────────────────
-- 20. TABELAS DE USUÁRIO AUTENTICADO
-- ─────────────────────────────────────────────
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_favorites_own" ON public.user_favorites;
CREATE POLICY "user_favorites_own" ON public.user_favorites
  FOR ALL USING (profile_id = (SELECT auth.uid()) OR public.is_platform_admin());

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_prefs_own" ON public.user_preferences;
CREATE POLICY "user_prefs_own" ON public.user_preferences
  FOR ALL USING (user_id = (SELECT auth.uid()) OR public.is_platform_admin());

ALTER TABLE public.user_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_followers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_followers_select" ON public.user_followers;
DROP POLICY IF EXISTS "user_followers_write_own" ON public.user_followers;
CREATE POLICY "user_followers_select" ON public.user_followers
  FOR SELECT USING (true);
CREATE POLICY "user_followers_write_own" ON public.user_followers
  FOR ALL USING (follower_user_id = (SELECT auth.uid()) OR public.is_platform_admin());

ALTER TABLE public.user_behavior_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "behavior_events_own" ON public.user_behavior_events;
DROP POLICY IF EXISTS "behavior_events_insert_auth" ON public.user_behavior_events;
CREATE POLICY "behavior_events_own" ON public.user_behavior_events
  FOR SELECT USING (user_id = (SELECT auth.uid()) OR public.is_platform_admin());
CREATE POLICY "behavior_events_insert_auth" ON public.user_behavior_events
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- ─────────────────────────────────────────────
-- 21. TABELAS FINANCEIRAS RESTANTES (ADMIN/STORE MEMBER ONLY)
-- ─────────────────────────────────────────────
-- Tabelas com store_id direto:
DO $$
DECLARE
  tbl text;
  direct_store_tables text[] := ARRAY[
    'cash_registers', 'commissions', 'couriers', 'courier_payouts', 'courier_profiles',
    'installment_plans', 'quotes', 'shipments', 'shipping_quotes',
    'platform_invoices', 'platform_subscriptions'
  ];
BEGIN
  FOREACH tbl IN ARRAY direct_store_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', tbl);
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "%s_store_member" ON public.%I', tbl, tbl);
    EXCEPTION WHEN OTHERS THEN NULL; END;
    EXECUTE format(
      'CREATE POLICY "%s_store_member" ON public.%I FOR ALL USING (
        public.is_platform_admin() OR
        store_id = ANY(public.auth_user_store_ids())
      )',
      tbl, tbl
    );
  END LOOP;
END $$;

-- cash_register_entries (vinculado a cash_registers.store_id)
ALTER TABLE public.cash_register_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_register_entries FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cash_reg_entries_store_member" ON public.cash_register_entries;
CREATE POLICY "cash_reg_entries_store_member" ON public.cash_register_entries
  FOR ALL USING (
    public.is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.cash_registers cr
      WHERE cr.id = cash_register_id AND cr.store_id = ANY(public.auth_user_store_ids())
    )
  );

-- quote_items (vinculado a quotes.store_id)
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quote_items_store_member" ON public.quote_items;
CREATE POLICY "quote_items_store_member" ON public.quote_items
  FOR ALL USING (
    public.is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_id AND q.store_id = ANY(public.auth_user_store_ids())
    )
  );

-- quote_messages (vinculado a quotes.store_id)
ALTER TABLE public.quote_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_messages FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quote_messages_store_member" ON public.quote_messages;
CREATE POLICY "quote_messages_store_member" ON public.quote_messages
  FOR ALL USING (
    public.is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_id AND q.store_id = ANY(public.auth_user_store_ids())
    )
  );

-- installments (vinculado a installment_plans.store_id)
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "installments_store_member" ON public.installments;
CREATE POLICY "installments_store_member" ON public.installments
  FOR ALL USING (
    public.is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.installment_plans ip
      WHERE ip.id = plan_id AND ip.store_id = ANY(public.auth_user_store_ids())
    )
  );

-- receivables & receivable_installments
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "receivables_parties" ON public.receivables;
CREATE POLICY "receivables_parties" ON public.receivables
  FOR ALL USING (
    public.is_platform_admin() OR
    creditor_id = (SELECT auth.uid()) OR
    debtor_id = (SELECT auth.uid())
  );

ALTER TABLE public.receivable_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivable_installments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rec_inst_parties" ON public.receivable_installments;
CREATE POLICY "rec_inst_parties" ON public.receivable_installments
  FOR ALL USING (
    public.is_platform_admin() OR
    EXISTS (
      SELECT 1 FROM public.receivables r
      WHERE r.id = receivable_id AND (r.creditor_id = (SELECT auth.uid()) OR r.debtor_id = (SELECT auth.uid()))
    )
  );

-- ─────────────────────────────────────────────
-- 22. UNIQUE CONSTRAINTS — Identidade Única
-- ─────────────────────────────────────────────

-- CPF único em profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'profiles' AND schemaname = 'public'
      AND indexname = 'profiles_cpf_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX profiles_cpf_unique_idx
      ON public.profiles (cpf)
      WHERE cpf IS NOT NULL AND cpf != '';
  END IF;
END $$;

-- Username único em profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'profiles' AND schemaname = 'public'
      AND indexname = 'profiles_username_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX profiles_username_unique_idx
      ON public.profiles (lower(username))
      WHERE username IS NOT NULL AND username != '';
  END IF;
END $$;

-- Phone único em profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'profiles' AND schemaname = 'public'
      AND indexname = 'profiles_phone_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX profiles_phone_unique_idx
      ON public.profiles (phone)
      WHERE phone IS NOT NULL AND phone != '';
  END IF;
END $$;

-- CNPJ único em stores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'stores' AND schemaname = 'public'
      AND indexname = 'stores_cnpj_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX stores_cnpj_unique_idx
      ON public.stores (cnpj)
      WHERE cnpj IS NOT NULL AND cnpj != '';
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 23. CRIAR TABELA: session_audit_logs
-- Rastreia cada evento de autenticação com fingerprint e risco
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.session_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'login_success', 'login_failed', 'logout',
    'password_reset_requested', 'password_reset_completed',
    'signup', 'session_revoked', 'suspicious_activity',
    'impossible_travel', 'new_device_detected', 'portal_login'
  )),
  ip_address inet,
  user_agent text,
  country_code text,      -- CF-IPCountry
  city text,
  device_type text,       -- CF-Device-Type: desktop/mobile/tablet
  is_datacenter boolean DEFAULT false,  -- CF-IPType = datacenter/vpn
  threat_score smallint DEFAULT 0,      -- CF-Threat-Score 0-100
  cf_ray text,            -- CF-Ray header
  device_fingerprint text,              -- hash do fingerprint cliente
  risk_score smallint DEFAULT 0,        -- 0-100 calculado internamente
  risk_flags text[],                    -- ['new_device', 'vpn', 'impossible_travel']
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS session_audit_profile_idx ON public.session_audit_logs (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS session_audit_ip_idx ON public.session_audit_logs (ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS session_audit_event_idx ON public.session_audit_logs (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS session_audit_risk_idx ON public.session_audit_logs (risk_score DESC, created_at DESC);

ALTER TABLE public.session_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_audit_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "session_audit_own" ON public.session_audit_logs;
CREATE POLICY "session_audit_own" ON public.session_audit_logs
  FOR SELECT USING (
    public.is_platform_admin() OR
    profile_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "session_audit_service_only" ON public.session_audit_logs;
CREATE POLICY "session_audit_service_only" ON public.session_audit_logs
  FOR INSERT WITH CHECK (public.is_platform_admin() OR (SELECT auth.uid()) IS NOT NULL);

-- ─────────────────────────────────────────────
-- 24. CRIAR TABELA: device_registry
-- Registra dispositivos confiáveis por usuário (como o Instagram faz)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.device_registry (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  device_name text,       -- ex: "Chrome no Windows", "Safari no iPhone"
  device_type text,       -- desktop, mobile, tablet
  country_code text,
  city text,
  ip_address inet,
  is_trusted boolean DEFAULT false,
  last_seen_at timestamptz DEFAULT now(),
  first_seen_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (profile_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS device_registry_profile_idx ON public.device_registry (profile_id, last_seen_at DESC);

ALTER TABLE public.device_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_registry FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "device_registry_own" ON public.device_registry;
CREATE POLICY "device_registry_own" ON public.device_registry
  FOR SELECT USING (
    public.is_platform_admin() OR
    profile_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "device_registry_update_own" ON public.device_registry;
CREATE POLICY "device_registry_update_own" ON public.device_registry
  FOR UPDATE USING (profile_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "device_registry_service_insert" ON public.device_registry;
CREATE POLICY "device_registry_service_insert" ON public.device_registry
  FOR INSERT WITH CHECK (public.is_platform_admin() OR (SELECT auth.uid()) IS NOT NULL);

-- ─────────────────────────────────────────────
-- 25. REVOGAR GRANTS PERIGOSOS DO ANON
-- A anon key NÃO deve ter INSERT/UPDATE/DELETE em tabelas sensíveis
-- ─────────────────────────────────────────────
DO $$
DECLARE
  tbl text;
  sensitive_tables text[] := ARRAY[
    'profiles', 'stores', 'workspace_members',
    'orders', 'order_items', 'payments', 'financial_transactions',
    'secret_vault', 'api_key_pools', 'integration_credentials',
    'user_token_wallets', 'user_token_transactions',
    'store_token_wallets', 'store_token_billing_invoices',
    'audit_logs', 'audit_log', 'forensic_audit_events',
    'security_audit_events', 'session_audit_logs', 'device_registry',
    'cash_registers', 'cash_register_entries'
  ];
BEGIN
  FOREACH tbl IN ARRAY sensitive_tables LOOP
    BEGIN
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM anon', tbl);
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────
-- 26. FUNÇÃO: Calcular Risk Score por evento de auth
-- Usada pelo BFF ao registrar cada login
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.calculate_auth_risk_score(
  p_is_datacenter boolean,
  p_threat_score smallint,
  p_country_code text,
  p_is_new_device boolean,
  p_failed_attempts int
)
RETURNS smallint
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  score smallint := 0;
BEGIN
  -- VPS/datacenter/VPN = +40 pontos (suspeito)
  IF p_is_datacenter THEN score := score + 40; END IF;

  -- Cloudflare threat score ponderado
  score := score + LEAST(p_threat_score / 2, 30);

  -- País de alto risco (fora do Brasil para uma plataforma BR)
  IF p_country_code NOT IN ('BR', 'PT', 'US', 'AR', 'CL', 'UY', 'PY') THEN
    score := score + 15;
  END IF;

  -- Dispositivo nunca visto antes = +10
  IF p_is_new_device THEN score := score + 10; END IF;

  -- Tentativas falhas recentes = +5 por tentativa (max 20)
  score := score + LEAST(p_failed_attempts * 5, 20);

  RETURN LEAST(score, 100)::smallint;
END;
$$;

-- ─────────────────────────────────────────────
-- 27. HABILITAR RLS EM TODAS AS DEMAIS TABELAS EXISTENTES (Cobrimento Total de 100%)
-- ─────────────────────────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' AND rowsecurity = false
  ) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', r.tablename);
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "%s_platform_admin_fallback" ON public.%I', r.tablename, r.tablename);
    EXCEPTION WHEN OTHERS THEN NULL; END;
    EXECUTE format(
      'CREATE POLICY "%s_platform_admin_fallback" ON public.%I FOR ALL USING (public.is_platform_admin())',
      r.tablename, r.tablename
    );
  END LOOP;
END $$;
