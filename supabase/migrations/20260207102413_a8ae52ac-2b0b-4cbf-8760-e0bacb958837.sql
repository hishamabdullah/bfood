-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  duration_months INTEGER NOT NULL DEFAULT 1,
  can_order BOOLEAN NOT NULL DEFAULT true,
  can_use_templates BOOLEAN NOT NULL DEFAULT false,
  can_use_branches BOOLEAN NOT NULL DEFAULT false,
  can_use_favorites BOOLEAN NOT NULL DEFAULT true,
  can_view_analytics BOOLEAN NOT NULL DEFAULT false,
  can_use_custom_prices BOOLEAN NOT NULL DEFAULT false,
  can_repeat_orders BOOLEAN NOT NULL DEFAULT true,
  can_manage_sub_users BOOLEAN NOT NULL DEFAULT false,
  max_orders_per_month INTEGER,
  max_sub_users INTEGER DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add plan_id to restaurant_features
ALTER TABLE public.restaurant_features 
ADD COLUMN plan_id UUID REFERENCES public.subscription_plans(id);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_plans
CREATE POLICY "Anyone can read active plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can manage plans" 
ON public.subscription_plans 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();