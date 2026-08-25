-- Migration 20260817140000_tourism_bookings_and_vouchers.sql
-- Description: Adds voucher generation, passenger lists, and full booking lifecycle to tourism_inquiries

ALTER TABLE public.tourism_inquiries
  ADD COLUMN IF NOT EXISTS voucher_code TEXT,
  ADD COLUMN IF NOT EXISTS total_price_cents BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'confirmed' CHECK (payment_status IN ('pending', 'paid', 'confirmed', 'cancelled', 'refunded')),
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pix',
  ADD COLUMN IF NOT EXISTS passengers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS meeting_point TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Index for customer trips lookup
CREATE INDEX IF NOT EXISTS idx_tourism_inquiries_profile ON public.tourism_inquiries(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tourism_inquiries_voucher ON public.tourism_inquiries(voucher_code);
