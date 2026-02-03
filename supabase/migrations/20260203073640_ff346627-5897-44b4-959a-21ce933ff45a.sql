-- Add can_repeat_orders column to restaurant_features
ALTER TABLE public.restaurant_features
ADD COLUMN can_repeat_orders BOOLEAN NOT NULL DEFAULT true;

-- Update the restaurant_has_feature function to include the new feature
CREATE OR REPLACE FUNCTION public.restaurant_has_feature(_restaurant_id UUID, _feature TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN _feature = 'is_active' THEN COALESCE((SELECT is_active FROM restaurant_features WHERE restaurant_id = _restaurant_id), true)
    WHEN _feature = 'can_order' THEN COALESCE((SELECT can_order FROM restaurant_features WHERE restaurant_id = _restaurant_id), true)
    WHEN _feature = 'can_use_templates' THEN COALESCE((SELECT can_use_templates FROM restaurant_features WHERE restaurant_id = _restaurant_id), false)
    WHEN _feature = 'can_use_branches' THEN COALESCE((SELECT can_use_branches FROM restaurant_features WHERE restaurant_id = _restaurant_id), false)
    WHEN _feature = 'can_use_favorites' THEN COALESCE((SELECT can_use_favorites FROM restaurant_features WHERE restaurant_id = _restaurant_id), true)
    WHEN _feature = 'can_view_analytics' THEN COALESCE((SELECT can_view_analytics FROM restaurant_features WHERE restaurant_id = _restaurant_id), false)
    WHEN _feature = 'can_use_custom_prices' THEN COALESCE((SELECT can_use_custom_prices FROM restaurant_features WHERE restaurant_id = _restaurant_id), false)
    WHEN _feature = 'can_repeat_orders' THEN COALESCE((SELECT can_repeat_orders FROM restaurant_features WHERE restaurant_id = _restaurant_id), true)
    ELSE false
  END
$$;