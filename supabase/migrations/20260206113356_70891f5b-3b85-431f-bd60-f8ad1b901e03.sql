-- Create storage bucket for registration documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('registration-documents', 'registration-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for registration documents bucket
-- Anyone can view the documents (for admin verification)
CREATE POLICY "Registration documents are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'registration-documents');

-- Users can upload their own documents during registration
CREATE POLICY "Users can upload their own registration documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'registration-documents');

-- Users can update their own documents
CREATE POLICY "Users can update their own registration documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'registration-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add columns to profiles table for document URLs and English business name
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS business_name_en TEXT,
ADD COLUMN IF NOT EXISTS commercial_registration_url TEXT,
ADD COLUMN IF NOT EXISTS license_url TEXT,
ADD COLUMN IF NOT EXISTS tax_certificate_url TEXT,
ADD COLUMN IF NOT EXISTS national_address_url TEXT;