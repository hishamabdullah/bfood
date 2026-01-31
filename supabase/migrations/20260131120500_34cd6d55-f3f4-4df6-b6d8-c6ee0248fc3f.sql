-- إضافة رقم عميل فريد للموردين (نفس نظام المطاعم)
-- تعديل trigger لتوليد رقم العميل ليشمل الموردين أيضاً

-- إنشاء دالة جديدة لتوليد أرقام العملاء للموردين
CREATE OR REPLACE FUNCTION public.generate_supplier_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  user_role app_role;
BEGIN
  -- الحصول على دور المستخدم
  SELECT role INTO user_role FROM public.user_roles WHERE user_id = NEW.user_id LIMIT 1;
  
  -- إذا كان المورد وليس لديه رقم عميل، توليد واحد
  IF user_role = 'supplier' AND NEW.customer_code IS NULL THEN
    LOOP
      -- توليد رقم عشوائي من 6 أرقام
      new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
      
      -- التحقق من عدم وجود الرقم
      SELECT EXISTS(SELECT 1 FROM public.profiles WHERE customer_code = new_code) INTO code_exists;
      
      EXIT WHEN NOT code_exists;
    END LOOP;
    
    NEW.customer_code := new_code;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- إنشاء trigger لتوليد رقم العميل للموردين عند التحديث
CREATE TRIGGER trigger_generate_supplier_code
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION generate_supplier_code();

-- تحديث الموردين الحاليين الذين ليس لديهم رقم عميل
DO $$
DECLARE
  supplier_record RECORD;
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  FOR supplier_record IN 
    SELECT p.user_id 
    FROM profiles p 
    INNER JOIN user_roles ur ON ur.user_id = p.user_id 
    WHERE ur.role = 'supplier' AND p.customer_code IS NULL
  LOOP
    LOOP
      new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
      SELECT EXISTS(SELECT 1 FROM profiles WHERE customer_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    
    UPDATE profiles SET customer_code = new_code WHERE user_id = supplier_record.user_id;
  END LOOP;
END $$;

-- إنشاء دالة لجلب الموردين المعتمدين (مشابهة لـ get_approved_restaurants)
CREATE OR REPLACE FUNCTION public.get_approved_suppliers()
RETURNS TABLE(user_id uuid, business_name text, full_name text, customer_code text, created_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    p.user_id,
    p.business_name,
    p.full_name,
    p.customer_code,
    p.created_at
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE ur.role = 'supplier'
    AND p.is_approved = true
    AND has_role(auth.uid(), 'admin')
  ORDER BY p.business_name
$function$;