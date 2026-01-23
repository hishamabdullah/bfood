-- Add minimum order amount and default delivery fee for suppliers
ALTER TABLE public.profiles 
ADD COLUMN minimum_order_amount NUMERIC DEFAULT 0,
ADD COLUMN default_delivery_fee NUMERIC DEFAULT 0;

-- Add supplier-specific delivery fee to order_items (calculated at order time)
ALTER TABLE public.order_items
ADD COLUMN delivery_fee NUMERIC DEFAULT 0;