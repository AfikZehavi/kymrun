import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ShoppingBag,
  Plus,
  Check,
  Gift,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import heroBottles from "@/assets/hero-bottles.jpg";
import heroBottlesLight from "@/assets/hero-bottles-light.jpg";
import { resolveImage } from "@/lib/images";
import { getCatalog } from "@/lib/catalog.functions";
import { useCart } from "@/lib/use-cart";
import type { Product, Category } from "@/lib/types";
import { ThemeToggle } from "@/components/theme-toggle";



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
  component: Home,
});

const paths = [
  { id: "gift", label: "מתנה", description: "אריזה מוכנה וכרטיס אישי" },
  { id: "tonight", label: "לערב", description: "מה שמתאים לארוחה שלך" },
  { id: "collectors", label: "אספנים", description: "בקבוקים נדירים ומוגבלים" },
];


function Home() {
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const navigate = useNavigate({ from: "/" });
  const { add: addToCart, changeQty, count, subtotal } = useCart();

  const fetchCatalog = useServerFn(getCatalog);
  const { data } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => fetchCatalog(),
  });

  const allProducts = useMemo<Product[]>(
    () =>
      (data?.products ?? []).map((p) => {
        const base = Number(p.price);
        const discount = p.discount_percent ?? 0;
        return {
          id: p.id,
          name: p.name,
          category: p.subtitle,
          group: p.category_slug,
          basePrice: base,
          price: Math.round(base * (1 - discount / 100)),
          discount,
          image: resolveImage(p.image),
          abv: p.abv,
          note: p.note,
          inStock: p.in_stock,
          featured: p.featured,
        };
      }),
    [data],
  );

  const categories = useMemo<Category[]>(
    () => [
      { id: "all", label: "הכול" },
      ...(data?.categories ?? []).map((c) => ({ id: c.slug, label: c.label })),
    ],
    [data],
  );

  const visible = useMemo(
    () =>
      filter === "all"
        ? allProducts
        : allProducts.filter((p) => p.group === filter),
    [filter, allProducts],
  );

  function addProduct(product: Product) {
    addToCart(product);
    toast.custom(
      (id) => (
        <div
          dir="rtl"
          className="pointer-events-auto flex w-[min(92vw,380px)] items-center gap-3 rounded-2xl border border-primary/25 bg-card/95 p-3 text-right shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          <img
            src={product.image}
            alt=""
            className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-border"
          />
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
    if (id === "gift") {
      setFilter("gift");
      toast("מסלול מתנה", { description: "הנה המארזים המוכנים למשלוח" });
    } else if (id === "tonight") {
      setFilter("wine");
      toast("לערב", { description: "יינות שמתאימים לארוחה" });
    } else {
      setFilter("whisky");
      toast("אספנים", { description: "בקבוקים נדירים ומיושנים" });
    }
    document
      .getElementById("shelf")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goToCart() {
    if (count === 0) {
      toast.error("הסל ריק", { description: "הוסיפו בקבוק כדי להמשיך" });
      return;
    }
    navigate({ to: "/cart" });
  }


  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <Header
        count={count}
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
              מה היום שלך?
            </h2>
            <span className="text-xs tracking-widest text-muted-foreground">
              3 דרכים
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 pt-1 snap-x md:grid md:grid-cols-3 md:gap-5 md:overflow-visible">
            {paths.map((path) => (
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
            {visible.map((product) => (
              <article
                key={product.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-3"
              >
                <button
                  onClick={() => setSelected(product)}
                  className="text-right transition-transform active:scale-[0.98]"
                  aria-label={`פרטי ${product.name}`}
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-muted">
                    <img
                      src={product.image}
                      alt={product.name}
                      width={768}
                      height={960}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
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
                    onClick={() => addToCart(product)}
                    disabled={!product.inStock}
                    aria-label={`הוסף ${product.name} לסל`}
                    className="grid size-9 place-items-center rounded-full border border-border bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="mt-12 lg:mt-20">
          <div className="grid gap-3 rounded-3xl border border-border bg-card p-5 md:grid-cols-3 lg:p-8">
            {[
              { t: "כל המשקאות כשרים", d: "ללא יוצא מן הכלל — כל בקבוק במדף" },
              { t: "משלוח עד הבית", d: "חינם בהזמנה מעל ₪550" },
              { t: "מכירה מגיל 18", d: "אימות גיל במסירה" },
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
      </main>

      {count > 0 && (
        <CartBar
          count={count}
          subtotal={subtotal}
          onOpen={goToCart}
          onCheckout={goToCart}
        />
      )}

      <ProductDialog
        product={selected}
        onClose={() => setSelected(null)}
        onAdd={(p) => {
          addToCart(p);
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
  const [shown, setShown] = useState(false);

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
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      id={id}
      ref={ref as never}
      className={`transition-all duration-700 ease-out will-change-transform ${
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
          <div className="min-w-0 leading-none">
            <span className="font-display text-lg font-bold tracking-[0.18em]">
              KYMRUN
            </span>
            <span className="block text-[10px] tracking-widest text-muted-foreground">
              משקאות פרימיום · כשר
            </span>
          </div>

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
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
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
    <section className="relative -mx-5 min-h-[78vh] overflow-hidden md:-mx-8 md:min-h-[62vh] lg:min-h-[70vh]">
      <img
        src={heroBottles}
        alt=""
        width={1920}
        height={1080}
        className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover object-center dark:block"
        loading="eager"
        decoding="async"
      />
      <img
        src={heroBottlesLight}
        alt=""
        width={1792}
        height={1024}
        className="pointer-events-none absolute inset-0 block h-full w-full object-cover object-center dark:hidden"
        loading="eager"
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

      <span className="pointer-events-none absolute top-4 left-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/70 px-3 py-1.5 text-[11px] font-semibold tracking-wide backdrop-blur-md">
        <ShieldCheck className="size-3.5 text-primary" />
        כשר · 100%
      </span>

      <div className="relative z-10 flex min-h-[78vh] items-end px-5 pb-12 pt-24 md:min-h-[62vh] md:items-center md:px-8 md:py-14 lg:min-h-[70vh] lg:py-12">
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
        כל המשקאות אצלנו כשרים — בלי לבדוק תווית
      </span>
      <h1 className="mt-3 font-display text-[2.5rem] font-bold leading-[1.05] dark:[text-shadow:0_2px_18px_rgba(0,0,0,0.65)] md:text-5xl lg:text-6xl">
        בקבוק אחד
        <br />
        <span className="text-primary">בדיוק בשבילך</span>
      </h1>
      <p className="mt-3 max-w-[34ch] text-[15px] font-medium leading-relaxed text-foreground/85 dark:[text-shadow:0_1px_10px_rgba(0,0,0,0.6)] md:text-base lg:text-lg">
        יין, וויסקי וספיריטים פרימיום — כולם כשרים. בחר מסלול, ונמליץ תוך שניות.
      </p>

      <div className="mt-5 flex flex-col gap-3 md:max-w-sm">
        <button
          onClick={onGift}
          className="w-full rounded-2xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-transform hover:scale-[1.01] active:scale-[0.98]"
        >
          בחר מתנה
        </button>
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
      <DialogContent dir="rtl" className="max-w-sm p-0 text-right">
        {product && (
          <>
            <img
              src={product.image}
              alt={product.name}
              width={768}
              height={960}
              loading="lazy"
              className="aspect-[4/3] w-full rounded-t-lg object-cover"
            />
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
                <button
                  onClick={() => onAdd(product)}
                  className="flex-1 rounded-2xl bg-primary py-3 text-base font-semibold text-primary-foreground active:scale-[0.98]"
                >
                  הוסף לסל
                </button>
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

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-in-bottom">
      <div className="mx-auto max-w-md px-4 pb-4 md:max-w-xl lg:max-w-2xl">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {remaining > 0
                  ? `עוד ₪${remaining} למשלוח חינם`
                  : "משלוח חינם — מגיע אליך"}
              </span>
              <span className="font-mono">
                ₪{subtotal} / ₪{freeShippingFrom}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onOpen} className="min-w-0 flex-1 text-right">
              <p className="text-xs text-muted-foreground">{count} פריטים</p>
              <p className="font-display text-2xl font-bold">₪{subtotal}</p>
            </button>
            <button
              onClick={onCheckout}
              className="flex-1 rounded-2xl bg-primary py-3.5 text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
            >
              לתשלום
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
