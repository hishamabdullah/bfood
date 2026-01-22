-- إضافة أعمدة الترجمة للمنتجات
ALTER TABLE public.products 
ADD COLUMN name_en TEXT,
ADD COLUMN name_ur TEXT,
ADD COLUMN name_hi TEXT,
ADD COLUMN description_en TEXT,
ADD COLUMN description_ur TEXT,
ADD COLUMN description_hi TEXT;