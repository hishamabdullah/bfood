-- تحديث سياسة قراءة المنتجات للسماح للموردين برؤية منتجاتهم
DROP POLICY IF EXISTS "المستخدمون المعتمدون يمكنهم قراءة" ON public.products;

CREATE POLICY "المستخدمون المعتمدون يمكنهم قراءة"
ON public.products
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR is_user_approved(auth.uid())
  OR (auth.uid() = supplier_id AND has_role(auth.uid(), 'supplier'::app_role))
);

-- دالة لاعتماد الموردين تلقائياً عند إنشاء الدور
CREATE OR REPLACE FUNCTION public.auto_approve_supplier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- إذا كان الدور مورد، قم باعتماده تلقائياً
  IF NEW.role = 'supplier' THEN
    UPDATE public.profiles
    SET is_approved = true
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- إنشاء trigger لاعتماد الموردين تلقائياً
DROP TRIGGER IF EXISTS auto_approve_supplier_trigger ON public.user_roles;
CREATE TRIGGER auto_approve_supplier_trigger
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_supplier();

-- تحديث الموردين الحاليين ليصبحوا معتمدين
UPDATE public.profiles p
SET is_approved = true
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.user_id AND ur.role = 'supplier'
);