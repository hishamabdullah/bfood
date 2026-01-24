-- Allow admins to update any product
CREATE POLICY "المدير يمكنه تحديث أي منتج"
ON public.products
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete any product
CREATE POLICY "المدير يمكنه حذف أي منتج"
ON public.products
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));