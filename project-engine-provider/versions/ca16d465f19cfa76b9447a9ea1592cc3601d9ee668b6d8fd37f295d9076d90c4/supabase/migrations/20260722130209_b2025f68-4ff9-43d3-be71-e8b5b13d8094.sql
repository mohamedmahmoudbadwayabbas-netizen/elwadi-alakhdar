
-- Add hierarchical location columns to delivery_zones
ALTER TABLE public.delivery_zones
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'مصر',
  ADD COLUMN IF NOT EXISTS governorate text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS area text;

CREATE INDEX IF NOT EXISTS delivery_zones_hierarchy_idx
  ON public.delivery_zones (country, governorate, city, area) WHERE is_active;

-- Add delivery tracking columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_zone_id uuid REFERENCES public.delivery_zones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_method text NOT NULL DEFAULT 'delivery';

-- Update create_order to persist delivery zone + fee + method on orders
CREATE OR REPLACE FUNCTION private.create_order(
  p_customer_name text, p_phone text, p_address text, p_notes text,
  p_items jsonb, p_delivery_zone_id uuid, p_delivery_method text,
  p_payment_method text, p_payment_reference text, p_coupon_code text, p_ref_source text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  it jsonb; prod public.products%ROWTYPE; qty numeric; ls numeric;
  subtotal numeric := 0; server_items jsonb := '[]'::jsonb;
  zone public.delivery_zones%ROWTYPE; v_delivery_fee numeric := 0;
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
    v_delivery_fee := zone.fee;
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

  total := round(subtotal - discount + v_delivery_fee, 2);

  INSERT INTO public.orders (
    customer_name, phone, address, notes, items, total_price,
    payment_method, payment_reference, ref_source, user_id, status,
    delivery_zone_id, delivery_fee, delivery_method
  ) VALUES (
    p_customer_name, p_phone, p_address, p_notes, server_items, total,
    p_payment_method, p_payment_reference, p_ref_source, auth.uid(), 'new',
    p_delivery_zone_id, v_delivery_fee, coalesce(p_delivery_method,'delivery')
  ) RETURNING id INTO new_id;
  RETURN new_id;
END $function$;
