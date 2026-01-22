-- حذف السياسة التي تسبب التكرار اللانهائي
DROP POLICY IF EXISTS "المورد يمكنه قراءة الطلبات المتعلقة به" ON public.orders;

-- إنشاء دالة للتحقق من أن المورد له عناصر في الطلب
CREATE OR REPLACE FUNCTION public.supplier_has_order_items(_order_id uuid, _supplier_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.order_items
    WHERE order_id = _order_id AND supplier_id = _supplier_id
  )
$$;

-- إنشاء دالة للحصول على order_id من order_items بدون تكرار
CREATE OR REPLACE FUNCTION public.get_order_restaurant_id(_order_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT restaurant_id FROM public.orders WHERE id = _order_id LIMIT 1
$$;

-- إعادة إنشاء سياسة الموردين باستخدام الدالة
CREATE POLICY "المورد يمكنه قراءة الطلبات المتعلقة به"
ON public.orders
FOR SELECT
USING (
  public.supplier_has_order_items(id, auth.uid())
);

-- تحديث سياسة قراءة order_items لتجنب التكرار
DROP POLICY IF EXISTS "قراءة عناصر الطلبات" ON public.order_items;

CREATE POLICY "قراءة عناصر الطلبات"
ON public.order_items
FOR SELECT
USING (
  supplier_id = auth.uid() 
  OR public.get_order_restaurant_id(order_id) = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);