-- Create favorites table for products
CREATE TABLE public.favorite_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create favorites table for suppliers
CREATE TABLE public.favorite_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, supplier_id)
);

-- Enable RLS
ALTER TABLE public.favorite_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_suppliers ENABLE ROW LEVEL SECURITY;

-- RLS policies for favorite_products
CREATE POLICY "المستخدم يمكنه قراءة مفضلاته"
ON public.favorite_products
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "المستخدم يمكنه إضافة للمفضلة"
ON public.favorite_products
FOR INSERT
WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'restaurant'::app_role));

CREATE POLICY "المستخدم يمكنه حذف من مفضلاته"
ON public.favorite_products
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for favorite_suppliers
CREATE POLICY "المستخدم يمكنه قراءة مفضلاته"
ON public.favorite_suppliers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "المستخدم يمكنه إضافة للمفضلة"
ON public.favorite_suppliers
FOR INSERT
WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'restaurant'::app_role));

CREATE POLICY "المستخدم يمكنه حذف من مفضلاته"
ON public.favorite_suppliers
FOR DELETE
USING (auth.uid() = user_id);