-- Migration: add show_stock_publicly flag to products
-- Permite que o lojista controle se o estoque é exibido publicamente
-- Por padrão FALSE: o estoque NÃO é exibido na vitrine pública

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS show_stock_publicly boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN products.show_stock_publicly IS 
'Quando TRUE, exibe o indicador de estoque disponível na página pública do produto. FALSE por padrão.';
