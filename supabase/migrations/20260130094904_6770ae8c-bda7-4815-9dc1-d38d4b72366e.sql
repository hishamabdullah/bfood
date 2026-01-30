-- السماح للموردين برفع شعاراتهم
CREATE POLICY "الموردين يمكنهم رفع شعاراتهم"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos' 
  AND has_role(auth.uid(), 'supplier'::app_role)
  AND (storage.foldername(name))[1] IS NULL -- root level only
  AND name LIKE 'supplier-%'
);

-- السماح للموردين بتحديث شعاراتهم
CREATE POLICY "الموردين يمكنهم تحديث شعاراتهم"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos' 
  AND has_role(auth.uid(), 'supplier'::app_role)
  AND name LIKE CONCAT('supplier-', auth.uid()::text, '-%')
);

-- السماح للموردين بحذف شعاراتهم القديمة
CREATE POLICY "الموردين يمكنهم حذف شعاراتهم"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos' 
  AND has_role(auth.uid(), 'supplier'::app_role)
  AND name LIKE CONCAT('supplier-', auth.uid()::text, '-%')
);