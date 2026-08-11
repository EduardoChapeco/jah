-- ============================================================================
-- Jah Commerce — Migration V4: In-Store PDV and Kanban Engine
-- ============================================================================
-- 1. Extend `orders` table with PDV/In-Store features.
-- ============================================================================

-- Add Origin Type and POS details to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS origin_type TEXT NOT NULL DEFAULT 'ecommerce' CHECK (origin_type IN ('ecommerce', 'pdv', 'table', 'counter', 'totem')),
ADD COLUMN IF NOT EXISTS table_identifier TEXT, -- e.g. "Mesa 04", "Balcão"
ADD COLUMN IF NOT EXISTS cashier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- The staff member who opened/closed the order
ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ; -- For Kitchen Display System (KDS) sync

-- Adjust order_status ENUM to allow "kitchen_prep" and "ready_for_pickup"
-- Wait, 'ready_for_pickup' already exists. We just need 'kitchen_prep'.
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'kitchen_prep' AFTER 'processing';

-- Index for KDS (Kanban) queries
CREATE INDEX IF NOT EXISTS idx_orders_kanban ON public.orders(store_id, status) WHERE origin_type IN ('pdv', 'table', 'counter', 'totem');
