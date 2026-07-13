
-- Categories: hierarchy + image
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON public.categories(parent_id);

-- Store settings: free shipping threshold
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS free_shipping_threshold numeric DEFAULT 0;

-- Hero banners table
CREATE TABLE IF NOT EXISTS public.hero_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text,
  subtitle text,
  cta_text text,
  link_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hero_banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hero_banners TO authenticated;
GRANT ALL ON public.hero_banners TO service_role;
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hero_banners_public_read" ON public.hero_banners FOR SELECT USING (true);
CREATE POLICY "hero_banners_admin_insert" ON public.hero_banners FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "hero_banners_admin_update" ON public.hero_banners FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "hero_banners_admin_delete" ON public.hero_banners FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE TRIGGER trg_hero_banners_updated_at BEFORE UPDATE ON public.hero_banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for private bucket 'store-assets' (admins upload; signed URLs used to serve)
CREATE POLICY "store_assets_admin_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "store_assets_admin_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'store-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "store_assets_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'store-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "store_assets_read_all" ON storage.objects FOR SELECT
  USING (bucket_id = 'store-assets');
