-- Create supplier categories table
CREATE TABLE public.supplier_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories
CREATE POLICY "Anyone can read supplier categories"
ON public.supplier_categories
FOR SELECT
USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can insert supplier categories"
ON public.supplier_categories
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update supplier categories"
ON public.supplier_categories
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete supplier categories"
ON public.supplier_categories
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default categories
INSERT INTO public.supplier_categories (name, name_en, icon) VALUES
('خضروات وفواكه', 'Vegetables & Fruits', '🥬'),
('لحوم ودواجن', 'Meat & Poultry', '🍖'),
('أسماك ومأكولات بحرية', 'Fish & Seafood', '🐟'),
('منتجات ألبان', 'Dairy Products', '🧀'),
('مخبوزات', 'Bakery', '🍞'),
('مشروبات', 'Beverages', '🥤'),
('مواد تنظيف', 'Cleaning Supplies', '🧹'),
('تغليف ومستلزمات', 'Packaging & Supplies', '📦'),
('بهارات وتوابل', 'Spices & Seasonings', '🌶️'),
('زيوت وسمن', 'Oils & Ghee', '🫒'),
('أرز وحبوب', 'Rice & Grains', '🌾'),
('معلبات', 'Canned Goods', '🥫');