import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, BadgeCheck, Loader2, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import { getStoreProduct } from "@/lib/store.functions";
import { useCartStore, useCartSync } from "@/lib/use-shopify-cart";
import { ProductImage } from "@/components/product-image";
import { QuantityStepper } from "@/components/quantity-stepper";
import { SiteHeader, headerIconClass } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";

const productQuery = (handle: string) =>
  queryOptions({
    queryKey: ["store-product", handle],
    queryFn: () => getStoreProduct({ data: { handle } }),
    staleTime: 60_000,
  });
export const Route = createFileRoute("/product/$handle")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(productQuery(params.handle)),
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} | KYMRUN` : "הבקבוק לא נמצא | KYMRUN";
    const description = loaderData
      ? `${loaderData.title}, ${loaderData.productType} כשר. ${loaderData.description.slice(0, 140)}`
      : "בקבוקי פרימיום כשרים בחנות KYMRUN.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
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
  const money = (n: number) =>
    new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(n);
  async function add() {
    if (!product || !variant || !variant.availableForSale) return;
    setAdding(true);
    try {
      await addItem({
        product: { node: product },
        variantId: variant.id,
        variantTitle: variant.title,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        quantity,
      });
      toast.success("נוסף לסל", { description: product.title });
    } catch {
      toast.error("לא הצלחנו להוסיף לסל. נסו שוב.");
    } finally {
      setAdding(false);
    }
  }
  const details = product?.details;
  const info: { label: string; value: string }[] =
    product && details
      ? [
          { label: "סוג מוצר", value: product.productType },
          { label: "אחוז אלכוהול", value: details.abv },
          { label: "נפח", value: details.volume_ml ? `${details.volume_ml} מ״ל` : "" },
          { label: "ארץ ייצור", value: details.country },
          { label: "יצרן / יקב", value: details.producer },
          { label: "זן ענבים", value: details.grape_variety },
          { label: "כשרות", value: "כשר" },
          { label: "כשר לפסח", value: details.kosher_passover ? "כן" : "" },
        ].filter((item) => item.value)
      : [];
  const inStock = !!variant?.availableForSale;
  const addLabel = inStock ? "הוספה לסל" : "אזל מהמלאי";

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader
        count={count}
        leading={
          <Link
            to="/"
            aria-label="חזרה לחנות"
            title="חזרה לחנות"
            className={`${headerIconClass} md:hidden`}
          >
            <ArrowRight className="size-[18px]" />
          </Link>
        }
      />
      {!product ? (
        <main className="mx-auto max-w-xl px-5 py-24 text-center">
          <span className="eyebrow">404</span>
          <h1 className="mt-3 font-display text-3xl font-medium">הבקבוק לא נמצא</h1>
          <Button asChild className="mt-8 h-12 px-8">
            <Link to="/">חזרה לחנות</Link>
          </Button>
        </main>
      ) : (
        <>
          <main className="mx-auto max-w-6xl px-5 pb-32 pt-6 md:px-8 md:pb-16 md:pt-10">
            <nav
              aria-label="מיקום בחנות"
              className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:mb-10"
            >
              <Link to="/" className="transition-colors hover:text-gold">
                החנות
              </Link>
              <span aria-hidden className="text-gold/50">
                /
              </span>
              <span>{product.productType}</span>
              <span aria-hidden className="text-gold/50">
                /
              </span>
              <span className="truncate text-foreground/80">{product.title}</span>
            </nav>
            <div className="grid gap-8 md:grid-cols-[1.05fr_1fr] md:gap-14 lg:gap-20">
              <div className="min-w-0 md:sticky md:top-32 md:self-start">
                <div className="relative overflow-hidden rounded-lg ring-1 ring-border">
                  <ProductImage
                    src={product.images.edges[0]?.node.url}
                    alt={product.title}
                    loading="eager"
                    width={960}
                    height={1200}
                    containerClassName="h-[min(48dvh,420px)] w-full md:h-[min(72dvh,660px)]"
                    className="p-8 md:p-14"
                  />
                  {basePrice > price && (
                    <span className="absolute right-3 top-3 rounded-sm bg-wine px-2 py-1 text-[11px] font-semibold text-wine-foreground">
                      ‎-{Math.round((1 - price / basePrice) * 100)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="min-w-0 md:pt-4">
                <span className="eyebrow inline-flex items-center gap-2">
                  <ShieldCheck className="size-3.5" />
                  {product.productType} · כשר
                </span>
                <h1 className="mt-3 font-display text-3xl font-medium leading-tight md:text-[2.75rem]">
                  {product.title}
                </h1>
                {details?.english_name && (
                  <p
                    dir="ltr"
                    className="mt-2 text-right text-sm tracking-wide text-muted-foreground"
                  >
                    {details.english_name}
                  </p>
                )}
                <div className="gold-rule my-6" />
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-3xl md:text-4xl">{money(price)}</span>
                  {basePrice > price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {money(basePrice)}
                    </span>
                  )}
                </div>
                {details?.volume_ml ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {details.volume_ml} מ״ל · {money((price / details.volume_ml) * 100)} ל־100 מ״ל
                  </p>
                ) : null}

                <div className="mt-7 flex items-center gap-3">
                  <QuantityStepper value={quantity} onChange={setQuantity} />
                  <Button
                    className="hidden h-12 flex-1 text-[15px] md:inline-flex"
                    onClick={add}
                    disabled={adding || !inStock}
                  >
                    {adding ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ShoppingBag className="size-4" />
                    )}
                    {addLabel}
                  </Button>
                  <p className="text-xs text-muted-foreground md:hidden">
                    {inStock ? "במלאי" : "אזל מהמלאי"}
                  </p>
                </div>

                <ul className="mt-6 grid gap-2.5 rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground sm:grid-cols-2">
                  <li className="flex items-center gap-2">
                    <Truck className="size-4 shrink-0 text-gold" strokeWidth={1.5} />
                    משלוח עד הבית · חינם מעל ₪350
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="size-4 shrink-0 text-gold" strokeWidth={1.5} />
                    בדיקת תעודה מזהה במסירה
                  </li>
                </ul>

                {product.description && (
                  <section className="mt-10">
                    <h2 className="eyebrow">על הבקבוק</h2>
                    <p className="mt-3 whitespace-pre-line text-[15px] leading-8 text-foreground/80">
                      {product.description}
                    </p>
                  </section>
                )}
                {info.length > 0 && (
                  <section className="mt-10">
                    <h2 className="eyebrow">מפרט</h2>
                    <dl className="mt-3 border-t border-border">
                      {info.map((item) => (
                        <div
                          key={item.label}
                          className="flex justify-between gap-4 border-b border-border py-3 text-sm"
                        >
                          <dt className="text-muted-foreground">{item.label}</dt>
                          <dd className="break-words text-left font-medium">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )}
              </div>
            </div>
          </main>
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
            <div className="mx-auto flex max-w-md items-center gap-4">
              <span className="shrink-0 font-display text-xl">{money(price * quantity)}</span>
              <Button
                className="h-12 flex-1 text-[15px]"
                onClick={add}
                disabled={adding || !inStock}
              >
                {adding ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShoppingBag className="size-4" />
                )}
                {addLabel}
              </Button>
            </div>
          </div>
          <SiteFooter />
        </>
      )}
    </div>
  );
}
