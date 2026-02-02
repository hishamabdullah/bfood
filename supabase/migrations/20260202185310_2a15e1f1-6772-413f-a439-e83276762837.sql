-- Create table for restaurant feature subscriptions
CREATE TABLE public.restaurant_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  can_order BOOLEAN NOT NULL DEFAULT true,
  can_use_templates BOOLEAN NOT NULL DEFAULT false,
  can_use_branches BOOLEAN NOT NULL DEFAULT false,
  can_use_favorites BOOLEAN NOT NULL DEFAULT true,
  can_view_analytics BOOLEAN NOT NULL DEFAULT false,
  can_use_custom_prices BOOLEAN NOT NULL DEFAULT false,
  max_orders_per_month INTEGER DEFAULT NULL,
  subscription_type TEXT DEFAULT 'basic',
  subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  subscription_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurant_features ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "المدير يمكنه إدارة ميزات المطاعم"
ON public.restaurant_features
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Restaurant can read their own features
CREATE POLICY "المطعم يمكنه قراءة ميزاته"
ON public.restaurant_features
FOR SELECT
USING (auth.uid() = restaurant_id);

-- Create trigger for updated_at
CREATE TRIGGER update_restaurant_features_updated_at
BEFORE UPDATE ON public.restaurant_features
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_restaurant_features_restaurant_id ON public.restaurant_features(restaurant_id);
CREATE INDEX idx_restaurant_features_is_active ON public.restaurant_features(is_active);

-- Create function to check if restaurant has a specific feature
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
    ELSE false
  END
$$;