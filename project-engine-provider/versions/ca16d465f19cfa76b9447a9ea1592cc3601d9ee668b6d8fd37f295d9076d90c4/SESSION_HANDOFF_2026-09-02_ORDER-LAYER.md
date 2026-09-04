# Elwadi Al Akhdar — Session Handoff

## Session
2026-09-02 — Order Data Layer stabilization

## Current source of truth
- Supabase live database is the authoritative schema.
- Do NOT rerun the old migration files.
- Do NOT create a paid Supabase branch.
- Firebase has been removed from the project.

## Live order schema verified
`orders` uses:
- id uuid
- user_id uuid nullable
- status: pending | confirmed | shipped | delivered | cancelled
- total_amount numeric
- shipping_address jsonb nullable
- customer_name, phone, address, notes
- delivery_zone_id uuid nullable
- delivery_method, payment_method, payment_reference
- coupon_code, ref_source
- delivery_fee, discount_amount

`order_items` is the authoritative item store:
- id uuid
- order_id uuid
- product_id uuid
- quantity integer
- price numeric

`products` supplies product names for order item display.

## Changes completed this session
1. Added `src/services/orderDataService.ts` as the normalized Order Data Layer.
2. `fetchOrdersWithItems()` fetches orders, order_items, and product names and returns a consistent `OrderView` with `items`.
3. Updated Supabase generated `orders` types to match the live database; removed stale `items` and `total_price` fields from that type.
4. Updated admin overview, admin orders, customer account orders, driver portal, branch stats, and abandoned-cart agent to use `total_amount` and normalized order items.
5. Removed the customer-side local order-history write from checkout. Supabase is now the order source of truth.
6. Removed admin-orders dependence on `alwadi_store_orders_v2` as a fallback source.
7. Updated operational AI analytics to use `total_amount` and no longer query nonexistent `orders.items`.
8. Updated AI schema context to describe `order_items` as the item source.
9. Aligned admin/driver/account order statuses with the live DB status values.
10. No Supabase migration or live DB schema change was made in this session.

## Important validation note
- The project ZIP was successfully created.
- TypeScript compilation was NOT run because this extracted project currently has no `node_modules`; do not claim the build passes yet.
- No production data exists in the current live tables used for orders/products/categories (verified previously).

## Remaining work / next step
1. Search the whole source for remaining stale order assumptions, especially old schema files and any code still expecting legacy product/order fields.
2. Verify all admin order status transitions and realtime behavior against the live status CHECK constraint.
3. Audit RLS/permissions for admin order reads and driver updates before adding more features.
4. Then test the complete checkout -> create_order -> order_items -> account/admin display flow.
5. Only after the foundation is stable should we move to the next major feature/AI layer.

## Do not do yet
- Do not write `ELWADI_ENGINEERING_RULES.md` yet.
- Do not reintroduce Firebase.
- Do not use LocalStorage as an order/auth source of truth.
- Do not add microservices/Kubernetes complexity.
