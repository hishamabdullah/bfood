-- إضافة عمود نوع التسليم للطلبات
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_pickup boolean DEFAULT false;

-- تحديث الطلبات الحالية
UPDATE public.orders SET is_pickup = false WHERE is_pickup IS NULL;