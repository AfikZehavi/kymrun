import { createFileRoute } from "@tanstack/react-router";
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
  Minus,
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

import heroBottle from "@/assets/hero-bottle.jpg";
import heroBottles from "@/assets/hero-bottles.jpg";
import wineBottle from "@/assets/wine-bottle.jpg";
import ginBottle from "@/assets/gin-bottle.jpg";
import champagneBottle from "@/assets/champagne-bottle.jpg";
import cognacBottle from "@/assets/cognac-bottle.jpg";
import vodkaBottle from "@/assets/vodka-bottle.jpg";
import giftSet from "@/assets/gift-set.jpg";

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

export type Product = {
  id: number;
  name: string;
  category: string;
  group: "gift" | "whisky" | "wine" | "spirits";
  price: number;
  image: string;
  abv: string;
  note: string;
  inStock?: boolean;
  featured?: boolean;
};

export const CUSTOM_PRODUCTS_KEY = "kymrun-custom-products";

export const products: Product[] = [
  {
    id: 1,
    name: "CEMRON — 18 שנות בַּשְׁלָה",
    category: "ויסקי · סקוטלנד",
    group: "whisky",
    price: 649,
    image: heroBottle,
    abv: "46%",
    note: "וניל, דבש כהה וסיומת עשן עדינה. חבית שרי ראשונה.",
  },
  {
    id: 2,
    name: "CEMRON — קברנה רזרב",
    category: "יין אדום · נאפה",
    group: "wine",
    price: 289,
    image: wineBottle,
    abv: "14.5%",
    note: "פירות יער כהים, ארז וטאנינים קטיפתיים. מצוין עם בשר.",
  },
  {
    id: 3,
    name: "CEMRON — ג'ין בוטניקל",
    category: "ג'ין · אנגליה",
    group: "spirits",
    price: 219,
    image: ginBottle,
    abv: "43%",
    note: "מחט ערער, הדרים ופלפל ורוד. מושלם לג'ין טוניק.",
  },
  {
    id: 4,
    name: "CEMRON — רום מיושן",
    category: "רום · קריביים",
    group: "spirits",
    price: 420,
    image: heroBottle,
    abv: "40%",
    note: "קרמל, בננה קלויה וקינמון. יישון 12 שנים.",
  },
  {
    id: 5,
    name: "CEMRON — שמפניה בלאן דה נואר",
    category: "שמפניה · צרפת",
    group: "wine",
    price: 540,
    image: champagneBottle,
    abv: "12.5%",
    note: "בועות דקיקות, בריוש ותפוח ירוק. לרגעים גדולים.",
  },
  {
    id: 6,
    name: "CEMRON — קוניאק XO",
    category: "קוניאק · קונייאק",
    group: "spirits",
    price: 890,
    image: cognacBottle,
    abv: "40%",
    note: "משמש מיובש, אגוזים ועץ אלון עתיק. יישון ארוך.",
  },
  {
    id: 7,
    name: "CEMRON — וודקה כסופה",
    category: "וודקה · פולין",
    group: "spirits",
    price: 199,
    image: vodkaBottle,
    abv: "40%",
    note: "זיקוק חמש פעמים, נקייה וקרירה במיוחד.",
  },
  {
    id: 8,
    name: "CEMRON — מארז מורשת 20 & 30",
    category: "מארז מתנה · שני בקבוקים",
    group: "gift",
    price: 1290,
    image: giftSet,
    abv: "43%",
    note: "שני וויסקי מיושנים בקופסת סאטן שחורה עם כרטיס אישי.",
  },
  {
    id: 9,
    name: "CEMRON — מארז חגיגה",
    category: "מארז מתנה · שמפניה וכוסות",
    group: "gift",
    price: 690,
    image: champagneBottle,
    abv: "12.5%",
    note: "שמפניה פרימיום, שתי כוסות קריסטל ואריזת מתנה.",
  },
  {
    id: 10,
    name: "CEMRON — מארז ערב זוגי",
    category: "מארז מתנה · יין וקינוח",
    group: "gift",
    price: 450,
    image: wineBottle,
    abv: "14%",
    note: "קברנה רזרב, שוקולד מריר ופותחן מעוצב.",
  },
  {
    id: 11,
    name: "CEMRON — סינגל מאלט 12",
    category: "ויסקי · איילה",
    group: "whisky",
    price: 389,
    image: heroBottle,
    abv: "43%",
    note: "כבול ימי, מלח ופלפל. קלאסיקה מעושנת.",
  },
  {
    id: 12,
    name: "CEMRON — שרדונה מיושן",
    category: "יין לבן · בורגון",
    group: "wine",
    price: 245,
    image: wineBottle,
    abv: "13%",
    note: "חמאה, אגס ומינרליות. מוגש מצונן.",
  },
];

const categories = [
  { id: "all", label: "הכול" },
  { id: "gift", label: "מתנות" },
  { id: "whisky", label: "ויסקי" },
  { id: "wine", label: "יין" },
  { id: "spirits", label: "ספיריטים" },
] as const;

const paths = [
  { id: "gift", label: "מתנה", description: "אריזה מוכנה וכרטיס אישי" },
  { id: "tonight", label: "לערב", description: "מה שמתאים לארוחה שלך" },
  { id: "collectors", label: "אספנים", description: "בקבוקים נדירים ומוגבלים" },
];

type CartLine = { product: Product; qty: number };

function Home() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [customProducts, setCustomProducts] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
      if (raw) setCustomProducts(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const allProducts = useMemo(
    () => [...products, ...customProducts],
    [customProducts],
  );

  const visible = useMemo(
    () =>
      filter === "all"
        ? allProducts
        : allProducts.filter((p) => p.group === filter),
    [filter, allProducts],
  );

  const count = cart.reduce((s, l) => s + l.qty, 0);
  const subtotal = cart.reduce((s, l) => s + l.qty * l.product.price, 0);

  function addToCart(product: Product) {
    setCart((prev) => {
      const found = prev.find((l) => l.product.id === product.id);
      if (found) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [...prev, { product, qty: 1 }];
    });
    toast.success("נוסף לסל", { description: product.name });
  }

  function changeQty(id: number, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.product.id === id ? { ...l, qty: Math.max(0, l.qty + delta) } : l,
        )
        .filter((l) => l.qty > 0),
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

  function checkout() {
    if (!cart.length) {
      toast.error("הסל ריק", { description: "הוסיפו בקבוק כדי להמשיך" });
      return;
    }
    setCartOpen(false);
    setOrderPlaced(true);
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <Header
        count={count}
        onCart={() => setCartOpen(true)}
        filter={filter}
        onFilter={setFilter}
      />

      <main className="mx-auto max-w-md px-5 pb-40 lg:max-w-6xl lg:px-8 lg:pb-28">
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
                  <span className="font-display text-lg font-bold">
                    ₪{product.price}
                  </span>
                  <button
                    onClick={() => addToCart(product)}
                    aria-label={`הוסף ${product.name} לסל`}
                    className="grid size-9 place-items-center rounded-full border border-border bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
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
          onOpen={() => setCartOpen(true)}
          onCheckout={checkout}
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

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader className="text-right">
            <SheetTitle className="font-display text-xl">הסל שלך</SheetTitle>
          </SheetHeader>
          <div dir="rtl" className="space-y-3 px-4 pb-6">
            {cart.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                הסל ריק עדיין — בחרו בקבוק מהמדף.
              </p>
            )}
            {cart.map((line) => (
              <div
                key={line.product.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <img
                  src={line.product.image}
                  alt={line.product.name}
                  width={768}
                  height={960}
                  loading="lazy"
                  className="size-16 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {line.product.name}
                  </p>
                  <p className="mt-1 font-display text-base font-bold">
                    ₪{line.product.price * line.qty}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    aria-label="הפחת"
                    onClick={() => changeQty(line.product.id, -1)}
                    className="grid size-8 place-items-center rounded-full border border-border bg-secondary"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">
                    {line.qty}
                  </span>
                  <button
                    aria-label="הוסף"
                    onClick={() => changeQty(line.product.id, 1)}
                    className="grid size-8 place-items-center rounded-full border border-border bg-secondary"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {cart.length > 0 && (
              <button
                onClick={checkout}
                className="mt-2 w-full rounded-2xl bg-primary py-3.5 text-base font-semibold text-primary-foreground active:scale-[0.98]"
              >
                אישור הזמנה · ₪{subtotal}
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={orderPlaced} onOpenChange={setOrderPlaced}>
        <DialogContent dir="rtl" className="max-w-sm text-right">
          <DialogHeader className="items-center text-center">
            <div className="mb-2 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground">
              <Check className="size-7" />
            </div>
            <DialogTitle className="font-display text-xl">
              ההזמנה אושרה
            </DialogTitle>
            <DialogDescription>
              {count} פריטים · ₪{subtotal}. נשלח אישור והמשלוח יוצא אליך.
            </DialogDescription>
          </DialogHeader>
          <button
            onClick={() => {
              setOrderPlaced(false);
              setCart([]);
            }}
            className="mt-2 w-full rounded-2xl bg-primary py-3 text-base font-semibold text-primary-foreground"
          >
            מעולה
          </button>
        </DialogContent>
      </Dialog>
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
}: {
  count: number;
  onCart: () => void;
  filter: string;
  onFilter: (id: string) => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-md grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 lg:max-w-6xl lg:px-8">
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

        <button
          onClick={onCart}
          aria-label="עגלת קניות"
          className="relative grid size-11 shrink-0 place-items-center rounded-full border border-border bg-card transition-transform active:scale-95"
        >
          <ShoppingBag className="size-5" />
          {count > 0 && (
            <span className="absolute -top-1 -left-1 grid size-5 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

function HeroSection({ onGift }: { onGift: () => void }) {
  return (
    <section className="relative -mx-5 min-h-[78vh] overflow-hidden lg:-mx-8 lg:min-h-[70vh]">
      <img
        src={heroBottles}
        alt=""
        width={1920}
        height={1080}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        loading="eager"
        decoding="async"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent lg:bg-gradient-to-r lg:from-background/90 lg:via-background/40 lg:to-transparent"
      />

      <span className="pointer-events-none absolute top-4 left-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/70 px-3 py-1.5 text-[11px] font-semibold tracking-wide backdrop-blur-md">
        <ShieldCheck className="size-3.5 text-primary" />
        כשר · 100%
      </span>

      <div className="relative z-10 flex min-h-[78vh] items-end px-5 pb-12 pt-24 lg:min-h-[70vh] lg:items-center lg:px-8 lg:py-12">
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
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground backdrop-blur-sm">
        <span className="size-1.5 rounded-full bg-primary" />
        כל המשקאות אצלנו כשרים — בלי לבדוק תווית
      </span>
      <h1 className="mt-3 font-display text-[2.5rem] font-bold leading-[1.05] lg:text-6xl">
        בקבוק אחד
        <br />
        <span className="text-primary">בדיוק בשבילך</span>
      </h1>
      <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-muted-foreground lg:text-lg">
        יין, וויסקי וספיריטים פרימיום — כולם כשרים. בחר מסלול, ונמליץ תוך שניות.
      </p>

      <div className="mt-5 flex flex-col gap-3 lg:max-w-sm">
        <button
          onClick={onGift}
          className="w-full rounded-2xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-transform hover:scale-[1.01] active:scale-[0.98]"
        >
          בחר מתנה
        </button>
        <p className="text-center text-xs text-muted-foreground lg:text-right">
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
      <div className="mx-auto max-w-md px-4 pb-4 lg:max-w-2xl">
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
