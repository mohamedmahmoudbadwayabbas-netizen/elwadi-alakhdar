
CREATE TABLE public.theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marble_bg_url text,
  dark_marble_bg_url text,
  primary_hex text NOT NULL DEFAULT '#036233',
  accent_hex text NOT NULL DEFAULT '#E85D2F',
  card_radius_px int NOT NULL DEFAULT 24,
  hero_grid_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  hero_title text DEFAULT 'الوادي الأخضر',
  hero_subtitle text DEFAULT 'سوبر ماركت وعطارة - أفضل أنواع الاختيارات وتوصيل سريع مباشر لباب بيتك',
  hero_cta_text text DEFAULT 'تسوّق الآن',
  auth_bg_url text,
  cart_empty_bg_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.theme_settings TO anon, authenticated;
GRANT ALL ON public.theme_settings TO service_role;
GRANT UPDATE, INSERT, DELETE ON public.theme_settings TO authenticated;

ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "theme readable by all" ON public.theme_settings FOR SELECT USING (true);
CREATE POLICY "theme admin insert" ON public.theme_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "theme admin update" ON public.theme_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "theme admin delete" ON public.theme_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER theme_settings_updated_at BEFORE UPDATE ON public.theme_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.theme_settings (
  marble_bg_url, dark_marble_bg_url, primary_hex, accent_hex, card_radius_px,
  hero_grid_images, hero_title, hero_subtitle, hero_cta_text
) VALUES (
  'https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=1600&q=80',
  'https://images.unsplash.com/photo-1604147495798-57beb5d6af73?w=1600&q=80',
  '#036233', '#E85D2F', 24,
  '["https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80","https://images.unsplash.com/photo-1452251889946-8ff5ea7b27ab?w=800&q=80","https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80","https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&q=80"]'::jsonb,
  'الوادي الأخضر',
  'سوبر ماركت وعطارة - أفضل أنواع الاختيارات وتوصيل سريع مباشر لباب بيتك',
  'تسوّق الآن'
);

-- Cart items sync (Option A: keep current Lovable Cloud DB, add cart persistence)
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity numeric(10,3) NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own cart" ON public.cart_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER cart_items_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
