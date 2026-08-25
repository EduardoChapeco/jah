-- Migration: Define false como default para overlays de texto nos banners e limpa os banners existentes
UPDATE public.banners
SET
  show_title = FALSE,
  show_description = FALSE,
  show_overlay = FALSE,
  show_badge = FALSE,
  show_cta = FALSE;

ALTER TABLE public.banners
  ALTER COLUMN show_title SET DEFAULT FALSE,
  ALTER COLUMN show_description SET DEFAULT FALSE,
  ALTER COLUMN show_overlay SET DEFAULT FALSE,
  ALTER COLUMN show_badge SET DEFAULT FALSE,
  ALTER COLUMN show_cta SET DEFAULT FALSE;
