
-- Private schema
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Storage policies
DROP POLICY IF EXISTS product_images_admin_insert ON storage.objects;
DROP POLICY IF EXISTS product_images_admin_update ON storage.objects;
DROP POLICY IF EXISTS product_images_admin_delete ON storage.objects;
CREATE POLICY product_images_admin_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND private.has_role(auth.uid(),'admin'));
CREATE POLICY product_images_admin_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND private.has_role(auth.uid(),'admin'));
CREATE POLICY product_images_admin_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND private.has_role(auth.uid(),'admin'));

-- Public schema policies
DROP POLICY IF EXISTS categories_admin_update ON public.categories;
DROP POLICY IF EXISTS categories_admin_delete ON public.categories;
DROP POLICY IF EXISTS categories_admin_insert ON public.categories;
CREATE POLICY categories_admin_update ON public.categories FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'admin'));
CREATE POLICY categories_admin_delete ON public.categories FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'admin'));
CREATE POLICY categories_admin_insert ON public.categories FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "coupons admin write" ON public.coupons;
DROP POLICY IF EXISTS "coupons public read" ON public.coupons;
CREATE POLICY coupons_admin_all ON public.coupons FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "zones admin write" ON public.delivery_zones;
CREATE POLICY zones_admin_all ON public.delivery_zones FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "banners admin write" ON public.hero_banners;
CREATE POLICY banners_admin_all ON public.hero_banners FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS orders_admin_read ON public.orders;
DROP POLICY IF EXISTS orders_admin_update ON public.orders;
DROP POLICY IF EXISTS orders_admin_delete ON public.orders;
DROP POLICY IF EXISTS orders_public_insert ON public.orders;
CREATE POLICY orders_admin_read ON public.orders FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'staff'));
CREATE POLICY orders_admin_update ON public.orders FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'staff'));
CREATE POLICY orders_admin_delete ON public.orders FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'admin'));
CREATE POLICY orders_owner_select ON public.orders FOR SELECT TO authenticated USING (user_id IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS products_admin_insert ON public.products;
DROP POLICY IF EXISTS products_admin_update ON public.products;
DROP POLICY IF EXISTS products_admin_delete ON public.products;
CREATE POLICY products_admin_insert ON public.products FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(),'admin'));
CREATE POLICY products_admin_update ON public.products FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'admin'));
CREATE POLICY products_admin_delete ON public.products FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can submit reviews" ON public.reviews;
CREATE POLICY reviews_admin_delete ON public.reviews FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'admin'));
CREATE POLICY reviews_admin_update ON public.reviews FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'admin'));
CREATE POLICY reviews_insert_own ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS store_settings_admin_insert ON public.store_settings;
DROP POLICY IF EXISTS store_settings_admin_update ON public.store_settings;
DROP POLICY IF EXISTS store_settings_public_read ON public.store_settings;
CREATE POLICY store_settings_admin_insert ON public.store_settings FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(),'admin'));
CREATE POLICY store_settings_admin_update ON public.store_settings FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'admin'));
CREATE POLICY store_settings_admin_select ON public.store_settings FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'staff'));

DROP POLICY IF EXISTS "theme admin write" ON public.theme_settings;
CREATE POLICY theme_admin_all ON public.theme_settings FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- Coupon validation RPC
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_subtotal numeric)
RETURNS TABLE (code text, discount_type text, discount_value numeric, discount_amount numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE c public.coupons%ROWTYPE; d numeric;
BEGIN
  SELECT * INTO c FROM public.coupons WHERE upper(coupons.code) = upper(trim(p_code)) AND is_active LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_COUPON' USING ERRCODE='check_violation'; END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN RAISE EXCEPTION 'EXPIRED_COUPON' USING ERRCODE='check_violation'; END IF;
  IF c.max_uses IS NOT NULL AND coalesce(c.uses_count,0) >= c.max_uses THEN RAISE EXCEPTION 'EXHAUSTED_COUPON' USING ERRCODE='check_violation'; END IF;
  IF c.min_order_amount IS NOT NULL AND p_subtotal < c.min_order_amount THEN RAISE EXCEPTION 'MIN_ORDER_NOT_MET' USING ERRCODE='check_violation'; END IF;
  IF c.discount_type IN ('percent','percentage') THEN d := round(p_subtotal * (c.discount_value/100.0), 2);
  ELSE d := c.discount_value; END IF;
  IF d > p_subtotal THEN d := p_subtotal; END IF;
  RETURN QUERY SELECT c.code, c.discount_type, c.discount_value, d;
END $$;
REVOKE ALL ON FUNCTION public.validate_coupon(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO anon, authenticated;

-- create_order RPC
CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_name text, p_phone text, p_address text, p_notes text,
  p_items jsonb, p_delivery_zone_id uuid, p_delivery_method text,
  p_payment_method text, p_payment_reference text, p_coupon_code text, p_ref_source text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  it jsonb; prod public.products%ROWTYPE; qty numeric; ls numeric;
  subtotal numeric := 0; server_items jsonb := '[]'::jsonb;
  zone public.delivery_zones%ROWTYPE; delivery_fee numeric := 0;
  discount numeric := 0; coupon_row public.coupons%ROWTYPE;
  new_id uuid; total numeric;
BEGIN
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'EMPTY_CART' USING ERRCODE='check_violation'; END IF;
  IF char_length(coalesce(p_customer_name,'')) < 2 OR char_length(p_customer_name) > 120 THEN RAISE EXCEPTION 'INVALID_NAME' USING ERRCODE='check_violation'; END IF;
  IF char_length(coalesce(p_phone,'')) < 5 OR char_length(p_phone) > 30 THEN RAISE EXCEPTION 'INVALID_PHONE' USING ERRCODE='check_violation'; END IF;
  IF char_length(coalesce(p_address,'')) < 5 OR char_length(p_address) > 500 THEN RAISE EXCEPTION 'INVALID_ADDRESS' USING ERRCODE='check_violation'; END IF;
  IF p_payment_method NOT IN ('cod','instapay','bank') THEN RAISE EXCEPTION 'INVALID_PAYMENT' USING ERRCODE='check_violation'; END IF;

  FOR it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT * INTO prod FROM public.products WHERE id = (it->>'id')::uuid;
    IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_NOT_FOUND' USING ERRCODE='check_violation'; END IF;
    qty := (it->>'quantity')::numeric;
    IF qty IS NULL OR qty <= 0 OR qty > 10000 THEN RAISE EXCEPTION 'INVALID_QUANTITY' USING ERRCODE='check_violation'; END IF;
    ls := round(prod.price_per_unit * qty, 2);
    subtotal := subtotal + ls;
    server_items := server_items || jsonb_build_object(
      'id', prod.id, 'name', prod.name, 'unit_label', prod.unit_label,
      'is_by_weight', prod.is_by_weight, 'price_per_unit', prod.price_per_unit,
      'quantity', qty, 'subtotal', ls
    );
  END LOOP;

  IF p_delivery_method = 'delivery' AND p_delivery_zone_id IS NOT NULL THEN
    SELECT * INTO zone FROM public.delivery_zones WHERE id = p_delivery_zone_id AND is_active;
    IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_ZONE' USING ERRCODE='check_violation'; END IF;
    IF zone.min_order_amount IS NOT NULL AND subtotal < zone.min_order_amount THEN RAISE EXCEPTION 'BELOW_MIN_ORDER' USING ERRCODE='check_violation'; END IF;
    delivery_fee := zone.fee;
  END IF;

  IF p_coupon_code IS NOT NULL AND length(trim(p_coupon_code)) > 0 THEN
    SELECT * INTO coupon_row FROM public.coupons WHERE upper(code) = upper(trim(p_coupon_code)) AND is_active;
    IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_COUPON' USING ERRCODE='check_violation'; END IF;
    IF coupon_row.expires_at IS NOT NULL AND coupon_row.expires_at < now() THEN RAISE EXCEPTION 'EXPIRED_COUPON' USING ERRCODE='check_violation'; END IF;
    IF coupon_row.max_uses IS NOT NULL AND coalesce(coupon_row.uses_count,0) >= coupon_row.max_uses THEN RAISE EXCEPTION 'EXHAUSTED_COUPON' USING ERRCODE='check_violation'; END IF;
    IF coupon_row.min_order_amount IS NOT NULL AND subtotal < coupon_row.min_order_amount THEN RAISE EXCEPTION 'MIN_ORDER_NOT_MET' USING ERRCODE='check_violation'; END IF;
    IF coupon_row.discount_type IN ('percent','percentage') THEN discount := round(subtotal * (coupon_row.discount_value/100.0), 2);
    ELSE discount := coupon_row.discount_value; END IF;
    IF discount > subtotal THEN discount := subtotal; END IF;
    UPDATE public.coupons SET uses_count = coalesce(uses_count,0)+1 WHERE id = coupon_row.id;
  END IF;

  total := round(subtotal - discount + delivery_fee, 2);

  INSERT INTO public.orders (
    customer_name, phone, address, notes, items, total_price,
    payment_method, payment_reference, ref_source, user_id, status
  ) VALUES (
    p_customer_name, p_phone, p_address, p_notes, server_items, total,
    p_payment_method, p_payment_reference, p_ref_source, auth.uid(), 'new'
  ) RETURNING id INTO new_id;
  RETURN new_id;
END $$;
REVOKE ALL ON FUNCTION public.create_order(text,text,text,text,jsonb,uuid,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order(text,text,text,text,jsonb,uuid,text,text,text,text,text) TO anon, authenticated;

-- Safe public view
CREATE OR REPLACE VIEW public.store_settings_public
WITH (security_invoker = true) AS
SELECT id, whatsapp_number, hero_title, hero_subtitle, hero_image_url, hero_cta_text,
       store_address, store_lat, store_lng, site_name, logo_url, favicon_url,
       primary_color, accent_color, background_color, foreground_color,
       announcement_text, announcement_enabled, announcement_bg_color,
       min_order_amount, default_delivery_fee, first_order_coupon_enabled,
       first_order_coupon_code, first_order_discount_percent,
       hero_bg_image, login_bg_pattern, cart_empty_bg, floating_element_image,
       created_at, updated_at
FROM public.store_settings;
GRANT SELECT ON public.store_settings_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_payment_config()
RETURNS TABLE (instapay_handle text, bank_account_info text, store_address text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT instapay_handle, bank_account_info, store_address FROM public.store_settings LIMIT 1 $$;
REVOKE ALL ON FUNCTION public.get_payment_config() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_payment_config() TO anon, authenticated;
