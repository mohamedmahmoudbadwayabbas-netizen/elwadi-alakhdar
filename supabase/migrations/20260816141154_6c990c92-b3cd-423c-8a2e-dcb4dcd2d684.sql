-- Safe public projection served by a hardened private definer function
create or replace function private.get_store_settings_public()
returns table (
  id uuid,
  whatsapp_number text,
  hero_title text,
  hero_subtitle text,
  hero_image_url text,
  hero_cta_text text,
  store_address text,
  store_lat numeric,
  store_lng numeric,
  site_name text,
  logo_url text,
  favicon_url text,
  primary_color text,
  accent_color text,
  background_color text,
  foreground_color text,
  announcement_text text,
  announcement_enabled boolean,
  announcement_bg_color text,
  min_order_amount numeric,
  default_delivery_fee numeric,
  first_order_coupon_enabled boolean,
  first_order_coupon_code text,
  first_order_discount_percent numeric,
  hero_bg_image text,
  login_bg_pattern text,
  cart_empty_bg text,
  floating_element_image text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id, s.whatsapp_number, s.hero_title, s.hero_subtitle, s.hero_image_url,
    s.hero_cta_text, s.store_address, s.store_lat, s.store_lng, s.site_name,
    s.logo_url, s.favicon_url, s.primary_color, s.accent_color, s.background_color,
    s.foreground_color, s.announcement_text, s.announcement_enabled, s.announcement_bg_color,
    s.min_order_amount, s.default_delivery_fee, s.first_order_coupon_enabled,
    s.first_order_coupon_code, s.first_order_discount_percent, s.hero_bg_image,
    s.login_bg_pattern, s.cart_empty_bg, s.floating_element_image,
    s.created_at, s.updated_at
  from public.store_settings s
$$;

revoke all on function private.get_store_settings_public() from public;
grant execute on function private.get_store_settings_public() to anon, authenticated, service_role;

-- Recreate the public view as SECURITY INVOKER over the safe projection
drop view if exists public.store_settings_public;
create view public.store_settings_public
with (security_invoker = true) as
  select * from private.get_store_settings_public();

grant select on public.store_settings_public to anon, authenticated, service_role;

-- Remove the always-true public read policy from the base table
drop policy if exists store_settings_public_columns_read on public.store_settings;

-- Base table stays admin-only for reads
drop policy if exists store_settings_admin_read on public.store_settings;
create policy store_settings_admin_read on public.store_settings
  for select to authenticated
  using (private.has_role(auth.uid(), 'admin'::app_role));