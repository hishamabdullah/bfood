-- Add city column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN city text NULL;