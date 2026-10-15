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

- Storefront product photos use the shared ProductImage component for loading/error states and whole-bottle framing.
- Storefront age declaration is centralized in AgeGate at the root and excludes admin/API paths; browser expiry controls repeat prompts.
- Optional membership and trivia surfaces use their module feature flags, including direct route redirects, so disabling remains reversible.

- Bottle specifications use additive products columns shared by admin add/edit and the full detail page; empty unknown attributes are omitted, not invented.
- Full bottle pages load through TanStack Query with loader-backed metadata and expose a mobile sticky purchase action.
