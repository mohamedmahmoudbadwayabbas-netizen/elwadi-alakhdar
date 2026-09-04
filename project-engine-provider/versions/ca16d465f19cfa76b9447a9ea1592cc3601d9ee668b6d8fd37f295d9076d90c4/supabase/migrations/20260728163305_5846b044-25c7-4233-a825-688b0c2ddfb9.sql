create or replace function public.create_order(p_customer_name text, p_phone text, p_address text, p_notes text, p_items jsonb, p_delivery_zone_id uuid, p_delivery_method text, p_payment_method text, p_payment_reference text, p_coupon_code text, p_ref_source text)
returns uuid
language sql
security definer
set search_path to 'public'
as $function$
  select private.create_order(
    p_customer_name, p_phone, p_address, p_notes, p_items,
    p_delivery_zone_id, p_delivery_method, p_payment_method,
    p_payment_reference, p_coupon_code, p_ref_source
  )
$function$;

revoke all on function public.create_order(text,text,text,text,jsonb,uuid,text,text,text,text,text) from public;
grant execute on function public.create_order(text,text,text,text,jsonb,uuid,text,text,text,text,text) to anon, authenticated;

create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns table(code text, discount_type text, discount_value numeric, discount_amount numeric)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select * from private.validate_coupon(p_code, p_subtotal)
$function$;

revoke all on function public.validate_coupon(text, numeric) from public;
grant execute on function public.validate_coupon(text, numeric) to anon, authenticated;