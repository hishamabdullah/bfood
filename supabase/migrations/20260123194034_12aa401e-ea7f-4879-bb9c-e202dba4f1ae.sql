-- 1. إضافة عمود حالة الموافقة للملفات الشخصية
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- 2. إنشاء دالة للتحقق من موافقة المستخدم
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

-- 3. تحديث سياسة قراءة المنتجات - فقط المستخدمين المعتمدين أو المدير
DROP POLICY IF EXISTS "يمكن للجميع قراءة المنتجات" ON public.products;

CREATE POLICY "المستخدمون المعتمدون يمكنهم قراءة المنتجات"
  ON public.products FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR is_user_approved(auth.uid())
  );

-- 4. تحديث سياسة قراءة الملفات الشخصية
DROP POLICY IF EXISTS "المستخدمون المسجلون يمكنهم قراءة الملفات الشخصية" ON public.profiles;

CREATE POLICY "المستخدمون المعتمدون يمكنهم قراءة الملفات الشخصية"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = user_id  -- المستخدم يرى ملفه الشخصي
    OR has_role(auth.uid(), 'admin'::app_role)  -- المدير يرى الجميع
    OR (is_user_approved(auth.uid()) AND auth.uid() IS NOT NULL)  -- المعتمدون يرون الآخرين
  );

-- 5. تحديث سياسة رؤية أدوار الموردين
DROP POLICY IF EXISTS "المطاعم يمكنها رؤية أدوار الموردي" ON public.user_roles;

CREATE POLICY "المطاعم المعتمدة يمكنها رؤية أدوار الموردين"
  ON public.user_roles FOR SELECT
  USING (
    (role = 'supplier'::app_role AND has_role(auth.uid(), 'restaurant'::app_role) AND is_user_approved(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 6. تحديث سياسة قراءة التصنيفات
DROP POLICY IF EXISTS "يمكن للجميع قراءة التصنيفات" ON public.categories;

CREATE POLICY "المستخدمون المعتمدون يمكنهم قراءة التصنيفات"
  ON public.categories FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR is_user_approved(auth.uid())
  );

-- 7. الموافقة على حساب المدير الحالي تلقائياً
UPDATE public.profiles 
SET is_approved = true 
WHERE user_id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role
);