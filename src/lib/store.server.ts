import { createClient } from "@supabase/supabase-js";
import type { ShopifyProduct } from "./shopify";

export function publicDb() {
  // Runtime vars win; the public URL/key baked in at build time (.env) are the fallback,
  // so hosting only has to provide secrets.
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  const url = process.env["SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"];
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
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
  english_name: string;
  volume_ml: number;
  country: string;
  producer: string;
  grape_variety: string;
  kosher_passover: boolean;
  category_slug: string;
  price: number | string;
  discount_percent: number;
  /** Full image (often a base64 data URL); lists select image_ref/image_ver instead. */
  image?: string;
  /** Image URL/name when it isn't embedded data (generated column). */
  image_ref?: string | null;
  /** Length of the stored image, used as a cache-busting version (generated column). */
  image_ver?: number | null;
  abv: string;
  note: string;
  in_stock: boolean;
  featured: boolean;
};

export const salePrice = (r: Row) =>
  Math.round(
    Number(r.price) * (1 - Math.min(95, Math.max(0, r.discount_percent || 0)) / 100) * 100,
  ) / 100;

export function imageUrl(r: Row) {
  if (r.image !== undefined) {
    if (!r.image) return "hero-bottle";
    if (r.image.startsWith("data:")) return `/api/public/product-image/${r.id}?v=${r.image.length}`;
    return r.image;
  }
  if (r.image_ref) return r.image_ref;
  if (r.image_ver) return `/api/public/product-image/${r.id}?v=${r.image_ver}`;
  return "hero-bottle";
}

/** Maps a database row into the node shape the storefront UI already understands. */
export function toNode(
  r: Row,
  catLabel: string,
): ShopifyProduct["node"] & {
  details: Pick<
    Row,
    | "subtitle"
    | "english_name"
    | "volume_ml"
    | "country"
    | "producer"
    | "grape_variety"
    | "kosher_passover"
    | "abv"
  >;
} {
  const base = Number(r.price);
  const sale = salePrice(r);
  const money = (n: number) => ({ amount: String(n), currencyCode: "ILS" });
  return {
    details: {
      subtitle: r.subtitle,
      english_name: r.english_name,
      volume_ml: r.volume_ml,
      country: r.country,
      producer: r.producer,
      grape_variety: r.grape_variety,
      kosher_passover: r.kosher_passover,
      abv: r.abv,
    },
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

export const ROW_COLS =
  "id,name,subtitle,category_slug,price,discount_percent,image_ref,image_ver,abv,note,in_stock,featured,english_name,volume_ml,country,producer,grape_variety,kosher_passover";
// list query without the heavy image payload, image resolved via length marker
export const LIST_COLS =
  "id,name,subtitle,category_slug,price,discount_percent,abv,note,in_stock,featured,sort,created_at";
