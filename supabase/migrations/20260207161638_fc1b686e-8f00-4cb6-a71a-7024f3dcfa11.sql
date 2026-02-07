-- Add can_view_subscription permission
ALTER TABLE public.restaurant_sub_user_permissions 
  ADD COLUMN IF NOT EXISTS can_view_subscription boolean DEFAULT false;

-- Update the function to include the new permission
DROP FUNCTION IF EXISTS public.get_sub_user_permissions(uuid);

CREATE OR REPLACE FUNCTION public.get_sub_user_permissions(_user_id uuid)
RETURNS TABLE (
  can_see_prices boolean,
  can_see_favorite_suppliers_only boolean,
  can_see_favorite_products_only boolean,
  can_edit_order boolean,
  can_cancel_order boolean,
  can_approve_order boolean,
  can_see_order_totals boolean,
  can_view_analytics boolean,
  can_manage_branches boolean,
  can_manage_templates boolean,
  can_view_subscription boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.can_see_prices,
    p.can_see_favorite_suppliers_only,
    p.can_see_favorite_products_only,
    p.can_edit_order,
    p.can_cancel_order,
    p.can_approve_order,
    p.can_see_order_totals,
    p.can_view_analytics,
    p.can_manage_branches,
    p.can_manage_templates,
    p.can_view_subscription
  FROM public.restaurant_sub_users su
  JOIN public.restaurant_sub_user_permissions p ON p.sub_user_id = su.id
  WHERE su.user_id = _user_id AND su.is_active = true
  LIMIT 1;
$$;