import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag, Plus } from "lucide-react";

import heroBottle from "@/assets/hero-bottle.jpg";
import wineBottle from "@/assets/wine-bottle.jpg";
import ginBottle from "@/assets/gin-bottle.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "קמרון — יין, וויסקי ומשקאות פרימיום" },
      {
        name: "description",
        content:
          "קמרון: יין, וויסקי, ג'ין ורום נדירים בישראל. משלוח מהיר עד הבית, בחירות פרימיום בקליק.",
      },
      {
        property: "og:title",
        content: "קמרון — יין, וויסקי ומשקאות פרימיום",
      },
      {
        property: "og:description",
        content:
          "קמרון: יין, וויסקי, ג'ין ורום נדירים בישראל. משלוח מהיר עד הבית.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const paths = [
  {
    id: "gift",
    label: "מתנה",
    description: "אריזה מוכנה וכרטיס אישי",
  },
  {
    id: "tonight",
    label: "לערב",
    description: "מה שמתאים לארוחה שלך",
  },
  {
    id: "collectors",
    label: "אספנים",
    description: "בקבוקים נדירים ומוגבלים",
  },
];

const products = [
  {
    id: 1,
    name: "גלנדרונאך 18 שנה",
    category: "ויסקי · סקוטלנד",
    price: 649,
    image: heroBottle,
    abv: "46%",
  },
  {
    id: 2,
    name: "קברנה סוביניון רזרב",
    category: "יין אדום · נאפה",
    price: 289,
    image: wineBottle,
    abv: "14.5%",
  },
  {
    id: 3,
    name: "ג'ין בוטניקל מוגבל",
    category: "ג'ין · אנגליה",
    price: 219,
    image: ginBottle,
    abv: "43%",
  },
  {
    id: 4,
    name: "מיונר 15 שנה",
    category: "רום · קריביים",
    price: 420,
    image: heroBottle,
    abv: "40%",
  },
];

function Home() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-md px-5 pb-36">
        <HeroSection />
        <DecisionPaths />
        <ProductGrid />
      </main>
      <CartBar />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-foreground text-background">
            <span className="font-display text-base font-bold">9</span>
          </div>
          <div className="leading-none">
            <span className="font-display text-lg font-bold tracking-tight">
              מרתף 9
            </span>
            <span className="block text-[10px] tracking-widest text-muted-foreground">
              PREMIUM SPIRITS
            </span>
          </div>
        </div>

        <button
          aria-label="עגלת קניות"
          className="relative grid size-11 place-items-center rounded-full border border-border bg-card transition-transform active:scale-95"
        >
          <ShoppingBag className="size-5" />
          <span className="absolute -top-1 -left-1 grid size-5 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            2
          </span>
        </button>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="pt-5">
      <div className="relative overflow-hidden rounded-3xl bg-card ring-1 ring-border">
        <div className="relative aspect-[4/5] w-full">
          <img
            src={heroBottle}
            alt="בקבוק וויסקי פרימיום על רקע כהה"
            width={1024}
            height={1280}
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-primary" />
            בחירת הסומלייה
          </span>
          <h1 className="mt-3 font-display text-[2.5rem] font-bold leading-[1.05] text-foreground">
            בקבוק אחד
            <br />
            <span className="text-primary">בדיוק בשבילך</span>
          </h1>
          <p className="mt-2 max-w-[28ch] text-[15px] leading-relaxed text-muted-foreground">
            יין, וויסקי וספיריטים פרימיום. בחר מסלול — נמליץ תוך שניות.
          </p>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">מחיר התחלתי</p>
              <p className="font-display text-3xl font-bold text-foreground">
                ₪219
              </p>
            </div>
            <button className="rounded-2xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-transform active:scale-[0.98]">
              התחל לבחור
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function DecisionPaths() {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-xl font-bold">מה היום שלך?</h2>
        <span className="text-xs tracking-widest text-muted-foreground">
          3 דרכים
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-hide snap-x">
        {paths.map((path) => (
          <button
            key={path.id}
            className="group shrink-0 basis-[44%] snap-start rounded-2xl border border-border bg-card p-4 text-right ring-1 ring-transparent transition-all hover:border-primary/30 hover:ring-primary/10 active:scale-[0.98]"
          >
            <p className="font-display text-lg font-bold">{path.label}</p>
            <p className="mt-1 text-xs leading-snug text-muted-foreground">
              {path.description}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary transition-transform group-hover:-translate-x-1">
              בחר
              <Plus className="size-3.5" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProductGrid() {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-xl font-bold">בחירות מהמדף</h2>
        <span className="text-xs tracking-widest text-muted-foreground">
          24 פריטים
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {products.map((product) => (
          <article
            key={product.id}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-3 transition-transform active:scale-[0.98]"
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
              <span className="absolute top-2 right-2 rounded-lg bg-background/70 px-2 py-1 text-[10px] font-medium text-foreground backdrop-blur-sm">
                {product.abv}
              </span>
            </div>

            <div className="mt-3 flex flex-1 flex-col">
              <p className="text-[10px] tracking-wider text-muted-foreground">
                {product.category}
              </p>
              <h3 className="mt-1 text-[15px] font-semibold leading-tight">
                {product.name}
              </h3>

              <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                <span className="font-display text-lg font-bold text-foreground">
                  ₪{product.price}
                </span>
                <button
                  aria-label={`הוסף ${product.name} לסל`}
                  className="grid size-9 place-items-center rounded-full border border-border bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CartBar() {
  const subtotal = 868;
  const freeShippingFrom = 1200;
  const progress = Math.min((subtotal / freeShippingFrom) * 100, 100);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-md px-4 pb-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>עוד ₪{freeShippingFrom - subtotal} למשלוח חינם</span>
              <span className="font-mono">₪{subtotal} / ₪{freeShippingFrom}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">2 פריטים</p>
              <p className="font-display text-2xl font-bold">₪{subtotal}</p>
            </div>
            <button className="flex-1 rounded-2xl bg-primary py-3.5 text-center text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98]">
              לתשלום
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
