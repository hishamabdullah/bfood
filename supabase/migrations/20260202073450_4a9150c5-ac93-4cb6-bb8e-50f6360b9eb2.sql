-- Add delivery_option column to profiles table
-- Options: 'with_fee' (توصيل مع رسوم), 'minimum_only' (توصيل فقط بعد الحد الأدنى), 'no_delivery' (لا توصيل)
ALTER TABLE public.profiles 
ADD COLUMN delivery_option TEXT DEFAULT 'with_fee' CHECK (delivery_option IN ('with_fee', 'minimum_only', 'no_delivery'));