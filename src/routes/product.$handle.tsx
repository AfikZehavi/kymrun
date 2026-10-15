import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, ShoppingBag, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { getStoreProduct } from "@/lib/store.functions";
import { useCartStore } from "@/lib/use-shopify-cart";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLockup } from "@/components/brand-lockup";
import { ProductImage } from "@/components/product-image";
import type { Product } from "@/lib/types";

export const Route = createFileRoute("/product/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: "מוצר — KYMRUN" },
      { name: "description", content: "מוצר פרימיום כשר מ-KYMRUN." },
      { property: "og:title", content: "מוצר — KYMRUN" },
      { property: "og:description", content: "מוצר פרימיום כשר מ-KYMRUN." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { handle } = Route.useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const cartCount = useCartStore(
    (s) => s.items.reduce((sum, i) => sum + i.quantity, 0),
  );
  const [adding, setAdding] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    getStoreProduct({ data: { handle } })
      .then((data) => {
        if (cancelled) return;
        const node = data;
        if (!node) {
          setNotFound(true);
        } else {
          const variant = node.variants.edges[0]?.node;
          const tags = node.tags ?? [];
          const abvTag = tags.find((t) => /^\d+(\.\d+)?%$/.test(t));
          const compareAt = variant?.compareAtPrice
            ? parseFloat(variant.compareAtPrice.amount)
            : 0;
          const price = parseFloat(variant?.price.amount ?? "0");
          setProduct({
            id: node.id,
            handle: node.handle,
            variantId: variant?.id ?? "",
            name: node.title,
            category: node.productType,
            group: tags[0] ?? "all",
            basePrice: compareAt > price ? compareAt : price,
            price,
            discount:
              compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0,
            image: node.images.edges[0]?.node.url ?? "",
            abv: abvTag ?? "",
            note: node.description,
            inStock: variant?.availableForSale ?? false,
            featured: tags.includes("featured"),
            compareAtPrice: variant?.compareAtPrice ?? null,
            currencyCode: variant?.price.currencyCode ?? "ILS",
          });
        }
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [handle]);

  function handleAdd(p: Product) {
    if (!p.variantId) return;
    setAdding(true);
    addItem({
      product: {
        node: {
          id: p.id,
          handle: p.handle,
          title: p.name,
          description: p.note,
          productType: p.category,
          tags: [],
          priceRange: { minVariantPrice: { amount: String(p.price), currencyCode: p.currencyCode } },
          compareAtPriceRange: p.compareAtPrice
            ? { minVariantPrice: p.compareAtPrice }
            : { minVariantPrice: { amount: String(p.price), currencyCode: p.currencyCode } },
          images: { edges: [{ node: { url: p.image, altText: p.name } }] },
          variants: {
            edges: [{
              node: {
                id: p.variantId,
                title: "Default Title",
                price: { amount: String(p.price), currencyCode: p.currencyCode },
                compareAtPrice: p.compareAtPrice ?? null,
                availableForSale: p.inStock,
                selectedOptions: [],
              },
            }],
          },
          options: [],
        },
      },
      variantId: p.variantId,
      variantTitle: "Default",
      price: { amount: String(p.price), currencyCode: p.currencyCode },
      compareAtPrice: p.compareAtPrice,
      quantity: 1,
    })
      .then(() => toast.success("נוסף לסל", { description: p.name }))
      .catch(() => toast.error("אופס", { description: "נסו שוב" }))
      .finally(() => setAdding(false));
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-white/90 dark:bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-md items-center justify-between gap-4 px-5 md:h-[4.5rem] md:max-w-2xl md:px-8 lg:max-w-4xl">
          <button
            onClick={() => navigate({ to: "/" })}
            className="min-w-0 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="inline-flex items-center gap-1">
              <ArrowRight className="size-4" />
              חזרה
            </span>
          </button>
          <BrandLockup compact />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/cart"
              aria-label="עגלת קניות"
              className="relative grid size-11 shrink-0 place-items-center rounded-full border border-border bg-muted text-foreground dark:bg-card"
            >
              <ShoppingBag className="size-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -left-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 py-8 md:max-w-2xl md:py-12 lg:max-w-4xl">
        {!loaded && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="aspect-[4/5] w-full animate-pulse rounded-3xl bg-muted" />
            <div className="space-y-3">
              <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-24 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        )}
        {loaded && (notFound || !product) && (
          <div className="rounded-3xl border border-border bg-card p-10 text-center">
            <h1 className="font-display text-xl font-bold">המוצר לא נמצא</h1>
            <Link
              to="/"
              className="mt-4 inline-block rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              חזרה לחנות
            </Link>
          </div>
        )}
        {loaded && product && (
          <div className="grid gap-6 md:grid-cols-2 md:gap-10">
            <div className="overflow-hidden rounded-3xl border border-border bg-card">
              {product.image ? (
                <ProductImage src={product.image} alt={product.name} width={960} height={1200} containerClassName="aspect-[4/5] w-full" />
              ) : (
                <div className="aspect-[4/5] w-full bg-muted" />
              )}
            </div>
            <div>
              <p className="text-xs tracking-widest text-muted-foreground">
                {product.category}
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">
                {product.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-baseline gap-2">
                <span className="font-display text-2xl font-bold">
                  ₪{product.price}
                </span>
                {product.discount > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground line-through">
                      ₪{product.basePrice}
                    </span>
                    <span className="rounded-md bg-accent px-1.5 py-0.5 text-xs font-bold text-accent-foreground">
                      -{product.discount}%
                    </span>
                  </>
                )}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {product.note}
              </p>
              <div className="mt-5 space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  כשר · איכות ללא פשרות
                </p>
                <p className="flex items-center gap-2">
                  <Truck className="size-4 text-primary" />
                  משלוח עד 4 שעות באזורי חלוקה נתמכים
                </p>
              </div>
              <button
                onClick={() => handleAdd(product)}
                disabled={!product.inStock || adding}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                {adding ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : product.inStock ? (
                  "הוסף לסל"
                ) : (
                  "אזל מהמלאי"
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
