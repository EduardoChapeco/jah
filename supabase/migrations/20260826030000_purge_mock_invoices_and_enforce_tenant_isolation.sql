-- ============================================================
-- Migration: Purge Mock Invoices & Enforce Strict Tenant Isolation
-- Deleta registros de teste/fictícios e impõe NOT NULL + RLS por store_id
-- ============================================================

-- 1. Deleta qualquer fatura fictícia/sem store_id
DELETE FROM public.logistics_invoices
WHERE store_id IS NULL 
   OR id IN (
     'b0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000003'
   );

-- 2. Torna store_id obrigatório e com integridade referencial estrita
ALTER TABLE public.logistics_invoices 
  ALTER COLUMN store_id SET NOT NULL;

-- 3. Atualiza políticas RLS para isolamento Multi-Tenant estrito
DROP POLICY IF EXISTS "Workspace stores and couriers can read invoices" ON public.logistics_invoices;
DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON public.logistics_invoices;
DROP POLICY IF EXISTS "Store members can read their own store invoices" ON public.logistics_invoices;
DROP POLICY IF EXISTS "Store admins can manage their own store invoices" ON public.logistics_invoices;

-- Leitura: Membros da loja podem ler apenas faturas do seu store_id
CREATE POLICY "Store members can read their own store invoices"
  ON public.logistics_invoices FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT wm.store_id FROM public.workspace_members wm WHERE wm.profile_id = auth.uid()
    )
  );

-- Gestão: Administradores e donos da loja podem atualizar faturas da sua loja
CREATE POLICY "Store admins can manage their own store invoices"
  ON public.logistics_invoices FOR ALL
  TO authenticated
  USING (
    store_id IN (
      SELECT wm.store_id FROM public.workspace_members wm 
      WHERE wm.profile_id = auth.uid() 
        AND wm.role IN ('owner', 'admin', 'manager', 'finance')
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT wm.store_id FROM public.workspace_members wm 
      WHERE wm.profile_id = auth.uid() 
        AND wm.role IN ('owner', 'admin', 'manager', 'finance')
    )
  );
