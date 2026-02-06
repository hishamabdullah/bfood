-- إنشاء جدول الأقسام الداخلية (المستوى الثالث)
CREATE TABLE public.sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  name_en text,
  icon text,
  subcategory_id uuid NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة للجميع
CREATE POLICY "الجميع يمكنهم قراءة الأقسام الداخلية"
ON public.sections FOR SELECT
USING (true);

-- سياسة الإدارة للمدير فقط
CREATE POLICY "المدير فقط يمكنه إدارة الأقسام الداخلية"
ON public.sections FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- إضافة عمود section_id لجدول المنتجات
ALTER TABLE public.products ADD COLUMN section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL;

-- إضافة فهرس للبحث السريع
CREATE INDEX idx_sections_subcategory ON public.sections(subcategory_id);
CREATE INDEX idx_products_section ON public.products(section_id);