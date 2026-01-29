-- Add unique constraint on supplier_id and restaurant_id for order_payments
ALTER TABLE public.order_payments 
ADD CONSTRAINT order_payments_supplier_restaurant_unique 
UNIQUE (supplier_id, restaurant_id);