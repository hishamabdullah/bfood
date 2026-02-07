-- Fix overly-permissive notifications INSERT policy (was WITH CHECK (true))
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'إضافة إشعارات للطلبات'
  ) THEN
    EXECUTE 'DROP POLICY "إضافة إشعارات للطلبات" ON public.notifications';
  END IF;
END $$;

CREATE POLICY "إضافة إشعارات للطلبات"
ON public.notifications
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL)
  AND (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);