# خطة ترقية منصة "الوادي الأخضر" — Enterprise Upgrade

سأنفذ هذه الترقية على دفعات منظمة لضمان الجودة. أرجو الموافقة قبل البدء.

## 1) الهوية البصرية والتصميم

- إعادة تسمية المنصة إلى **"الوادي الأخضر"** في الهيدر والفوتر و SEO/meta و title.
- شعار نصي أنيق + favicon جديد.
- لوحة ألوان جديدة في `src/styles.css` كرموز دلالية (semantic tokens):
  - Primary: `#166534` (أخضر زمردي)
  - Accent: `#ea580c` (برتقالي دافئ)
  - تدرّجات وظلال راقية (gradient-primary, shadow-elegant).
- خطوط عربية أنيقة: **Tajawal** للنصوص + **Amiri** (Serif) للعناوين، عبر `<link>` في `__root.tsx`.
- إحساس Serif-modern، مساحات بيضاء واسعة، حواف ناعمة.
- Micro-interactions: Skeleton loaders، Toasts (sonner)، Optimistic UI في السلة، hover transitions.
- RTL كامل (مفعّل مسبقاً) — مراجعة كل المكونات الجديدة.

## 2) قاعدة البيانات (Migration واحد)

تعديلات على الجداول الحالية + جداول جديدة:

- **products**: إضافة `stock_quantity`, `low_stock_threshold`, `is_featured` (للأكثر مبيعاً يدوياً). تحويل `price_per_unit` لتمثيل **السعر لكل كيلوغرام** للمنتجات الموزونة (logic frontend: `price/1000 * grams`).
- **orders**: إضافة `ref_source` (text) لتتبع `?ref=...`، و `status` يدعم: `new | processing | shipped | completed | cancelled`.
- **store_settings** (جديد، صف واحد): `whatsapp_number`, `hero_title`, `hero_subtitle`, `hero_image_url`, `hero_cta_text`, `store_address`, `store_lat`, `store_lng`.
- **user_roles** (جديد) + enum `app_role` + دالة `has_role()` — بديل آمن لـ Dev Mode.
- **Storage bucket**: `product-images` (public) مع RLS تسمح للأدمن فقط بالرفع.
- RLS مُحدّثة: الكتابة على products/orders/settings للأدمن فقط (`has_role(auth.uid(),'admin')`)، القراءة عامة للـ products/categories/settings.
- Real-time مفعّل على products و orders.
- تفعيل المصادقة الأساسية (email/password) + Google OAuth لاحقاً عند الطلب.

## 3) واجهة العميل (Storefront)

- **Hero ديناميكي** يقرأ من `store_settings` (CMS-style).
- **البحث**: `ilike` على `name` و `description` (debounced) مع نتائج فورية.
- **بطاقة المنتج**: تعرض السعر/كجم، خصومات، شارة "الأكثر مبيعاً" حسب `is_featured`، شارة "نفدت الكمية" عند `stock_quantity=0`.
- **Modal المنتج**: حاسبة وزن ديناميكية (250g / 500g / 1kg / مخصص) + معاينة سعرية لحظية.
- **سلة + Checkout**: حقول (اسم، هاتف، عنوان، ملاحظات)، التقاط `?ref=` تلقائياً وحفظه في الطلب، تأكيد Toast.
- **Skeleton loaders** أثناء التحميل.

## 4) لوحة الأدمن `/admin` (محمية بـ Role)

استبدال Dev Mode بـ:
- صفحة `/auth` لتسجيل الدخول.
- حماية `/admin/*` عبر `_authenticated` + فحص `has_role(...,'admin')`.
- أول مستخدم يُسجَّل عبر RPC لمنحه دور admin (سأشرحه لك بعد التشغيل).

**التنقّل**: Sidebar (shadcn) بأقسام:

- **نظرة عامة** (`/admin`): KPIs (مبيعات اليوم/الشهر، عدد الطلبات، طلبات قيد المعالجة، تنبيهات المخزون المنخفض) + رسم بياني للأكثر مبيعاً (recharts).
- **المنتجات** (`/admin/products`): CRUD كامل + رفع صور إلى Storage + تعيين `low_stock_threshold` + Toggle "الأكثر مبيعاً".
- **التصنيفات** (`/admin/categories`): CRUD.
- **الطلبات** (`/admin/orders`): Tabs (جديد / قيد المعالجة / تم الشحن / مكتمل / ملغي)، تحديث الحالة، تفاصيل، **طباعة إيصال حراري** (80mm)، **تصدير CSV/Excel** (xlsx).
- **الإعدادات** (`/admin/settings`): تعديل WhatsApp، محتوى الـ Hero، **خريطة Google Maps** لتحديد موقع المحل (عبر موصّل Google Maps Platform).

## 5) أدوات إضافية

- زر "تواصل واتساب" عائم يستخدم الرقم من `store_settings`.
- تتبّع المصدر التسويقي (`?ref=facebook_ad` → عمود `ref_source`).
- Optimistic UI في تحديث حالة الطلب وعمليات السلة.

## التفاصيل التقنية

- **Stack**: TanStack Start + Supabase + shadcn + Tailwind v4 + Sonner + Recharts + xlsx + @tanstack/react-query.
- **Server functions**: للعمليات الإدارية (CRUD المنتجات، تحديث الطلبات، الإعدادات) عبر `createServerFn` + `requireSupabaseAuth` + فحص الدور.
- **Storage**: bucket عام `product-images` للقراءة، كتابة محصورة بالأدمن.
- **Google Maps**: عبر موصّل Lovable (سأطلب توصيله عند الوصول لصفحة الإعدادات).
- **حذف**: إزالة زر Dev Mode من الهيدر بعد تفعيل المصادقة.

## ترتيب التنفيذ

1. Migration (schema + roles + settings + storage).
2. Auth + حماية `/admin`.
3. تحديث الهوية البصرية (ألوان، خطوط، تسمية، hero ديناميكي).
4. Storefront: بحث ilike، بطاقات محدّثة، حاسبة وزن، tracking `ref`.
5. Admin Sidebar + Overview + Products CRUD + Storage uploads.
6. Orders Tabs + تصدير CSV/Excel + طباعة إيصال.
7. Settings + Google Maps (يتطلب توصيل الموصّل).

## أسئلة قبل التنفيذ

1. هل أعتمد **Email/Password** فقط للأدمن الآن، أم أُضيف **Google OAuth**؟
2. هل تريد دعم **متعدد الأدوار** (admin + staff بصلاحيات محدودة) أم **admin فقط**؟
3. **Google Maps**: هل سأربط الموصّل الآن (لخريطة الإعدادات)، أم نؤجلها؟

عند الموافقة، أبدأ بالـ Migration كخطوة أولى.
