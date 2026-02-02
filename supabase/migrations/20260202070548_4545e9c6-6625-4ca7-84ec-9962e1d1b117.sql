-- Allow any authenticated user (supplier/restaurant) to read categories/subcategories
-- This fixes empty dropdowns caused by approval-gated read policies.

DO $$
BEGIN
  -- Categories
  BEGIN
    CREATE POLICY "Authenticated users can read categories"
    ON public.categories
    FOR SELECT
    TO authenticated
    USING (true);
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;

  -- Subcategories
  BEGIN
    CREATE POLICY "Authenticated users can read subcategories"
    ON public.subcategories
    FOR SELECT
    TO authenticated
    USING (true);
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;