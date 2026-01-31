-- Add product code/SKU column to products table
ALTER TABLE public.products 
ADD COLUMN sku text;

-- Add unique index for SKU per supplier (same supplier can't have duplicate SKUs)
CREATE UNIQUE INDEX idx_products_supplier_sku 
ON public.products (supplier_id, sku) 
WHERE sku IS NOT NULL AND sku != '';