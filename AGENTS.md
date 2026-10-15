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
- Catalog source of truth is the `products` table (admin writes it, storefront reads via `src/lib/store.functions.ts`); Shopify is no longer used at runtime — its admin token expired after claim.
- Payments go to the Tranzila hosted page built server-side in `createOrder`; totals are recomputed from DB prices so the browser can't change them.
