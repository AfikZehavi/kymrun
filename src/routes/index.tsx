import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Clock,
  Gift,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Search,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { useQuery, queryOptions } from "@tanstack/react-query";

import heroBottles from "@/assets/hero-bottles.webp";
import heroBottlesLight from "@/assets/hero-bottles-light.webp";
import heritageCrest from "@/assets/kymrun-heritage-crest.png";
import type { ShopifyProduct } from "@/lib/shopify";
import { getStoreProducts } from "@/lib/store.functions";
import { useCartStore, useCartSync } from "@/lib/use-shopify-cart";
import { deliverySpeeds } from "@/lib/delivery";
import type { Product, Category, ProductDetails } from "@/lib/types";
import { SiteFooter } from "@/components/site-footer";
import { ZoneChecker } from "@/components/zone-checker";
import { ProductImage } from "@/components/product-image";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { QuantityStepper } from "@/components/quantity-stepper";
import { SectionHeading } from "@/components/section-heading";
import { SiteHeader, navLinkClass } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { GOLD_ENABLED } from "@/lib/gold";
import { SECRET_ROOM_ENABLED } from "@/lib/use-secret-gift";
import { GoldBand } from "@/components/gold-band";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KYMRUN — יין, וויסקי ומשקאות פרימיום כשרים" },
      {
        name: "description",
        content:
          "KYMRUN: יין, וויסקי, ג'ין ורום פרימיום — כל המשקאות כשרים, משלוח מהיר עד הבית ובחירה בכמה קליקים.",
      },
      {
        property: "og:title",
        content: "KYMRUN — יין, וויסקי ומשקאות פרימיום כשרים",
      },
      {
        property: "og:description",
        content: "KYMRUN: כל המשקאות כשרים. יין, וויסקי וספיריטים פרימיום עם משלוח עד הבית.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  // keep the loader snapshot so client hydration matches the server HTML
  component: Home,
});

const catalogQuery = queryOptions({
  queryKey: ["store-catalog"],
  queryFn: (): Promise<(ShopifyProduct["node"] & { details?: ProductDetails })[]> =>
    getStoreProducts(),
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: 1,
});

const paths: {
  id: string;
  label: string;
  description: string;
  filter: string;
  toast: string;
  to?: "/events" | "/secret-room";
}[] = [
  {
    id: "gift",
    label: "מתנה",
    description: "אריזה מוכנה וכרטיס אישי",
    filter: "gift",
    toast: "הנה המארזים המוכנים למשלוח",
  },
  {
    id: "shop",
    label: "לחנות",
    description: "כל המדף שלנו במקום אחד",
    filter: "all",
    toast: "כל הבקבוקים לפניך",
  },
  {
    id: "winery",
    label: "ליקב",
    description: "יינות אדומים, לבנים ובועות",
    filter: "wine",
    toast: "יינות שמתאימים לארוחה",
  },
  {
    id: "collectors",
    label: "אספנים",
    description: "ויסקי נדיר ומיושן",
    filter: "whisky",
    toast: "בקבוקים נדירים ומיושנים",
  },
  {
    id: "secret",
    label: "החדר הסודי",
    description: "טריוויית יין ווויסקי — עונים נכון, מקבלים מתנה",
    filter: "secret",
    toast: "פתחנו לך את הדלת לחדר הסודי",
    to: "/secret-room" as const,
  },
  {
    id: "events",
    label: "אירועים",
    description: "בר לאירוע, מתנות לעובדים והצעת מחיר תוך 4 שעות",
    filter: "all",
    toast: "ספרו לנו על האירוע",
    to: "/events" as const,
  },
];

function Home() {
  const [search, setSearch] = useState("");
  const activePaths = paths.filter((path) => SECRET_ROOM_ENABLED || path.id !== "secret");
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Product | null>(null);

  useCartSync();
  const navigate = useNavigate({ from: "/" });
  const addShopifyItem = useCartStore((s) => s.addItem);
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const subtotal = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.quantity * parseFloat(i.price.amount), 0),
  );

  const loaderData = Route.useLoaderData();
  const { data, isPending, isError, refetch } = useQuery({
    ...catalogQuery,
    initialData: loaderData,
  });

  const allProducts = useMemo<Product[]>(() => {
    return (data ?? []).map((sp) => {
      const node = sp;
      const variant = node.variants.edges[0]?.node;
      const tags = node.tags ?? [];
      const group = tags.find((t) => !/%$/.test(t) && t !== "featured") ?? "all";
      const abvTag = tags.find((t) => /^\d+(\.\d+)?%$/.test(t));
      const compareAt = variant?.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : 0;
      const price = parseFloat(variant?.price.amount ?? "0");
      const discount = compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;
      return {
        id: node.id,
        handle: node.handle,
        variantId: variant?.id ?? "",
        name: node.title,
        category: node.productType,
        group,
        basePrice: compareAt > price ? compareAt : price,
        price,
        discount,
        image: node.images.edges[0]?.node.url ?? "",
        abv: abvTag ?? "",
        note: node.description,
        inStock: variant?.availableForSale ?? false,
        featured: tags.includes("featured"),
        compareAtPrice: variant?.compareAtPrice ?? null,
        currencyCode: variant?.price.currencyCode ?? "ILS",
        details: node.details,
      };
    });
  }, [data]);

  const categories = useMemo<Category[]>(() => {
    const groupOrder = ["all", "gift", "wine", "whisky", "spirits", "secret"];
    const seen = new Map<string, string>();
    for (const p of allProducts) {
      if (!seen.has(p.group)) seen.set(p.group, p.category || p.group);
    }
    const rank = (g: string) => {
      const i = groupOrder.indexOf(g);
      return i === -1 ? 99 : i;
    };
    return [
      { id: "all", label: "הכול" },
      ...[...seen.keys()]
        .filter((g) => g !== "all" && (SECRET_ROOM_ENABLED || g !== "secret"))
        .sort((a, b) => rank(a) - rank(b))
        .map((g) => ({ id: g, label: seen.get(g) ?? g })),
    ];
  }, [allProducts]);

  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [filter, search]);
  const visible = useMemo(
    () =>
      allProducts.filter(
        (p) =>
          (filter === "all" || p.group === filter) &&
          p.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
      ),
    [filter, search, allProducts],
  );
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  function goToPage(n: number) {
    setPage(n);
    document.getElementById("shelf")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function addProduct(product: Product, quantity = 1) {
    if (!product.variantId) return;
    addShopifyItem({
      product: {
        node: {
          id: product.id,
          handle: product.handle,
          title: product.name,
          description: product.note,
          productType: product.category,
          tags: [],
          priceRange: {
            minVariantPrice: { amount: String(product.price), currencyCode: product.currencyCode },
          },
          compareAtPriceRange: product.compareAtPrice
            ? { minVariantPrice: product.compareAtPrice }
            : {
                minVariantPrice: {
                  amount: String(product.price),
                  currencyCode: product.currencyCode,
                },
              },
          images: { edges: [{ node: { url: product.image, altText: product.name } }] },
          variants: {
            edges: [
              {
                node: {
                  id: product.variantId,
                  title: "Default Title",
                  price: { amount: String(product.price), currencyCode: product.currencyCode },
                  compareAtPrice: product.compareAtPrice ?? null,
                  availableForSale: product.inStock,
                  selectedOptions: [],
                },
              },
            ],
          },
          options: [],
        },
      },
      variantId: product.variantId,
      variantTitle: "Default",
      price: { amount: String(product.price), currencyCode: product.currencyCode },
      compareAtPrice: product.compareAtPrice,
      quantity,
    });
    toast.custom(
      (id) => (
        <div
          dir="rtl"
          className="pointer-events-auto flex w-[min(92vw,380px)] items-center gap-3 rounded-lg border border-gold/25 bg-card/95 p-3 text-right shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          <ProductImage
            src={product.image}
            alt=""
            containerClassName="size-14 shrink-0 rounded-md ring-1 ring-border"
            className="p-1.5"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-gold">
              <Check className="size-3.5" />
              נוסף לסל
            </p>
            <p className="mt-0.5 truncate font-display text-[15px] font-medium">{product.name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">₪{product.price}</p>
          </div>
          <button
            onClick={() => {
              toast.dismiss(id);
              navigate({ to: "/cart" });
            }}
            className="shrink-0 rounded-md bg-primary px-4 py-2.5 text-xs font-semibold tracking-wide text-primary-foreground"
          >
            לסל
          </button>
        </div>
      ),
      { duration: 3200 },
    );
  }

  function selectPath(id: string) {
    const path = activePaths.find((p) => p.id === id) ?? activePaths[0];
    if (!path) return;
    if (path.to) {
      navigate({ to: path.to });
      return;
    }
    setFilter(path.filter);
    toast(path.label, { description: path.toast });
    document.getElementById("shelf")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goToCart() {
    if (cartCount === 0) {
      toast.error("הסל ריק", { description: "הוסיפו בקבוק כדי להמשיך" });
      return;
    }
    navigate({ to: "/cart" });
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader
        count={cartCount}
        onCart={goToCart}
        nav={
          <>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setFilter(c.id);
                  document
                    .getElementById("shelf")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={navLinkClass(filter === c.id)}
              >
                {c.label}
              </button>
            ))}
            <Link to="/events" className={navLinkClass()}>
              אירועים
            </Link>
            <Link to="/contact" className={navLinkClass()}>
              יצירת קשר
            </Link>
          </>
        }
      />

      <HeroSection onGift={() => selectPath("gift")} />

      <main className="mx-auto max-w-6xl px-5 pb-40 md:px-8 md:pb-32 lg:pb-28">
        <Reveal as="section" className="mt-16 lg:mt-24">
          <SectionHeading
            eyebrow="איך נוכל לעזור"
            title="בחרו את הדרך שלכם"
            description="מתנה מוכנה, ערב יין בבית או בקבוק לאספנים — כל מסלול מוביל לבחירה המדויקת."
            align="center"
          />
          <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-px md:overflow-visible md:rounded-lg md:bg-border md:px-0 md:pb-0 md:ring-1 md:ring-border lg:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
            {activePaths.map((path, i) => (
              <button
                key={path.id}
                onClick={() => selectPath(path.id)}
                className="group relative flex shrink-0 basis-[62%] snap-start flex-col rounded-lg border border-border bg-card p-5 text-right transition-colors hover:bg-secondary md:basis-auto md:rounded-none md:border-0 md:p-7"
              >
                <span className="font-display text-sm text-gold">0{i + 1}</span>
                <p className="mt-6 font-display text-xl font-medium md:text-2xl">{path.label}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {path.description}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold tracking-wide text-gold">
                  לגלות
                  <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" id="shelf" className="mt-20 scroll-mt-32 lg:mt-28">
          <SectionHeading
            eyebrow="המרתף שלנו"
            title="בחירות מהמדף"
            aside={
              <span className="text-xs tracking-widest text-muted-foreground">
                {visible.length} פריטים
              </span>
            }
          />

          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0 md:pb-0">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilter(c.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
                    filter === c.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-gold/50 hover:text-foreground"
                  }`}
                >
                  {c.id === "gift" && <Gift className="size-3.5" />}
                  {c.label}
                </button>
              ))}
            </div>
            <div className="relative md:w-72">
              <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                aria-label="חיפוש לפי שם בקבוק"
                placeholder="חיפוש בקבוק"
                maxLength={150}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-full border border-border bg-transparent pr-10 pl-10 text-sm outline-none transition-colors placeholder:text-muted-foreground/80 focus:border-gold/70 [&::-webkit-search-cancel-button]:hidden"
              />
              {search && (
                <button
                  aria-label="נקה חיפוש"
                  title="נקה חיפוש"
                  onClick={() => setSearch("")}
                  className="absolute left-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14">
            {pageItems.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpen={() => setSelected(product)}
                onAdd={() => addProduct(product)}
              />
            ))}
            {isPending &&
              Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={`s${i}`} />)}
          </div>
          {!isPending && !isError && visible.length === 0 && (
            <p
              role="status"
              className="py-16 text-center font-display text-lg text-muted-foreground"
            >
              לא נמצאו בקבוקים התואמים לחיפוש.
            </p>
          )}
          {pageCount > 1 && (
            <nav aria-label="עמודים" className="mt-14 flex items-center justify-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              >
                <ArrowRight className="size-4" />
                הקודם
              </button>
              <span className="px-3 text-sm text-muted-foreground md:hidden">
                {currentPage} / {pageCount}
              </span>
              {Array.from({ length: pageCount }, (_, k) => k + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => goToPage(n)}
                  aria-current={n === currentPage ? "page" : undefined}
                  className={`hidden size-10 rounded-full font-display text-sm transition-colors md:inline-block ${
                    n === currentPage
                      ? "border border-gold text-gold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === pageCount}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              >
                הבא
                <ArrowLeft className="size-4" />
              </button>
            </nav>
          )}

          {isError && (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">לא הצלחנו לטעון את המדף כרגע.</p>
              <Button onClick={() => refetch()} className="mt-4 h-11 px-6">
                נסה שוב
              </Button>
            </div>
          )}
        </Reveal>

        <Reveal as="section" className="mt-20 lg:mt-28">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border ring-1 ring-border md:grid-cols-4">
            {[
              { icon: ShieldCheck, t: "כל המשקאות כשרים", d: "ללא יוצא מן הכלל" },
              { icon: Clock, t: "אספקה עד 4 שעות", d: "אקספרס באזורים נבחרים" },
              { icon: Truck, t: "משלוח עד הבית", d: "חינם מעל ₪550" },
              { icon: BadgeCheck, t: "מכירה מגיל 18", d: "תעודה מזהה במסירה" },
            ].map(({ icon: Icon, t, d }) => (
              <div
                key={t}
                className="flex flex-col items-center bg-card px-4 py-7 text-center md:py-9"
              >
                <Icon className="size-5 text-gold" strokeWidth={1.5} />
                <p className="mt-3 font-display text-[15px] font-medium md:text-base">{t}</p>
                <p className="mt-1 text-xs text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" id="delivery" className="mt-20 scroll-mt-32 lg:mt-28">
          <SectionHeading
            eyebrow="משלוחים"
            title="מתי זה יגיע אליכם"
            aside={
              <Link
                to="/shipping"
                className="text-xs font-medium tracking-wide text-gold hover:underline"
              >
                כל אזורי החלוקה
              </Link>
            }
          />

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1.35fr]">
            {deliverySpeeds.map((s) => (
              <div key={s.id} className="rounded-lg border border-border bg-card p-6">
                <p className="eyebrow">{s.window}</p>
                <p className="mt-3 font-display text-2xl font-medium">{s.label}</p>
                <div className="gold-rule my-4 opacity-60" />
                <p className="font-display text-lg">₪{s.price}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.note}</p>
              </div>
            ))}
            <ZoneChecker />
          </div>
        </Reveal>

        {SECRET_ROOM_ENABLED && (
          <Reveal as="section" className="mt-20 lg:mt-28">
            <div className="surface-glow overflow-hidden rounded-lg border border-gold/25 bg-card p-7 md:p-12">
              <span className="eyebrow inline-flex items-center gap-2">
                <Sparkles className="size-3.5" />
                החדר הסודי
              </span>
              <h2 className="mt-4 max-w-[22ch] font-display text-3xl font-medium leading-tight lg:text-[2.75rem]">
                טריוויית הבקבוקים — ענו נכון, קבלו מתנה
              </h2>
              <p className="mt-4 max-w-[56ch] text-sm leading-relaxed text-muted-foreground lg:text-base">
                56 שאלות על שימור יין, טעמי יין ועולם הוויסקי. כל סבב מגריל 7 שאלות — 6 נכונות ומעלה
                פותחות מתנה שתצורף להזמנה שלך.
              </p>

              <div className="mt-8 grid gap-px overflow-hidden rounded-md bg-border sm:grid-cols-3">
                {[
                  { t: "שימור", d: "מרתף, טמפרטורה ופקקים" },
                  { t: "יין", d: "טאנינים, ארומות והתאמות" },
                  { t: "וויסקי", d: "חביות, פיט וסינגל מאלט" },
                ].map((c) => (
                  <div key={c.t} className="bg-background/70 p-5 backdrop-blur-md">
                    <p className="font-display text-lg font-medium">{c.t}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{c.d}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-12 px-7 text-[15px]">
                  <Link to="/secret-room">לשחק ולזכות במתנה</Link>
                </Button>
                <Button asChild variant="outline" className="h-12 px-7 text-[15px]">
                  <Link to="/events" hash="tasting">
                    טעימת יין פרטית בבית או בעסק
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>
        )}

        {GOLD_ENABLED && (
          <Reveal as="section" className="mt-20 lg:mt-28">
            <GoldBand />
          </Reveal>
        )}

        <Reveal as="section" className="mt-20 lg:mt-28">
          <SectionHeading eyebrow="הבית שלנו" title="מה שמבדיל את קמרון" align="center" />
          <div className="grid gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-x-reverse md:divide-border">
            {[
              {
                n: "I",
                t: "בחירה של בן אדם",
                d: "כל בקבוק נבחר ונטעם אצלנו לפני שהוא מגיע למדף. אין כאן מלאי אקראי.",
              },
              {
                n: "II",
                t: "אחסון מבוקר",
                d: "טמפרטורה ולחות קבועות, אריזה ממוגנת לכל משלוח — הבקבוק מגיע כמו שיצא.",
              },
              {
                n: "III",
                t: "שירות אישי",
                d: "לא בטוחים? נמליץ לפי האירוע, הטעם והתקציב. גם בוואטסאפ.",
              },
            ].map((c) => (
              <div key={c.t} className="text-center md:px-10">
                <span className="font-display text-sm tracking-[0.3em] text-gold">{c.n}</span>
                <p className="mt-4 font-display text-xl font-medium">{c.t}</p>
                <p className="mx-auto mt-3 max-w-[32ch] text-sm leading-relaxed text-muted-foreground">
                  {c.d}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </main>

      <SiteFooter />

      {cartCount > 0 && (
        <CartBar count={cartCount} subtotal={subtotal} onOpen={goToCart} onCheckout={goToCart} />
      )}

      <ProductDialog
        product={selected}
        onClose={() => setSelected(null)}
        onAdd={(p, qty) => {
          addProduct(p, qty);
          setSelected(null);
        }}
      />
    </div>
  );
}

function Reveal({
  children,
  className = "",
  as: Tag = "div",
  id,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
  id?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -5% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      id={id}
      ref={ref as never}
      className={`content-auto transition-all duration-700 ease-out ${
        shown ? "translate-y-0 opacity-100 blur-0" : "translate-y-8 opacity-0 blur-[2px]"
      } ${className}`}
    >
      {children}
    </Tag>
  );
}

function HeroSection({ onGift }: { onGift: () => void }) {
  return (
    <section className="relative min-h-[82svh] overflow-hidden md:min-h-[68vh] lg:min-h-[78vh]">
      <img
        src={heroBottles}
        alt=""
        width={1920}
        height={1080}
        className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover object-center dark:block"
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
      <img
        src={heroBottlesLight}
        alt=""
        width={1792}
        height={1024}
        className="pointer-events-none absolute inset-0 block h-full w-full object-cover object-center dark:hidden"
        loading="lazy"
        decoding="async"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/20 md:bg-gradient-to-r md:from-background/10 md:via-background/70 md:to-background"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent"
      />

      <img
        src={heritageCrest}
        alt=""
        aria-hidden="true"
        width={1093}
        height={432}
        className="pointer-events-none absolute left-[5%] top-1/2 z-[1] hidden w-[clamp(13rem,22vw,22rem)] -translate-y-1/2 object-contain opacity-[0.12] mix-blend-multiply md:block dark:invert dark:mix-blend-screen dark:opacity-[0.14]"
        loading="eager"
        decoding="async"
      />

      <div className="relative z-10 mx-auto flex min-h-[82svh] w-full max-w-6xl items-end px-5 pb-14 pt-24 md:min-h-[68vh] md:items-center md:px-8 md:py-16 lg:min-h-[78vh]">
        <div className="w-full max-w-xl">
          <HeroCopy onGift={onGift} />
        </div>
      </div>
    </section>
  );
}

function HeroCopy({ onGift }: { onGift: () => void }) {
  return (
    <div>
      <span className="eyebrow inline-flex items-center gap-3">
        <span aria-hidden className="h-px w-8 bg-gold" />
        בית למשקאות פרימיום כשרים
      </span>
      <h1 className="mt-5 font-display dark:[text-shadow:0_2px_24px_rgba(0,0,0,0.55)]">
        <span className="block text-[3.75rem] font-medium leading-none md:text-7xl lg:text-[5.5rem]">
          קִמְרוּן
        </span>
        <span className="mt-3 block text-[1.6rem] font-normal leading-tight text-gold md:text-4xl lg:text-[2.6rem]">
          כְּשֶׁיַּיִן וַחֲוָיָה נִפְגָּשִׁים
        </span>
      </h1>
      <p className="mt-5 max-w-[36ch] text-[15px] leading-relaxed text-foreground/85 dark:[text-shadow:0_1px_12px_rgba(0,0,0,0.6)] md:text-lg">
        יין, וויסקי וספיריטים נבחרים — כולם כשרים. בחרו מסלול, ונמליץ על הבקבוק המדויק.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={onGift} className="h-12 px-8 text-[15px]">
          <Gift className="size-4" />
          בחירת מתנה
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-12 bg-background/40 px-8 text-[15px] backdrop-blur-md"
        >
          <Link to="/events">אירוע או טעימה פרטית</Link>
        </Button>
      </div>

      <a
        href="#delivery"
        className="mt-6 inline-flex items-center gap-2 text-xs text-foreground/75 transition-colors hover:text-gold"
      >
        <Truck className="size-3.5 text-gold" />
        משלוח אקספרס עד 4 שעות — בדקו אם זמין אצלכם
        <ArrowLeft className="size-3" />
      </a>
    </div>
  );
}

function ProductDialog({
  product,
  onClose,
  onAdd,
}: {
  product: Product | null;
  onClose: () => void;
  onAdd: (p: Product, qty: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  useEffect(() => setQuantity(1), [product?.id]);
  const details = product?.details;
  const info: { label: string; value: string }[] = product
    ? [
        { label: "סוג מוצר", value: product.category },
        { label: "אחוז אלכוהול", value: details?.abv || product.abv },
        { label: "נפח", value: details?.volume_ml ? `${details.volume_ml} מ״ל` : "" },
        { label: "ארץ ייצור", value: details?.country ?? "" },
        { label: "יצרן / יקב", value: details?.producer ?? "" },
        { label: "זן ענבים", value: details?.grape_variety ?? "" },
        { label: "כשרות", value: "כשר" },
        { label: "כשר לפסח", value: details?.kosher_passover ? "כן" : "" },
      ].filter((item) => item.value)
    : [];
  const money = (n: number) =>
    new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(n);
  const volume = details?.volume_ml ?? 0;
  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        dir="rtl"
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl gap-0 overflow-y-auto rounded-lg border-border p-0 text-right md:grid md:h-[min(86dvh,620px)] md:grid-cols-2 md:grid-rows-[minmax(0,1fr)] md:overflow-hidden [&>button]:left-3 [&>button]:right-auto [&>button]:top-3 [&>button]:z-10 [&>button]:rounded-full [&>button]:bg-background/80 [&>button]:p-1.5 [&>button]:opacity-100 [&>button]:backdrop-blur"
      >
        {product && (
          <>
            <ProductImage
              src={product.image}
              alt={product.name}
              width={768}
              height={960}
              loading="eager"
              containerClassName="h-[min(40dvh,360px)] w-full shrink-0 md:h-full"
              className="p-8"
            />
            <div className="flex flex-col p-6 md:min-h-0 md:overflow-y-auto md:p-8">
              <DialogHeader className="space-y-1 text-right sm:text-right">
                <span className="eyebrow">{product.category}</span>
                <DialogTitle className="pt-1 font-display text-2xl font-medium leading-snug md:text-[1.75rem]">
                  {product.name}
                </DialogTitle>
                {details?.english_name && (
                  <p dir="ltr" className="text-right text-xs tracking-wide text-muted-foreground">
                    {details.english_name}
                  </p>
                )}
                <DialogDescription className="sr-only">
                  {product.category}
                  {product.abv ? ` · ${product.abv}` : ""}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 flex flex-wrap items-baseline gap-2.5">
                <span className="font-display text-3xl">{money(product.price)}</span>
                {product.discount > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground line-through">
                      {money(product.basePrice)}
                    </span>
                    <span className="rounded-sm bg-wine px-1.5 py-0.5 text-[10px] font-semibold text-wine-foreground">
                      ‎-{product.discount}%
                    </span>
                  </>
                )}
              </div>
              {volume > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {volume} מ״ל · {money((product.price / volume) * 100)} ל־100 מ״ל
                </p>
              )}
              {product.note && (
                <p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {product.note}
                </p>
              )}
              {info.length > 0 && (
                <dl className="mt-6 border-t border-border">
                  {info.map((item) => (
                    <div
                      key={item.label}
                      className="flex justify-between gap-4 border-b border-border py-2.5 text-sm"
                    >
                      <dt className="text-muted-foreground">{item.label}</dt>
                      <dd className="break-words text-left font-medium">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="mt-auto pt-6">
                <div className="flex items-center gap-3">
                  <QuantityStepper value={quantity} onChange={setQuantity} />
                  <Button
                    onClick={() => onAdd(product, quantity)}
                    disabled={!product.inStock}
                    className="h-12 flex-1 text-[15px]"
                  >
                    <ShoppingBag className="size-4" />
                    {product.inStock ? "הוספה לסל" : "אזל מהמלאי"}
                  </Button>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="size-3.5 text-gold" />
                    משלוח עד הבית
                  </span>
                  <Link
                    to="/product/$handle"
                    params={{ handle: product.handle }}
                    className="inline-flex items-center gap-1 font-medium text-gold hover:underline"
                  >
                    לעמוד המלא
                    <ArrowLeft className="size-3" />
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CartBar({
  count,
  subtotal,
  onOpen,
  onCheckout,
}: {
  count: number;
  subtotal: number;
  onOpen: () => void;
  onCheckout: () => void;
}) {
  const freeShippingFrom = 550;
  const progress = Math.min((subtotal / freeShippingFrom) * 100, 100);
  const remaining = Math.max(freeShippingFrom - subtotal, 0);
  const formatMoney = (value: number) =>
    new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-in-bottom">
      <div className="mx-auto max-w-md px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:max-w-xl lg:max-w-2xl">
        <div className="rounded-lg border border-gold/25 bg-card/95 p-4 shadow-[0_24px_60px_-12px_rgb(0_0_0/0.55)] backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button onClick={onOpen} className="min-w-0 flex-1 text-right">
              <span className="block text-[11px] tracking-wide text-muted-foreground">
                {count} פריטים בסל
              </span>
              <span className="block whitespace-nowrap font-display text-xl">
                {formatMoney(subtotal)}
              </span>
            </button>
            <Button onClick={onCheckout} className="h-12 shrink-0 px-8 text-[15px]">
              לתשלום
              <ArrowLeft className="size-4" />
            </Button>
          </div>
          <div className="mt-3">
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {remaining > 0
                ? `עוד ${formatMoney(remaining)} למשלוח חינם`
                : "משלוח חינם — מגיע אליך"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
