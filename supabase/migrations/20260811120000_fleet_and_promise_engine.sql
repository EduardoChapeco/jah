-- Microfase 2: Motor Logístico e Gestão de Frota

CREATE TABLE IF NOT EXISTS public.delivery_drivers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    vehicle_type TEXT DEFAULT 'motorcycle', -- 'motorcycle', 'bicycle', 'car', 'van'
    status TEXT DEFAULT 'available', -- 'available', 'busy', 'offline'
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view delivery_drivers for their stores"
    ON public.delivery_drivers FOR SELECT
    USING (
        store_id IN (
            SELECT store_id FROM public.store_roles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage delivery_drivers for their stores"
    ON public.delivery_drivers FOR ALL
    USING (
        store_id IN (
            SELECT store_id FROM public.store_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
        )
    );

-- Atualiza a tabela orders para relacionar com a frota
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES public.delivery_drivers(id) ON DELETE SET NULL;

-- Garante que temos as colunas base_price_cents e price_per_km_cents em shipping_rates (que já devem existir, mas para garantir)
ALTER TABLE public.shipping_rates ADD COLUMN IF NOT EXISTS base_price_cents INTEGER DEFAULT 0;
ALTER TABLE public.shipping_rates ADD COLUMN IF NOT EXISTS price_per_km_cents INTEGER DEFAULT 0;
