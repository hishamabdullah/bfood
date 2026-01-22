-- السماح للمورد بقراءة الطلبات التي تحتوي على منتجاته
CREATE POLICY "المورد يمكنه قراءة الطلبات المتعلقة به"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM order_items 
    WHERE order_items.order_id = orders.id 
    AND order_items.supplier_id = auth.uid()
  )
);