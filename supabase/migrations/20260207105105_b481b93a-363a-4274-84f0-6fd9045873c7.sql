-- إضافة عمود الحد الأقصى للفروع في جدول خطط الاشتراك
ALTER TABLE public.subscription_plans 
ADD COLUMN max_branches INTEGER DEFAULT 1;

-- إضافة عمود الحد الأقصى للفروع في جدول ميزات المطعم
ALTER TABLE public.restaurant_features 
ADD COLUMN max_branches INTEGER DEFAULT 1;