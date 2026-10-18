import { createServerFn } from "@tanstack/react-start";

export type DbCategory = { id: string; slug: string; label: string; sort: number };

export type DbProduct = {
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
  price: number;
  discount_percent: number;
  image: string;
  abv: string;
  note: string;
  in_stock: boolean;
  featured: boolean;
  sort: number;
};

export type ProductInput = Partial<DbProduct> & { imageData?: string | undefined };
export type Catalog = { categories: DbCategory[]; products: DbProduct[] };
type Creds = { user: string; pass: string };

async function adminDb(creds: Creds) {
  const { assertAdmin } = await import("./admin-auth.server");
  assertAdmin(creds);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const checkAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: Creds) => d)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin-auth.server");
    assertAdmin(data);
    return { ok: true };
  });

export const getAdminCatalog = createServerFn({ method: "POST" })
  .inputValidator((d: Creds) => d)
  .handler(async ({ data }): Promise<Catalog> => {
    const sb = await adminDb(data);
    const [cats, prods] = await Promise.all([
      sb.from("categories").select("id,slug,label,sort").order("sort"),
      sb
        .from("products")
        .select(
          "id,name,subtitle,category_slug,price,discount_percent,image_ref,image_ver,abv,note,in_stock,featured,sort,created_at,english_name,volume_ml,country,producer,grape_variety,kosher_passover",
        )
        .order("created_at", { ascending: false }),
    ]);
    if (cats.error) throw cats.error;
    if (prods.error) throw prods.error;
    type ListRow = Omit<DbProduct, "image"> & {
      image_ref: string | null;
      image_ver: number | null;
    };
    return {
      categories: (cats.data ?? []) as DbCategory[],
      // image_ref / image_ver are light generated columns, so the list never downloads the photos themselves
      products: ((prods.data ?? []) as unknown as ListRow[]).map(
        ({ image_ref, image_ver, ...p }) => ({
          ...p,
          price: Number(p.price),
          image: image_ref ?? (image_ver ? `/api/public/product-image/${p.id}?v=${image_ver}` : ""),
        }),
      ),
    };
  });

export const saveProduct = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { product: ProductInput }) => d)
  .handler(async ({ data }) => {
    const sb = await adminDb(data);
    const { id, imageData, ...fields } = data.product;
    const row: Record<string, unknown> = { ...fields };
    delete row["image"];
    if (imageData) row["image"] = imageData;
    if (id) {
      const { error } = await sb
        .from("products")
        .update(row as never)
        .eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await sb.from("products").insert(row as never);
      if (error) throw error;
    }
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { id: string }) => d)
  .handler(async ({ data }) => {
    const sb = await adminDb(data);
    const { error } = await sb.from("products").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

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
    const used = await sb.from("products").select("id").eq("category_slug", data.slug).limit(1);
    if (used.error) throw used.error;
    if (used.data?.length) throw new Error("category-in-use");
    const { error } = await sb.from("categories").delete().eq("slug", data.slug);
    if (error) throw error;
    return { ok: true };
  });
