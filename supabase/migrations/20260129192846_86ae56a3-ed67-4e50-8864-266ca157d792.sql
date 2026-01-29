-- Drop the old constraint that only uses supplier_id and restaurant_id
ALTER TABLE public.order_payments 
DROP CONSTRAINT IF EXISTS order_payments_supplier_restaurant_unique;

-- Add a partial unique constraint for cart payments (where order_id is null)
-- This ensures only one "pre-order" payment per supplier-restaurant pair
CREATE UNIQUE INDEX IF NOT EXISTS order_payments_supplier_restaurant_null_order_unique 
ON public.order_payments (supplier_id, restaurant_id) 
WHERE order_id IS NULL;