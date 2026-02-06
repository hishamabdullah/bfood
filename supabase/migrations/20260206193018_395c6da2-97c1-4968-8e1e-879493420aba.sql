-- إضافة سياسة UPDATE لعناصر الطلبات للمطعم (فقط إذا كان العنصر معلق)
CREATE POLICY "المطعم يمكنه تعديل عناصر طلباته المعلقة"
ON public.order_items FOR UPDATE
USING (
  get_order_restaurant_id(order_id) = auth.uid() 
  AND status = 'pending'
)
WITH CHECK (
  get_order_restaurant_id(order_id) = auth.uid() 
  AND status = 'pending'
);

-- إضافة سياسة DELETE لعناصر الطلبات للمطعم (فقط إذا كان العنصر معلق)
CREATE POLICY "المطعم يمكنه حذف عناصر طلباته المعلقة"
ON public.order_items FOR DELETE
USING (
  get_order_restaurant_id(order_id) = auth.uid() 
  AND status = 'pending'
);

-- إضافة سياسة DELETE للطلبات للمطعم (فقط إذا كان الطلب معلق)
CREATE POLICY "المطعم يمكنه حذف طلباته المعلقة"
ON public.orders FOR DELETE
USING (
  auth.uid() = restaurant_id 
  AND status = 'pending'
);