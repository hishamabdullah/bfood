-- جدول طلبات تجديد الاشتراك
CREATE TABLE public.subscription_renewals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  subscription_type TEXT NOT NULL DEFAULT 'basic',
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_renewals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "المطعم يمكنه إنشاء طلب تجديد"
ON public.subscription_renewals FOR INSERT
WITH CHECK (auth.uid() = restaurant_id AND has_role(auth.uid(), 'restaurant'));

CREATE POLICY "المطعم يمكنه قراءة طلباته"
ON public.subscription_renewals FOR SELECT
USING (auth.uid() = restaurant_id);

CREATE POLICY "المطعم يمكنه تحديث طلبه المعلق"
ON public.subscription_renewals FOR UPDATE
USING (auth.uid() = restaurant_id AND status = 'pending');

CREATE POLICY "المدير يمكنه قراءة جميع الطلبات"
ON public.subscription_renewals FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "المدير يمكنه تحديث الطلبات"
ON public.subscription_renewals FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "المدير يمكنه حذف الطلبات"
ON public.subscription_renewals FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_subscription_renewals_updated_at
BEFORE UPDATE ON public.subscription_renewals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- إضافة إعدادات الاشتراك الافتراضية
INSERT INTO public.site_settings (key, value) VALUES
  ('subscription_price', '500'),
  ('subscription_bank_name', 'بنك الراجحي'),
  ('subscription_bank_account_name', 'مؤسسة بي فود'),
  ('subscription_bank_iban', 'SA0000000000000000000000')
ON CONFLICT (key) DO NOTHING;

-- إنشاء bucket لإيصالات الاشتراك
INSERT INTO storage.buckets (id, name, public) 
VALUES ('subscription-receipts', 'subscription-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- سياسات التخزين
CREATE POLICY "المطعم يمكنه رفع إيصال اشتراكه"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'subscription-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "الجميع يمكنهم رؤية الإيصالات"
ON storage.objects FOR SELECT
USING (bucket_id = 'subscription-receipts');