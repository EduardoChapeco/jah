-- Jah Commerce — Migration 20260803150000: Fix WMS and RMA RLS Policies

-- Drop broken WMS policies
DROP POLICY IF EXISTS "Staff can view picking sessions for their store" ON public.wms_picking_sessions;
DROP POLICY IF EXISTS "Staff can view picking items for their store" ON public.wms_picking_items;

-- Create correct WMS policies using workspace_members helper
CREATE POLICY "Staff can view picking sessions for their store" 
ON public.wms_picking_sessions FOR SELECT USING (
    public.has_workspace_role(store_id, ARRAY['admin', 'manager', 'owner', 'seller', 'logistics', 'stock'])
);

CREATE POLICY "Staff can view picking items for their store" 
ON public.wms_picking_items FOR SELECT USING (
    session_id IN (SELECT id FROM public.wms_picking_sessions WHERE public.has_workspace_role(store_id, ARRAY['admin', 'manager', 'owner', 'seller', 'logistics', 'stock']))
);

UPDATE public.wms_picking_items SET qty_picked = qty_expected WHERE qty_picked > qty_expected;
ALTER TABLE public.wms_picking_items ADD CONSTRAINT wms_picking_items_qty_check CHECK (qty_picked <= qty_expected);

-- Drop broken RMA policies
DROP POLICY IF EXISTS "Staff can view rma requests for their store" ON public.rma_requests;
DROP POLICY IF EXISTS "Staff can view rma items for their store" ON public.rma_items;
DROP POLICY IF EXISTS "Staff can view rma inspections for their store" ON public.rma_inspections;

-- Create correct RMA policies using workspace_members helper
CREATE POLICY "Staff can view rma requests for their store" 
ON public.rma_requests FOR SELECT USING (
    public.has_workspace_role(store_id, ARRAY['admin', 'manager', 'owner', 'seller', 'logistics', 'stock', 'finance'])
    OR customer_id = auth.uid()
);

CREATE POLICY "Staff can view rma items for their store" 
ON public.rma_items FOR SELECT USING (
    rma_id IN (
        SELECT id FROM public.rma_requests WHERE public.has_workspace_role(store_id, ARRAY['admin', 'manager', 'owner', 'seller', 'logistics', 'stock', 'finance'])
        OR customer_id = auth.uid()
    )
);

CREATE POLICY "Staff can view rma inspections for their store" 
ON public.rma_inspections FOR SELECT USING (
    rma_item_id IN (
        SELECT id FROM public.rma_items WHERE rma_id IN (
            SELECT id FROM public.rma_requests WHERE public.has_workspace_role(store_id, ARRAY['admin', 'manager', 'owner', 'seller', 'logistics', 'stock', 'finance'])
        )
    )
);
