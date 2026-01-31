-- Create subcategories table
CREATE TABLE public.subcategories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_en TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add subcategory_id to products table
ALTER TABLE public.products ADD COLUMN subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL;

-- Enable RLS on subcategories
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subcategories
CREATE POLICY "المدير فقط يمكنه إدارة الأقسام الفرعية"
ON public.subcategories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "المستخدمون المعتمدون يمكنهم قراءة الأقسام"
ON public.subcategories
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_user_approved(auth.uid()));

-- Create index for better performance
CREATE INDEX idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX idx_products_subcategory_id ON public.products(subcategory_id);