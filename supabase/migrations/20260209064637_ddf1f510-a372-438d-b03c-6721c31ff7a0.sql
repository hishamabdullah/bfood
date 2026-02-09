-- إضافة سياسة RLS للسماح للمدير بإضافة منتجات
CREATE POLICY "المدير يمكنه إضافة أي منتج" 
ON public.products 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));