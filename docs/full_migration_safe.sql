-- ============================================
-- ملف Migration موحد وآمن لإعادة التشغيل
-- يستخدم IF NOT EXISTS و IF EXISTS لتجنب الأخطاء
-- آخر تحديث: يناير 2026
-- ============================================

-- إنشاء نوع أدوار المستخدمين
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'restaurant', 'supplier');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- الجداول الأساسية
-- ============================================

-- جدول الملفات الشخصية للمستخدمين
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  google_maps_url TEXT,
  bio TEXT,
  region TEXT,
  supply_categories TEXT[],
  is_approved boolean NOT NULL DEFAULT false,
  customer_code TEXT,
  minimum_order_amount NUMERIC DEFAULT 0,
  default_delivery_fee NUMERIC DEFAULT 0,
  bank_name text,
  bank_account_name text,
  bank_iban text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة قيد unique لـ user_id إذا لم يكن موجوداً
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- إضافة قيد unique لـ customer_code إذا لم يكن موجوداً
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_customer_code_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_customer_code_key UNIQUE (customer_code);
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- جدول أدوار المستخدمين
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'restaurant'
);

-- إضافة قيد unique لـ user_id و role إذا لم يكن موجوداً
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- جدول التصنيفات
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة قيد unique لـ name إذا لم يكن موجوداً
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_name_key'
  ) THEN
    ALTER TABLE public.categories ADD CONSTRAINT categories_name_key UNIQUE (name);
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- جدول المنتجات
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  category_id UUID,
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
  country_of_origin text DEFAULT 'السعودية',
  stock_quantity integer DEFAULT 0,
  unlimited_stock BOOLEAN DEFAULT false,
  delivery_fee numeric DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة foreign key لـ category_id إذا لم يكن موجوداً
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_category_id_fkey'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- جدول الطلبات الرئيسي
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  branch_id UUID,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  delivery_address TEXT,
  notes TEXT,
  is_pickup boolean DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الفروع
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  name TEXT NOT NULL,
  google_maps_url TEXT,
  address TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة foreign key للطلبات بعد إنشاء جدول الفروع
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_branch_id_fkey'
  ) THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- جدول عناصر الطلبات
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  delivery_fee NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة foreign keys لـ order_items
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_items_order_id_fkey'
  ) THEN
    ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_items_product_id_fkey'
  ) THEN
    ALTER TABLE public.order_items ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- جدول الإشعارات
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'order',
  is_read BOOLEAN NOT NULL DEFAULT false,
  order_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة foreign key لـ order_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_order_id_fkey'
  ) THEN
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- جدول المفضلة للمنتجات
CREATE TABLE IF NOT EXISTS public.favorite_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة القيود لـ favorite_products
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'favorite_products_product_id_fkey'
  ) THEN
    ALTER TABLE public.favorite_products ADD CONSTRAINT favorite_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'favorite_products_user_id_product_id_key'
  ) THEN
    ALTER TABLE public.favorite_products ADD CONSTRAINT favorite_products_user_id_product_id_key UNIQUE (user_id, product_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- جدول المفضلة للموردين
CREATE TABLE IF NOT EXISTS public.favorite_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة قيد unique لـ favorite_suppliers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'favorite_suppliers_user_id_supplier_id_key'
  ) THEN
    ALTER TABLE public.favorite_suppliers ADD CONSTRAINT favorite_suppliers_user_id_supplier_id_key UNIQUE (user_id, supplier_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- جدول الأسعار المخصصة
CREATE TABLE IF NOT EXISTS public.product_custom_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  restaurant_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  custom_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة القيود لـ product_custom_prices
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_custom_prices_product_id_fkey'
  ) THEN
    ALTER TABLE public.product_custom_prices ADD CONSTRAINT product_custom_prices_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_custom_prices_product_id_restaurant_id_key'
  ) THEN
    ALTER TABLE public.product_custom_prices ADD CONSTRAINT product_custom_prices_product_id_restaurant_id_key UNIQUE (product_id, restaurant_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- جدول شرائح الأسعار
CREATE TABLE IF NOT EXISTS public.product_price_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  min_quantity INTEGER NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة foreign key لـ product_price_tiers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_price_tiers_product_id_fkey'
  ) THEN
    ALTER TABLE public.product_price_tiers ADD CONSTRAINT product_price_tiers_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- جدول إعدادات الموقع
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL,
  value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- إضافة قيد unique لـ key
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_key_key'
  ) THEN
    ALTER TABLE public.site_settings ADD CONSTRAINT site_settings_key_key UNIQUE (key);
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- جدول المدفوعات
CREATE TABLE IF NOT EXISTS public.order_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID,
  supplier_id UUID NOT NULL,
  restaurant_id UUID NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة foreign key لـ order_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_payments_order_id_fkey'
  ) THEN
    ALTER TABLE public.order_payments ADD CONSTRAINT order_payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- إضافة قيد فريد للمدفوعات
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_payments_supplier_restaurant_unique'
  ) THEN
    ALTER TABLE public.order_payments ADD CONSTRAINT order_payments_supplier_restaurant_unique UNIQUE (supplier_id, restaurant_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- تفعيل RLS على جميع الجداول
-- ============================================

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

-- ============================================
-- الدوال (Functions)
-- ============================================

-- دالة للتحقق من الدور
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- دالة للحصول على دور المستخدم
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- دالة للتحقق من موافقة المستخدم
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_approved FROM public.profiles WHERE user_id = _user_id LIMIT 1),
    false
  )
$$;

-- دالة للتحقق من أن المورد له عناصر في الطلب
CREATE OR REPLACE FUNCTION public.supplier_has_order_items(_order_id uuid, _supplier_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.order_items
    WHERE order_id = _order_id AND supplier_id = _supplier_id
  )
$$;

-- دالة للحصول على restaurant_id من الطلب
CREATE OR REPLACE FUNCTION public.get_order_restaurant_id(_order_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT restaurant_id FROM public.orders WHERE id = _order_id LIMIT 1
$$;

-- دالة تحديث updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- دالة لتوليد رقم عميل تلقائي
CREATE OR REPLACE FUNCTION public.generate_customer_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
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

-- دالة لاعتماد الموردين تلقائياً
CREATE OR REPLACE FUNCTION public.auto_approve_supplier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'supplier' THEN
    UPDATE public.profiles
    SET is_approved = true
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- دالة لجلب المطاعم المعتمدة
CREATE OR REPLACE FUNCTION public.get_approved_restaurants()
RETURNS TABLE (
  user_id uuid,
  business_name text,
  full_name text,
  customer_code text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.business_name,
    p.full_name,
    p.customer_code,
    p.created_at
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE ur.role = 'restaurant'
    AND p.is_approved = true
    AND (has_role(auth.uid(), 'supplier') OR has_role(auth.uid(), 'admin'))
  ORDER BY p.created_at DESC
$$;

-- ============================================
-- الـ Triggers
-- ============================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_branches_updated_at ON public.branches;
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_custom_prices_updated_at ON public.product_custom_prices;
CREATE TRIGGER update_product_custom_prices_updated_at
  BEFORE UPDATE ON public.product_custom_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_payments_updated_at ON public.order_payments;
CREATE TRIGGER update_order_payments_updated_at
  BEFORE UPDATE ON public.order_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS generate_customer_code_trigger ON public.profiles;
CREATE TRIGGER generate_customer_code_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.customer_code IS NULL)
  EXECUTE FUNCTION public.generate_customer_code();

DROP TRIGGER IF EXISTS auto_approve_supplier_trigger ON public.user_roles;
CREATE TRIGGER auto_approve_supplier_trigger
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.auto_approve_supplier();

-- ============================================
-- الفهارس (Indexes)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_product_custom_prices_product ON public.product_custom_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_product_custom_prices_restaurant ON public.product_custom_prices(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_product_custom_prices_supplier ON public.product_custom_prices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_profiles_customer_code ON public.profiles(customer_code);
CREATE INDEX IF NOT EXISTS idx_product_price_tiers_product_id ON public.product_price_tiers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_price_tiers_min_quantity ON public.product_price_tiers(product_id, min_quantity);

-- ============================================
-- سياسات RLS للملفات الشخصية (profiles)
-- ============================================

DROP POLICY IF EXISTS "يمكن للمستخدم إنشاء ملفه الشخصي" ON public.profiles;
CREATE POLICY "يمكن للمستخدم إنشاء ملفه الشخصي"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "يمكن للمستخدم تحديث ملفه الشخصي" ON public.profiles;
CREATE POLICY "يمكن للمستخدم تحديث ملفه الشخصي"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "المستخدمون المعتمدون يمكنهم قراءة" ON public.profiles;
CREATE POLICY "المستخدمون المعتمدون يمكنهم قراءة"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = user_id
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (is_user_approved(auth.uid()) AND auth.uid() IS NOT NULL)
  );

DROP POLICY IF EXISTS "المدير يمكنه تحديث أي ملف شخصي" ON public.profiles;
CREATE POLICY "المدير يمكنه تحديث أي ملف شخصي"
  ON public.profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- سياسات RLS لأدوار المستخدمين (user_roles)
-- ============================================

DROP POLICY IF EXISTS "يمكن للمستخدم قراءة دوره" ON public.user_roles;
CREATE POLICY "يمكن للمستخدم قراءة دوره"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "المدير فقط يمكنه إدارة الأدوار" ON public.user_roles;
CREATE POLICY "المدير فقط يمكنه إدارة الأدوار"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "يمكن للمستخدم إنشاء دوره عند التسجيل" ON public.user_roles;
CREATE POLICY "يمكن للمستخدم إنشاء دوره عند التسجيل"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND role IN ('restaurant'::app_role, 'supplier'::app_role)
  );

DROP POLICY IF EXISTS "المطاعم المعتمدة يمكنها رؤية أدوا" ON public.user_roles;
CREATE POLICY "المطاعم المعتمدة يمكنها رؤية أدوا"
  ON public.user_roles FOR SELECT
  USING (
    (role = 'supplier'::app_role AND has_role(auth.uid(), 'restaurant'::app_role) AND is_user_approved(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- سياسات RLS للتصنيفات (categories)
-- ============================================

DROP POLICY IF EXISTS "المستخدمون المعتمدون يمكنهم قراءة" ON public.categories;
CREATE POLICY "المستخدمون المعتمدون يمكنهم قراءة"
  ON public.categories FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR is_user_approved(auth.uid())
  );

DROP POLICY IF EXISTS "المدير فقط يمكنه إدارة التصنيفات" ON public.categories;
CREATE POLICY "المدير فقط يمكنه إدارة التصنيفات"
  ON public.categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- سياسات RLS للمنتجات (products)
-- ============================================

DROP POLICY IF EXISTS "المستخدمون المعتمدون يمكنهم قراءة" ON public.products;
CREATE POLICY "المستخدمون المعتمدون يمكنهم قراءة"
  ON public.products FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR is_user_approved(auth.uid())
    OR (auth.uid() = supplier_id AND has_role(auth.uid(), 'supplier'::app_role))
  );

DROP POLICY IF EXISTS "المورد يمكنه إضافة منتجاته" ON public.products;
CREATE POLICY "المورد يمكنه إضافة منتجاته"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = supplier_id AND public.has_role(auth.uid(), 'supplier'));

DROP POLICY IF EXISTS "المورد يمكنه تحديث منتجاته" ON public.products;
CREATE POLICY "المورد يمكنه تحديث منتجاته"
  ON public.products FOR UPDATE
  USING (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "المورد يمكنه حذف منتجاته" ON public.products;
CREATE POLICY "المورد يمكنه حذف منتجاته"
  ON public.products FOR DELETE
  USING (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "المدير يمكنه تحديث أي منتج" ON public.products;
CREATE POLICY "المدير يمكنه تحديث أي منتج"
  ON public.products FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "المدير يمكنه حذف أي منتج" ON public.products;
CREATE POLICY "المدير يمكنه حذف أي منتج"
  ON public.products FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- سياسات RLS للطلبات (orders)
-- ============================================

DROP POLICY IF EXISTS "المطعم يمكنه قراءة طلباته" ON public.orders;
CREATE POLICY "المطعم يمكنه قراءة طلباته"
  ON public.orders FOR SELECT
  USING (auth.uid() = restaurant_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "المطعم يمكنه إنشاء طلب" ON public.orders;
CREATE POLICY "المطعم يمكنه إنشاء طلب"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = restaurant_id AND public.has_role(auth.uid(), 'restaurant'));

DROP POLICY IF EXISTS "المطعم يمكنه تحديث طلباته" ON public.orders;
CREATE POLICY "المطعم يمكنه تحديث طلباته"
  ON public.orders FOR UPDATE
  USING (auth.uid() = restaurant_id);

DROP POLICY IF EXISTS "المورد يمكنه قراءة الطلبات المتعل" ON public.orders;
CREATE POLICY "المورد يمكنه قراءة الطلبات المتعل"
  ON public.orders FOR SELECT
  USING (public.supplier_has_order_items(id, auth.uid()));

-- ============================================
-- سياسات RLS لعناصر الطلبات (order_items)
-- ============================================

DROP POLICY IF EXISTS "قراءة عناصر الطلبات" ON public.order_items;
CREATE POLICY "قراءة عناصر الطلبات"
  ON public.order_items FOR SELECT
  USING (
    supplier_id = auth.uid() 
    OR public.get_order_restaurant_id(order_id) = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "إضافة عناصر الطلبات" ON public.order_items;
CREATE POLICY "إضافة عناصر الطلبات"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.restaurant_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "المورد يمكنه تحديث حالة عناصر طلبا" ON public.order_items;
CREATE POLICY "المورد يمكنه تحديث حالة عناصر طلبا"
  ON public.order_items FOR UPDATE
  USING (auth.uid() = supplier_id);

-- ============================================
-- سياسات RLS للإشعارات (notifications)
-- ============================================

DROP POLICY IF EXISTS "المستخدم يقرأ إشعاراته" ON public.notifications;
CREATE POLICY "المستخدم يقرأ إشعاراته"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "المستخدم يحدث إشعاراته" ON public.notifications;
CREATE POLICY "المستخدم يحدث إشعاراته"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "إضافة إشعارات للطلبات" ON public.notifications;
CREATE POLICY "إضافة إشعارات للطلبات"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- سياسات RLS للمفضلة
-- ============================================

DROP POLICY IF EXISTS "المستخدم يمكنه قراءة مفضلاته" ON public.favorite_products;
CREATE POLICY "المستخدم يمكنه قراءة مفضلاته"
  ON public.favorite_products FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "المستخدم يمكنه إضافة للمفضلة" ON public.favorite_products;
CREATE POLICY "المستخدم يمكنه إضافة للمفضلة"
  ON public.favorite_products FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'restaurant'::app_role));

DROP POLICY IF EXISTS "المستخدم يمكنه حذف من مفضلاته" ON public.favorite_products;
CREATE POLICY "المستخدم يمكنه حذف من مفضلاته"
  ON public.favorite_products FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "المستخدم يمكنه قراءة مفضلاته" ON public.favorite_suppliers;
CREATE POLICY "المستخدم يمكنه قراءة مفضلاته"
  ON public.favorite_suppliers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "المستخدم يمكنه إضافة للمفضلة" ON public.favorite_suppliers;
CREATE POLICY "المستخدم يمكنه إضافة للمفضلة"
  ON public.favorite_suppliers FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'restaurant'::app_role));

DROP POLICY IF EXISTS "المستخدم يمكنه حذف من مفضلاته" ON public.favorite_suppliers;
CREATE POLICY "المستخدم يمكنه حذف من مفضلاته"
  ON public.favorite_suppliers FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- سياسات RLS للأسعار المخصصة
-- ============================================

DROP POLICY IF EXISTS "المورد يمكنه قراءة أسعاره المخصصة" ON public.product_custom_prices;
CREATE POLICY "المورد يمكنه قراءة أسعاره المخصصة"
  ON public.product_custom_prices FOR SELECT
  USING (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "المورد يمكنه إضافة أسعار مخصصة" ON public.product_custom_prices;
CREATE POLICY "المورد يمكنه إضافة أسعار مخصصة"
  ON public.product_custom_prices FOR INSERT
  WITH CHECK (auth.uid() = supplier_id AND has_role(auth.uid(), 'supplier'));

DROP POLICY IF EXISTS "المورد يمكنه تحديث أسعاره المخصصة" ON public.product_custom_prices;
CREATE POLICY "المورد يمكنه تحديث أسعاره المخصصة"
  ON public.product_custom_prices FOR UPDATE
  USING (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "المورد يمكنه حذف أسعاره المخصصة" ON public.product_custom_prices;
CREATE POLICY "المورد يمكنه حذف أسعاره المخصصة"
  ON public.product_custom_prices FOR DELETE
  USING (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "المطعم يمكنه رؤية أسعاره المخصصة" ON public.product_custom_prices;
CREATE POLICY "المطعم يمكنه رؤية أسعاره المخصصة"
  ON public.product_custom_prices FOR SELECT
  USING (auth.uid() = restaurant_id AND has_role(auth.uid(), 'restaurant'));

DROP POLICY IF EXISTS "المدير يمكنه رؤية جميع الأسعار" ON public.product_custom_prices;
CREATE POLICY "المدير يمكنه رؤية جميع الأسعار"
  ON public.product_custom_prices FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- سياسات RLS لشرائح الأسعار
-- ============================================

DROP POLICY IF EXISTS "المورد يمكنه قراءة شرائح أسعار منت" ON public.product_price_tiers;
CREATE POLICY "المورد يمكنه قراءة شرائح أسعار منت"
  ON public.product_price_tiers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_price_tiers.product_id 
      AND products.supplier_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "المورد يمكنه إضافة شرائح أسعار منت" ON public.product_price_tiers;
CREATE POLICY "المورد يمكنه إضافة شرائح أسعار منت"
  ON public.product_price_tiers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_price_tiers.product_id 
      AND products.supplier_id = auth.uid()
    )
    AND has_role(auth.uid(), 'supplier'::app_role)
  );

DROP POLICY IF EXISTS "المورد يمكنه تحديث شرائح أسعار منت" ON public.product_price_tiers;
CREATE POLICY "المورد يمكنه تحديث شرائح أسعار منت"
  ON public.product_price_tiers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_price_tiers.product_id 
      AND products.supplier_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "المورد يمكنه حذف شرائح أسعار منتجا" ON public.product_price_tiers;
CREATE POLICY "المورد يمكنه حذف شرائح أسعار منتجا"
  ON public.product_price_tiers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_price_tiers.product_id 
      AND products.supplier_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "المطاعم المعتمدة يمكنها رؤية شرائ" ON public.product_price_tiers;
CREATE POLICY "المطاعم المعتمدة يمكنها رؤية شرائ"
  ON public.product_price_tiers FOR SELECT
  USING (is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "المدير يمكنه رؤية جميع شرائح الأسع" ON public.product_price_tiers;
CREATE POLICY "المدير يمكنه رؤية جميع شرائح الأسع"
  ON public.product_price_tiers FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- سياسات RLS للفروع
-- ============================================

DROP POLICY IF EXISTS "المطعم يمكنه قراءة فروعه" ON public.branches;
CREATE POLICY "المطعم يمكنه قراءة فروعه"
  ON public.branches FOR SELECT
  USING (auth.uid() = restaurant_id OR has_role(auth.uid(), 'supplier'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "المطعم يمكنه إضافة فروعه" ON public.branches;
CREATE POLICY "المطعم يمكنه إضافة فروعه"
  ON public.branches FOR INSERT
  WITH CHECK (auth.uid() = restaurant_id AND has_role(auth.uid(), 'restaurant'::app_role));

DROP POLICY IF EXISTS "المطعم يمكنه تحديث فروعه" ON public.branches;
CREATE POLICY "المطعم يمكنه تحديث فروعه"
  ON public.branches FOR UPDATE
  USING (auth.uid() = restaurant_id);

DROP POLICY IF EXISTS "المطعم يمكنه حذف فروعه" ON public.branches;
CREATE POLICY "المطعم يمكنه حذف فروعه"
  ON public.branches FOR DELETE
  USING (auth.uid() = restaurant_id);

-- ============================================
-- سياسات RLS لإعدادات الموقع
-- ============================================

DROP POLICY IF EXISTS "الجميع يمكنهم قراءة الإعدادات" ON public.site_settings;
CREATE POLICY "الجميع يمكنهم قراءة الإعدادات"
  ON public.site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "المدير فقط يمكنه تعديل الإعدادات" ON public.site_settings;
CREATE POLICY "المدير فقط يمكنه تعديل الإعدادات"
  ON public.site_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- سياسات RLS للمدفوعات
-- ============================================

DROP POLICY IF EXISTS "المطعم يمكنه قراءة مدفوعاته" ON public.order_payments;
CREATE POLICY "المطعم يمكنه قراءة مدفوعاته"
  ON public.order_payments FOR SELECT
  USING (auth.uid() = restaurant_id);

DROP POLICY IF EXISTS "المورد يمكنه قراءة المدفوعات الخا" ON public.order_payments;
CREATE POLICY "المورد يمكنه قراءة المدفوعات الخا"
  ON public.order_payments FOR SELECT
  USING (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "المطعم يمكنه إضافة مدفوعات" ON public.order_payments;
CREATE POLICY "المطعم يمكنه إضافة مدفوعات"
  ON public.order_payments FOR INSERT
  WITH CHECK (auth.uid() = restaurant_id AND has_role(auth.uid(), 'restaurant'));

DROP POLICY IF EXISTS "المطعم يمكنه تحديث مدفوعاته" ON public.order_payments;
CREATE POLICY "المطعم يمكنه تحديث مدفوعاته"
  ON public.order_payments FOR UPDATE
  USING (auth.uid() = restaurant_id);

-- ============================================
-- Storage Buckets
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', true) ON CONFLICT (id) DO NOTHING;

-- سياسات التخزين للشعارات
DROP POLICY IF EXISTS "الجميع يمكنهم عرض الشعارات" ON storage.objects;
CREATE POLICY "الجميع يمكنهم عرض الشعارات"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "المدير يمكنه رفع الشعارات" ON storage.objects;
CREATE POLICY "المدير يمكنه رفع الشعارات"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "المدير يمكنه تحديث الشعارات" ON storage.objects;
CREATE POLICY "المدير يمكنه تحديث الشعارات"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'logos' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "المدير يمكنه حذف الشعارات" ON storage.objects;
CREATE POLICY "المدير يمكنه حذف الشعارات"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'logos' AND has_role(auth.uid(), 'admin'::app_role));

-- سياسات التخزين للإيصالات
DROP POLICY IF EXISTS "المطاعم يمكنها رفع إيصالات" ON storage.objects;
CREATE POLICY "المطاعم يمكنها رفع إيصالات"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-receipts' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "الجميع يمكنهم قراءة الإيصالات" ON storage.objects;
CREATE POLICY "الجميع يمكنهم قراءة الإيصالات"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-receipts');

-- ============================================
-- Realtime
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order_payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_payments;
  END IF;
END $$;

-- ============================================
-- البيانات الافتراضية
-- ============================================

-- تصنيفات افتراضية
INSERT INTO public.categories (name, icon) VALUES
  ('خضروات', '🥬'),
  ('فواكه', '🍎'),
  ('لحوم', '🥩'),
  ('دواجن', '🍗'),
  ('أسماك', '🐟'),
  ('ألبان', '🥛'),
  ('زيوت', '🫒'),
  ('حبوب', '🌾'),
  ('توابل', '🌶️'),
  ('مشروبات', '🥤')
ON CONFLICT (name) DO NOTHING;

-- إعدادات الموقع
INSERT INTO public.site_settings (key, value) VALUES
  ('header_logo_url', NULL),
  ('favicon_url', NULL)
ON CONFLICT (key) DO NOTHING;

-- الموافقة على المدراء والموردين الحاليين
UPDATE public.profiles 
SET is_approved = true 
WHERE user_id IN (
  SELECT user_id FROM public.user_roles WHERE role IN ('admin'::app_role, 'supplier'::app_role)
);
