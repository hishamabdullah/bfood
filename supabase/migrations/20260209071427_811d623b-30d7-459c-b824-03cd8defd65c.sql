-- حذف السياسة القديمة وإنشاء سياسة جديدة تسمح بإشعارات تغيير الحالة
DROP POLICY IF EXISTS "إضافة إشعارات للطلبات" ON public.notifications;

CREATE POLICY "إضافة إشعارات للطلبات والحالات" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    -- المستخدم يضيف إشعار لنفسه
    user_id = auth.uid()
    -- أو المدير
    OR has_role(auth.uid(), 'admin'::app_role)
    -- أو إشعار طلب جديد من المطعم للمورد
    OR (
      type = 'order'::text 
      AND order_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = notifications.order_id 
        AND (
          o.restaurant_id = auth.uid() 
          OR (is_sub_user(auth.uid()) AND o.restaurant_id = get_restaurant_owner_id(auth.uid()))
        )
      )
    )
    -- أو إشعار تحديث حالة من المورد للمطعم
    OR (
      type = 'status_update'::text 
      AND order_id IS NOT NULL 
      AND has_role(auth.uid(), 'supplier'::app_role)
      AND EXISTS (
        SELECT 1 FROM order_items oi
        WHERE oi.order_id = notifications.order_id 
        AND oi.supplier_id = auth.uid()
      )
    )
  )
);