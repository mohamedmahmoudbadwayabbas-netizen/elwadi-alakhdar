# خريطة البيانات (Data Mapping)

| الحقل في لوحة الإعدادات     | الجدول والعمود في قاعدة البيانات                                              | يُقرأ في المتجر من                                          |
| --------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| اسم المتجر                  | `store_settings.site_name`                                                    | `src/lib/settings-context.tsx` → `Header.tsx`, `__root.tsx` |
| الشعار                      | `store_settings.logo_url`                                                     | `src/components/storefront/Header.tsx`                      |
| الأيقونة (Favicon)          | `store_settings.favicon_url`                                                  | `src/routes/__root.tsx`                                     |
| اللون الأساسي               | `store_settings.primary_color` (HSL)                                          | `settings-context.tsx` (`applyTheme` → `--primary`)         |
| اللون المميز                | `store_settings.accent_color` (HSL)                                           | `settings-context.tsx` (`--accent`)                         |
| لون الخلفية / النص          | `store_settings.background_color` / `foreground_color`                        | `settings-context.tsx`                                      |
| نص الشريط العلوي            | `store_settings.announcement_text`                                            | `src/components/storefront/AnnouncementBar.tsx`             |
| تفعيل الشريط العلوي         | `store_settings.announcement_enabled`                                         | `AnnouncementBar.tsx`                                       |
| لون الشريط العلوي           | `store_settings.announcement_bg_color`                                        | `AnnouncementBar.tsx`                                       |
| عنوان الهيرو                | `store_settings.hero_title`                     | `src/routes/index.tsx`, `HeroCarousel.tsx`                  |
| وصف الهيرو                  | `store_settings.hero_subtitle`                                                | `index.tsx`, `HeroCarousel.tsx`                             |
| زر الهيرو                   | `store_settings.hero_cta_text`                                                | `HeroCarousel.tsx`                                          |
| صورة/خلفية الهيرو           | `store_settings.hero_image_url`, `hero_bg_image`                              | `HeroCarousel.tsx`                                          |
| بانرات الهيرو               | لا يوجد جدول `hero_banners` في الـlive schema؛ الواجهة تعتمد على `store_settings` | `HeroCarousel.tsx`, `admin.banners.tsx` |
| خلفية صفحة الدخول           | `store_settings.login_bg_pattern`              | `src/routes/auth.tsx`                                       |
| خلفية السلة الفارغة         | `store_settings.cart_empty_bg`                                                | `src/routes/cart.tsx`                                       |
| رقم واتساب                  | `store_settings.whatsapp_number`                                              | `WhatsAppFloat.tsx`                                         |
| عنوان المتجر والإحداثيات    | `store_settings.store_address`, `store_lat`, `store_lng`                      | `StoreMapPicker.tsx`, `cart.tsx`                            |
| الحد الأدنى للطلب           | `store_settings.min_order_amount`                                             | `cart.tsx`                                                  |
| رسوم التوصيل الافتراضية     | `store_settings.default_delivery_fee`                                         | `cart.tsx`                                                  |
| إعدادات أول طلب             | `store_settings.first_order_coupon_*` (إعدادات فقط؛ لا توجد قاعدة first-order داخل جدول coupons) | لوحة الإعدادات |
| بيانات الدفع (إنستاباي/بنك) | `store_settings.instapay_handle`, `bank_account_info`                         | RPC `get_payment_config()` ← `cart.tsx`                     |
| GA4 / Meta Pixel            | `store_settings.ga4_id`, `meta_pixel_id`                                      | `__root.tsx`                                                |
| ألوان الثيم                 | `store_settings.primary_color`, `accent_color`, `background_color`, `foreground_color` | `src/lib/theme-context.tsx` |
| الأقسام                     | `categories.*`                                                                | `index.tsx`, `categories.tsx`, `CategoryGrid.tsx`           |
| المنتجات                    | `products.*`                                                                  | `index.tsx`, `products.$productId.tsx`, `ProductCard.tsx`   |
| مناطق التوصيل               | `delivery_zones.*`                                                            | `cart.tsx`, `admin.delivery-zones.tsx`                      |
| الكوبونات                   | `coupons.*`                                                                   | RPC `validate_coupon()` ← `coupon-validator.ts`             |
| الطلبات                     | `orders.*`                                                                    | RPC `create_order()` ← `cart.tsx`, `admin.orders.tsx`       |
| التقييمات                   | `products.rating`, `products.reviews_count` فقط؛ لا يوجد جدول `reviews` | `products.$productId.tsx` |
| بيانات العميل               | `profiles.*` (لا يوجد جدول `addresses`)                                      | `src/routes/_authenticated/account.tsx` |
| المفضلة                     | غير مدعومة في الـlive schema؛ لا يوجد جدول `wishlists`                      | — |
| الأدوار                     | `user_roles.role` (`private.has_role`)                                        | `src/lib/auth-context.tsx`, `admin.tsx`                     |

## ملاحظات

- القراءة العامة للإعدادات تمر عبر العرض `store_settings_public` (أعمدة آمنة فقط)؛ الأعمدة الحساسة (بيانات البنك) تُقرأ فقط عبر RPC مخصص.
- التحديث اللحظي للإعدادات يعتمد على `store_settings` + Realtime؛ لا يوجد `store_settings_pulse` في الـlive schema.
- ملف `supabase/schema.sql` يحتوي الهيكل الكامل + الصلاحيات + سياسات RLS + البيانات الافتراضية لإعادة النشر على أي حساب جديد.
