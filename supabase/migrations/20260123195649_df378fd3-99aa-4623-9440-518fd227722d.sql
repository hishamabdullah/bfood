-- إضافة سياسة تسمح للمدير بتحديث حالة الموافقة
DROP POLICY IF EXISTS "المدير يمكنه تحديث أي ملف شخصي" ON public.profiles;

CREATE POLICY "المدير يمكنه تحديث أي ملف شخصي"
  ON public.profiles
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));