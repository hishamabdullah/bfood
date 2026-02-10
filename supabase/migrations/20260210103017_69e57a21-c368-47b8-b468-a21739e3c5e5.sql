
-- Junction table: product ↔ categories (many-to-many)
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, category_id)
);

-- Junction table: product ↔ subcategories (many-to-many)
CREATE TABLE public.product_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, subcategory_id)
);

-- Junction table: product ↔ sections (many-to-many)
CREATE TABLE public.product_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, section_id)
);

-- Enable RLS on all junction tables
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sections ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_categories
CREATE POLICY "Anyone approved can read product categories"
ON public.product_categories FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_user_approved(auth.uid()));

CREATE POLICY "Supplier can manage their product categories"
ON public.product_categories FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = product_categories.product_id AND products.supplier_id = auth.uid()));

CREATE POLICY "Supplier can delete their product categories"
ON public.product_categories FOR DELETE
USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_categories.product_id AND products.supplier_id = auth.uid()));

CREATE POLICY "Admin can manage product categories"
ON public.product_categories FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for product_subcategories
CREATE POLICY "Anyone approved can read product subcategories"
ON public.product_subcategories FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_user_approved(auth.uid()));

CREATE POLICY "Supplier can manage their product subcategories"
ON public.product_subcategories FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = product_subcategories.product_id AND products.supplier_id = auth.uid()));

CREATE POLICY "Supplier can delete their product subcategories"
ON public.product_subcategories FOR DELETE
USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_subcategories.product_id AND products.supplier_id = auth.uid()));

CREATE POLICY "Admin can manage product subcategories"
ON public.product_subcategories FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for product_sections
CREATE POLICY "Anyone approved can read product sections"
ON public.product_sections FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_user_approved(auth.uid()));

CREATE POLICY "Supplier can manage their product sections"
ON public.product_sections FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = product_sections.product_id AND products.supplier_id = auth.uid()));

CREATE POLICY "Supplier can delete their product sections"
ON public.product_sections FOR DELETE
USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_sections.product_id AND products.supplier_id = auth.uid()));

CREATE POLICY "Admin can manage product sections"
ON public.product_sections FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing data from single FK fields to junction tables
INSERT INTO public.product_categories (product_id, category_id)
SELECT id, category_id FROM products WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.product_subcategories (product_id, subcategory_id)
SELECT id, subcategory_id FROM products WHERE subcategory_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.product_sections (product_id, section_id)
SELECT id, section_id FROM products WHERE section_id IS NOT NULL
ON CONFLICT DO NOTHING;
