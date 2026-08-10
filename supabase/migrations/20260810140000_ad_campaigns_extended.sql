-- Ad Campaigns Extended Fields

ALTER TABLE public.ad_campaigns 
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS target_url TEXT,
  ADD COLUMN IF NOT EXISTS placements TEXT[] DEFAULT '{feed}';
