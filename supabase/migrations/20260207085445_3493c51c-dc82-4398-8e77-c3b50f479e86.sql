-- تحديث سياسات المفضلة للسماح للمستخدمين الفرعيين بالوصول للمفضلة المشتركة

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Users can manage their favorites" ON public.favorite_products;
DROP POLICY IF EXISTS "Users can view their favorite products" ON public.favorite_products;
DROP POLICY IF EXISTS "Users can add favorite products" ON public.favorite_products;
DROP POLICY IF EXISTS "Users can remove favorite products" ON public.favorite_products;

DROP POLICY IF EXISTS "Users can manage their favorite suppliers" ON public.favorite_suppliers;
DROP POLICY IF EXISTS "Users can view their favorite suppliers" ON public.favorite_suppliers;
DROP POLICY IF EXISTS "Users can add favorite suppliers" ON public.favorite_suppliers;
DROP POLICY IF EXISTS "Users can remove favorite suppliers" ON public.favorite_suppliers;

-- سياسات favorite_products - المفضلة مشتركة بين المطعم والمستخدمين الفرعيين
CREATE POLICY "Restaurant and sub-users can view favorite products"
ON public.favorite_products FOR SELECT
USING (
  -- المستخدم صاحب المفضلة أو مستخدم فرعي للمطعم
  user_id = auth.uid()
  OR user_id = get_restaurant_owner_id(auth.uid())
);

CREATE POLICY "Restaurant and sub-users can add favorite products"
ON public.favorite_products FOR INSERT
WITH CHECK (
  -- يمكن الإضافة لحساب المطعم الأصلي فقط
  user_id = get_restaurant_owner_id(auth.uid())
);

CREATE POLICY "Restaurant and sub-users can remove favorite products"
ON public.favorite_products FOR DELETE
USING (
  -- يمكن الحذف من حساب المطعم الأصلي فقط
  user_id = get_restaurant_owner_id(auth.uid())
);

-- سياسات favorite_suppliers - المفضلة مشتركة بين المطعم والمستخدمين الفرعيين
CREATE POLICY "Restaurant and sub-users can view favorite suppliers"
ON public.favorite_suppliers FOR SELECT
USING (
  user_id = auth.uid()
  OR user_id = get_restaurant_owner_id(auth.uid())
);

CREATE POLICY "Restaurant and sub-users can add favorite suppliers"
ON public.favorite_suppliers FOR INSERT
WITH CHECK (
  user_id = get_restaurant_owner_id(auth.uid())
);

CREATE POLICY "Restaurant and sub-users can remove favorite suppliers"
ON public.favorite_suppliers FOR DELETE
USING (
  user_id = get_restaurant_owner_id(auth.uid())
);

-- تفعيل Realtime للمفضلة لتحديث فوري
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorite_products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorite_suppliers;