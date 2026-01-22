-- إضافة حقول جديدة لجدول profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS supply_categories TEXT[];

-- تحديث جدول products لإضافة خيار الكمية غير محدودة
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS unlimited_stock BOOLEAN DEFAULT false;
