-- إضافة عمود email لجدول restaurant_sub_users
ALTER TABLE public.restaurant_sub_users 
ADD COLUMN IF NOT EXISTS email text;