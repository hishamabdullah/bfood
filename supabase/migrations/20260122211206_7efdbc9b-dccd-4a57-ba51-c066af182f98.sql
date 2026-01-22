-- جدول الإشعارات
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'order',
  is_read BOOLEAN NOT NULL DEFAULT false,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: المستخدم يقرأ إشعاراته فقط
CREATE POLICY "المستخدم يقرأ إشعاراته"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- سياسة التحديث: المستخدم يحدث إشعاراته فقط
CREATE POLICY "المستخدم يحدث إشعاراته"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- سياسة الإدراج: النظام يضيف الإشعارات
CREATE POLICY "إضافة إشعارات للطلبات"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- تفعيل Realtime للإشعارات
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;