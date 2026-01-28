-- إنشاء جدول لتتبع المدفوعات بين المطاعم والموردين
CREATE TABLE public.order_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL,
  restaurant_id UUID NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id, supplier_id)
);

-- تفعيل RLS
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "المطعم يمكنه قراءة مدفوعاته"
ON public.order_payments FOR SELECT
USING (auth.uid() = restaurant_id);

CREATE POLICY "المورد يمكنه قراءة المدفوعات الخاصة به"
ON public.order_payments FOR SELECT
USING (auth.uid() = supplier_id);

CREATE POLICY "المطعم يمكنه إضافة مدفوعات"
ON public.order_payments FOR INSERT
WITH CHECK (auth.uid() = restaurant_id AND has_role(auth.uid(), 'restaurant'));

CREATE POLICY "المطعم يمكنه تحديث مدفوعاته"
ON public.order_payments FOR UPDATE
USING (auth.uid() = restaurant_id);

-- إنشاء باكت لإيصالات التحويل
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true);

-- سياسات التخزين
CREATE POLICY "المطاعم يمكنها رفع إيصالات"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "الجميع يمكنهم قراءة الإيصالات"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-receipts');

-- Trigger لتحديث updated_at
CREATE TRIGGER update_order_payments_updated_at
BEFORE UPDATE ON public.order_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- تفعيل Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_payments;