
-- دالة لجلب بيانات المطعم للمورد عند وجود طلب بينهما
CREATE OR REPLACE FUNCTION public.get_restaurant_profile_for_order(_restaurant_id uuid)
RETURNS TABLE(
  user_id uuid,
  business_name text,
  full_name text,
  phone text,
  google_maps_url text,
  customer_code text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.user_id,
    p.business_name,
    p.full_name,
    p.phone,
    p.google_maps_url,
    p.customer_code
  FROM public.profiles p
  WHERE p.user_id = _restaurant_id
    AND (
      -- المدير يمكنه رؤية أي ملف
      has_role(auth.uid(), 'admin')
      -- أو المورد لديه طلبات من هذا المطعم
      OR EXISTS (
        SELECT 1 FROM public.order_items oi
        JOIN public.orders o ON o.id = oi.order_id
        WHERE oi.supplier_id = auth.uid()
          AND o.restaurant_id = _restaurant_id
      )
      -- أو المستخدم يقرأ ملفه الخاص
      OR auth.uid() = _restaurant_id
    )
  LIMIT 1
$$;
