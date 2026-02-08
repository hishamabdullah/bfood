
-- تحديث سياسة قراءة عناصر الطلبات للسماح للمستخدم الفرعي
DROP POLICY IF EXISTS "قراءة عناصر الطلبات" ON public.order_items;

CREATE POLICY "قراءة عناصر الطلبات" 
ON public.order_items 
FOR SELECT TO public
USING (
  supplier_id = auth.uid() 
  OR get_order_restaurant_id(order_id) = auth.uid()
  OR (is_sub_user(auth.uid()) AND get_order_restaurant_id(order_id) = get_restaurant_owner_id(auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
);
