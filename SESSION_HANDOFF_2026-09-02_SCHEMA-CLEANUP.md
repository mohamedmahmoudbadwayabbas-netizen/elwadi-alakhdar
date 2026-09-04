# Elwadi Al Akhdar — Session Handoff

## Session
2026-09-02 — Schema cleanup / live DB alignment

## Source of truth
The live Supabase schema is authoritative. Do NOT rerun the old migration set and do NOT introduce a paid Supabase branch.

## Verified live public schema
- categories: id, name, name_ar, slug, image_url, created_at
- products: id, name, name_ar, description, description_ar, price, original_price, image_url, images, category_id, stock, rating, reviews_count, is_featured, is_active, created_at
- orders: id, user_id, status, total_amount, shipping_address, created_at, customer_name, phone, address, notes, delivery_zone_id, delivery_method, payment_method, payment_reference, coupon_code, ref_source, delivery_fee, discount_amount
- order_items: id, order_id, product_id, quantity, price
- profiles: id, full_name, phone, address, city, updated_at, role
- coupons: id, code, discount_type (percentage/fixed), discount_value, min_order_amount, usage_limit, used_count, expires_at, is_active, created_at
- delivery_zones: id, name, country, governorate, city, area, fee, min_order_amount, estimated_minutes, is_active, sort_order, created_at
- There is NO `addresses` table.

## Completed in this session
1. Replaced account address CRUD against nonexistent `addresses` with a profile-backed default delivery address.
2. Replaced Google Maps default-location persistence with `profiles.address` (including GPS coordinates in text) instead of nonexistent `addresses`.
3. Fixed admin category loading/saving to stop requesting nonexistent `sort_order`, `icon`, and `parent_id` columns; current save payload uses name/name_ar/slug/image_url.
4. Fixed admin product category ordering to use created_at instead of nonexistent sort_order.
5. Fixed coupon admin persistence to use live fields `percentage/fixed`, `usage_limit`, `used_count`; removed first_order_only from DB payload and stopped silently reporting success after failed DB writes.
6. Fixed coupon validation usage-limit field names and percentage mapping.
7. Fixed AI schema context from `total_price`/embedded `items` to `total_amount` and `order_items`.
8. Fixed admin realtime INSERT handling: it now re-fetches complete orders so realtime payload does not create an order missing its items.
9. No Supabase migration was created in this session.

## Important remaining work
- The generated `src/integrations/supabase/types.ts` is still an older generated snapshot in this ZIP. Supabase's live type generator was queried and confirmed the exact live schema; the next session should replace the local types file with the generated live output before deeper TypeScript cleanup.
- `admin.categories.tsx` still contains UI concepts for hierarchy/reordering from the old schema; the next session should simplify that UI to the actual flat category schema instead of pretending those fields exist.
- `admin.coupons.tsx` may still contain legacy UI labels/state around first-order-only; the DB no longer has that column, so first-order behavior must eventually be implemented through a secure server-side rule/RPC if desired, not client state.
- Search all source for old schema names again after types replacement.
- The `AbandonedCartAgent` currently treats pending orders as abandoned carts; this is conceptually wrong and should be redesigned around cart_items / timestamps or a dedicated abandoned-cart mechanism.
- Full TypeScript/build validation still has not been proven because dependencies/node_modules were not installed in the working environment.

## Rules
- Do not claim build/test passes without actually running them.
- Do not reintroduce localStorage as an auth/order source of truth.
- Do not add Firebase back.
- Do not rerun the old migration files.
- Do not create ELWADI_ENGINEERING_RULES.md yet.
- Prefer small, coherent hardening steps over adding new features.
