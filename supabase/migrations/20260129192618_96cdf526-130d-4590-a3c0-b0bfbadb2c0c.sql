-- Add unique constraint for order-specific payments (order_id, supplier_id, restaurant_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'order_payments_order_supplier_restaurant_unique'
  ) THEN
    ALTER TABLE public.order_payments
    ADD CONSTRAINT order_payments_order_supplier_restaurant_unique 
    UNIQUE (order_id, supplier_id, restaurant_id);
  END IF;
END $$;