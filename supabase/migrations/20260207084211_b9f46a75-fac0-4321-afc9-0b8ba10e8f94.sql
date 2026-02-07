-- تحديث سياسات RLS للمستخدمين الفرعيين

-- 1. تحديث سياسة قراءة الطلبات لتشمل المستخدمين الفرعيين
DROP POLICY IF EXISTS "المطعم يمكنه قراءة طلباته" ON orders;
CREATE POLICY "المطعم يمكنه قراءة طلباته" ON orders
FOR SELECT USING (
  auth.uid() = restaurant_id 
  OR has_role(auth.uid(), 'admin')
  OR restaurant_id = get_restaurant_owner_id(auth.uid())
);

-- 2. تحديث سياسة قراءة ميزات المطعم لتشمل المستخدمين الفرعيين
DROP POLICY IF EXISTS "المطعم يمكنه قراءة ميزاته" ON restaurant_features;
CREATE POLICY "المطعم يمكنه قراءة ميزاته" ON restaurant_features
FOR SELECT USING (
  auth.uid() = restaurant_id 
  OR restaurant_id = get_restaurant_owner_id(auth.uid())
);

-- 3. تحديث سياسة قراءة الفروع لتشمل المستخدمين الفرعيين
DROP POLICY IF EXISTS "المطاعم يمكنها قراءة فروعها" ON branches;
CREATE POLICY "المطاعم يمكنها قراءة فروعها" ON branches
FOR SELECT USING (
  auth.uid() = restaurant_id 
  OR restaurant_id = get_restaurant_owner_id(auth.uid())
  OR has_role(auth.uid(), 'admin')
);

-- 4. السماح للمستخدم الفرعي بقراءة ملف المطعم الأصلي
DROP POLICY IF EXISTS "المستخدم يمكنه قراءة ملفه الشخصي" ON profiles;
CREATE POLICY "المستخدم يمكنه قراءة ملفه أو ملف مطعمه" ON profiles
FOR SELECT USING (
  auth.uid() = user_id
  OR user_id = get_restaurant_owner_id(auth.uid())
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'supplier')
);