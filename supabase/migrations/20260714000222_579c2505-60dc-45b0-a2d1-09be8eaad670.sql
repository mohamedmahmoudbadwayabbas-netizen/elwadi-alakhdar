
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS site_name text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS favicon_url text,
  ADD COLUMN IF NOT EXISTS primary_color text,
  ADD COLUMN IF NOT EXISTS accent_color text,
  ADD COLUMN IF NOT EXISTS background_color text,
  ADD COLUMN IF NOT EXISTS foreground_color text,
  ADD COLUMN IF NOT EXISTS announcement_text text,
  ADD COLUMN IF NOT EXISTS announcement_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS announcement_bg_color text,
  ADD COLUMN IF NOT EXISTS ga4_id text,
  ADD COLUMN IF NOT EXISTS meta_pixel_id text,
  ADD COLUMN IF NOT EXISTS min_order_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_delivery_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_order_coupon_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_order_coupon_code text,
  ADD COLUMN IF NOT EXISTS first_order_discount_percent numeric DEFAULT 10,
  ADD COLUMN IF NOT EXISTS hero_bg_image text,
  ADD COLUMN IF NOT EXISTS login_bg_pattern text,
  ADD COLUMN IF NOT EXISTS cart_empty_bg text,
  ADD COLUMN IF NOT EXISTS floating_element_image text;

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value numeric NOT NULL,
  min_order_amount numeric,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  first_order_only boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons public read" ON public.coupons FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "coupons admin write" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
