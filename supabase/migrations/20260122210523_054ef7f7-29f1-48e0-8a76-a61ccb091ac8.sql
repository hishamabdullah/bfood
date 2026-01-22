-- سياسة تسمح للمطاعم فقط برؤية أدوار الموردين
CREATE POLICY "المطاعم يمكنها رؤية أدوار الموردين"
ON public.user_roles
FOR SELECT
USING (
  role = 'supplier' 
  AND has_role(auth.uid(), 'restaurant')
);
