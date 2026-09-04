
-- Ensure private schema exists and is not exposed via PostgREST
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

-- 1) Move trigger-only helpers into private schema
CREATE OR REPLACE FUNCTION private.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION private.enforce_order_rate_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recent_count int;
BEGIN
  IF NEW.phone IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO recent_count FROM public.orders
   WHERE phone = NEW.phone AND created_at > now() - interval '10 minutes';
  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Too many orders submitted recently. Please try again later.' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END; $$;

-- Repoint any triggers currently using the public versions
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT tgname, c.relname, n.nspname,
           pg_get_triggerdef(tr.oid) AS def
    FROM pg_trigger tr
    JOIN pg_class c ON c.oid = tr.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = tr.tgfoid
    JOIN pg_namespace pn ON pn.oid = p.pronamespace
    WHERE NOT tr.tgisinternal
      AND pn.nspname = 'public'
      AND p.proname IN ('update_updated_at_column','enforce_order_rate_limit')
  LOOP
    EXECUTE format('DROP TRIGGER %I ON %I.%I', t.tgname, t.nspname, t.relname);
    EXECUTE replace(replace(t.def,
      'public.update_updated_at_column', 'private.update_updated_at_column'),
      'public.enforce_order_rate_limit', 'private.enforce_order_rate_limit');
  END LOOP;
END $$;

-- 2) Move privileged RPC bodies into private schema; keep public API as SECURITY INVOKER wrappers

-- get_payment_config
CREATE OR REPLACE FUNCTION private.get_payment_config()
RETURNS TABLE(instapay_handle text, bank_account_info text, store_address text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT instapay_handle, bank_account_info, store_address FROM public.store_settings LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_payment_config()
RETURNS TABLE(instapay_handle text, bank_account_info text, store_address text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT * FROM private.get_payment_config()
$$;

-- validate_coupon
CREATE OR REPLACE FUNCTION private.validate_coupon(p_code text, p_subtotal numeric)
RETURNS TABLE(code text, discount_type text, discount_value numeric, discount_amount numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
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

CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_subtotal numeric)
RETURNS TABLE(code text, discount_type text, discount_value numeric, discount_amount numeric)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT * FROM private.validate_coupon(p_code, p_subtotal)
$$;

-- create_order
CREATE OR REPLACE FUNCTION private.create_order(
  p_customer_name text, p_phone text, p_address text, p_notes text, p_items jsonb,
  p_delivery_zone_id uuid, p_delivery_method text, p_payment_method text,
  p_payment_reference text, p_coupon_code text, p_ref_source text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_name text, p_phone text, p_address text, p_notes text, p_items jsonb,
  p_delivery_zone_id uuid, p_delivery_method text, p_payment_method text,
  p_payment_reference text, p_coupon_code text, p_ref_source text
) RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT private.create_order(
    p_customer_name, p_phone, p_address, p_notes, p_items,
    p_delivery_zone_id, p_delivery_method, p_payment_method,
    p_payment_reference, p_coupon_code, p_ref_source
  )
$$;

-- Drop old SECURITY DEFINER copies from public (only trigger helpers; RPCs above were replaced in place as INVOKER)
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.enforce_order_rate_limit() CASCADE;

-- Grants: public wrappers callable by storefront; private only to service_role
GRANT EXECUTE ON FUNCTION public.get_payment_config() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order(text, text, text, text, jsonb, uuid, text, text, text, text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION private.get_payment_config() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.validate_coupon(text, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.create_order(text, text, text, text, jsonb, uuid, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.enforce_order_rate_limit() FROM PUBLIC, anon, authenticated;
