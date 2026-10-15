import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Loader2, ShoppingBag, ShieldCheck, Minus, Plus, Truck } from "lucide-react";
import { toast } from "sonner";
import { getStoreProduct } from "@/lib/store.functions";
import { useCartStore, useCartSync } from "@/lib/use-shopify-cart";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLockup } from "@/components/brand-lockup";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";

const productQuery = (handle: string) => queryOptions({ queryKey: ["store-product", handle], queryFn: () => getStoreProduct({ data: { handle } }), staleTime: 60_000 });
export const Route = createFileRoute("/product/$handle")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(productQuery(params.handle)),
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} — KYMRUN` : "הבקבוק לא נמצא — KYMRUN";
    const description = loaderData ? `${loaderData.title} — ${loaderData.productType}, כשר. ${loaderData.description.slice(0, 140)}` : "בקבוקי פרימיום כשרים בחנות KYMRUN.";
    return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "product" }, { name: "twitter:card", content: "summary_large_image" }] };
  },
  component: ProductPage,
});

function ProductPage() {
  const { handle } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(handle));
  useCartSync();
  const addItem = useCartStore((s) => s.addItem);
  const count = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const variant = product?.variants.edges[0]?.node;
  const price = Number(variant?.price.amount ?? 0);
  const basePrice = Number(variant?.compareAtPrice?.amount ?? price);
  const money = (n: number) => new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(n);
  async function add() {
    if (!product || !variant || !variant.availableForSale) return;
    setAdding(true);
    try {
      await addItem({ product: { node: product }, variantId: variant.id, variantTitle: variant.title, price: variant.price, compareAtPrice: variant.compareAtPrice, quantity });
      toast.success("נוסף לסל", { description: product.title });
    } catch { toast.error("לא הצלחנו להוסיף לסל. נסו שוב."); }
    finally { setAdding(false); }
  }
  const details = product?.details;
  const info: { label: string; value: string }[] = product && details ? [
    { label: "סוג מוצר", value: product.productType },
    { label: "אחוז אלכוהול", value: details.abv },
    { label: "נפח", value: details.volume_ml ? `${details.volume_ml} מ״ל` : "" },
    { label: "ארץ ייצור", value: details.country },
    { label: "יצרן / יקב", value: details.producer },
    { label: "זן ענבים", value: details.grape_variety },
    { label: "כשרות", value: "כשר" },
    { label: "כשר לפסח", value: details.kosher_passover ? "כן" : "" },
  ].filter((item) => item.value) : [];
  return <div dir="rtl" className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 md:px-8">
        <Button variant="ghost" size="icon" asChild><Link to="/" aria-label="חזרה לחנות" title="חזרה לחנות"><ArrowRight className="size-5" /></Link></Button>
        <BrandLockup compact />
        <div className="flex items-center gap-2"><ThemeToggle /><Button variant="outline" size="icon" asChild className="relative"><Link to="/cart" aria-label="עגלת קניות"><ShoppingBag className="size-5" />{count > 0 && <span className="absolute -top-2 -left-2 grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">{count}</span>}</Link></Button></div>
      </div>
    </header>
    {!product ? <main className="mx-auto max-w-xl px-5 py-20 text-center"><h1 className="text-2xl font-bold">הבקבוק לא נמצא</h1><Button asChild className="mt-6"><Link to="/">חזרה לחנות</Link></Button></main> : <>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 md:px-8 md:pb-12">
        <nav aria-label="מיקום בחנות" className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground"><Link to="/" className="hover:text-primary">החנות</Link><span>/</span><span>{product.productType}</span><span>/</span><span>{product.title}</span></nav>
        <div className="grid gap-6 md:grid-cols-2 md:gap-12">
          <div className="min-w-0 md:sticky md:top-24 md:self-start"><ProductImage src={product.images.edges[0]?.node.url} alt={product.title} loading="eager" width={960} height={1200} containerClassName="h-[min(43dvh,340px)] w-full rounded-lg md:h-[min(70dvh,620px)]" className="p-4 md:p-8" /></div>
          <div className="min-w-0">
            <div className="text-center md:text-right">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><ShieldCheck className="size-4" />כשר</span>
              {basePrice > price && <span className="mr-3 text-xs font-semibold text-accent">{Math.round((1-price/basePrice)*100)}% הנחה</span>}
              <h1 className="mt-2 font-display text-2xl font-bold leading-snug md:text-3xl">{product.title}</h1>
              {details?.english_name && <p dir="ltr" className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-right">{details.english_name}</p>}
              <div className="mt-4 flex items-baseline justify-center gap-3 md:justify-start"><span className="text-2xl font-bold text-primary">{money(price)}</span>{basePrice > price && <span className="text-sm text-muted-foreground line-through">{money(basePrice)}</span>}</div>
              {details?.volume_ml ? <p className="mt-1 text-xs text-muted-foreground">{details.volume_ml} מ״ל · {money(price / details.volume_ml * 100)} ל־100 מ״ל</p> : null}
            </div>
            <div className="mt-6 flex items-center gap-3">
              <div className="grid h-12 shrink-0 grid-cols-[40px_32px_40px] items-center rounded-lg border border-border"><Button variant="ghost" size="icon" aria-label="הפחת כמות" disabled={quantity <= 1} onClick={() => setQuantity((q) => q - 1)}><Minus className="size-4" /></Button><output className="text-center text-sm font-medium">{quantity}</output><Button variant="ghost" size="icon" aria-label="הגדל כמות" disabled={quantity >= 50} onClick={() => setQuantity((q) => q + 1)}><Plus className="size-4" /></Button></div>
              <Button className="hidden h-12 flex-1 md:inline-flex" onClick={add} disabled={adding || !variant?.availableForSale}>{adding ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />}{variant?.availableForSale ? "הוסף לסל" : "אזל מהמלאי"}</Button>
              <p className="text-xs text-muted-foreground md:hidden">{variant?.availableForSale ? "במלאי" : "אזל מהמלאי"}</p>
            </div>
            <section className="mt-7 border-t border-border pt-5"><h2 className="font-display text-lg font-bold">מידע נוסף</h2><dl className="mt-3">{info.map((item) => <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b border-border py-3 text-sm"><dt className="text-muted-foreground">{item.label}</dt><dd className="break-words text-left">{item.value}</dd></div>)}</dl></section>
            {product.description && <section className="mt-7 border-t border-border pt-5"><h2 className="font-display text-lg font-bold">על המוצר</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{product.description}</p></section>}
            <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><Truck className="size-4 shrink-0 text-primary" />משלוח עד הבית · בדיקת תעודה מזהה במסירה</p>
          </div>
        </div>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"><div className="mx-auto flex max-w-md items-center gap-4"><span className="shrink-0 text-lg font-bold">{money(price*quantity)}</span><Button className="h-12 flex-1" onClick={add} disabled={adding || !variant?.availableForSale}>{adding ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />}{variant?.availableForSale ? "הוסף לסל" : "אזל מהמלאי"}</Button></div></div>
      <SiteFooter />
    </>}
  </div>;
}
