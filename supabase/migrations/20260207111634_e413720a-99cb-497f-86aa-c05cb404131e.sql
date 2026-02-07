-- Add max_notes_chars to subscription plans and restaurant features
ALTER TABLE public.subscription_plans 
ADD COLUMN max_notes_chars INTEGER DEFAULT 500;

ALTER TABLE public.restaurant_features 
ADD COLUMN max_notes_chars INTEGER DEFAULT 500;