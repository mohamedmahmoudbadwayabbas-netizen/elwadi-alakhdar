-- =====================================================================
--  Smart Store — Full database schema + seed data (single file)
--  Generated from the live project. Apply on a fresh Supabase project:
--    psql "$DATABASE_URL" -f supabase/schema.sql
--  Everything is idempotent where possible.
-- =====================================================================

create extension if not exists pgcrypto;

create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

do $$ begin
  create type public.app_role as enum ('admin','staff','user');
exception when duplicate_object then null; end $$;


-- ============================ TABLES ============================

create table if not exists public.addresses (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  label text not null,
  full_name text not null,
  phone text not null,
  area text not null,
  street text not null,
  building text not null,
  apartment text,
  notes text,
  is_default boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
do $$ begin alter table public.addresses add constraint addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; exception when duplicate_object then null when duplicate_table then null; end $$;
do $$ begin alter table public.addresses add constraint addresses_pkey PRIMARY KEY (id); exception when duplicate_object then null when duplicate_table then null; end $$;

create table if not exists public.categories (
  id uuid default gen_random_uuid() not null,
  name text not null,
  slug text not null,
  icon text,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  image_url text,
  parent_id uuid
);
do $$ begin alter table public.categories add constraint categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL; exception when duplicate_object then null when duplicate_table then null; end $$;
do $$ begin alter table public.categories add constraint categories_pkey PRIMARY KEY (id); exception when duplicate_object then null when duplicate_table then null; end $$;
do $$ begin alter table public.categories add constraint categories_slug_key UNIQUE (slug); exception when duplicate_object then null when duplicate_table then null; end $$;

create table if not exists public.coupons (
  id uuid default gen_random_uuid() not null,
  code text not null,
  discount_type text not null,
  discount_value numeric not null,
  min_order_amount numeric,
  max_uses integer,
  uses_count integer default 0 not null,
  expires_at timestamp with time zone,
  is_active boolean default true not null,
  first_order_only boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
do $$ begin alter table public.coupons add constraint coupons_discount_type_check CHECK ((discount_type = ANY (ARRAY['percent'::text, 'fixed'::text]))); exception when duplicate_object then null when duplicate_table then null; end $$;
do $$ begin alter table public.coupons add constraint coupons_pkey PRIMARY KEY (id); exception when duplicate_object then null when duplicate_table then null; end $$;
do $$ begin alter table public.coupons add constraint coupons_code_key UNIQUE (code); exception when duplicate_object then null when duplicate_table then null; end $$;

create table if not exists public.delivery_zones (
  id uuid default gen_random_uuid() not null,
  name text not null,
  fee numeric default 0 not null,
  min_order_amount numeric default 0 not null,
  estimated_minutes integer default 45 not null,
  is_active boolean default true not null,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  country text default 'مصر'::text not null,
  governorate text,
  city text,
  area text
);
do $$ begin alter table public.delivery_zones add constraint delivery_zones_pkey PRIMARY KEY (id); exception when duplicate_object then null when duplicate_table then null; end $$;

create table if not exists public.hero_banners (
  id uuid default gen_random_uuid() not null,
  image_url text not null,
  title text,
  subtitle text,
  cta_text text,
  link_url text,
  is_active boolean default true not null,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
do $$ begin alter table public.hero_banners add constraint hero_banners_pkey PRIMARY KEY (id); exception when duplicate_object then null when duplicate_table then null; end $$;

create table if not exists public.orders (
  id uuid default gen_random_uuid() not null,
  customer_name text not null,
  phone text not null,
  address text not null,
  total_price numeric not null,
  status text default 'new'::text not null,
  items jsonb default '[]'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  ref_source text,
  notes text,
  updated_at timestamp with time zone default now() not null,
  payment_method text default 'cod'::text not null,
  payment_reference text,
  user_id uuid,
  delivery_zone_id uuid,
  delivery_fee numeric default 0 not null,
  delivery_method text default 'delivery'::text not null
);
do $$ begin alter table public.orders add constraint orders_delivery_zone_id_fkey FOREIGN KEY (delivery_zone_id) REFERENCES delivery_zones(id) ON DELETE SET NULL; exception when duplicate_object then null when duplicate_table then null; end $$;
do $$ begin alter table public.orders add constraint orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL; exception when duplicate_object then null when duplicate_table then null; end $$;
do $$ begin alter table public.orders add constraint orders_pkey PRIMARY KEY (id); exception when duplicate_object then null when duplicate_table then null; end $$;

create table if not exists public.products (
  id uuid default gen_random_uuid() not null,
  name text not null,
  category_id uuid,
  description text,
  price_per_unit numeric not null,
  old_price numeric,
  image_url text,
  is_by_weight boolean default false not null,
  unit_label text default 'قطعة'::text not null,
  is_popular boolean default false not null,
  is_on_sale boolean default false not null,
  created_at timestamp with time zone default now() not null,
  stock_quantity integer default 100 not null,
  low_stock_threshold integer default 10 not null,
  is_featured boolean default false not null,
  updated_at timestamp with time zone default now() not null
);
do $$ begin alter table public.products add constraint products_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL; exception when duplicate_object then null when duplicate_table then null; end $$;
do $$ begin alter table public.products add constraint products_pkey PRIMARY KEY (id); exception when duplicate_object then null when duplicate_table then null; end $$;

create table if not exists public.profiles (
  id uuid not null,
  full_name text,
  phone text,
  birth_date date,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
do $$ begin alter table public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE; exception when duplicate_object then null when duplicate_table then null; end $$;
do $$ begin alter table public.profiles add constraint profiles_pkey PRIMARY KEY (id); exception when duplicate_object then null when duplicate_table then null; end $$;

create table if not exists public.reviews (
  id uuid default gen_random_uuid() not null,
  product_id uuid not null,
  author_name text not null,
  rating integer not null,
  comment text not null,
  created_at timestamp with time zone default now() not null,
  user_id uuid
);
do $$ begin alter table public.reviews add constraint reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5))); exception when duplicate_object then null when duplicate_table then null; end $$;
do $$ begin alter table public.reviews add constraint reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE; exception when duplicate_object then null when duplicate_table then null; end $$;
do $$ begin alter table public.reviews add constraint reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL; exception when duplicate_object then null when duplicate_table then null; end $$;
do $$ begin alter table public.reviews add constraint reviews_pkey PRIMARY KEY (id); exception when duplicate_object then null when duplicate_table then null; end $$;

create table if not exists public.store_settings (
  id uuid default gen_random_uuid() not null,
  whatsapp_number text,
  hero_title text default 'الوادي الأخضر'::text not null,
  hero_subtitle text default 'سوبر ماركت وعطارة — جودة أصيلة وتوصيل سريع'::text not null,
  hero_image_url text,
  hero_cta_text text default 'تسوّق الآن'::text not null,
  store_address text,
  store_lat numeric,
  store_lng numeric,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  instapay_handle text,
  bank_account_info text,
  site_name text,
  logo_url text,
  favicon_url text,
  primary_color text,
  accent_color text,
  background_color text,
  foreground_color text,
  announcement_text text,
  announcement_enabled boolean default true,
  announcement_bg_color text,
  ga4_id text,
  meta_pixel_id text,
  min_order_amount numeric default 0,
  default_delivery_fee numeric default 0,
  first_order_coupon_enabled boolean default false,
  first_order_coupon_code text,
  first_order_discount_percent numeric default 10,
  hero_bg_image text,
  login_bg_pattern text,
  cart_empty_bg text,
  floating_element_image text
);
do $$ begin alter table public.store_settings add constraint store_settings_pkey PRIMARY KEY (id); exception when duplicate_object then null when duplicate_table then null; end $$;

create table if not exists public.store_settings_pulse (
  id smallint default 1 not null,
  updated_at timestamp with time zone default now() not null
);
do $$ begin alter table public.store_settings_pulse add constraint store_settings_pulse_single_row CHECK ((id = 1)); exception when duplicate_object then null when duplicate_table then null; end $$;
do $$ begin alter table public.store_settings_pulse add constraint store_settings_pulse_pkey PRIMARY KEY (id); exception when duplicate_object then null when duplicate_table then null; end $$;

create table if not exists public.theme_settings (
  id uuid default gen_random_uuid() not null,
  marble_bg_url text,
  dark_marble_bg_url text,
  primary_hex text default '#036233'::text not null,
  accent_hex text default '#E85D2F'::text not null,
  card_radius_px integer default 24 not null,
  hero_grid_images jsonb default '[]'::jsonb not null,
  hero_title text,
  hero_subtitle text,
  hero_cta_text text,
  auth_bg_url text,
  cart_empty_bg_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
do $$ begin alter table public.theme_settings add constraint theme_settings_pkey PRIMARY KEY (id); exception when duplicate_object then null when duplicate_table then null; end $$;

create table if not exists public.user_roles (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  role app_role not null,
  created_at timestamp with time zone default now() not null
);
do $$ begin alter table public.user_roles add constraint user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; exception when duplicate_object then null when duplicate_table then null; end $$;
do $$ begin alter table public.user_roles add constraint user_roles_pkey PRIMARY KEY (id); exception when duplicate_object then null when duplicate_table then null; end $$;
do $$ begin alter table public.user_roles add constraint user_roles_user_id_role_key UNIQUE (user_id, role); exception when duplicate_object then null when duplicate_table then null; end $$;

create table if not exists public.wishlists (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  product_id uuid not null,
  created_at timestamp with time zone default now() not null
);
do $$ begin alter table public.wishlists add constraint wishlists_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE; exception when duplicate_object then null when duplicate_table then null; end $$;
do $$ begin alter table public.wishlists add constraint wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; exception when duplicate_object then null when duplicate_table then null; end $$;
do $$ begin alter table public.wishlists add constraint wishlists_pkey PRIMARY KEY (id); exception when duplicate_object then null when duplicate_table then null; end $$;
do $$ begin alter table public.wishlists add constraint wishlists_user_id_product_id_key UNIQUE (user_id, product_id); exception when duplicate_object then null when duplicate_table then null; end $$;

-- ============================ GRANTS ============================
grant insert, select, update, delete on public.addresses to anon;
grant insert, select, update, delete on public.addresses to authenticated;
grant insert, select, update, delete on public.addresses to service_role;
grant insert, select, update, delete on public.categories to anon;
grant insert, select, update, delete on public.categories to authenticated;
grant insert, select, update, delete on public.categories to service_role;
grant insert, select, update, delete on public.coupons to anon;
grant insert, select, update, delete on public.coupons to authenticated;
grant insert, select, update, delete on public.coupons to service_role;
grant insert, select, update, delete on public.delivery_zones to anon;
grant insert, select, update, delete on public.delivery_zones to authenticated;
grant insert, select, update, delete on public.delivery_zones to service_role;
grant insert, select, update, delete on public.hero_banners to anon;
grant insert, select, update, delete on public.hero_banners to authenticated;
grant insert, select, update, delete on public.hero_banners to service_role;
grant insert, select, update, delete on public.orders to anon;
grant insert, select, update, delete on public.orders to authenticated;
grant insert, select, update, delete on public.orders to service_role;
grant insert, select, update, delete on public.products to anon;
grant insert, select, update, delete on public.products to authenticated;
grant insert, select, update, delete on public.products to service_role;
grant insert, select, update, delete on public.profiles to anon;
grant insert, select, update, delete on public.profiles to authenticated;
grant insert, select, update, delete on public.profiles to service_role;
grant insert, select, update, delete on public.reviews to anon;
grant insert, select, update, delete on public.reviews to authenticated;
grant insert, select, update, delete on public.reviews to service_role;
grant insert, update, delete on public.store_settings to anon;
grant insert, update, delete on public.store_settings to authenticated;
grant insert, select, update, delete on public.store_settings to service_role;
grant insert, select, update, delete on public.store_settings_pulse to anon;
grant insert, select, update, delete on public.store_settings_pulse to authenticated;
grant insert, select, update, delete on public.store_settings_pulse to service_role;
grant insert, select, update, delete on public.theme_settings to anon;
grant insert, select, update, delete on public.theme_settings to authenticated;
grant insert, select, update, delete on public.theme_settings to service_role;
grant insert, select, update, delete on public.user_roles to anon;
grant insert, select, update, delete on public.user_roles to authenticated;
grant insert, select, update, delete on public.user_roles to service_role;
grant insert, select, update, delete on public.wishlists to anon;
grant insert, select, update, delete on public.wishlists to authenticated;
grant insert, select, update, delete on public.wishlists to service_role;

-- ====================== FUNCTIONS (private) ======================
CREATE OR REPLACE FUNCTION private.create_order(p_customer_name text, p_phone text, p_address text, p_notes text, p_items jsonb, p_delivery_zone_id uuid, p_delivery_method text, p_payment_method text, p_payment_reference text, p_coupon_code text, p_ref_source text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
;
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
;
  IF p_delivery_method = 'delivery' AND p_delivery_zone_id IS NOT NULL THEN
    SELECT * INTO zone FROM public.delivery_zones WHERE id = p_delivery_zone_id AND is_active;
    IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_ZONE' USING ERRCODE='check_violation'; END IF;
    IF zone.min_order_amount IS NOT NULL AND subtotal < zone.min_order_amount THEN RAISE EXCEPTION 'BELOW_MIN_ORDER' USING ERRCODE='check_violation'; END IF;
    v_delivery_fee := zone.fee;
  END IF;
;
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
;
  total := round(subtotal - discount + v_delivery_fee, 2);
;
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
END $function$
;
CREATE OR REPLACE FUNCTION private.validate_coupon(p_code text, p_subtotal numeric)
 RETURNS TABLE(code text, discount_type text, discount_value numeric, discount_amount numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
END $function$
;
CREATE OR REPLACE FUNCTION private.get_payment_config()
 RETURNS TABLE(instapay_handle text, bank_account_info text, store_address text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT instapay_handle, bank_account_info, store_address FROM public.store_settings LIMIT 1
$function$
;
CREATE OR REPLACE FUNCTION private.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$
;
CREATE OR REPLACE FUNCTION private.enforce_order_rate_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE recent_count int;
BEGIN
  IF NEW.phone IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO recent_count FROM public.orders
   WHERE phone = NEW.phone AND created_at > now() - interval '10 minutes';
  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Too many orders submitted recently. Please try again later.' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END; $function$
;
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $function$
;
CREATE OR REPLACE FUNCTION private.get_store_settings_admin()
 RETURNS SETOF store_settings
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select s.* from public.store_settings s
  where private.has_role(auth.uid(), 'admin'::app_role)
  limit 1
$function$
;
CREATE OR REPLACE FUNCTION private.get_store_settings_public()
 RETURNS TABLE(id uuid, whatsapp_number text, hero_title text, hero_subtitle text, hero_image_url text, hero_cta_text text, store_address text, store_lat numeric, store_lng numeric, site_name text, logo_url text, favicon_url text, primary_color text, accent_color text, background_color text, foreground_color text, announcement_text text, announcement_enabled boolean, announcement_bg_color text, min_order_amount numeric, default_delivery_fee numeric, first_order_coupon_enabled boolean, first_order_coupon_code text, first_order_discount_percent numeric, hero_bg_image text, login_bg_pattern text, cart_empty_bg text, floating_element_image text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;
CREATE OR REPLACE FUNCTION private.bump_store_settings_pulse()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.store_settings_pulse (id, updated_at)
  VALUES (1, now())
  ON CONFLICT (id) DO UPDATE SET updated_at = now();
  RETURN NULL;
END;
$function$
;

;

-- ====================== FUNCTIONS (public wrappers) ======================
CREATE OR REPLACE FUNCTION public.get_payment_config()
 RETURNS TABLE(instapay_handle text, bank_account_info text, store_address text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select * from private.get_payment_config()
$function$

;
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_subtotal numeric)
 RETURNS TABLE(code text, discount_type text, discount_value numeric, discount_amount numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select * from private.validate_coupon(p_code, p_subtotal)
$function$

;
CREATE OR REPLACE FUNCTION public.create_order(p_customer_name text, p_phone text, p_address text, p_notes text, p_items jsonb, p_delivery_zone_id uuid, p_delivery_method text, p_payment_method text, p_payment_reference text, p_coupon_code text, p_ref_source text)
 RETURNS uuid
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  select private.create_order(
    p_customer_name, p_phone, p_address, p_notes, p_items,
    p_delivery_zone_id, p_delivery_method, p_payment_method,
    p_payment_reference, p_coupon_code, p_ref_source
  )
$function$

;
CREATE OR REPLACE FUNCTION public.get_store_settings_admin()
 RETURNS SETOF store_settings
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select * from private.get_store_settings_admin()
$function$

;

-- ============================ VIEWS ============================
create or replace view public.store_settings_public with (security_invoker = true) as
 SELECT id,
    whatsapp_number,
    hero_title,
    hero_subtitle,
    hero_image_url,
    hero_cta_text,
    store_address,
    store_lat,
    store_lng,
    site_name,
    logo_url,
    favicon_url,
    primary_color,
    accent_color,
    background_color,
    foreground_color,
    announcement_text,
    announcement_enabled,
    announcement_bg_color,
    min_order_amount,
    default_delivery_fee,
    first_order_coupon_enabled,
    first_order_coupon_code,
    first_order_discount_percent,
    hero_bg_image,
    login_bg_pattern,
    cart_empty_bg,
    floating_element_image,
    created_at,
    updated_at
   FROM private.get_store_settings_public() get_store_settings_public(id, whatsapp_number, hero_title, hero_subtitle, hero_image_url, hero_cta_text, store_address, store_lat, store_lng, site_name, logo_url, favicon_url, primary_color, accent_color, background_color, foreground_color, announcement_text, announcement_enabled, announcement_bg_color, min_order_amount, default_delivery_fee, first_order_coupon_enabled, first_order_coupon_code, first_order_discount_percent, hero_bg_image, login_bg_pattern, cart_empty_bg, floating_element_image, created_at, updated_at);;
grant select on public.store_settings_public to anon, authenticated, service_role;

-- ============================ RLS + POLICIES ============================
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.coupons enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.hero_banners enable row level security;
alter table public.orders enable row level security;
alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.store_settings enable row level security;
alter table public.store_settings_pulse enable row level security;
alter table public.theme_settings enable row level security;
alter table public.user_roles enable row level security;
alter table public.wishlists enable row level security;
drop policy if exists "own addr all" on public.addresses;
create policy "own addr all" on public.addresses for ALL to authenticated using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
drop policy if exists categories_admin_delete on public.categories;
create policy categories_admin_delete on public.categories for DELETE to authenticated using (private.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists categories_admin_insert on public.categories;
create policy categories_admin_insert on public.categories for INSERT to authenticated with check (private.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists categories_admin_update on public.categories;
create policy categories_admin_update on public.categories for UPDATE to authenticated using (private.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for SELECT to public using (true);
drop policy if exists coupons_admin_all on public.coupons;
create policy coupons_admin_all on public.coupons for ALL to authenticated using (private.has_role(auth.uid(), 'admin'::app_role)) with check (private.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "zones public read" on public.delivery_zones;
create policy "zones public read" on public.delivery_zones for SELECT to anon, authenticated using (true);
drop policy if exists zones_admin_all on public.delivery_zones;
create policy zones_admin_all on public.delivery_zones for ALL to authenticated using (private.has_role(auth.uid(), 'admin'::app_role)) with check (private.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "banners public read" on public.hero_banners;
create policy "banners public read" on public.hero_banners for SELECT to anon, authenticated using (true);
drop policy if exists banners_admin_all on public.hero_banners;
create policy banners_admin_all on public.hero_banners for ALL to authenticated using (private.has_role(auth.uid(), 'admin'::app_role)) with check (private.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists orders_admin_delete on public.orders;
create policy orders_admin_delete on public.orders for DELETE to authenticated using (private.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists orders_admin_read on public.orders;
create policy orders_admin_read on public.orders for SELECT to authenticated using ((private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role)));
drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders for UPDATE to authenticated using ((private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role)));
drop policy if exists orders_owner_select on public.orders;
create policy orders_owner_select on public.orders for SELECT to authenticated using (((user_id IS NOT NULL) AND (user_id = auth.uid())));
drop policy if exists products_admin_delete on public.products;
create policy products_admin_delete on public.products for DELETE to authenticated using (private.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists products_admin_insert on public.products;
create policy products_admin_insert on public.products for INSERT to authenticated with check (private.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists products_admin_update on public.products;
create policy products_admin_update on public.products for UPDATE to authenticated using (private.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for SELECT to public using (true);
drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles for INSERT to authenticated with check ((auth.uid() = id));
drop policy if exists "own profile select" on public.profiles;
create policy "own profile select" on public.profiles for SELECT to authenticated using ((auth.uid() = id));
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for UPDATE to authenticated using ((auth.uid() = id)) with check ((auth.uid() = id));
drop policy if exists "Anyone can read reviews" on public.reviews;
create policy "Anyone can read reviews" on public.reviews for SELECT to public using (true);
drop policy if exists reviews_admin_delete on public.reviews;
create policy reviews_admin_delete on public.reviews for DELETE to authenticated using (private.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists reviews_admin_update on public.reviews;
create policy reviews_admin_update on public.reviews for UPDATE to authenticated using (private.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews for INSERT to authenticated with check ((user_id = auth.uid()));
drop policy if exists store_settings_admin_insert on public.store_settings;
create policy store_settings_admin_insert on public.store_settings for INSERT to authenticated with check (private.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists store_settings_admin_read on public.store_settings;
create policy store_settings_admin_read on public.store_settings for SELECT to authenticated using (private.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists store_settings_admin_update on public.store_settings;
create policy store_settings_admin_update on public.store_settings for UPDATE to authenticated using (private.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "pulse public read" on public.store_settings_pulse;
create policy "pulse public read" on public.store_settings_pulse for SELECT to anon, authenticated using (true);
drop policy if exists "theme public read" on public.theme_settings;
create policy "theme public read" on public.theme_settings for SELECT to anon, authenticated using (true);
drop policy if exists theme_admin_all on public.theme_settings;
create policy theme_admin_all on public.theme_settings for ALL to authenticated using (private.has_role(auth.uid(), 'admin'::app_role)) with check (private.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists users_can_read_own_roles on public.user_roles;
create policy users_can_read_own_roles on public.user_roles for SELECT to authenticated using ((auth.uid() = user_id));
drop policy if exists "own wish all" on public.wishlists;
create policy "own wish all" on public.wishlists for ALL to authenticated using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));

-- ============================ TRIGGERS ============================
drop trigger if exists store_settings_pulse_trg on public.store_settings;
CREATE TRIGGER store_settings_pulse_trg AFTER INSERT OR UPDATE ON public.store_settings FOR EACH STATEMENT EXECUTE FUNCTION private.bump_store_settings_pulse();

-- ============================ REALTIME ============================
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.products;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.theme_settings;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.store_settings_pulse;
exception when duplicate_object then null; end $$;

-- ============================ STORAGE ============================
insert into storage.buckets (id, name, public) values ('product-images','product-images',false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('store-assets','store-assets',false)
  on conflict (id) do nothing;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects for SELECT to anon, authenticated using ((bucket_id = 'product-images'::text));
drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert on storage.objects for INSERT to authenticated with check (((bucket_id = 'product-images'::text) AND private.has_role(auth.uid(), 'admin'::app_role)));
drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects for UPDATE to authenticated using (((bucket_id = 'product-images'::text) AND private.has_role(auth.uid(), 'admin'::app_role)));
drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects for DELETE to authenticated using (((bucket_id = 'product-images'::text) AND private.has_role(auth.uid(), 'admin'::app_role)));
drop policy if exists store_assets_read on storage.objects;
create policy store_assets_read on storage.objects for SELECT to anon, authenticated using ((bucket_id = 'store-assets'::text));
drop policy if exists store_assets_admin_insert on storage.objects;
create policy store_assets_admin_insert on storage.objects for INSERT to authenticated with check (((bucket_id = 'store-assets'::text) AND private.has_role(auth.uid(), 'admin'::app_role)));
drop policy if exists store_assets_admin_update on storage.objects;
create policy store_assets_admin_update on storage.objects for UPDATE to authenticated using (((bucket_id = 'store-assets'::text) AND private.has_role(auth.uid(), 'admin'::app_role)));
drop policy if exists store_assets_admin_delete on storage.objects;
create policy store_assets_admin_delete on storage.objects for DELETE to authenticated using (((bucket_id = 'store-assets'::text) AND private.has_role(auth.uid(), 'admin'::app_role)));

-- ============================ SEED DATA ============================
insert into public.categories (name, slug, icon, sort_order) values
  ('لحوم','meat','🥩',2),
  ('دواجن','poultry',NULL,6),
  ('ألبان','dairy','🥛',5),
  ('عطارة','spices','🌿',4),
  ('بقالة','grocery','🛒',4),
  ('منظفات ومنزل','cleaning','🧼',6)
on conflict (slug) do nothing;
insert into public.products (name, category_id, description, price_per_unit, old_price, image_url, is_by_weight, unit_label, is_popular, is_on_sale, is_featured, stock_quantity)
select v.name::text, v.category_id::uuid, v.description::text, v.price_per_unit::numeric, v.old_price::numeric,
       v.image_url::text, v.is_by_weight::boolean, v.unit_label::text, v.is_popular::boolean,
       v.is_on_sale::boolean, v.is_featured::boolean, v.stock_quantity::int
from (values
  ('كمون حصى',(select id from public.categories where slug='spices'),'كمون حصى درجة أولى',45.00,60.00,'https://nyirkanquoziravfepkf.supabase.co/storage/v1/object/sign/product-images/1784747558262-x5kf26r7h6r.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81ZmRlODQwOS03MDgzLTQ5OWYtYTAxOS05ODFlMzE4OWNjOGQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy8xNzg0NzQ3NTU4MjYyLXg1a2YyNnI3aDZyLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODQ3NDc1NjQsImV4cCI6MjEwMDEwNzU2NH0.Mdozz5XFyonZwQbOLEcBRA9sUk-zg8-OXjUalOTu3N4',true,'100 جرام',false,true,false,100),
  ('أرز  بسمتي مندي',(select id from public.categories where slug='grocery'),'أرز مصري فاخر - كيس 10 كجم',439.00,null,'https://nyirkanquoziravfepkf.supabase.co/storage/v1/object/sign/product-images/1784747595093-7wcll747oty.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81ZmRlODQwOS03MDgzLTQ5OWYtYTAxOS05ODFlMzE4OWNjOGQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy8xNzg0NzQ3NTk1MDkzLTd3Y2xsNzQ3b3R5LnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODQ3NDc2MDAsImV4cCI6MjEwMDEwNzYwMH0.xGxNXlr1M4Kgw4xsRsV3qxDMzoWK9YNSUAarN6GgckY',false,'كيس 10 كجم',true,true,false,100),
  ('صدور دجاج طازجة',(select id from public.categories where slug='poultry'),'صدور دجاج بلدي طازجة بدون عظم',185.00,220.00,'https://nyirkanquoziravfepkf.supabase.co/storage/v1/object/sign/product-images/1784747785862-86xs353vcit.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81ZmRlODQwOS03MDgzLTQ5OWYtYTAxOS05ODFlMzE4OWNjOGQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy8xNzg0NzQ3Nzg1ODYyLTg2eHMzNTN2Y2l0LmpwZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODQ3NDc3ODcsImV4cCI6MjEwMDEwNzc4N30.jCsPHjBaEXniUtwNp6gXXpsvvkZo3Z4zcxDbFRlc3Mo',true,'1 كجم',true,true,false,100),
  ('لحم بقري ',(select id from public.categories where slug='meat'),'لحم بقري بلدي طازج',380.00,400.00,'https://nyirkanquoziravfepkf.supabase.co/storage/v1/object/sign/product-images/1784751015398-5uvcdirp2ul.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81ZmRlODQwOS03MDgzLTQ5OWYtYTAxOS05ODFlMzE4OWNjOGQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy8xNzg0NzUxMDE1Mzk4LTV1dmNkaXJwMnVsLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODQ3NTEwMjIsImV4cCI6MjEwMDExMTAyMn0.YPUlwGCpRFNoNMJdFo3ckWF7WFSXScOkQf0Dv5J_FuM',true,'1 كجم',true,false,false,100),
  ('جبنة بيضاء طازجة',(select id from public.categories where slug='dairy'),'جبنة رومي كاملة الدسم',260.00,280.00,'https://nyirkanquoziravfepkf.supabase.co/storage/v1/object/sign/product-images/1784751099183-9laj6kjd9u.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81ZmRlODQwOS03MDgzLTQ5OWYtYTAxOS05ODFlMzE4OWNjOGQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy8xNzg0NzUxMDk5MTgzLTlsYWo2a2pkOXUucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NDc1MTEwMywiZXhwIjoyMTAwMTExMTAzfQ.0s3rXGShC_HCkzUjP6nHTmzzwq9OpbPgZeNCTKAeHk0',false,'علبة 500 جرام',true,true,false,100),
  ('اوكسي كبير ٢ كيلو',(select id from public.categories where slug='cleaning'),'اوكسي كبير فوق اوتوماتيك 2 كيلو',139.00,null,'https://nyirkanquoziravfepkf.supabase.co/storage/v1/object/sign/product-images/1784751145091-wkqh1k9l8y.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81ZmRlODQwOS03MDgzLTQ5OWYtYTAxOS05ODFlMzE4OWNjOGQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy8xNzg0NzUxMTQ1MDkxLXdrcWgxazlsOHkucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NDc1MTE1MCwiZXhwIjoyMTAwMTExMTUwfQ.Gkre-Xa_mCmgAO3xRg02APbhbmsxmmcdbKW8NNVQFb0',false,'قطعة',false,true,false,100),
  ('لبن طازج كامل الدسم ١ لتر',(select id from public.categories where slug='dairy'),'لبن بقري طازج كامل الدسم معبّأ في نفس يوم الإنتاج.',48.00,55.00,'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',false,'لتر',true,true,false,120),
  ('زبادي طبيعي — ٦ عبوات',(select id from public.categories where slug='dairy'),'زبادي طبيعي بدون إضافات، عبوة اقتصادية ٦ قطع.',66.00,null,'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',false,'عبوة',false,false,false,90),
  ('بيض بلدي — طبق ٣٠ بيضة',(select id from public.categories where slug='poultry'),'بيض بلدي طازج، طبق ٣٠ بيضة معبّأ بعناية لضمان الوصول سليماً.',145.00,null,'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80',false,'طبق',true,false,true,80),
  ('مسحوق غسيل أوتوماتيك ٣ كجم',(select id from public.categories where slug='cleaning'),'مسحوق غسيل أوتوماتيك عالي الكفاءة برائحة منعشة.',215.00,240.00,'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80',false,'عبوة',true,true,false,45),
  ('قرفة عيدان فاخرة',(select id from public.categories where slug='spices'),'قرفة عيدان فاخرة برائحة نفّاذة، تُباع بالوزن.',120.00,null,'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80',true,'كجم',false,false,false,30),
  ('سائل غسيل أطباق ١ لتر',(select id from public.categories where slug='cleaning'),'سائل غسيل أطباق مركّز يزيل الدهون بسهولة.',58.00,null,'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=800&q=80',false,'عبوة',false,false,false,75),
  ('سكر أبيض ناعم ١ كجم',(select id from public.categories where slug='grocery'),'سكر أبيض ناعم معبّأ ١ كجم من إنتاج مصانع محلية معتمدة.',42.00,null,'https://images.unsplash.com/photo-1610478920392-95888b4b6f0e?auto=format&fit=crop&w=800&q=80',false,'كجم',false,false,false,150),
  ('لحم ضاني بلدي طازج',(select id from public.categories where slug='meat'),'لحم ضاني بلدي طازج مذبوح يومياً، مقطّع حسب الطلب ومعبّأ بطريقة صحية.',520.00,560.00,'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80',true,'كجم',true,true,true,40),
  ('دجاج بلدي كامل',(select id from public.categories where slug='poultry'),'دجاج بلدي كامل منظّف وجاهز للطهي، وزن يتراوح بين ١.٢ و١.٥ كجم.',165.00,180.00,'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80',false,'قطعة',true,true,false,60),
  ('زيت ذرة ٢ لتر',(select id from public.categories where slug='grocery'),'زيت ذرة نقي ٢ لتر مناسب للطهي والتحمير.',189.00,205.00,'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',false,'عبوة',true,true,true,70),
  ('مكرونة إسباجيتي ٤٠٠ جم',(select id from public.categories where slug='grocery'),'مكرونة إسباجيتي من دقيق السيمولينا الفاخر.',26.00,32.00,'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=800&q=80',false,'عبوة',false,true,false,200),
  ('كفتة مفرومة طازجة',(select id from public.categories where slug='meat'),'كفتة بقري مفرومة طازجة يومياً بتوابل خفيفة جاهزة للطهي.',340.00,null,'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80',true,'كجم',true,false,false,55),
  ('كركديه سوداني',(select id from public.categories where slug='spices'),'كركديه سوداني أحمر ممتاز، يُقدّم ساخناً أو بارداً.',95.00,110.00,'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=80',true,'كجم',true,true,true,35)
) as v(name, category_id, description, price_per_unit, old_price, image_url, is_by_weight, unit_label, is_popular, is_on_sale, is_featured, stock_quantity)
where not exists (select 1 from public.products p2 where p2.name = v.name);
insert into public.store_settings (site_name, hero_title, hero_subtitle, hero_cta_text, hero_image_url, hero_bg_image, announcement_text, announcement_bg_color, primary_color, accent_color, background_color, foreground_color, min_order_amount, default_delivery_fee, store_address, whatsapp_number)
select v.site_name::text, v.hero_title::text, v.hero_subtitle::text, v.hero_cta_text::text, v.hero_image_url::text,
       v.hero_bg_image::text, v.announcement_text::text, v.announcement_bg_color::text, v.primary_color::text,
       v.accent_color::text, v.background_color::text, v.foreground_color::text, v.min_order_amount::numeric,
       v.default_delivery_fee::numeric, v.store_address::text, v.whatsapp_number::text
from (values
  ('سمارت ستور — Smart Store','سمارت ستور — متجرك الإلكتروني المتكامل 🛍️','بقالة، لحوم ودواجن، ألبان، عطارة ومنظفات — أسعار تنافسية وتوصيل سريع لباب البيت.','ابدأ التسوّق الآن','https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=85','https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=85','🚚 توصيل سريع لكل المناطق — شحن مجاني للطلبات أكثر من ٥٠٠ ج.م','142 76% 24%','142 76% 24%','18 85% 55%','48 33% 97%','120 18% 12%',0,0,'الشرقية، مصر، اول العاشر من رمضان، مجاورة السابعة، أمام منطقة C1 ','+201095540005')
) as v(site_name, hero_title, hero_subtitle, hero_cta_text, hero_image_url, hero_bg_image, announcement_text, announcement_bg_color, primary_color, accent_color, background_color, foreground_color, min_order_amount, default_delivery_fee, store_address, whatsapp_number)
where not exists (select 1 from public.store_settings);
insert into public.theme_settings (primary_hex, accent_hex, card_radius_px, hero_title, hero_subtitle, hero_cta_text, hero_grid_images)
select v.primary_hex, v.accent_hex, v.card_radius_px, v.hero_title, v.hero_subtitle, v.hero_cta_text, v.hero_grid_images::jsonb from (values
  ('#036233','#E85D2F',24,'سمارت ستور — متجرك الإلكتروني المتكامل','كل احتياجات البيت في مكان واحد مع توصيل سريع وأسعار مناسبة.','ابدأ التسوّق','["https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1573246123716-6b1782bfc499?auto=format&fit=crop&w=1200&q=80"]')
) as v(primary_hex, accent_hex, card_radius_px, hero_title, hero_subtitle, hero_cta_text, hero_grid_images)
where not exists (select 1 from public.theme_settings);
insert into public.delivery_zones (name, fee, min_order_amount, estimated_minutes, is_active, sort_order, country, governorate, city, area)
select v.name::text, v.fee::numeric, v.min_order_amount::numeric, v.estimated_minutes::int, v.is_active::boolean,
       v.sort_order::int, v.country::text, v.governorate::text, v.city::text, v.area::text
from (values
  ('الشرقية — العاشر من رمضان — المجاورة 8',20,100,30,true,1,'مصر','الشرقية','العاشر من رمضان','المجاورة 8')
) as v(name, fee, min_order_amount, estimated_minutes, is_active, sort_order, country, governorate, city, area)
where not exists (select 1 from public.delivery_zones d where d.name = v.name);

insert into public.store_settings_pulse (id, updated_at) values (1, now()) on conflict (id) do nothing;

-- ============================ ADMIN BOOTSTRAP ============================
-- 1) Create the admin user in Authentication (dashboard or Admin API).
-- 2) Grant the admin role (replace the UUID with the new user id):
-- insert into public.user_roles (user_id, role) values ('<AUTH_USER_UUID>','admin');

