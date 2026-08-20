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
| عنوان الهيرو                | `store_settings.hero_title` / `theme_settings.hero_title`                     | `src/routes/index.tsx`, `HeroCarousel.tsx`                  |
| وصف الهيرو                  | `store_settings.hero_subtitle`                                                | `index.tsx`, `HeroCarousel.tsx`                             |
| زر الهيرو                   | `store_settings.hero_cta_text`                                                | `HeroCarousel.tsx`                                          |
| صورة/خلفية الهيرو           | `store_settings.hero_image_url`, `hero_bg_image`                              | `HeroCarousel.tsx`                                          |
| بانرات الهيرو               | `hero_banners.*`                                                              | `HeroCarousel.tsx`                                          |
| خلفية صفحة الدخول           | `store_settings.login_bg_pattern` / `theme_settings.auth_bg_url`              | `src/routes/auth.tsx`                                       |
| خلفية السلة الفارغة         | `store_settings.cart_empty_bg`                                                | `src/routes/cart.tsx`                                       |
| رقم واتساب                  | `store_settings.whatsapp_number`                                              | `WhatsAppFloat.tsx`                                         |
| عنوان المتجر والإحداثيات    | `store_settings.store_address`, `store_lat`, `store_lng`                      | `StoreMapPicker.tsx`, `cart.tsx`                            |
| الحد الأدنى للطلب           | `store_settings.min_order_amount`                                             | `cart.tsx`                                                  |
| رسوم التوصيل الافتراضية     | `store_settings.default_delivery_fee`                                         | `cart.tsx`                                                  |
| كوبون أول طلب               | `store_settings.first_order_coupon_*`                                         | `cart.tsx`, `coupon-validator.ts`                           |
| بيانات الدفع (إنستاباي/بنك) | `store_settings.instapay_handle`, `bank_account_info`                         | RPC `get_payment_config()` ← `cart.tsx`                     |
| GA4 / Meta Pixel            | `store_settings.ga4_id`, `meta_pixel_id`                                      | `__root.tsx`                                                |
| ألوان/زوايا الثيم المتقدمة  | `theme_settings.primary_hex`, `accent_hex`, `card_radius_px`, `marble_bg_url` | `src/lib/theme-context.tsx`                                 |
| الأقسام                     | `categories.*`                                                                | `index.tsx`, `categories.tsx`, `CategoryGrid.tsx`           |
| المنتجات                    | `products.*`                                                                  | `index.tsx`, `products.$productId.tsx`, `ProductCard.tsx`   |
| مناطق التوصيل               | `delivery_zones.*`                                                            | `cart.tsx`, `admin.delivery-zones.tsx`                      |
| الكوبونات                   | `coupons.*`                                                                   | RPC `validate_coupon()` ← `coupon-validator.ts`             |
| الطلبات                     | `orders.*`                                                                    | RPC `create_order()` ← `cart.tsx`, `admin.orders.tsx`       |
| التقييمات                   | `reviews.*`                                                                   | `products.$productId.tsx`, `admin.reviews.tsx`              |
| بيانات العميل               | `profiles.*`, `addresses.*`                                                   | `src/routes/_authenticated/account.tsx`                     |
| المفضلة                     | `wishlists.*`                                                                 | `account.tsx`, `ProductCard.tsx`                            |
| الأدوار                     | `user_roles.role` (`private.has_role`)                                        | `src/lib/auth-context.tsx`, `admin.tsx`                     |

## ملاحظات

- القراءة العامة للإعدادات تمر عبر العرض `store_settings_public` (أعمدة آمنة فقط)؛ الأعمدة الحساسة (بيانات البنك) تُقرأ فقط عبر RPC مخصص.
- التحديث اللحظي للإعدادات يعتمد على جدول `store_settings_pulse` + Realtime، فأي حفظ في لوحة التحكم ينعكس فوراً على المتجر.
- ملف `supabase/schema.sql` يحتوي الهيكل الكامل + الصلاحيات + سياسات RLS + البيانات الافتراضية لإعادة النشر على أي حساب جديد.
