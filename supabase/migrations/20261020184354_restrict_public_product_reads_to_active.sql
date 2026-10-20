DROP POLICY IF EXISTS products_public_read ON public.products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;

CREATE POLICY products_public_read
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (is_active IS TRUE);
