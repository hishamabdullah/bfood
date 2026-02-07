-- Create trigger to sync subscription_plans changes to restaurant_features
-- When a plan is updated, all restaurants linked to that plan will be updated

CREATE OR REPLACE FUNCTION public.sync_plan_to_restaurant_features()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update all restaurant_features records that reference this plan
  UPDATE public.restaurant_features
  SET 
    can_order = NEW.can_order,
    can_use_templates = NEW.can_use_templates,
    can_use_branches = NEW.can_use_branches,
    can_use_favorites = NEW.can_use_favorites,
    can_view_analytics = NEW.can_view_analytics,
    can_use_custom_prices = NEW.can_use_custom_prices,
    can_repeat_orders = NEW.can_repeat_orders,
    can_manage_sub_users = NEW.can_manage_sub_users,
    max_orders_per_month = NEW.max_orders_per_month,
    max_sub_users = NEW.max_sub_users,
    max_branches = NEW.max_branches,
    max_notes_chars = NEW.max_notes_chars,
    subscription_type = NEW.name,
    updated_at = now()
  WHERE plan_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS trigger_sync_plan_to_restaurant_features ON public.subscription_plans;

-- Create the trigger on subscription_plans UPDATE
CREATE TRIGGER trigger_sync_plan_to_restaurant_features
AFTER UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.sync_plan_to_restaurant_features();