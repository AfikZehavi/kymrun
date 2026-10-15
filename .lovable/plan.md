# New bottles on the site + payment through Tranzila

## Admin login
- Address: kymrun.lovable.app/admin-kymrun-37
- Username: `adminkymrunhere22!!`
- Password: `kymrunToWin2423`

## Why the bottles don't show up
Your friend added 109 bottles, and they're saved safely. But since the Shopify connection, the homepage has been reading the product list from Shopify instead of the list he's working on. So his bottles exist but don't appear.

## Why I mentioned reconnecting
When the store was claimed, Shopify cancelled the temporary key the site used to manage it. If Tranzila takes the payments directly, the site no longer needs Shopify at all, and you don't need to reconnect anything.

## What I'll do
1. **Make a backup** of the full product list before any deletion.
2. **Delete only the 35 demo bottles.** These are the ones from the site's first day, all dated September 14. Your friend's 109 bottles were all added in the last few days and won't be touched. Before deleting, I'll show the list of names to make sure there's no mistake.
3. **Home page, product page and admin** show your friend's list again. Every change in the admin will show up on the site right away.
4. **Payment through Tranzila directly:** click "Pay" in the cart and a secure Tranzila payment page opens (credit card, and bit/Apple Pay if they're enabled on your terminal). Once payment goes through, the order is saved and an email arrives.
5. **Shopify is disconnected from the checkout.** The store stays open on your side, but nothing depends on it.

## What I need from you
- The **terminal name** from Tranzila (e.g. `kymrun`). It's what appears in the email from Tranzila.
- If you have it, also the **terminal password or API key**. That lets the site confirm on its own that the payment really went through.
I'll open a secure box to paste these into. Nothing will be written into the site's code.

## Technical details
- Backup: copy `products` to `products_backup_20261015`. Delete: `delete from products where created_at < '2026-09-15'`, after confirming count = 35 and listing the names.
- Catalog: `/` and `/product/$handle` read the `products` table through `getCatalog`. The admin screen goes back to its database CRUD (revert the Shopify-admin functions).
- Cart: local cart (zustand) over database products, with no Shopify cart.
- New `orders` table (RLS locked, server-only writes). A `createOrder` server function computes the total on the server from the database prices, then returns the Tranzila hosted page URL (`direct.tranzila.com/{terminal}/iframenew.php`, sum, currency=1 ILS, order id, notify_url).
- Server route `/api/public/tranzila/notify` checks the response (Response=000, matching sum, and, when an API key is provided, a verification call to Tranzila), then marks the order as paid.
- Secrets: `TRANZILA_TERMINAL`, `TRANZILA_PASSWORD` (optional).
