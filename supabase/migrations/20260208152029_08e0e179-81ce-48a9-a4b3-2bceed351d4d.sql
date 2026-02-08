-- تحديث سياسة INSERT للطلبات للسماح للمستخدمين الفرعيين بإنشاء طلبات
DROP POLICY IF EXISTS "المطعم يمكنه إنشاء طلب" ON public.orders;

CREATE POLICY "المطعم أو الموظف يمكنه إنشاء طلب" 
ON public.orders 
FOR INSERT 
TO public
WITH CHECK (
  -- المستخدم الأساسي (المطعم) يمكنه إنشاء طلب لنفسه
  (auth.uid() = restaurant_id AND has_role(auth.uid(), 'restaurant'::app_role))
  OR
  -- المستخدم الفرعي يمكنه إنشاء طلب للمطعم الذي يتبع له
  (is_sub_user(auth.uid()) AND restaurant_id = get_restaurant_owner_id(auth.uid()))
);

-- تحديث سياسة UPDATE للطلبات للسماح للمستخدمين الفرعيين بتحديث طلبات المطعم
DROP POLICY IF EXISTS "المطعم يمكنه تحديث طلباته" ON public.orders;

CREATE POLICY "المطعم أو الموظف يمكنه تحديث الطلبات" 
ON public.orders 
FOR UPDATE 
TO public
USING (
  auth.uid() = restaurant_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (is_sub_user(auth.uid()) AND restaurant_id = get_restaurant_owner_id(auth.uid()))
);

-- تحديث سياسة DELETE للطلبات للسماح للمستخدمين الفرعيين بحذف طلبات المطعم المعلقة
DROP POLICY IF EXISTS "المطعم يمكنه حذف طلباته المعلقة" ON public.orders;

CREATE POLICY "المطعم أو الموظف يمكنه حذف الطلبات المعلقة" 
ON public.orders 
FOR DELETE 
TO public
USING (
  (
    auth.uid() = restaurant_id 
    OR (is_sub_user(auth.uid()) AND restaurant_id = get_restaurant_owner_id(auth.uid()))
  )
  AND status = 'pending'
);

-- تحديث سياسة INSERT لجدول order_items للسماح للمستخدمين الفرعيين
DROP POLICY IF EXISTS "المستخدم يمكنه إضافة عناصر لطلباته" ON public.order_items;

CREATE POLICY "المستخدم يمكنه إضافة عناصر لطلباته" 
ON public.order_items 
FOR INSERT 
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id 
    AND (
      o.restaurant_id = auth.uid() 
      OR (is_sub_user(auth.uid()) AND o.restaurant_id = get_restaurant_owner_id(auth.uid()))
    )
  )
);