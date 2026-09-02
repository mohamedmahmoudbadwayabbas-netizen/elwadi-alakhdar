-- =====================================================================
--  Al-Wadi Al-Akhdar Supermarket (سوبرماركت الوادي الأخضر)
--  PostgreSQL / Supabase Schema for 3 Branches
-- =====================================================================

create extension if not exists pgcrypto;

-- 1. Branches Table (3 Main Supermarket Branches)
create table if not exists public.branches (
  id text primary key,
  code text unique not null,
  name text not null,
  name_en text,
  city text not null,
  address text not null,
  phone text not null,
  whatsapp text,
  status text default 'open' check (status in ('open', 'busy', 'closed')),
  is_main boolean default false,
  latitude double precision not null,
  longitude double precision not null,
  delivery_zones jsonb default '[]'::jsonb,
  operating_hours jsonb default '{"open": "07:00", "close": "02:00"}'::jsonb,
  manager_name text,
  manager_email text,
  daily_revenue numeric default 0,
  daily_orders integer default 0,
  active_orders integer default 0,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Seed the 3 Branches
insert into public.branches (id, code, name, name_en, city, address, phone, whatsapp, status, is_main, latitude, longitude, delivery_zones, manager_name, manager_email, daily_revenue, daily_orders, active_orders)
values
  ('branch-dokki', 'DOKKI_MAIN', 'فرع الدقي والمهندسين (الفرع الرئيسي)', 'Dokki Main Branch', 'الجيزة', 'شارع مصدق تقاطع شارع السودان، الدقي', '+201099887711', '+201099887711', 'open', true, 30.0384, 31.2118, '["الدقي", "المهندسين", "العجوزة", "الزمالك"]'::jsonb, 'م. أحمد عبد الرحمن', 'adminstoresupermarketinvo@gmail.com', 24850, 68, 7),
  ('branch-nasr-city', 'NASR_CITY', 'فرع مدينة نصر والتجمع الخامس', 'Nasr City Branch', 'القاهرة', 'شارع مكرم عبيد بجوار سيتي ستارز، مدينة نصر', '+201099887722', '+201099887722', 'open', false, 30.0561, 31.3439, '["مدينة نصر", "مصر الجديدة", "التجمع الأول", "التجمع الخامس"]'::jsonb, 'أ. محمود شاكر', 'nasrcity.manager@elwadi.com', 19400, 49, 5),
  ('branch-maadi', 'MAADI', 'فرع المعادي والمقطم', 'Maadi Branch', 'القاهرة', 'شارع النصر تقاطع اللاسلكي، دجلة المعادي', '+201099887733', '+201099887733', 'open', false, 29.9602, 31.2774, '["المعادي", "دجلة", "زهراء المعادي", "المقطم"]'::jsonb, 'أ. خالد النجار', 'maadi.manager@elwadi.com', 16200, 38, 4)
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  status = excluded.status;

-- 2. Multi-Branch Inventory Table
create table if not exists public.branch_inventory (
  id uuid default gen_random_uuid() primary key,
  product_id uuid not null,
  branch_id text not null references public.branches(id) on delete cascade,
  stock_quantity integer default 0 not null,
  low_stock_threshold integer default 10 not null,
  is_available boolean default true not null,
  shelf_location text,
  updated_at timestamp with time zone default now() not null,
  unique (product_id, branch_id)
);

-- 3. Branch Orders Relation
alter table public.orders add column if not exists branch_id text references public.branches(id);
alter table public.orders add column if not exists chef_instructions text;
