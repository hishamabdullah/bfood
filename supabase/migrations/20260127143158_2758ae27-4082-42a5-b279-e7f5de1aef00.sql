-- دالة لجلب المطاعم المعتمدة للموردين (بدون بيانات التواصل)
CREATE OR REPLACE FUNCTION public.get_approved_restaurants()
RETURNS TABLE (
  user_id uuid,
  business_name text,
  full_name text,
  customer_code text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.business_name,
    p.full_name,
    p.customer_code,
    p.created_at
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE ur.role = 'restaurant'
    AND p.is_approved = true
    AND (
      -- المورد أو المدير فقط يمكنهم استدعاء هذه الدالة
      has_role(auth.uid(), 'supplier') OR has_role(auth.uid(), 'admin')
    )
  ORDER BY p.created_at DESC
$$;