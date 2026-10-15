import { createServerFn } from "@tanstack/react-start";
import type { ShopifyProduct } from "./shopify";

async function load() {
  const m = await import("./store.server");
  const db = m.publicDb();
  const cats = await db.from("categories").select("slug,label");
  if (cats.error) throw cats.error;
  const labels = new Map((cats.data ?? []).map((c: any) => [c.slug, c.label as string]));
  return { m, db, labels };
}

export const getStoreProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ShopifyProduct["node"][]> => {
    const { m, db, labels } = await load();
    const { data, error } = await db
      .from("products")
      .select(m.ROW_COLS)
      .order("sort")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as any[]).map((r) => m.toNode(r, labels.get(r.category_slug) ?? ""));
  },
);

export const getStoreProduct = createServerFn({ method: "GET" })
  .inputValidator((d: { handle: string }) => d)
  .handler(async ({ data }): Promise<ReturnType<typeof import("./store.server").toNode> | null> => {
    if (!/^[0-9a-f-]{36}$/i.test(data.handle)) return null;
    const { m, db, labels } = await load();
    const { data: r, error } = await db.from("products").select(m.ROW_COLS).eq("id", data.handle).maybeSingle();
    if (error) throw error;
    return r ? m.toNode(r as any, labels.get((r as any).category_slug) ?? "") : null;
  });

type OrderInput = {
  email: string;
  full_name: string;
  phone: string;
  address: string;
  shipping: number;
  items: { id: string; qty: number }[];
};

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d: OrderInput) => {
    if (!d.items?.length || d.items.length > 100) throw new Error("bad items");
    return {
      ...d,
      shipping: Math.min(Math.max(Number(d.shipping) || 0, 0), 35),
      items: d.items.map((i) => ({ id: String(i.id), qty: Math.min(Math.max(Math.floor(i.qty), 1), 50) })),
    };
  })
  .handler(async ({ data }) => {
    const m = await import("./store.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("products")
      .select("id,name,price,discount_percent,in_stock")
      .in("id", data.items.map((i) => i.id));
    if (error) throw error;
    const lines = data.items.flatMap((i) => {
      const r = (rows ?? []).find((x: any) => x.id === i.id) as any;
      if (!r || !r.in_stock) return [];
      return [{ id: r.id, name: r.name, qty: i.qty, price: m.salePrice(r) }];
    });
    if (!lines.length) throw new Error("no available items");
    const total = Math.round((lines.reduce((s, l) => s + l.price * l.qty, 0) + data.shipping) * 100) / 100;

    const { data: order, error: oe } = await supabaseAdmin
      .from("orders")
      .insert({
        email: data.email.slice(0, 200),
        full_name: data.full_name.slice(0, 200),
        phone: data.phone.slice(0, 50),
        address: data.address.slice(0, 500),
        items: lines,
        total,
      } as never)
      .select("id")
      .single();
    if (oe) throw oe;
    const orderId = (order as any).id as string;

    const terminal = process.env["TRANZILA_TERMINAL"];
    if (!terminal) return { orderId, total, paymentUrl: null as string | null };
    const params = new URLSearchParams({
      sum: total.toFixed(2),
      currency: "1",
      cred_type: "1",
      lang: "il",
      orderId,
      contact: data.full_name,
      email: data.email,
      phone: data.phone,
      pdesc: lines.map((l) => `${l.name} x${l.qty}`).join(", ").slice(0, 250),
    });
    // Ask Tranzila to post the result back so the order is marked as paid.
    const origin = import.meta.env.PROD
      ? "https://kymrun.lovable.app"
      : "https://kymrun--0d735870-b8f2-4329-a2c9-cc581bbcc3cd.lovable.app";
    params.set("notify_url", `${origin}/api/public/tranzila/notify`);
    return {
      orderId,
      total,
      paymentUrl: `https://direct.tranzila.com/${encodeURIComponent(terminal)}/iframenew.php?${params}`,
    };
  });
