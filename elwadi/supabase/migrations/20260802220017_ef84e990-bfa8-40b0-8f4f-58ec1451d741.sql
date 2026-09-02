-- 1) Allow calling the hardened private helpers, then flip the public wrappers to SECURITY INVOKER
GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.create_order(text, text, text, text, jsonb, uuid, text, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.validate_coupon(text, numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.get_payment_config() TO anon, authenticated;

ALTER FUNCTION public.create_order(text, text, text, text, jsonb, uuid, text, text, text, text, text) SECURITY INVOKER;
ALTER FUNCTION public.validate_coupon(text, numeric) SECURITY INVOKER;
ALTER FUNCTION public.get_payment_config() SECURITY INVOKER;

-- 2) Admin-only full settings read (sensitive columns) via private definer + invoker wrapper
CREATE OR REPLACE FUNCTION private.get_store_settings_admin()
RETURNS SETOF public.store_settings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select s.* from public.store_settings s
  where private.has_role(auth.uid(), 'admin'::app_role)
  limit 1
$$;

REVOKE ALL ON FUNCTION private.get_store_settings_admin() FROM public;
GRANT EXECUTE ON FUNCTION private.get_store_settings_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_store_settings_admin()
RETURNS SETOF public.store_settings
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  select * from private.get_store_settings_admin()
$$;

REVOKE ALL ON FUNCTION public.get_store_settings_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.get_store_settings_admin() TO authenticated;

-- 3) The public view now runs as the querying user
ALTER VIEW public.store_settings_public SET (security_invoker = true);

-- 4) Column-scoped public read access on store_settings
REVOKE SELECT ON public.store_settings FROM anon, authenticated;

GRANT SELECT (
  id, whatsapp_number, hero_title, hero_subtitle, hero_image_url, hero_cta_text,
  store_address, store_lat, store_lng, site_name, logo_url, favicon_url,
  primary_color, accent_color, background_color, foreground_color,
  announcement_text, announcement_enabled, announcement_bg_color,
  min_order_amount, default_delivery_fee, first_order_coupon_enabled,
  first_order_coupon_code, first_order_discount_percent, hero_bg_image,
  login_bg_pattern, cart_empty_bg, floating_element_image, created_at, updated_at
) ON public.store_settings TO anon, authenticated;

GRANT SELECT ON public.store_settings_public TO anon, authenticated;

DROP POLICY IF EXISTS store_settings_admin_select ON public.store_settings;
CREATE POLICY store_settings_public_columns_read
  ON public.store_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);
