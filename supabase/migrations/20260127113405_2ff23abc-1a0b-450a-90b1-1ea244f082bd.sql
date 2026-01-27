-- Create table for custom product prices per restaurant
CREATE TABLE public.product_custom_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  custom_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, restaurant_id)
);

-- Enable RLS
ALTER TABLE public.product_custom_prices ENABLE ROW LEVEL SECURITY;

-- Supplier can manage their custom prices
CREATE POLICY "المورد يمكنه قراءة أسعاره المخصصة"
ON public.product_custom_prices FOR SELECT
USING (auth.uid() = supplier_id);

CREATE POLICY "المورد يمكنه إضافة أسعار مخصصة"
ON public.product_custom_prices FOR INSERT
WITH CHECK (auth.uid() = supplier_id AND has_role(auth.uid(), 'supplier'));

CREATE POLICY "المورد يمكنه تحديث أسعاره المخصصة"
ON public.product_custom_prices FOR UPDATE
USING (auth.uid() = supplier_id);

CREATE POLICY "المورد يمكنه حذف أسعاره المخصصة"
ON public.product_custom_prices FOR DELETE
USING (auth.uid() = supplier_id);

-- Restaurant can see prices customized for them
CREATE POLICY "المطعم يمكنه رؤية أسعاره المخصصة"
ON public.product_custom_prices FOR SELECT
USING (auth.uid() = restaurant_id AND has_role(auth.uid(), 'restaurant'));

-- Admin can see all
CREATE POLICY "المدير يمكنه رؤية جميع الأسعار"
ON public.product_custom_prices FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_product_custom_prices_updated_at
BEFORE UPDATE ON public.product_custom_prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_product_custom_prices_product ON public.product_custom_prices(product_id);
CREATE INDEX idx_product_custom_prices_restaurant ON public.product_custom_prices(restaurant_id);
CREATE INDEX idx_product_custom_prices_supplier ON public.product_custom_prices(supplier_id);