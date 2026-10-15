# Showing the new bottles on the site

## Admin login
- Address: kymrun.lovable.app/admin-kymrun-37
- Username: `adminkymrunhere22!!`
- Password: `kymrunToWin2423`

## Why the new bottles don't show up
Your friend has added 109 new bottles in the last few days, so his work isn't lost. They're saved in the site's own product list.
But since we connected Shopify, the homepage only shows products from Shopify. These are two separate lists, so the new bottles don't appear anywhere.
On top of that, the key that let the site update Shopify stopped working when the store was claimed. Without it, nothing can be moved into Shopify automatically.

## Recommendation: the site's own list becomes the main list
The fastest option that doesn't need any key from Shopify:
1. The homepage, product page and admin screen show the site's own product list again, with all 109 new bottles. That's where your friend is already working, so every change he makes shows up right away.
2. Shopify is used only for payment. When a customer clicks "Pay", a Shopify payment page opens with the right bottles and prices.
3. Delete the 35 demo bottles from the start (everything added before the last few days), from both the site and Shopify.

## Technical details
- Catalog on `/`, `/product/$handle` and the admin screen: read from the `products` table (restore `getCatalog`). The admin screen goes back to its old database CRUD.
- Checkout: a server function creates a Shopify cart using draft line items, or creates or updates a Shopify product with the admin token at checkout. Both need a working Shopify admin token. Fallback without a token: an order form saved to the database, plus the "cash on delivery" WhatsApp flow.
- Delete demo rows: `delete from products where created_at < now() - interval '3 days'` (35 rows), and remove the 36 old products from Shopify.

## What I need from you
To make checkout and deleting from Shopify work, one of these:
- Reconnect your Shopify account in the chat (one click), or
- An admin key from Shopify (the steps from my previous message).
Until then, the bottles will show on the site, but payment can only be cash on delivery, through WhatsApp or the order form.
