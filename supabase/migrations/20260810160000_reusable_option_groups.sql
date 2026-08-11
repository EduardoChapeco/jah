-- Migration: Reusable Option Groups (Modifier Engine)

-- 1. Create Option Groups (Global level per tenant)
CREATE TABLE IF NOT EXISTS public.option_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    internal_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    selection_type TEXT DEFAULT 'single' CHECK (selection_type IN ('single', 'multiple')),
    min_selections INTEGER DEFAULT 0,
    max_selections INTEGER DEFAULT 1,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Option Values (Choices within a group)
CREATE TABLE IF NOT EXISTS public.option_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.option_groups(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    price_modifier_cents INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Pivot table linking products to option groups
CREATE TABLE IF NOT EXISTS public.product_option_groups (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    option_group_id UUID NOT NULL REFERENCES public.option_groups(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    PRIMARY KEY (product_id, option_group_id)
);

-- Enable RLS
ALTER TABLE public.option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_groups ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Read public, Write admin/tenant)

CREATE POLICY "Option Groups are readable by everyone" 
  ON public.option_groups FOR SELECT 
  USING (true);

CREATE POLICY "Option Groups are insertable by admins" 
  ON public.option_groups FOR INSERT 
  WITH CHECK (public.is_store_staff(store_id));

CREATE POLICY "Option Groups are updatable by admins" 
  ON public.option_groups FOR UPDATE 
  USING (public.is_store_staff(store_id));

CREATE POLICY "Option Values are readable by everyone" 
  ON public.option_values FOR SELECT 
  USING (true);

CREATE POLICY "Option Values are insertable by admins" 
  ON public.option_values FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.option_groups g 
    WHERE g.id = group_id 
    AND public.is_store_staff(g.store_id)
  ));

CREATE POLICY "Product Option Groups are readable by everyone" 
  ON public.product_option_groups FOR SELECT 
  USING (true);

CREATE POLICY "Product Option Groups are insertable by admins" 
  ON public.product_option_groups FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = product_id 
    AND public.is_store_staff(p.store_id)
  ));
