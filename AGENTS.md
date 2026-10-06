<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Storefront product reads reuse PRODUCT_COLUMNS and normalizeProduct from store-data-hooks, including search and cart hydration, to prevent live-schema drift.
- Numeric price groups and quantity controls use explicit LTR islands within RTL layouts so control order matches the Product Page.
- The homepage sticky cart summary links to the existing cart route; no drawer is mounted, so opening cart context state alone is not a navigation action.
