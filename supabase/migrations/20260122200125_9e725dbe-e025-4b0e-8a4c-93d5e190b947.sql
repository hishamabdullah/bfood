-- إضافة عمود رسوم التوصيل للمنتجات ليحددها المورد
ALTER TABLE public.products 
ADD COLUMN delivery_fee numeric DEFAULT 0;

-- تحديث عمود رسوم التوصيل في الطلبات ليكون 0 افتراضياً
ALTER TABLE public.orders 
ALTER COLUMN delivery_fee SET DEFAULT 0;