-- ============================================================================
-- Jah Commerce — Migration: RMA Logistics Tracking
-- ============================================================================

ALTER TABLE public.rma_requests
ADD COLUMN return_tracking_code TEXT,
ADD COLUMN return_label_url TEXT,
ADD COLUMN return_carrier TEXT;

-- We can also add an index for tracking code searches
CREATE INDEX IF NOT EXISTS idx_rma_requests_tracking ON public.rma_requests(return_tracking_code);
