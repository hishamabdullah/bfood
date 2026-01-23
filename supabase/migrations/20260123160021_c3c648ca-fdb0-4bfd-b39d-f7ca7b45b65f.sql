
-- إنشاء جدول الفروع
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  name TEXT NOT NULL,
  google_maps_url TEXT,
  address TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "المطعم يمكنه قراءة فروعه"
ON public.branches
FOR SELECT
USING (auth.uid() = restaurant_id OR has_role(auth.uid(), 'supplier'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "المطعم يمكنه إضافة فروعه"
ON public.branches
FOR INSERT
WITH CHECK (auth.uid() = restaurant_id AND has_role(auth.uid(), 'restaurant'::app_role));

CREATE POLICY "المطعم يمكنه تحديث فروعه"
ON public.branches
FOR UPDATE
USING (auth.uid() = restaurant_id);

CREATE POLICY "المطعم يمكنه حذف فروعه"
ON public.branches
FOR DELETE
USING (auth.uid() = restaurant_id);

-- إضافة عمود branch_id للطلبات
ALTER TABLE public.orders ADD COLUMN branch_id UUID REFERENCES public.branches(id);

-- تريقر لتحديث updated_at
CREATE TRIGGER update_branches_updated_at
BEFORE UPDATE ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
