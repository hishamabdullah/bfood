-- Create site_settings table for storing logo URLs and other settings
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "الجميع يمكنهم قراءة الإعدادات"
ON public.site_settings
FOR SELECT
USING (true);

-- Only admins can modify settings
CREATE POLICY "المدير فقط يمكنه تعديل الإعدادات"
ON public.site_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES
('header_logo_url', NULL),
('favicon_url', NULL);

-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Storage policies for logos bucket
CREATE POLICY "الجميع يمكنهم عرض الشعارات"
ON storage.objects
FOR SELECT
USING (bucket_id = 'logos');

CREATE POLICY "المدير يمكنه رفع الشعارات"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'logos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "المدير يمكنه تحديث الشعارات"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'logos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "المدير يمكنه حذف الشعارات"
ON storage.objects
FOR DELETE
USING (bucket_id = 'logos' AND has_role(auth.uid(), 'admin'::app_role));