import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Minus,
  ShoppingBag,
  Plus,
  Check,
  Gift,
  ShieldCheck,
  Truck,
  Sparkles,
  Search,
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
const heroTitleLight = "/hero-title-light.png";
const heroTitleDark = "/hero-title-dark.png";
import type { ShopifyProduct } from "@/lib/shopify";
import { getStoreProducts } from "@/lib/store.functions";
import { useCartStore, useCartSync } from "@/lib/use-shopify-cart";
import { deliverySpeeds } from "@/lib/delivery";
import type { Product, Category, ProductDetails } from "@/lib/types";
import { ThemeToggle } from "@/components/theme-toggle";
import { WhatsappButton } from "@/components/whatsapp-button";
import { SiteFooter } from "@/components/site-footer";
import { ZoneChecker } from "@/components/zone-checker";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import { GOLD_ENABLED } from "@/lib/gold";
import { SECRET_ROOM_ENABLED } from "@/lib/use-secret-gift";
import { GoldBand } from "@/components/gold-band";
import { BrandLockup } from "@/components/brand-lockup";





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
        content:
          "KYMRUN: כל המשקאות כשרים. יין, וויסקי וספיריטים פרימיום עם משלוח עד הבית.",
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
  queryFn: (): Promise<(ShopifyProduct["node"] & { details?: ProductDetails })[]> => getStoreProducts(),
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
  const cartCount = useCartStore(
    (s) => s.items.reduce((sum, i) => sum + i.quantity, 0),
  );
  const subtotal = useCartStore(
    (s) => s.items.reduce((sum, i) => sum + i.quantity * parseFloat(i.price.amount), 0),
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
      const compareAt = variant?.compareAtPrice
        ? parseFloat(variant.compareAtPrice.amount)
        : 0;
      const price = parseFloat(variant?.price.amount ?? "0");
      const discount =
        compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;
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
      allProducts.filter((p) => (filter === "all" || p.group === filter) && p.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())),
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
          priceRange: { minVariantPrice: { amount: String(product.price), currencyCode: product.currencyCode } },
          compareAtPriceRange: product.compareAtPrice
            ? { minVariantPrice: product.compareAtPrice }
            : { minVariantPrice: { amount: String(product.price), currencyCode: product.currencyCode } },
          images: { edges: [{ node: { url: product.image, altText: product.name } }] },
          variants: {
            edges: [{
              node: {
                id: product.variantId,
                title: "Default Title",
                price: { amount: String(product.price), currencyCode: product.currencyCode },
                compareAtPrice: product.compareAtPrice ?? null,
                availableForSale: product.inStock,
                selectedOptions: [],
              },
            }],
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
          className="pointer-events-auto flex w-[min(92vw,380px)] items-center gap-3 rounded-2xl border border-primary/25 bg-card/95 p-3 text-right shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          <ProductImage src={product.image} alt="" containerClassName="size-14 shrink-0 rounded-xl ring-1 ring-border" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-primary">
              <Check className="size-3.5" />
              נוסף לסל
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold">
              {product.name}
            </p>
            <p className="mt-0.5 font-display text-sm font-bold text-muted-foreground">
              ₪{product.price}
            </p>
          </div>
          <button
            onClick={() => {
              toast.dismiss(id);
              navigate({ to: "/cart" });
            }}
            className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
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
    document
      .getElementById("shelf")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      <Header
        count={cartCount}
        onCart={goToCart}
        filter={filter}
        onFilter={setFilter}
        categories={categories}
      />


      <main className="mx-auto max-w-md px-5 pb-40 md:max-w-3xl md:px-8 md:pb-32 lg:max-w-6xl lg:pb-28">
        <HeroSection onGift={() => selectPath("gift")} />

        <Reveal as="section" className="mt-8 lg:mt-16">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-xl font-bold lg:text-3xl">
              בחר מה שהכי תרצה היום
            </h2>
            <span className="text-xs tracking-widest text-muted-foreground">
              {activePaths.length} דרכים
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 pt-1 snap-x md:grid md:grid-cols-3 md:gap-5 md:overflow-visible lg:grid-cols-5">
            {activePaths.map((path) => (
              <button
                key={path.id}
                onClick={() => selectPath(path.id)}
                className="group shrink-0 basis-[44%] snap-start rounded-2xl border border-border bg-card p-4 text-right transition-all hover:border-primary/30 hover:-translate-y-0.5 active:scale-[0.98] md:basis-auto md:p-6"
              >
                <p className="font-display text-lg font-bold">{path.label}</p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">
                  {path.description}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  בחר
                  <Plus className="size-3.5" />
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" id="shelf" className="mt-10 scroll-mt-24 lg:mt-20">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-xl font-bold lg:text-3xl">
              בחירות מהמדף
            </h2>
            <span className="text-xs tracking-widest text-muted-foreground">
              {visible.length} פריטים
            </span>
          </div>

          <div className="relative mb-4">
            <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input type="search" aria-label="חיפוש לפי שם בקבוק" placeholder="חיפוש לפי שם בקבוק" maxLength={150} value={search} onChange={(e) => setSearch(e.target.value)} className="h-12 w-full rounded-lg border border-border bg-card pr-12 pl-12 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary [&::-webkit-search-cancel-button]:hidden" />
            {search && <Button variant="ghost" size="icon" aria-label="נקה חיפוש" title="נקה חיפוש" onClick={() => setSearch("")} className="absolute left-2 top-1/2 -translate-y-1/2"><X /></Button>}
          </div>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  filter === c.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.id === "gift" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Gift className="size-3.5" />
                    {c.label}
                  </span>
                ) : (
                  c.label
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {pageItems.map((product) => (
              <article
                key={product.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-3"
              >
                <button
                  onClick={() => setSelected(product)}
                  className="text-right transition-transform active:scale-[0.98]"
                  aria-label={`פרטי ${product.name}`}
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-photo">
                    <ProductImage src={product.image} alt={product.name} width={768} height={960} containerClassName="h-full w-full" className="transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    <span className="absolute top-2 right-2 rounded-lg bg-background/70 px-2 py-1 text-[10px] font-medium backdrop-blur-sm">
                      {product.abv}
                    </span>
                    {product.group === "gift" && (
                      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-[10px] font-semibold text-accent-foreground">
                        <Gift className="size-3" />
                        מארז
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-[10px] tracking-wider text-muted-foreground">
                    {product.category}
                  </p>
                  <h3 className="mt-1 text-[15px] font-semibold leading-tight">
                    {product.name}
                  </h3>
                </button>

                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <span className="flex flex-wrap items-baseline gap-1.5">
                    <span className="font-display text-lg font-bold">
                      ₪{product.price}
                    </span>
                    {product.discount > 0 && (
                      <>
                        <span className="text-xs text-muted-foreground line-through">
                          ₪{product.basePrice}
                        </span>
                        <span className="rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                          -{product.discount}%
                        </span>
                      </>
                    )}
                  </span>
                  <button
                    onClick={() => addProduct(product)}
                    disabled={!product.inStock}
                    aria-label={`הוסף ${product.name} לסל`}
                    className="grid size-9 place-items-center rounded-full border border-border bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </article>
            ))}

            {isPending &&
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`s${i}`}
                  className="flex flex-col rounded-2xl border border-border bg-card p-3"
                >
                  <div className="aspect-[4/5] w-full animate-pulse rounded-xl bg-muted" />
                  <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="mt-4 h-5 w-1/3 animate-pulse rounded bg-muted" />
                </div>
              ))}
          </div>
          {!isPending && !isError && visible.length === 0 && <p role="status" className="py-10 text-center text-sm text-muted-foreground">לא נמצאו בקבוקים התואמים לחיפוש.</p>}
          {pageCount > 1 && (
            <nav aria-label="עמודים" className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                הקודם
              </button>
              <span className="px-3 text-sm text-muted-foreground md:hidden">
                עמוד {currentPage} מתוך {pageCount}
              </span>
              {Array.from({ length: pageCount }, (_, k) => k + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => goToPage(n)}
                  aria-current={n === currentPage ? "page" : undefined}
                  className={`hidden size-10 rounded-full text-sm font-semibold md:inline-block ${
                    n === currentPage
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === pageCount}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                הבא
              </button>
            </nav>
          )}

          {isError && (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">
                לא הצלחנו לטעון את המדף כרגע.
              </p>
              <button
                onClick={() => refetch()}
                className="mt-3 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                נסה שוב
              </button>
            </div>
          )}
        </Reveal>

        <Reveal as="section" id="delivery" className="mt-12 scroll-mt-24 lg:mt-20">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-xl font-bold lg:text-3xl">
              מתי זה יגיע אליך
            </h2>
            <Link
              to="/shipping"
              className="text-xs font-medium text-primary hover:underline"
            >
              כל אזורי החלוקה
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {deliverySpeeds.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <Truck className="size-5 text-primary" />
                <p className="mt-3 font-display text-xl font-bold">{s.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.window}</p>
                <p className="mt-3 text-sm font-semibold">₪{s.price}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {s.note}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <ZoneChecker />
          </div>
        </Reveal>

        {SECRET_ROOM_ENABLED && (
        <Reveal as="section" className="mt-12 lg:mt-20">
          <div className="overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-bl from-card via-card to-primary/10 p-6 lg:p-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-3 py-1 text-[11px] font-semibold tracking-wide text-primary">
              <Sparkles className="size-3.5" />
              החדר הסודי
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold leading-tight lg:text-4xl">
              טריוויית הבקבוקים — ענה נכון, קבל מתנה
            </h2>
            <p className="mt-3 max-w-[56ch] text-sm leading-relaxed text-muted-foreground lg:text-base">
              56 שאלות על שימור יין, טעמי יין ועולם הוויסקי. כל סבב מגריל 7
              שאלות — 6 נכונות ומעלה פותחות מתנה שתצורף להזמנה שלך.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { t: "שימור", d: "מרתף, טמפרטורה ופקקים" },
                { t: "יין", d: "טאנינים, ארומות והתאמות" },
                { t: "וויסקי", d: "חביות, פיט וסינגל מאלט" },
              ].map((c) => (
                <div
                  key={c.t}
                  className="rounded-2xl border border-border bg-background/60 p-4 backdrop-blur-md"
                >
                  <p className="font-display text-base font-bold">{c.t}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.d}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/secret-room"
                className="rounded-2xl bg-primary px-6 py-3.5 text-center text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
              >
                לשחק ולזכות במתנה
              </Link>
              <Link
                to="/events"
                hash="tasting"
                className="rounded-2xl border border-border bg-background px-6 py-3.5 text-center text-base font-semibold transition-colors hover:border-primary/40"
              >
                טעימת יין פרטית בבית או בעסק
              </Link>
            </div>
          </div>
        </Reveal>

        )}

        {GOLD_ENABLED && <Reveal as="section" className="mt-12 lg:mt-20"><GoldBand /></Reveal>}

        <Reveal as="section" className="mt-12 lg:mt-20">
          <div className="grid gap-3 rounded-3xl border border-border bg-card p-5 md:grid-cols-4 lg:p-8">
            {[
              { t: "כל המשקאות כשרים", d: "ללא יוצא מן הכלל — כל בקבוק במדף" },
              { t: "אספקה עד 4 שעות", d: "אקספרס באזורי שירות נבחרים" },
              { t: "משלוח עד הבית", d: "חינם בהזמנה מעל ₪550" },
              { t: "מכירה מגיל 18", d: "הצגת תעודת זהות בפני השליח" },
            ].map((item) => (
              <div key={item.t} className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{item.t}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="mt-12 lg:mt-20">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                t: "בחירה של בן אדם",
                d: "כל בקבוק נבחר ונטעם אצלנו לפני שהוא מגיע למדף. אין כאן מלאי אקראי.",
              },
              {
                t: "אחסון מבוקר",
                d: "טמפרטורה ולחות קבועות, אריזה ממוגנת לכל משלוח — הבקבוק מגיע כמו שיצא.",
              },
              {
                t: "שירות אישי",
                d: "לא בטוחים? נמליץ לפי האירוע, הטעם והתקציב. גם בוואטסאפ.",
              },
            ].map((c) => (
              <div
                key={c.t}
                className="rounded-3xl border border-border bg-card p-6"
              >
                <p className="font-display text-lg font-bold">{c.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {c.d}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </main>

      <SiteFooter />


      {cartCount > 0 && (
        <CartBar
          count={cartCount}
          subtotal={subtotal}
          onOpen={goToCart}
          onCheckout={goToCart}
        />
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

function Header({
  count,
  onCart,
  filter,
  onFilter,
  categories,
}: {
  count: number;
  onCart: () => void;
  filter: string;
  onFilter: (id: string) => void;
  categories: Category[];
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-white dark:bg-background/85 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-md grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 md:h-[4.5rem] md:max-w-3xl md:px-8 lg:max-w-6xl">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link to="/" aria-label="KYMRUN — דף הבית" className="shrink-0">
            <BrandLockup compact />
          </Link>

          <nav className="ms-8 hidden items-center gap-1 lg:flex">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onFilter(c.id);
                  document
                    .getElementById("shelf")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  filter === c.id
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
            <Link
              to="/events"
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              אירועים
            </Link>
            <Link
              to="/contact"
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              יצירת קשר
            </Link>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <WhatsappButton />
          <button
            onClick={onCart}
            aria-label="עגלת קניות"
            className="relative grid size-11 shrink-0 place-items-center rounded-full border border-border bg-muted text-foreground transition-transform active:scale-95 dark:bg-card"
          >
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -top-1 -left-1 grid size-5 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function HeroSection({ onGift }: { onGift: () => void }) {
  return (
    <section className="relative w-[100dvw] max-w-none [margin-inline:calc(50%-50dvw)] min-h-[78vh] overflow-hidden md:min-h-[62vh] lg:min-h-[70vh]">
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
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/25 md:bg-gradient-to-r md:from-background md:via-background/75 md:to-background/20"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-background/25 md:hidden"
      />

      <img
        src={heritageCrest}
        alt=""
        aria-hidden="true"
        width={1093}
        height={432}
        className="pointer-events-none absolute left-[4%] top-1/2 z-[1] hidden w-[clamp(13rem,22vw,22rem)] -translate-y-1/2 object-contain opacity-[0.13] mix-blend-multiply md:block dark:invert dark:mix-blend-screen dark:opacity-[0.16]"
        loading="eager"
        decoding="async"
      />

      <div className="relative z-10 mx-auto flex min-h-[78vh] w-full max-w-md items-end px-5 pb-12 pt-24 md:min-h-[62vh] md:max-w-3xl md:items-center md:px-8 md:py-14 lg:min-h-[70vh] lg:max-w-6xl lg:py-12">
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
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-[11px] font-medium tracking-wide text-foreground/80 backdrop-blur-md">
        <span className="size-1.5 rounded-full bg-primary" />
        כל המשקאות אצלנו כשרים — איכות ללא פשרות
      </span>
      <h1 className="sr-only">קִמְרוּן כְּשֶׁיַּיִן וַחֲוָיָה נִפְגָּשִׁים</h1>
      <div className="mt-3">
        <img
          src={heroTitleLight}
          alt=""
          aria-hidden="true"
          className="block w-full max-w-[min(340px,72vw)] dark:hidden md:max-w-[min(400px,60vw)] lg:max-w-[min(460px,52vw)]"
          style={{ height: "auto" }}
        />
        <img
          src={heroTitleDark}
          alt=""
          aria-hidden="true"
          className="hidden w-full max-w-[min(340px,72vw)] dark:block md:max-w-[min(400px,60vw)] lg:max-w-[min(460px,52vw)]"
          style={{ height: "auto" }}
        />
      </div>
      <p className="mt-3 max-w-[34ch] text-[15px] font-medium leading-relaxed text-foreground/85 dark:[text-shadow:0_1px_10px_rgba(0,0,0,0.6)] md:text-base lg:text-lg">
        יין, וויסקי וספיריטים פרימיום — כולם כשרים. בחר מסלול, ונמליץ תוך שניות.
      </p>

      <a
        href="#delivery"
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/70 px-3.5 py-1.5 text-[11px] font-semibold backdrop-blur-md"
      >
        <Truck className="size-3.5 text-primary" />
        משלוח אקספרס עד 4 שעות — בדקו אם זמין אצלכם
      </a>

      <div className="mt-5 flex flex-col gap-3 md:max-w-sm">
        <button
          onClick={onGift}
          className="w-full rounded-2xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-transform hover:scale-[1.01] active:scale-[0.98]"
        >
          בחר מתנה
        </button>
        <Link
          to="/events"
          className="w-full rounded-2xl border border-border bg-background/70 px-6 py-3 text-center text-sm font-semibold backdrop-blur-md transition-colors hover:border-primary/40"
        >
          אירוע או טעימה פרטית
        </Link>
        <p className="text-center text-xs text-foreground/70 md:text-right">
          כשר · משלוח עד הבית · מגיל 18
        </p>
      </div>
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
  onAdd: (p: Product) => void;
}) {
  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="w-[calc(100%-2rem)] max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto gap-0 rounded-lg p-0 text-right [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:opacity-100 [&>button]:p-2">
        {product && (
          <>
            <ProductImage src={product.image} alt={product.name} width={768} height={960} loading="eager" containerClassName="h-[min(42dvh,360px)] w-full shrink-0 rounded-t-lg" />
            <div className="space-y-3 p-5">
              <DialogHeader className="text-right">
                <DialogTitle className="font-display text-xl">
                  {product.name}
                </DialogTitle>
                <DialogDescription>
                  {product.category} · {product.abv}
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {product.note}
              </p>
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="font-display text-2xl font-bold">
                  ₪{product.price}
                </span>
                <Button variant="outline" asChild><Link to="/product/$handle" params={{ handle: product.handle }}>לפרטי הבקבוק</Link></Button>
                <Button onClick={() => onAdd(product)} disabled={!product.inStock} className="h-12 flex-1 text-base">{product.inStock ? "הוסף לסל" : "אזל מהמלאי"}</Button>
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
  const formatMoney = (value: number) => new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 2 }).format(value);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-in-bottom">
      <div className="mx-auto max-w-md px-4 pb-4 md:max-w-xl lg:max-w-2xl">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="mb-3">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                {remaining > 0
                  ? `עוד ${formatMoney(remaining)} למשלוח חינם`
                  : "משלוח חינם — מגיע אליך"}
              </span>
              <span className="whitespace-nowrap font-mono" dir="ltr">{formatMoney(subtotal)} / {formatMoney(freeShippingFrom)}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_minmax(100px,1fr)] items-center gap-3">
            <Button variant="ghost" onClick={onOpen} className="h-auto min-w-0 flex-col items-start px-0 text-right">
              <span className="text-xs text-muted-foreground">{count} פריטים</span>
              <span className="whitespace-nowrap font-display text-xl font-bold">{formatMoney(subtotal)}</span>
            </Button>
            <Button onClick={onCheckout} className="h-12 w-full text-base">לתשלום</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
