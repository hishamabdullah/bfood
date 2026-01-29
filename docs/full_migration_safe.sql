-- =============================================
-- B-Food Migration Script - Idempotent & Safe
-- يمكن تشغيله عدة مرات بدون أخطاء
-- =============================================

-- 1. ENUM TYPE
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin', 'restaurant', 'supplier'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  google_maps_url TEXT,
  bio TEXT,
  region TEXT,
  supply_categories TEXT[],
  is_approved BOOLEAN NOT NULL DEFAULT false,
  customer_code TEXT UNIQUE,
  minimum_order_amount NUMERIC DEFAULT 0,
  default_delivery_fee NUMERIC DEFAULT 0,
  bank_name TEXT,
  bank_account_name TEXT,
  bank_iban TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'restaurant',
  UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  name_en TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  name TEXT NOT NULL,
  google_maps_url TEXT,
  address TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  name TEXT NOT NULL,
  name_en TEXT,
  name_ur TEXT,
  name_hi TEXT,
  description TEXT,
  description_en TEXT,
  description_ur TEXT,
  description_hi TEXT,
  price NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'كيلو',
  image_url TEXT,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  country_of_origin TEXT DEFAULT 'السعودية',
  stock_quantity INTEGER DEFAULT 0,
  unlimited_stock BOOLEAN DEFAULT false,
  delivery_fee NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  branch_id UUID REFERENCES public.branches(id),
  total_amount NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  delivery_address TEXT,
  notes TEXT,
  is_pickup BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  delivery_fee NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'order',
  is_read BOOLEAN NOT NULL DEFAULT false,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favorite_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.favorite_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, supplier_id)
);

CREATE TABLE IF NOT EXISTS public.product_custom_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  custom_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, restaurant_id)
);

CREATE TABLE IF NOT EXISTS public.product_price_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  min_quantity INTEGER NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  supplier_id UUID NOT NULL,
  restaurant_id UUID NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, restaurant_id)
);

-- 3. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_custom_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_price_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- 4. FUNCTIONS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID) RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_approved FROM public.profiles WHERE user_id = _user_id LIMIT 1), false)
$$;

CREATE OR REPLACE FUNCTION public.supplier_has_order_items(_order_id uuid, _supplier_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.order_items WHERE order_id = _order_id AND supplier_id = _supplier_id)
$$;

CREATE OR REPLACE FUNCTION public.get_order_restaurant_id(_order_id uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT restaurant_id FROM public.orders WHERE id = _order_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_customer_code() RETURNS TRIGGER AS $$
DECLARE new_code TEXT; code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE customer_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  NEW.customer_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.auto_approve_supplier() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'supplier' THEN UPDATE public.profiles SET is_approved = true WHERE user_id = NEW.user_id; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_approved_restaurants() RETURNS TABLE (user_id uuid, business_name text, full_name text, customer_code text, created_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.user_id, p.business_name, p.full_name, p.customer_code, p.created_at
  FROM public.profiles p INNER JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE ur.role = 'restaurant' AND p.is_approved = true AND (has_role(auth.uid(), 'supplier') OR has_role(auth.uid(), 'admin'))
  ORDER BY p.created_at DESC
$$;

-- 5. TRIGGERS
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_branches_updated_at ON public.branches;
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_custom_prices_updated_at ON public.product_custom_prices;
CREATE TRIGGER update_product_custom_prices_updated_at BEFORE UPDATE ON public.product_custom_prices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_payments_updated_at ON public.order_payments;
CREATE TRIGGER update_order_payments_updated_at BEFORE UPDATE ON public.order_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS generate_customer_code_trigger ON public.profiles;
CREATE TRIGGER generate_customer_code_trigger BEFORE INSERT ON public.profiles FOR EACH ROW WHEN (NEW.customer_code IS NULL) EXECUTE FUNCTION public.generate_customer_code();

DROP TRIGGER IF EXISTS auto_approve_supplier_trigger ON public.user_roles;
CREATE TRIGGER auto_approve_supplier_trigger AFTER INSERT ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.auto_approve_supplier();

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_product_custom_prices_product ON public.product_custom_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_product_custom_prices_restaurant ON public.product_custom_prices(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_product_custom_prices_supplier ON public.product_custom_prices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_profiles_customer_code ON public.profiles(customer_code);
CREATE INDEX IF NOT EXISTS idx_product_price_tiers_product_id ON public.product_price_tiers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_price_tiers_min_quantity ON public.product_price_tiers(product_id, min_quantity);

-- 7. RLS POLICIES (profiles)
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR (is_user_approved(auth.uid()) AND auth.uid() IS NOT NULL));

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 7. RLS POLICIES (user_roles)
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_roles_admin" ON public.user_roles;
CREATE POLICY "user_roles_admin" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
CREATE POLICY "user_roles_insert" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id AND role IN ('restaurant', 'supplier'));

DROP POLICY IF EXISTS "user_roles_select_suppliers" ON public.user_roles;
CREATE POLICY "user_roles_select_suppliers" ON public.user_roles FOR SELECT USING ((role = 'supplier' AND has_role(auth.uid(), 'restaurant') AND is_user_approved(auth.uid())) OR has_role(auth.uid(), 'admin'));

-- 7. RLS POLICIES (categories)
DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (has_role(auth.uid(), 'admin') OR is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "categories_admin" ON public.categories;
CREATE POLICY "categories_admin" ON public.categories FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 7. RLS POLICIES (products)
DROP POLICY IF EXISTS "products_select" ON public.products;
CREATE POLICY "products_select" ON public.products FOR SELECT USING (has_role(auth.uid(), 'admin') OR is_user_approved(auth.uid()) OR (auth.uid() = supplier_id AND has_role(auth.uid(), 'supplier')));

DROP POLICY IF EXISTS "products_insert" ON public.products;
CREATE POLICY "products_insert" ON public.products FOR INSERT WITH CHECK (auth.uid() = supplier_id AND has_role(auth.uid(), 'supplier'));

DROP POLICY IF EXISTS "products_update_own" ON public.products;
CREATE POLICY "products_update_own" ON public.products FOR UPDATE USING (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "products_delete_own" ON public.products;
CREATE POLICY "products_delete_own" ON public.products FOR DELETE USING (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "products_update_admin" ON public.products;
CREATE POLICY "products_update_admin" ON public.products FOR UPDATE USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
CREATE POLICY "products_delete_admin" ON public.products FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 7. RLS POLICIES (orders)
DROP POLICY IF EXISTS "orders_select_restaurant" ON public.orders;
CREATE POLICY "orders_select_restaurant" ON public.orders FOR SELECT USING (auth.uid() = restaurant_id OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (auth.uid() = restaurant_id AND has_role(auth.uid(), 'restaurant'));

DROP POLICY IF EXISTS "orders_update" ON public.orders;
CREATE POLICY "orders_update" ON public.orders FOR UPDATE USING (auth.uid() = restaurant_id);

DROP POLICY IF EXISTS "orders_select_supplier" ON public.orders;
CREATE POLICY "orders_select_supplier" ON public.orders FOR SELECT USING (supplier_has_order_items(id, auth.uid()));

-- 7. RLS POLICIES (order_items)
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT USING (supplier_id = auth.uid() OR get_order_restaurant_id(order_id) = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.restaurant_id = auth.uid()));

DROP POLICY IF EXISTS "order_items_update" ON public.order_items;
CREATE POLICY "order_items_update" ON public.order_items FOR UPDATE USING (auth.uid() = supplier_id);

-- 7. RLS POLICIES (notifications)
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);

-- 7. RLS POLICIES (favorites)
DROP POLICY IF EXISTS "fav_products_select" ON public.favorite_products;
CREATE POLICY "fav_products_select" ON public.favorite_products FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "fav_products_insert" ON public.favorite_products;
CREATE POLICY "fav_products_insert" ON public.favorite_products FOR INSERT WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'restaurant'));

DROP POLICY IF EXISTS "fav_products_delete" ON public.favorite_products;
CREATE POLICY "fav_products_delete" ON public.favorite_products FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "fav_suppliers_select" ON public.favorite_suppliers;
CREATE POLICY "fav_suppliers_select" ON public.favorite_suppliers FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "fav_suppliers_insert" ON public.favorite_suppliers;
CREATE POLICY "fav_suppliers_insert" ON public.favorite_suppliers FOR INSERT WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'restaurant'));

DROP POLICY IF EXISTS "fav_suppliers_delete" ON public.favorite_suppliers;
CREATE POLICY "fav_suppliers_delete" ON public.favorite_suppliers FOR DELETE USING (auth.uid() = user_id);

-- 7. RLS POLICIES (custom_prices)
DROP POLICY IF EXISTS "custom_prices_select_supplier" ON public.product_custom_prices;
CREATE POLICY "custom_prices_select_supplier" ON public.product_custom_prices FOR SELECT USING (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "custom_prices_insert" ON public.product_custom_prices;
CREATE POLICY "custom_prices_insert" ON public.product_custom_prices FOR INSERT WITH CHECK (auth.uid() = supplier_id AND has_role(auth.uid(), 'supplier'));

DROP POLICY IF EXISTS "custom_prices_update" ON public.product_custom_prices;
CREATE POLICY "custom_prices_update" ON public.product_custom_prices FOR UPDATE USING (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "custom_prices_delete" ON public.product_custom_prices;
CREATE POLICY "custom_prices_delete" ON public.product_custom_prices FOR DELETE USING (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "custom_prices_select_restaurant" ON public.product_custom_prices;
CREATE POLICY "custom_prices_select_restaurant" ON public.product_custom_prices FOR SELECT USING (auth.uid() = restaurant_id AND has_role(auth.uid(), 'restaurant'));

DROP POLICY IF EXISTS "custom_prices_select_admin" ON public.product_custom_prices;
CREATE POLICY "custom_prices_select_admin" ON public.product_custom_prices FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- 7. RLS POLICIES (price_tiers)
DROP POLICY IF EXISTS "price_tiers_select_supplier" ON public.product_price_tiers;
CREATE POLICY "price_tiers_select_supplier" ON public.product_price_tiers FOR SELECT USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_price_tiers.product_id AND products.supplier_id = auth.uid()));

DROP POLICY IF EXISTS "price_tiers_insert" ON public.product_price_tiers;
CREATE POLICY "price_tiers_insert" ON public.product_price_tiers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_price_tiers.product_id AND products.supplier_id = auth.uid()) AND has_role(auth.uid(), 'supplier'));

DROP POLICY IF EXISTS "price_tiers_update" ON public.product_price_tiers;
CREATE POLICY "price_tiers_update" ON public.product_price_tiers FOR UPDATE USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_price_tiers.product_id AND products.supplier_id = auth.uid()));

DROP POLICY IF EXISTS "price_tiers_delete" ON public.product_price_tiers;
CREATE POLICY "price_tiers_delete" ON public.product_price_tiers FOR DELETE USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_price_tiers.product_id AND products.supplier_id = auth.uid()));

DROP POLICY IF EXISTS "price_tiers_select_approved" ON public.product_price_tiers;
CREATE POLICY "price_tiers_select_approved" ON public.product_price_tiers FOR SELECT USING (is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "price_tiers_select_admin" ON public.product_price_tiers;
CREATE POLICY "price_tiers_select_admin" ON public.product_price_tiers FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- 7. RLS POLICIES (branches)
DROP POLICY IF EXISTS "branches_select" ON public.branches;
CREATE POLICY "branches_select" ON public.branches FOR SELECT USING (auth.uid() = restaurant_id OR has_role(auth.uid(), 'supplier') OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "branches_insert" ON public.branches;
CREATE POLICY "branches_insert" ON public.branches FOR INSERT WITH CHECK (auth.uid() = restaurant_id AND has_role(auth.uid(), 'restaurant'));

DROP POLICY IF EXISTS "branches_update" ON public.branches;
CREATE POLICY "branches_update" ON public.branches FOR UPDATE USING (auth.uid() = restaurant_id);

DROP POLICY IF EXISTS "branches_delete" ON public.branches;
CREATE POLICY "branches_delete" ON public.branches FOR DELETE USING (auth.uid() = restaurant_id);

-- 7. RLS POLICIES (site_settings)
DROP POLICY IF EXISTS "site_settings_select" ON public.site_settings;
CREATE POLICY "site_settings_select" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_settings_admin" ON public.site_settings;
CREATE POLICY "site_settings_admin" ON public.site_settings FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 7. RLS POLICIES (order_payments)
DROP POLICY IF EXISTS "payments_select_restaurant" ON public.order_payments;
CREATE POLICY "payments_select_restaurant" ON public.order_payments FOR SELECT USING (auth.uid() = restaurant_id);

DROP POLICY IF EXISTS "payments_select_supplier" ON public.order_payments;
CREATE POLICY "payments_select_supplier" ON public.order_payments FOR SELECT USING (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "payments_insert" ON public.order_payments;
CREATE POLICY "payments_insert" ON public.order_payments FOR INSERT WITH CHECK (auth.uid() = restaurant_id AND has_role(auth.uid(), 'restaurant'));

DROP POLICY IF EXISTS "payments_update" ON public.order_payments;
CREATE POLICY "payments_update" ON public.order_payments FOR UPDATE USING (auth.uid() = restaurant_id);

-- 8. STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "logos_select" ON storage.objects;
CREATE POLICY "logos_select" ON storage.objects FOR SELECT USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "logos_insert" ON storage.objects;
CREATE POLICY "logos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "logos_update" ON storage.objects;
CREATE POLICY "logos_update" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "logos_delete" ON storage.objects;
CREATE POLICY "logos_delete" ON storage.objects FOR DELETE USING (bucket_id = 'logos' AND has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "receipts_insert" ON storage.objects;
CREATE POLICY "receipts_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-receipts' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "receipts_select" ON storage.objects;
CREATE POLICY "receipts_select" ON storage.objects FOR SELECT USING (bucket_id = 'payment-receipts');

-- 9. REALTIME
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'order_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'order_payments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_payments;
  END IF;
END $$;

-- 10. DEFAULT DATA
INSERT INTO public.categories (name, icon) VALUES ('خضروات', '🥬'), ('فواكه', '🍎'), ('لحوم', '🥩'), ('دواجن', '🍗'), ('أسماك', '🐟'), ('ألبان', '🥛'), ('زيوت', '🫒'), ('حبوب', '🌾'), ('توابل', '🌶️'), ('مشروبات', '🥤') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.site_settings (key, value) VALUES ('header_logo_url', NULL), ('favicon_url', NULL) ON CONFLICT (key) DO NOTHING;

UPDATE public.profiles SET is_approved = true WHERE user_id IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'supplier'));
