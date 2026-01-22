-- إضافة حقل بلد الصنع للمنتجات
ALTER TABLE public.products ADD COLUMN country_of_origin text DEFAULT 'السعودية';

-- إضافة حقل الكمية المتوفرة
ALTER TABLE public.products ADD COLUMN stock_quantity integer DEFAULT 0;