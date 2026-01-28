-- جعل order_id اختياري (nullable) لأن الدفع قد يحدث قبل إنشاء الطلب
ALTER TABLE public.order_payments ALTER COLUMN order_id DROP NOT NULL;

-- تحديث القيد الفريد ليشمل supplier_id و restaurant_id بدلاً من order_id
ALTER TABLE public.order_payments DROP CONSTRAINT IF EXISTS order_payments_order_id_supplier_id_key;

-- إضافة قيد فريد جديد
ALTER TABLE public.order_payments ADD CONSTRAINT order_payments_supplier_restaurant_unique UNIQUE (supplier_id, restaurant_id);

-- تحديث العلاقة مع orders لتكون اختيارية
ALTER TABLE public.order_payments DROP CONSTRAINT IF EXISTS order_payments_order_id_fkey;
ALTER TABLE public.order_payments ADD CONSTRAINT order_payments_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;