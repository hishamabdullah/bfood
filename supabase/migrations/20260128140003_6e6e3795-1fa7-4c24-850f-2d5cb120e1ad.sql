-- Create table for product price tiers (quantity-based pricing)
CREATE TABLE public.product_price_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  min_quantity INTEGER NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_price_tiers ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_product_price_tiers_product_id ON public.product_price_tiers(product_id);
CREATE INDEX idx_product_price_tiers_min_quantity ON public.product_price_tiers(product_id, min_quantity);

-- Suppliers can manage their product price tiers
CREATE POLICY "المورد يمكنه قراءة شرائح أسعار منتجاته"
ON public.product_price_tiers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_price_tiers.product_id 
    AND products.supplier_id = auth.uid()
  )
);

CREATE POLICY "المورد يمكنه إضافة شرائح أسعار منتجاته"
ON public.product_price_tiers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_price_tiers.product_id 
    AND products.supplier_id = auth.uid()
  )
  AND has_role(auth.uid(), 'supplier'::app_role)
);

CREATE POLICY "المورد يمكنه تحديث شرائح أسعار منتجاته"
ON public.product_price_tiers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_price_tiers.product_id 
    AND products.supplier_id = auth.uid()
  )
);

CREATE POLICY "المورد يمكنه حذف شرائح أسعار منتجاته"
ON public.product_price_tiers
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_price_tiers.product_id 
    AND products.supplier_id = auth.uid()
  )
);

-- Restaurants can view price tiers for products they can see
CREATE POLICY "المطاعم المعتمدة يمكنها رؤية شرائح الأسعار"
ON public.product_price_tiers
FOR SELECT
USING (
  is_user_approved(auth.uid())
);

-- Admin can view all
CREATE POLICY "المدير يمكنه رؤية جميع شرائح الأسعار"
ON public.product_price_tiers
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
);