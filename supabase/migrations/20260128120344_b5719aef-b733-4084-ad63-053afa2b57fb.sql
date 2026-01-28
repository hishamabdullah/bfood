-- Add bank details columns to profiles table for suppliers
ALTER TABLE public.profiles
ADD COLUMN bank_name text,
ADD COLUMN bank_account_name text,
ADD COLUMN bank_iban text;