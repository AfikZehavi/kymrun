import { createClient } from "@supabase/supabase-js";
import type { ShopifyProduct } from "./shopify";

export function publicDb() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export type Row = {
  id: string;
  name: string;
  subtitle: string;
  category_slug: string;
  price: number | string;
  discount_percent: number;
  image: string;
  abv: string;
  note: string;
  in_stock: boolean;
  featured: boolean;
};

export const salePrice = (r: Row) =>
  Math.round(Number(r.price) * (1 - Math.min(95, Math.max(0, r.discount_percent || 0)) / 100) * 100) / 100;

export function imageUrl(r: Row) {
  if (!r.image) return "hero-bottle";
  if (r.image.startsWith("data:")) return `/api/public/product-image/${r.id}?v=${r.image.length}`;
  return r.image;
}

/** Maps a database row into the node shape the storefront UI already understands. */
export function toNode(r: Row, catLabel: string): ShopifyProduct["node"] {
  const base = Number(r.price);
  const sale = salePrice(r);
  const money = (n: number) => ({ amount: String(n), currencyCode: "ILS" });
  return {
    id: r.id,
    title: r.name,
    description: r.note || r.subtitle,
    handle: r.id,
    tags: [r.category_slug, r.abv, r.featured ? "featured" : ""].filter(Boolean),
    productType: catLabel,
    priceRange: { minVariantPrice: money(sale) },
    compareAtPriceRange: { minVariantPrice: money(base) },
    images: { edges: [{ node: { url: imageUrl(r), altText: r.name } }] },
    variants: {
      edges: [
        {
          node: {
            id: r.id,
            title: "Default",
            price: money(sale),
            compareAtPrice: sale < base ? money(base) : null,
            availableForSale: r.in_stock,
            selectedOptions: [],
          },
        },
      ],
    },
    options: [],
  };
}

export const ROW_COLS = "id,name,subtitle,category_slug,price,discount_percent,image,abv,note,in_stock,featured";
// list query without the heavy image payload, image resolved via length marker
export const LIST_COLS = "id,name,subtitle,category_slug,price,discount_percent,abv,note,in_stock,featured,sort,created_at";
