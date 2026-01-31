-- إزالة تريجر الاعتماد التلقائي للموردين
DROP TRIGGER IF EXISTS auto_approve_supplier_trigger ON public.user_roles;
DROP FUNCTION IF EXISTS public.auto_approve_supplier();