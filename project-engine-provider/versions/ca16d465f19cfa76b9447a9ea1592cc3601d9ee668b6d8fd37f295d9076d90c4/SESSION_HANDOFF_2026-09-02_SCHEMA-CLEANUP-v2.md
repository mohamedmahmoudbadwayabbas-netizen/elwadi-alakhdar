# Elwadi Al Akhdar — Session Handoff

## Session
2026-09-02 — Schema cleanup / live DB alignment — v2

## Source of truth
The live Supabase schema is authoritative. Do NOT rerun the old migration set, do NOT create a paid Supabase branch, do NOT add Firebase back, and do NOT create `ELWADI_ENGINEERING_RULES.md` yet.

## Live schema confirmed
- `categories`: id, name, name_ar, slug, image_url, created_at
- `products`: id, name, name_ar, description, description_ar, price, original_price, image_url, images, category_id, stock, rating, reviews_count, is_featured, is_active, created_at
- `orders`: id, user_id, status, total_amount, shipping_address, created_at, customer_name, phone, address, notes, delivery_zone_id, delivery_method, payment_method, payment_reference, coupon_code, ref_source, delivery_fee, discount_amount
- `order_items`: id, order_id, product_id, quantity, price
- `profiles`: id, full_name, phone, address, city, updated_at, role
- `coupons`: id, code, discount_type (`percentage`/`fixed`), discount_value, min_order_amount, usage_limit, used_count, expires_at, is_active, created_at
- `delivery_zones`: id, name, country, governorate, city, area, fee, min_order_amount, estimated_minutes, is_active, sort_order, created_at
- `cart_items`: id, user_id, product_id, quantity, created_at; unique `(user_id, product_id)`
- `store_settings` and `store_settings_public`
- Functions used by the app: `create_order`, `get_my_role`, `get_payment_config`, `is_admin`, `validate_coupon`
- There is NO `addresses`, `wishlists`, `reviews`, `hero_banners`, or `theme_settings` table in the live schema.

## Completed in this shot
1. Replaced `src/integrations/supabase/types.ts` with the live-schema generated shape (including `cart_items`, flat `categories`, live product columns, live order columns, `store_settings_public`, and the current RPC signatures).
2. Simplified `categories.tsx` and `admin.categories.tsx` to a flat taxonomy. Removed hierarchy/parent/reordering assumptions.
3. Removed all source-level DB reads/writes against `addresses`, `wishlists`, `reviews`, `hero_banners`, and `theme_settings`.
4. Reworked hero/banner management to use `store_settings` (`hero_title`, `hero_subtitle`, `hero_cta_text`, `hero_image_url`).
5. Reworked product reads/writes to live fields (`price`, `original_price`, `stock`, `rating`, `reviews_count`, `is_featured`, `is_active`). Legacy UI-only product fields are now derived locally where needed; they are not written to Supabase.
6. Reworked analytics top-products calculation to derive sales from `orders + order_items` instead of nonexistent `purchase_count`.
7. Reworked `AbandonedCartAgent` to derive abandoned carts from stale `cart_items` + profiles/products and exclude users with a newer order. It no longer treats pending orders as abandoned carts.
8. Reworked authenticated cart persistence to `cart_items`. Removed LocalStorage as the cart/account/commercial-data source. Guest cart is in-memory only.
9. Removed the persisted shopping-list/wishlist features because the live schema has no tables for them; no fake LocalStorage-backed account/commercial data was introduced.
10. Coupon validation now delegates to the live `validate_coupon()` RPC. No `max_uses`, `uses_count`, or `first_order_only` fields are fabricated in the client.
11. First-order promotion UI was disabled rather than pretending the client can enforce it. If first-order behavior is required later, implement it in a secure server-side/RPC rule.
12. Removed legacy product-cache LocalStorage updates after checkout.
13. Removed admin delivery-zone LocalStorage cache; Supabase is authoritative.
14. Updated `DATA-MAPPING.md` to reflect the live schema and removed obsolete table references.
15. Removed the nonexistent `increment_product_views` RPC call.

## Verification
### Live Supabase
Read-only checks confirmed the live tables are reachable. Current counts at verification time:
- categories: 9
- products: 15
- profiles: 3
- delivery_zones: 1
- store_settings: 1
- cart_items: 0
- orders: 0
- order_items: 0
- coupons: 0

The `cart_items` unique constraint `(user_id, product_id)` was confirmed, so authenticated cart upsert can safely use that conflict target.

### Static syntax verification
All 182 `.ts`/`.tsx` source files were passed through the TypeScript transpiler parser with **0 syntax diagnostics**.

### TypeScript / build
A real project TypeScript check could NOT be completed because dependencies are not installed in this working copy. `tsc --noEmit` stops at missing `vite/client` types. `npm install` timed out, and offline install was not cached.

A real build was attempted with `npm run build` and **did not run successfully** because `vite` is not installed (`vite: not found`). Therefore do NOT claim the build passes.

## Remaining NEXT STEP
1. Install project dependencies in an environment with network/package cache access.
2. Run `tsc --noEmit` and fix the actual type errors caused by the new live types, especially around legacy UI-only `Product` compatibility and RPC nullability.
3. Run `npm run build` and fix build-only/module/route issues.
4. Then audit `admin.settings.tsx`, `layout-config-context.tsx`, and remaining LocalStorage usage to ensure no account/order/commercial data is treated as authoritative there. UI-only preferences may remain client-side.
5. Review the disabled first-order promotion requirement. If business wants it back, design a secure server-side/RPC implementation against the existing live schema; do not add a fake `first_order_only` column.
6. Do not reintroduce removed legacy tables or old migration assumptions.

## Important rules
- Supabase live schema is the only DB source of truth.
- Checkout uses `create_order()` only.
- Orders are `orders + order_items + products`.
- No `addresses` table.
- No LocalStorage as source of accounts, orders, cart, or commercial truth.
- Firebase stays removed.
- No paid Supabase branch.
- No old migrations rerun.
- No `ELWADI_ENGINEERING_RULES.md` yet.
- Never claim Build/TypeScript success unless actually executed successfully.
