
-- تحديث دالة is_user_approved لتدعم المستخدمين الفرعيين
-- إذا كان المستخدم فرعي، نتحقق من اعتماد المطعم الأب
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- أولاً: تحقق إذا كان المستخدم لديه ملف شخصي معتمد مباشرة
    (SELECT is_approved FROM public.profiles WHERE user_id = _user_id LIMIT 1),
    -- ثانياً: إذا كان مستخدم فرعي، تحقق من اعتماد المطعم الأب
    (SELECT p.is_approved 
     FROM public.restaurant_sub_users su
     JOIN public.profiles p ON p.user_id = su.restaurant_id
     WHERE su.user_id = _user_id AND su.is_active = true
     LIMIT 1),
    false
  )
$$;
