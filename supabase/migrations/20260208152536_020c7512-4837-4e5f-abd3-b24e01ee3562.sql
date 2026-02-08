-- حذف السياسة القديمة وإنشاء سياسة جديدة للسماح بإشعارات الطلبات
DROP POLICY IF EXISTS "إضافة إشعارات للطلبات" ON public.notifications;

CREATE POLICY "إضافة إشعارات للطلبات" 
ON public.notifications 
FOR INSERT 
TO public
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    -- المستخدم يضيف إشعار لنفسه
    user_id = auth.uid()
    -- المدير يمكنه إضافة إشعارات لأي مستخدم
    OR has_role(auth.uid(), 'admin'::app_role)
    -- المطعم/الموظف يمكنه إرسال إشعارات للموردين لطلباته
    OR (
      type = 'order'
      AND order_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = order_id
          AND (
            o.restaurant_id = auth.uid()
            OR (is_sub_user(auth.uid()) AND o.restaurant_id = get_restaurant_owner_id(auth.uid()))
          )
      )
    )
  )
);