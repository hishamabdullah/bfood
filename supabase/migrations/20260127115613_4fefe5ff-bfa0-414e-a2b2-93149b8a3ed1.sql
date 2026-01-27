-- إضافة حقل رقم العميل للمطاعم
ALTER TABLE public.profiles
ADD COLUMN customer_code TEXT UNIQUE;

-- إنشاء فهرس للبحث السريع
CREATE INDEX idx_profiles_customer_code ON public.profiles(customer_code);

-- إنشاء دالة لتوليد رقم عميل تلقائي
CREATE OR REPLACE FUNCTION public.generate_customer_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- توليد رقم عميل فقط للمطاعم (سيتم التحقق لاحقاً من الدور)
  LOOP
    -- توليد رقم عشوائي من 6 أرقام
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- التحقق من عدم وجود الرقم
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE customer_code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  NEW.customer_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- إنشاء trigger لتوليد الرقم تلقائياً عند إنشاء ملف شخصي جديد
CREATE TRIGGER generate_customer_code_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.customer_code IS NULL)
EXECUTE FUNCTION public.generate_customer_code();

-- توليد أرقام للمطاعم الموجودة حالياً
UPDATE public.profiles
SET customer_code = LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
WHERE customer_code IS NULL;