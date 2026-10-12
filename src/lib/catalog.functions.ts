import { createServerFn } from "@tanstack/react-start";

export type DbCategory = { id: string; slug: string; label: string; sort: number };

/** Admin view of a Shopify product. id = Shopify product GID. */
export type DbProduct = {
  id: string;
  name: string;
  subtitle: string;
  category_slug: string;
  price: number;
  discount_percent: number;
  image: string;
  abv: string;
  note: string;
  in_stock: boolean;
  featured: boolean;
  sort: number;
};

export type ProductInput = Partial<DbProduct> & { imageData?: string };

export type Catalog = { categories: DbCategory[]; products: DbProduct[] };

type Creds = { user: string; pass: string };

async function guard(creds: Creds) {
  const { assertAdmin } = await import("./admin-auth.server");
  assertAdmin(creds);
  return import("./shopify-admin.server");
}

const PRODUCT_FIELDS = `id title descriptionHtml description productType tags
  featuredMedia{preview{image{url}}}
  variants(first:1){nodes{id price compareAtPrice inventoryQuantity inventoryItem{id}}}`;

const ABV_RE = /^\d+(\.\d+)?%$/;

function toDb(n: any, i: number, cats: DbCategory[]): DbProduct {
  const v = n.variants.nodes[0] ?? {};
  const price = Number(v.price ?? 0);
  const cmp = v.compareAtPrice ? Number(v.compareAtPrice) : 0;
  const base = cmp > price ? cmp : price;
  const tags: string[] = n.tags ?? [];
  const slug =
    tags.find((t) => cats.some((c) => c.slug === t)) ??
    tags.find((t) => !ABV_RE.test(t) && t !== "featured") ??
    "";
  return {
    id: n.id,
    name: n.title,
    subtitle: n.productType ?? "",
    category_slug: slug,
    price: base,
    discount_percent: base > price ? Math.round((1 - price / base) * 100) : 0,
    image: n.featuredMedia?.preview?.image?.url ?? "hero-bottle",
    abv: tags.find((t) => ABV_RE.test(t)) ?? "",
    note: n.description ?? "",
    in_stock: (v.inventoryQuantity ?? 0) > 0,
    featured: tags.includes("featured"),
    sort: i,
  };
}

async function loadCategories(): Promise<DbCategory[]> {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.from("categories").select("id,slug,label,sort").order("sort");
  if (error) throw error;
  return (data ?? []) as DbCategory[];
}

export const getAdminCatalog = createServerFn({ method: "POST" })
  .inputValidator((d: Creds) => d)
  .handler(async ({ data }): Promise<Catalog> => {
    const { adminGql } = await guard(data);
    const categories = await loadCategories();
    const d = await adminGql(`{products(first:250,sortKey:TITLE){nodes{${PRODUCT_FIELDS}}}}`);
    return {
      categories,
      products: d.products.nodes.map((n: any, i: number) => toDb(n, i, categories)),
    };
  });

export const checkAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: Creds) => d)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin-auth.server");
    assertAdmin(data);
    return { ok: true };
  });

export const saveProduct = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { product: ProductInput }) => d)
  .handler(async ({ data }) => {
    const { adminGql, userErrors, uploadDataUrl } = await guard(data);
    const p = data.product;
    const categories = await loadCategories();

    let current: DbProduct | undefined;
    let variantId: string | undefined;
    let inventoryItemId: string | undefined;
    let mediaIds: string[] = [];
    if (p.id) {
      const d = await adminGql(
        `query($id:ID!){product(id:$id){${PRODUCT_FIELDS} media(first:20){nodes{id}}}}`,
        { id: p.id },
      );
      current = toDb(d.product, 0, categories);
      variantId = d.product.variants.nodes[0]?.id;
      inventoryItemId = d.product.variants.nodes[0]?.inventoryItem?.id;
      mediaIds = d.product.media.nodes.map((m: any) => m.id);
    }
    const next = { ...current, ...p } as DbProduct;
    const cat = categories.find((c) => c.slug === next.category_slug);
    const tags = [next.category_slug, next.abv, next.featured ? "featured" : ""].filter(Boolean);

    const productInput: Record<string, unknown> = {
      title: next.name,
      productType: cat?.label ?? next.subtitle ?? "",
      tags,
    };
    if (p.note !== undefined || !p.id) productInput["descriptionHtml"] = next.note ?? "";

    let imageSrc: string | undefined;
    if (p.imageData?.startsWith("data:")) imageSrc = await uploadDataUrl(p.imageData);
    else if (p.imageData?.startsWith("http")) imageSrc = p.imageData;
    const media = imageSrc
      ? [{ originalSource: imageSrc, mediaContentType: "IMAGE", alt: next.name }]
      : undefined;

    let productId = p.id;
    if (productId) {
      const d = await adminGql(
        `mutation($product:ProductUpdateInput!,$media:[CreateMediaInput!]){productUpdate(product:$product,media:$media){product{id} userErrors{message}}}`,
        { product: { id: productId, ...productInput }, media },
      );
      userErrors(d.productUpdate);
      if (media && mediaIds.length) {
        await adminGql(
          `mutation($id:ID!,$m:[ID!]!){productDeleteMedia(productId:$id,mediaIds:$m){userErrors{message}}}`,
          { id: productId, m: mediaIds },
        );
      }
    } else {
      const d = await adminGql(
        `mutation($product:ProductCreateInput!,$media:[CreateMediaInput!]){productCreate(product:$product,media:$media){product{id variants(first:1){nodes{id inventoryItem{id}}}} userErrors{message}}}`,
        { product: { ...productInput, status: "ACTIVE" }, media },
      );
      userErrors(d.productCreate);
      productId = d.productCreate.product.id;
      variantId = d.productCreate.product.variants.nodes[0].id;
      inventoryItemId = d.productCreate.product.variants.nodes[0].inventoryItem.id;
      const pubs = await adminGql(`{publications(first:20){nodes{id}}}`);
      await adminGql(
        `mutation($id:ID!,$input:[PublicationInput!]!){publishablePublish(id:$id,input:$input){userErrors{message}}}`,
        { id: productId, input: pubs.publications.nodes.map((n: any) => ({ publicationId: n.id })) },
      );
    }

    // Price + discount
    if (variantId && (p.price !== undefined || p.discount_percent !== undefined || !p.id)) {
      const base = Number(next.price) || 0;
      const disc = Math.min(95, Math.max(0, Number(next.discount_percent) || 0));
      const sale = Math.round(base * (1 - disc / 100) * 100) / 100;
      const d = await adminGql(
        `mutation($pid:ID!,$v:[ProductVariantsBulkInput!]!){productVariantsBulkUpdate(productId:$pid,variants:$v){userErrors{message}}}`,
        {
          pid: productId,
          v: [
            {
              id: variantId,
              price: String(sale),
              compareAtPrice: disc > 0 ? String(base) : null,
              inventoryItem: { tracked: true },
            },
          ],
        },
      );
      userErrors(d.productVariantsBulkUpdate);
    }

    // Stock
    if (inventoryItemId && (p.in_stock !== undefined || !p.id)) {
      const loc = await adminGql(`{locations(first:1){nodes{id}}}`);
      const d = await adminGql(
        `mutation($input:InventorySetQuantitiesInput!){inventorySetQuantities(input:$input){userErrors{message}}}`,
        {
          input: {
            name: "available",
            reason: "correction",
            ignoreCompareQuantity: true,
            quantities: [
              {
                inventoryItemId,
                locationId: loc.locations.nodes[0].id,
                quantity: next.in_stock ? 12 : 0,
              },
            ],
          },
        },
      );
      userErrors(d.inventorySetQuantities);
    }
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { id: string }) => d)
  .handler(async ({ data }) => {
    const { adminGql, userErrors } = await guard(data);
    const d = await adminGql(
      `mutation($id:ID!){productDelete(input:{id:$id}){deletedProductId userErrors{message}}}`,
      { id: data.id },
    );
    userErrors(d.productDelete);
    return { ok: true };
  });

async function adminDb(creds: Creds) {
  const { assertAdmin } = await import("./admin-auth.server");
  assertAdmin(creds);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const saveCategory = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { slug: string; label: string }) => d)
  .handler(async ({ data }) => {
    const sb = await adminDb(data);
    const { error } = await sb
      .from("categories")
      .upsert({ slug: data.slug, label: data.label } as never, { onConflict: "slug" });
    if (error) throw error;
    return { ok: true };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { slug: string }) => d)
  .handler(async ({ data }) => {
    const sb = await adminDb(data);
    // Supabase products table still references categories; detach first.
    await sb.from("products").delete().eq("category_slug", data.slug);
    const { error } = await sb.from("categories").delete().eq("slug", data.slug);
    if (error) throw error;
    return { ok: true };
  });
