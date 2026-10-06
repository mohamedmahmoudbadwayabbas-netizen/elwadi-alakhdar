# Homepage consistency fixes

## Audit: keep what works
- Preserve the current homepage layout, category grid, search filtering, product links, and four product shelves.
- The main catalog uses the correct live fields: `price_per_unit`, `stock_quantity`, `old_price`, `unit_label`, and `category_id`.
- Sale items already require a real higher `old_price`; no mock catalog is used by the shelves.
- Category filtering keeps sold-out products visible. Cards already dim/desaturate their images, show «نفدت الكمية», and disable initial purchase.
- Prices and weight labels already produce Western digits; the remaining issue is direction on complete price groups and counter controls.

## Confirmed corrections
1. Make card price groups, quantity steppers, weight selectors, quick-view prices, search prices, and category/cart counters explicit LTR islands without changing the overall Arabic RTL layout.
2. Replace obsolete product columns in search and signed-in cart product reads with the existing shared live catalog selection and normalization.
3. Populate the popular shelf from `is_popular` or `is_top_seller`, not `is_featured`. Remove unsupported “in your area” and purchase/rating claims. Align quick-view badges with real popular/discount conditions.
4. Keep unavailable cards navigable to the Product Page, disable quantity increases even if already in the cart, and prevent direct search additions. Add the missing unavailable indication to search/quick view.
5. Restore the already-planned sticky cart summary: its existing component is not mounted, and its action opens no visible drawer. Link it to the existing cart page and position it above bottom navigation.

## Scope and verification
- No redesign, database writes, AI features, personalization, new reviews UI, or recommendation carousel.
- Wishlist hearts currently toggle only local card state; persistent wishlist work is outside these four requested checks and will remain unchanged.
- Check actual live product rows, sale/popular membership, search results, an in-stock add/increase/decrease flow, and the sold-out category-to-Product-Page flow on desktop and mobile.

## Technical details
- Reuse `PRODUCT_COLUMNS` and export its existing normalizer for search/cart reads; keep cart persistence architecture unchanged.
- Retain existing formatting (`toFixed`/numeric values produce Western digits); add direction and bidi isolation where needed.
- Use existing design-system controls for modified buttons and existing semantic color tokens.
- Check preview build diagnostics and browser behavior before reporting completion.