-- Add service areas columns for suppliers
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS service_regions text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS service_cities text[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.service_regions IS 'List of regions the supplier serves';
COMMENT ON COLUMN public.profiles.service_cities IS 'List of cities the supplier serves';