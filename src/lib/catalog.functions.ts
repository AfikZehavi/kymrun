import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export type DbCategory = {
  id: string;
  slug: string;
  label: string;
  sort: number;
};

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

export type Catalog = { categories: DbCategory[]; products: DbProduct[] };

type Creds = { user: string; pass: string };

const CATALOG_CACHE_MS = 5 * 60 * 1000;
let catalogCache: { value: Catalog; expiresAt: number } | undefined;
let catalogRequest: Promise<Catalog> | undefined;

function clearCatalogCache() {
  catalogCache = undefined;
  catalogRequest = undefined;
}

function publicClient() {
  return createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

export const getCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<Catalog> => {
    if (catalogCache && catalogCache.expiresAt > Date.now()) {
      return catalogCache.value;
    }

    if (!catalogRequest) {
      catalogRequest = (async () => {
        const supabase = publicClient();
        const [cats, prods] = await Promise.all([
          supabase.from("categories").select("id,slug,label,sort").order("sort"),
          supabase
            .from("products")
            .select("id,name,subtitle,category_slug,price,discount_percent,image,abv,note,in_stock,featured,sort")
            .order("sort"),
        ]);
        if (cats.error) throw cats.error;
        if (prods.error) throw prods.error;
        const value = {
          categories: (cats.data ?? []) as unknown as DbCategory[],
          products: ((prods.data ?? []) as unknown as DbProduct[]).map((p) => ({
            ...p,
            price: Number(p.price),
          })),
        };
        catalogCache = { value, expiresAt: Date.now() + CATALOG_CACHE_MS };
        return value;
      })().finally(() => {
        catalogRequest = undefined;
      });
    }

    return catalogRequest;
  },
);

async function adminClient(creds: Creds) {
  const { assertAdmin } = await import("./admin-auth.server");
  assertAdmin(creds);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const saveProduct = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { product: Partial<DbProduct> }) => d)
  .handler(async ({ data }) => {
    const supabase = await adminClient(data);
    const { id, ...fields } = data.product;
    if (id) {
      const { error } = await supabase
        .from("products")
        .update(fields as never)
        .eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("products").insert(fields as never);
      if (error) throw error;
    }
    clearCatalogCache();
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { id: string }) => d)
  .handler(async ({ data }) => {
    const supabase = await adminClient(data);
    const { error } = await supabase.from("products").delete().eq("id", data.id);
    if (error) throw error;
    clearCatalogCache();
    return { ok: true };
  });

export const saveCategory = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { slug: string; label: string }) => d)
  .handler(async ({ data }) => {
    const supabase = await adminClient(data);
    const { error } = await supabase
      .from("categories")
      .upsert({ slug: data.slug, label: data.label } as never, {
        onConflict: "slug",
      });
    if (error) throw error;
    clearCatalogCache();
    return { ok: true };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { slug: string }) => d)
  .handler(async ({ data }) => {
    const supabase = await adminClient(data);
    const used = await supabase
      .from("products")
      .select("id")
      .eq("category_slug", data.slug)
      .limit(1);
    if (used.error) throw used.error;
    if (used.data?.length) throw new Error("category-in-use");
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("slug", data.slug);
    if (error) throw error;
    clearCatalogCache();
    return { ok: true };
  });
