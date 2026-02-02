-- Add invoice_url column to order_items table
ALTER TABLE public.order_items 
ADD COLUMN invoice_url text;

-- Create storage bucket for invoices
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Allow suppliers to upload invoices
CREATE POLICY "Suppliers can upload invoices"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'invoices' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow suppliers to update their invoices
CREATE POLICY "Suppliers can update their invoices"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'invoices' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow suppliers to delete their invoices
CREATE POLICY "Suppliers can delete their invoices"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'invoices' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view invoices (public bucket)
CREATE POLICY "Anyone can view invoices"
ON storage.objects
FOR SELECT
USING (bucket_id = 'invoices');