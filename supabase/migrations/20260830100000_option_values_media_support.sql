-- Migration: Add media, description and quantity limits to option_values & option_groups
-- Padrão iFood / AmoOfertas / UberEats

ALTER TABLE public.option_groups 
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.option_values 
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS max_quantity_per_item INTEGER DEFAULT 1;

COMMENT ON COLUMN public.option_values.image_url IS 'Foto ilustrativa do adicional/complemento (recorte 1:1)';
COMMENT ON COLUMN public.option_values.description IS 'Descrição curta dos ingredientes ou detalhes do adicional';
COMMENT ON COLUMN public.option_values.max_quantity_per_item IS 'Quantidade máxima que o cliente pode selecionar deste item';
