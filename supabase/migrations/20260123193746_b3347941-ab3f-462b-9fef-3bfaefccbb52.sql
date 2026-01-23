-- 1. إصلاح ثغرة تصعيد الصلاحيات في جدول user_roles
-- منع المستخدمين من منح أنفسهم صلاحية admin

DROP POLICY IF EXISTS "يمكن للمستخدم إنشاء دوره عند التسج" ON public.user_roles;

CREATE POLICY "يمكن للمستخدم إنشاء دوره عند التسجيل"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND role IN ('restaurant'::app_role, 'supplier'::app_role)
  );

-- 2. إصلاح كشف البيانات الشخصية في جدول profiles
-- تقييد الوصول للمستخدمين المسجلين فقط

DROP POLICY IF EXISTS "يمكن للجميع قراءة الملفات الشخصية" ON public.profiles;

CREATE POLICY "المستخدمون المسجلون يمكنهم قراءة الملفات الشخصية"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);