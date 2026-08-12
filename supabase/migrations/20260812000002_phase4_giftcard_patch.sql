ALTER TABLE public.gift_cards 
ADD COLUMN IF NOT EXISTS purchaser_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS recipient_email text;
