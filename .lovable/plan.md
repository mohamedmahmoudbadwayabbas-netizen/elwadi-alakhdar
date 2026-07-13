
# 🏪 Blueprint متجر "الوادي الأخضر" — تقرير نقل شامل

هذا المستند جاهز للنسخ إلى برومبت المشروع الأصلي. يحتوي على قاعدة البيانات، الواجهة، المنطق، والهوية البصرية بحيث يمكن للـ AI في المشروع الأصلي تطبيقه بدقة.

---

## 1) 🧱 التقنيات والاعتمادات (Stack)

- **Framework:** TanStack Start v1 + React 19 + Vite 8 (Cloudflare Workers).
- **Backend:** Supabase (Lovable Cloud) — auth, DB, storage.
- **UI:** shadcn/ui (Radix) + Tailwind v4 (`src/styles.css`).
- **State/Data:** TanStack Query 5، Context API (auth/cart/settings/theme/i18n).
- **Icons:** lucide-react. **Forms:** react-hook-form + zod. **Toasts:** sonner.
- **Extras:** embla-carousel-react, recharts, date-fns, xlsx (تصدير Excel للطلبات).
- **RTL/عربي:** الخط الافتراضي `Tajawal`، الواجهة كلها `dir="rtl"`.

---

## 2) 🗄️ قاعدة البيانات الكاملة (Supabase — schema public)

### 2.1 Enums

```sql
CREATE TYPE public.app_role AS ENUM ('admin','staff','user');
```

### 2.2 جميع الجداول (SQL كامل)

> كل جدول: CREATE → GRANT → ENABLE RLS → POLICIES. تريجر `update_updated_at_column()` عام.

```sql
-- Helper: updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Helper: user roles check
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;

-- Handle new user (profiles + default role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name',''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone,''),
    NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;
```

**user_roles** — أدوار (لا تُخزَّن على profiles أبداً).
```sql
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid()=user_id);
```

**profiles**
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text, phone text, birth_date date, avatar_url text,
  is_blocked boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid()=id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid()=id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid()=id);
CREATE POLICY "admin read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**categories**
```sql
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, slug text NOT NULL UNIQUE,
  icon text, sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY categories_public_read ON public.categories FOR SELECT USING (true);
CREATE POLICY categories_admin_insert ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY categories_admin_update ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY categories_admin_delete ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
```

**products**
```sql
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description text,
  price_per_unit numeric NOT NULL,
  old_price numeric,
  image_url text,
  is_by_weight boolean NOT NULL DEFAULT false,
  unit_label text NOT NULL DEFAULT 'قطعة',
  unit_type text,                 -- kg / piece / bunch ...
  is_popular boolean NOT NULL DEFAULT false,
  is_on_sale boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  stock_quantity int NOT NULL DEFAULT 0,
  low_stock_threshold int NOT NULL DEFAULT 5,
  badges text[] DEFAULT '{}',     -- e.g. {"طازج","عضوي"}
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_public_read ON public.products FOR SELECT USING (true);
CREATE POLICY products_admin_all ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

**cart_items**
```sql
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own cart" ON public.cart_items FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
```

**wishlists / recently_viewed**
```sql
CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wishlist" ON public.wishlists FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE public.recently_viewed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.recently_viewed TO authenticated;
GRANT ALL ON public.recently_viewed TO service_role;
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recently" ON public.recently_viewed FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
```

**addresses**
```sql
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text, full_name text NOT NULL, phone text NOT NULL,
  area text, street text NOT NULL, building text, apartment text, notes text,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own addresses" ON public.addresses FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "admins view addresses" ON public.addresses FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
```

**delivery_zones / delivery_slots**
```sql
CREATE TABLE public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, fee numeric NOT NULL DEFAULT 0,
  min_order_amount numeric DEFAULT 0, estimated_minutes int DEFAULT 45,
  is_active boolean DEFAULT true, sort_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.delivery_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL, start_hour int NOT NULL, end_hour int NOT NULL,
  is_active boolean DEFAULT true, sort_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.delivery_zones, public.delivery_slots TO anon, authenticated;
GRANT ALL ON public.delivery_zones, public.delivery_slots TO service_role;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active zones readable" ON public.delivery_zones FOR SELECT USING (is_active=true);
CREATE POLICY "admins manage zones" ON public.delivery_zones FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "active slots readable" ON public.delivery_slots FOR SELECT USING (is_active=true);
CREATE POLICY "admins manage slots" ON public.delivery_slots FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
```

**coupons / coupon_redemptions**
```sql
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value numeric NOT NULL,
  min_order_amount numeric DEFAULT 0,
  max_uses int, uses_count int DEFAULT 0,
  expires_at timestamptz, is_active boolean DEFAULT true,
  first_order_only boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  phone text, order_id uuid,
  discount_amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT SELECT, INSERT ON public.coupon_redemptions TO authenticated;
GRANT ALL ON public.coupons, public.coupon_redemptions TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active coupons readable" ON public.coupons FOR SELECT USING (is_active=true);
CREATE POLICY "admins manage coupons" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "users see own redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "admins view redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
```

**orders**
```sql
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL, phone text NOT NULL, address text NOT NULL,
  items jsonb NOT NULL,
  total_price numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',   -- pending|confirmed|preparing|out_for_delivery|delivered|cancelled
  payment_method text NOT NULL DEFAULT 'cod', -- cod|instapay|bank
  payment_reference text,
  ref_source text, notes text,
  coupon_id uuid REFERENCES public.coupons(id),
  coupon_code text, discount_amount numeric DEFAULT 0,
  delivery_zone_id uuid REFERENCES public.delivery_zones(id),
  delivery_fee numeric DEFAULT 0,
  delivery_slot text, delivery_date date,
  tracking_token text UNIQUE DEFAULT encode(gen_random_bytes(12),'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- Public/guest insert with validation
CREATE POLICY orders_public_insert ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(customer_name) BETWEEN 2 AND 120
    AND char_length(phone) BETWEEN 6 AND 30
    AND total_price >= 0
  );
CREATE POLICY orders_own_read ON public.orders FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY orders_admin_read ON public.orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY orders_admin_update ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY orders_admin_delete ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Rate limit trigger (max 5 orders / 10 min per phone)
CREATE OR REPLACE FUNCTION public.enforce_order_rate_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE recent_count int;
BEGIN
  IF NEW.phone IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO recent_count FROM public.orders
    WHERE phone=NEW.phone AND created_at > now() - interval '10 minutes';
  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Too many orders submitted recently. Please try again later.' USING ERRCODE='check_violation';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_orders_rate_limit BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.enforce_order_rate_limit();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

**reviews / returns / notifications / abandoned_carts / flash_offers / product_bundles**
```sql
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  author_name text NOT NULL, rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY reviews_public_read ON public.reviews FOR SELECT USING (true);
CREATE POLICY reviews_insert_auth ON public.reviews FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY reviews_admin_update ON public.reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY reviews_admin_delete ON public.reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL, status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.returns TO authenticated;
GRANT ALL ON public.returns TO service_role;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY returns_own ON public.returns FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY returns_insert_own ON public.returns FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY returns_admin ON public.returns FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL, body text, type text DEFAULT 'info',
  link text, is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "mark own read" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid()=user_id);

CREATE TABLE public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text, cart_data jsonb NOT NULL, total numeric NOT NULL DEFAULT 0,
  reminded_at timestamptz, recovered boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.abandoned_carts TO authenticated, service_role;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own abandoned" ON public.abandoned_carts FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "admins view abandoned" ON public.abandoned_carts FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.flash_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, banner_image_url text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  discount_percent int NOT NULL,
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.flash_offers TO anon, authenticated;
GRANT ALL ON public.flash_offers TO authenticated, service_role;
ALTER TABLE public.flash_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active offers readable" ON public.flash_offers FOR SELECT USING (is_active=true);
CREATE POLICY "admins manage offers" ON public.flash_offers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.product_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, description text,
  buy_quantity int NOT NULL, pay_quantity int NOT NULL,
  product_ids uuid[] NOT NULL,
  is_active boolean DEFAULT true,
  starts_at timestamptz, ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_bundles TO anon, authenticated;
GRANT ALL ON public.product_bundles TO authenticated, service_role;
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active bundles readable" ON public.product_bundles FOR SELECT USING (is_active=true);
CREATE POLICY "admins manage bundles" ON public.product_bundles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
```

**store_settings** (صف واحد يحكم كل الهوية البصرية)
```sql
CREATE TABLE public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text DEFAULT 'الوادي الأخضر',
  logo_url text, favicon_url text,
  primary_color text DEFAULT '#166534',
  accent_color text DEFAULT '#ea580c',
  background_color text DEFAULT '#fafaf7',
  foreground_color text DEFAULT '#1a1a1a',
  font_family text DEFAULT 'Tajawal',
  announcement_text text DEFAULT 'شحن مجاني فوق ٣٠٠ ج.م | توصيل سريع خلال ٤٥ دقيقة ⚡ | الدفع عند الاستلام ✓',
  announcement_enabled boolean DEFAULT true,
  announcement_bg_color text DEFAULT '#166534',
  whatsapp_number text,
  hero_title text NOT NULL DEFAULT 'الوادي الأخضر',
  hero_subtitle text NOT NULL DEFAULT 'سوبر ماركت وعطارة — جودة أصيلة وتوصيل سريع',
  hero_image_url text, hero_cta_text text NOT NULL DEFAULT 'تسوّق الآن',
  hero_bg_image text, cart_empty_bg text, floating_element_image text, login_bg_pattern text,
  store_address text, store_lat numeric, store_lng numeric,
  ga4_id text, meta_pixel_id text,
  min_order_amount numeric DEFAULT 0,
  default_delivery_fee numeric DEFAULT 0,
  dark_mode_enabled boolean DEFAULT false,
  first_order_coupon_enabled boolean DEFAULT false,
  first_order_coupon_code text,
  first_order_discount_percent int DEFAULT 10,
  instapay_handle text, bank_account_info text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_public_read ON public.store_settings FOR SELECT USING (true);
CREATE POLICY settings_admin_update ON public.store_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY settings_admin_insert ON public.store_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.store_settings DEFAULT VALUES;
```

**theme_settings** (توكنز طور تجريبي — hero grid وصور رخام)
```sql
CREATE TABLE public.theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marble_bg_url text, dark_marble_bg_url text,
  primary_hex text DEFAULT '#036233',
  accent_hex text DEFAULT '#E85D2F',
  card_radius_px int DEFAULT 24,
  hero_grid_images jsonb DEFAULT '[]'::jsonb,
  hero_title text DEFAULT 'الوادي الأخضر',
  hero_subtitle text DEFAULT 'سوبر ماركت وعطارة - أفضل أنواع الاختيارات وتوصيل سريع مباشر لباب بيتك',
  hero_cta_text text DEFAULT 'تسوّق الآن',
  auth_bg_url text, cart_empty_bg_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.theme_settings TO anon, authenticated;
GRANT UPDATE, INSERT ON public.theme_settings TO authenticated;
GRANT ALL ON public.theme_settings TO service_role;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY theme_public_read ON public.theme_settings FOR SELECT USING (true);
CREATE POLICY theme_admin_update ON public.theme_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY theme_admin_insert ON public.theme_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY theme_admin_delete ON public.theme_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
INSERT INTO public.theme_settings DEFAULT VALUES;
```

### 2.3 Storage
- Bucket **`product-images`** (private). يُقرأ عبر signed URLs أو يُحوَّل public لو رغبت.

### 2.4 Auth
- تفعيل Email/Password و Google OAuth (عبر Lovable broker: `lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin })`).
- تريجر `handle_new_user` مُفعَّل على `auth.users`.

---

## 3) 🎨 الواجهة الأمامية — Routes & Components

### 3.1 Routes (كلها تحت `src/routes/`)
| ملف | مسار | وصف |
|---|---|---|
| `__root.tsx` | / | الجذر: Providers (Auth, Settings, Theme, Cart, i18n, QueryClient) + `<Toaster/>` + `<Header/> <AnnouncementBar/> <Outlet/> <BottomNav/> <WhatsAppFloat/>` + `head()` SEO |
| `index.tsx` | `/` | الصفحة الرئيسية: Hero + CategoryGrid + شبكة المنتجات + فلاتر + شارات عروض |
| `products.$productId.tsx` | `/products/$productId` | صفحة تفاصيل المنتج + reviews + related |
| `cart.tsx` | `/cart` | السلة + الكوبون + zone + slot + الدفع (COD/InstaPay/Bank) + إنشاء الطلب |
| `auth.tsx` | `/auth` | تسجيل/دخول + Google OAuth |
| `_authenticated/route.tsx` | (gate) | `ssr:false` + `supabase.auth.getUser()` |
| `_authenticated/account.tsx` | `/account` | الملف الشخصي + العناوين + الطلبات + المفضلة |
| `admin.tsx` | `/admin` | Layout + AdminSidebar |
| `admin.index.tsx` | `/admin` | لوحة KPIs (طلبات، إيرادات، متوسط، مخزون منخفض) + recharts |
| `admin.login.tsx` | `/admin/login` | دخول خاص بالأدمن |
| `admin.products.tsx` | `/admin/products` | CRUD منتجات (رفع صور، badges، مخزون) + استيراد/تصدير xlsx |
| `admin.categories.tsx` | `/admin/categories` | CRUD أقسام (اسم/slug/icon/ترتيب) |
| `admin.orders.tsx` | `/admin/orders` | إدارة الطلبات + تغيير الحالة + تصدير |
| `admin.coupons.tsx` | `/admin/coupons` | CRUD كوبونات + first-order-only |
| `admin.reviews.tsx` | `/admin/reviews` | مراجعة/حذف تقييمات |
| `admin.profile.tsx` | `/admin/profile` | حساب الأدمن |
| `admin.settings.tsx` | `/admin/settings` | كل إعدادات المتجر + **LivePreview** فوري + StoreMapPicker |
| `sitemap[.]xml.ts` | `/sitemap.xml` | server route ينتج XML |

### 3.2 Storefront components (`src/components/storefront/`)
- **Header.tsx**: يقرأ `useSettings()` → لوجو (`logo_url`) + `site_name` + Search + UserMenu + Cart badge.
- **AnnouncementBar.tsx**: يعرض `announcement_text` بلون `announcement_bg_color` عند التفعيل.
- **HeroCarousel.tsx**: يستخدم embla-carousel + `hero_bg_image`/`hero_grid_images`.
- **CategoryGrid.tsx**: يجلب `categories` مرتبة بـ `sort_order` ويسمح بالفلترة.
- **ProductCard.tsx**: صورة + سعر + سعر قديم + badges + زر إضافة + عدّاد كمية (وحدات وزنية vs قطع).
- **ProductModal.tsx**: عرض سريع + إضافة للسلة.
- **BottomNav.tsx**: Home / Categories / Cart / Account (mobile فقط).
- **WhatsAppFloat.tsx**: زر عائم يفتح `wa.me/${whatsapp_number}`.
- **UserMenu.tsx**: dropdown حساب/طلبات/تسجيل خروج.

### 3.3 Admin components (`src/components/admin/`)
- **AdminSidebar.tsx**: تنقّل الأدمن (Dashboard/Products/Categories/Orders/Coupons/Reviews/Settings/Profile).
- **StoreMapPicker.tsx**: اختيار `store_lat/store_lng` من الخريطة.

### 3.4 UI base
- shadcn/ui كاملة (`src/components/ui/*`) + مكوّن مخصّص `number-input.tsx` لعدّاد الكمية.

---

## 4) 🧠 المنطق البرمجي (Contexts / Hooks)

### 4.1 `src/lib/settings-context.tsx`
- يجلب صف `store_settings` مرة واحدة عند التركيب (`useEffect` بـ deps فارغة + `mounted` guard).
- يحقن CSS vars: `--primary/--accent/--background/--foreground` عبر `hexToHsl`.
- يوفّر `useSettings()` لكل المكوّنات.

### 4.2 `src/lib/theme-context.tsx`
- يجلب `theme_settings` مرة واحدة + `applyTokens()` (radius/marble bg).
- يوفّر `useTheme()`.

### 4.3 `src/lib/auth-context.tsx`
- يستمع لـ `supabase.auth.onAuthStateChange` مع فلترة SIGNED_IN/OUT/USER_UPDATED فقط.
- يعرّض `user, session, isAdmin, signOut()`.

### 4.4 `src/lib/cart-context.tsx`
- Guest cart في `localStorage`؛ عند تسجيل الدخول يُدمج مع `cart_items`.
- API: `addItem, removeItem, updateQty, clear, subtotal, count`.
- كميات وزنية بخطوة 0.25 والقطعية بخطوة 1.

### 4.5 `src/lib/i18n-context.tsx`
- عربي فقط (`ar`) افتراضياً + مفاتيح ترجمة قابلة للتوسّع.

### 4.6 Data fetching
- الافتراضي: TanStack Query. المنتجات/الأقسام/الكوبونات/الطلبات تُقرأ عبر `supabase.from(...).select(...)` داخل `useQuery` أو داخل route loader + `queryClient.ensureQueryData`.
- إنشاء الطلب في `cart.tsx`: `supabase.from('orders').insert({...})` (Guest عبر anon insert policy).

### 4.7 Routing/SSR
- `src/router.tsx` ينشئ QueryClient + Router.
- `_authenticated/route.tsx` مُدار (`ssr:false`) — لا تعدّله.
- `src/start.ts` يُلحق `attachSupabaseAuth` كـ `functionMiddleware`.

---

## 5) 🎨 الهوية البصرية (Theming)

### 5.1 الألوان الأساسية
- **Primary (أخضر الوادي):** `#166534` (وأحياناً `#036233` كتوكن ثيم بديل).
- **Accent (برتقالي عروض):** `#ea580c` (بديل `#E85D2F`).
- **Background:** `#fafaf7` — **Foreground:** `#1a1a1a`.
- **Announcement bar:** `#166534` نص أبيض.
- **Sale/Badge Discount:** لون الـ accent.
- **Radius البطاقات:** `24px`.

### 5.2 الخطوط
- `Tajawal` عبر Google Fonts (تحميل عبر `<link>` في `__root.tsx` head — ليس CSS `@import`).
- الوزن الافتراضي 500/700.

### 5.3 الشارات (Badges) داخل `ProductCard`
- **خصم %** — خلفية accent.
- **الأكثر مبيعاً** — خلفية primary.
- **جديد / طازج / عضوي** — badges من عمود `products.badges[]`.
- **مخزون منخفض** — يظهر عند `stock_quantity <= low_stock_threshold`.
- **نفدت الكمية** — عند `stock_quantity = 0`.

### 5.4 اللوجو الحالي
- `https://i.ibb.co/2YvczYTB/Screenshot-2026-07-01-00-39-41-09.jpg` (يمكن استبداله من `/admin/settings`).

### 5.5 نص الإعلان
> شحن مجاني فوق ٣٠٠ ج.م | توصيل سريع خلال ٤٥ دقيقة ⚡ | الدفع عند الاستلام ✓

### 5.6 اتجاه الواجهة
- كل شيء `dir="rtl"`، `lang="ar"` على `<html>` في `__root.tsx`.

---

## 6) 🌱 بيانات بذور (Seed) موصى بها

```sql
INSERT INTO public.categories (name, slug, icon, sort_order) VALUES
 ('الكل','all','Grid',0),
 ('دواجن','poultry','Bird',1),
 ('لحوم','meat','Beef',2),
 ('خضروات','vegetables','Carrot',3),
 ('ألبان','dairy','Milk',4),
 ('بقالة','groceries','ShoppingBasket',5)
ON CONFLICT (slug) DO NOTHING;
```

---

## 7) ✅ خطوات التطبيق في المشروع الأصلي

1. شغّل SQL الفصل (2) بالكامل كـ migration واحد.
2. أنشئ bucket `product-images` (private) في Storage.
3. فعِّل Google OAuth عبر Lovable broker.
4. انسخ كامل `src/routes`, `src/components/storefront`, `src/components/admin`, `src/lib/{settings,theme,cart,auth,i18n}-context.tsx`, `src/hooks/*` من هذا الريمكس.
5. ثبّت الاعتمادات الإضافية (embla-carousel-react, recharts, date-fns, xlsx, sonner, vaul, input-otp, cmdk, react-day-picker, react-hook-form, zod).
6. حمِّل خط Tajawal في `__root.tsx` عبر `<link>`.
7. حدِّث `head()` بـ site_name / description / og:image (الصورة الحالية للوجو).
8. اجعل أول مستخدم أدمن يدوياً:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('<UUID>', 'admin') ON CONFLICT DO NOTHING;
   ```
9. ادخل `/admin/settings` وعدّل الألوان/الإعلان/اللوجو → المعاينة الحيّة تعكس التغيير فوراً.

---

هذا كل شيء المطلوب لاستنساخ الريمكس 1:1 في المشروع الأصلي. يمكن للـ AI في المشروع الآخر تنفيذ الخطوات بالترتيب دون تخمين.
