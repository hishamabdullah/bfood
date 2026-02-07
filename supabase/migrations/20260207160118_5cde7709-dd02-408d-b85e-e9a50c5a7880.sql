-- إضافة صلاحيات جديدة للمستخدمين الفرعيين
ALTER TABLE public.restaurant_sub_user_permissions 
  ADD COLUMN IF NOT EXISTS can_view_analytics boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_branches boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_templates boolean DEFAULT false;

-- إضافة عمود لتتبع منشئ الطلب
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS created_by_name text;

-- حذف الدالة القديمة وإعادة إنشائها بالحقول الجديدة
DROP FUNCTION IF EXISTS public.get_sub_user_permissions(uuid);

CREATE FUNCTION public.get_sub_user_permissions(_user_id uuid)
RETURNS TABLE (
  can_see_prices boolean,
  can_see_order_totals boolean,
  can_edit_order boolean,
  can_cancel_order boolean,
  can_approve_order boolean,
  can_see_favorite_suppliers_only boolean,
  can_see_favorite_products_only boolean,
  can_view_analytics boolean,
  can_manage_branches boolean,
  can_manage_templates boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.can_see_prices,
    p.can_see_order_totals,
    p.can_edit_order,
    p.can_cancel_order,
    p.can_approve_order,
    p.can_see_favorite_suppliers_only,
    p.can_see_favorite_products_only,
    COALESCE(p.can_view_analytics, false),
    COALESCE(p.can_manage_branches, false),
    COALESCE(p.can_manage_templates, false)
  FROM restaurant_sub_users su
  JOIN restaurant_sub_user_permissions p ON p.sub_user_id = su.id
  WHERE su.user_id = _user_id AND su.is_active = true
  LIMIT 1;
$$;