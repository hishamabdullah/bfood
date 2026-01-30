-- حذف القيد القديم الذي يسبب المشكلة
ALTER TABLE public.order_payments DROP CONSTRAINT IF EXISTS order_payments_supplier_restaurant_unique;

-- حذف السجلات القديمة التي ليس لها order_id (بيانات قديمة تالفة)
DELETE FROM public.order_payments WHERE order_id IS NULL;