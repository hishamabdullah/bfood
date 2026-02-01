-- إنشاء جدول قوالب الطلبات
CREATE TABLE public.order_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول عناصر قوالب الطلبات
CREATE TABLE public.order_template_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.order_templates(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.order_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_template_items ENABLE ROW LEVEL SECURITY;

-- سياسات order_templates
CREATE POLICY "المطعم يمكنه إنشاء قوالب" 
ON public.order_templates 
FOR INSERT 
WITH CHECK (auth.uid() = restaurant_id AND has_role(auth.uid(), 'restaurant'));

CREATE POLICY "المطعم يمكنه قراءة قوالبه" 
ON public.order_templates 
FOR SELECT 
USING (auth.uid() = restaurant_id);

CREATE POLICY "المطعم يمكنه تحديث قوالبه" 
ON public.order_templates 
FOR UPDATE 
USING (auth.uid() = restaurant_id);

CREATE POLICY "المطعم يمكنه حذف قوالبه" 
ON public.order_templates 
FOR DELETE 
USING (auth.uid() = restaurant_id);

-- سياسات order_template_items
CREATE POLICY "المطعم يمكنه إضافة عناصر لقوالبه" 
ON public.order_template_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.order_templates 
    WHERE id = template_id AND restaurant_id = auth.uid()
  )
);

CREATE POLICY "المطعم يمكنه قراءة عناصر قوالبه" 
ON public.order_template_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.order_templates 
    WHERE id = template_id AND restaurant_id = auth.uid()
  )
);

CREATE POLICY "المطعم يمكنه تحديث عناصر قوالبه" 
ON public.order_template_items 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.order_templates 
    WHERE id = template_id AND restaurant_id = auth.uid()
  )
);

CREATE POLICY "المطعم يمكنه حذف عناصر قوالبه" 
ON public.order_template_items 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.order_templates 
    WHERE id = template_id AND restaurant_id = auth.uid()
  )
);

-- Trigger لتحديث updated_at
CREATE TRIGGER update_order_templates_updated_at
BEFORE UPDATE ON public.order_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- إضافة index للبحث السريع
CREATE INDEX idx_order_templates_restaurant_id ON public.order_templates(restaurant_id);
CREATE INDEX idx_order_template_items_template_id ON public.order_template_items(template_id);