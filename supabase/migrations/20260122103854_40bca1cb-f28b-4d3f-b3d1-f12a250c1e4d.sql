-- إنشاء نوع أدوار المستخدمين
CREATE TYPE public.app_role AS ENUM ('admin', 'restaurant', 'supplier');

-- جدول الملفات الشخصية للمستخدمين
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول أدوار المستخدمين (منفصل للأمان)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'restaurant',
  UNIQUE(user_id, role)
);

-- جدول التصنيفات
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول المنتجات
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'كيلو',
  image_url TEXT,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الطلبات الرئيسي
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'pending',
  delivery_address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الطلبات الفرعية (حسب المورد)
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES auth.users(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS على جميع الجداول
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

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

-- سياسات RLS للملفات الشخصية
CREATE POLICY "يمكن للجميع قراءة الملفات الشخصية"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "يمكن للمستخدم تحديث ملفه الشخصي"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "يمكن للمستخدم إنشاء ملفه الشخصي"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- سياسات RLS لأدوار المستخدمين
CREATE POLICY "يمكن للمستخدم قراءة دوره"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "المدير فقط يمكنه إدارة الأدوار"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "يمكن للمستخدم إنشاء دوره عند التسجيل"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- سياسات RLS للتصنيفات
CREATE POLICY "يمكن للجميع قراءة التصنيفات"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "المدير فقط يمكنه إدارة التصنيفات"
  ON public.categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- سياسات RLS للمنتجات
CREATE POLICY "يمكن للجميع قراءة المنتجات"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "المورد يمكنه إضافة منتجاته"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = supplier_id AND public.has_role(auth.uid(), 'supplier'));

CREATE POLICY "المورد يمكنه تحديث منتجاته"
  ON public.products FOR UPDATE
  USING (auth.uid() = supplier_id);

CREATE POLICY "المورد يمكنه حذف منتجاته"
  ON public.products FOR DELETE
  USING (auth.uid() = supplier_id);

-- سياسات RLS للطلبات
CREATE POLICY "المطعم يمكنه قراءة طلباته"
  ON public.orders FOR SELECT
  USING (auth.uid() = restaurant_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "المطعم يمكنه إنشاء طلب"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = restaurant_id AND public.has_role(auth.uid(), 'restaurant'));

CREATE POLICY "المطعم يمكنه تحديث طلباته"
  ON public.orders FOR UPDATE
  USING (auth.uid() = restaurant_id);

-- سياسات RLS لعناصر الطلبات
CREATE POLICY "قراءة عناصر الطلبات"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.restaurant_id = auth.uid() OR order_items.supplier_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "إضافة عناصر الطلبات"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.restaurant_id = auth.uid()
    )
  );

CREATE POLICY "المورد يمكنه تحديث حالة عناصر طلباته"
  ON public.order_items FOR UPDATE
  USING (auth.uid() = supplier_id);

-- دالة تحديث updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers للتحديث التلقائي
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- إضافة تصنيفات افتراضية
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
  ('مشروبات', '🥤');