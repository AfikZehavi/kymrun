import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { products as baseProducts } from "./index";

export const Route = createFileRoute("/admin-kymrun-37")({
  head: () => ({
    meta: [
      { title: "ניהול · KYMRUN" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "ממשק ניהול פנימי של KYMRUN." },
      { property: "og:title", content: "ניהול · KYMRUN" },
      { property: "og:description", content: "ממשק ניהול פנימי של KYMRUN." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Override = { price: number; inStock: boolean; featured: boolean };
const STORAGE_KEY = "kymrun-admin-overrides";

function AdminPage() {
  const [overrides, setOverrides] = useState<Record<number, Override>>({});
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOverrides(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }, [overrides, loaded]);

  const rows = useMemo(() => {
    return baseProducts
      .map((p) => ({
        ...p,
        ...(overrides[p.id] ?? { price: p.price, inStock: true, featured: false }),
      }))
      .filter((p) => p.name.includes(query) || p.category.includes(query));
  }, [overrides, query]);

  function patch(id: number, next: Partial<Override>) {
    setOverrides((prev) => {
      const base = baseProducts.find((p) => p.id === id)!;
      const current = prev[id] ?? {
        price: base.price,
        inStock: true,
        featured: false,
      };
      return { ...prev, [id]: { ...current, ...next } };
    });
  }

  const active = rows.filter((r) => r.inStock).length;
  const avg = rows.length
    ? Math.round(rows.reduce((s, r) => s + r.price, 0) / rows.length)
    : 0;

  return (
    <div dir="rtl" className="min-h-screen bg-background px-5 py-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-[0.14em]">
              KYMRUN · ניהול
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              עמוד פנימי. שינויים נשמרים בדפדפן הזה בלבד.
            </p>
          </div>
          <button
            onClick={() => {
              setOverrides({});
              toast.success("אופס לערכי ברירת המחדל");
            }}
            className="shrink-0 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            איפוס
          </button>
        </header>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "מוצרים", value: baseProducts.length },
            { label: "במלאי", value: active },
            { label: "מחיר ממוצע", value: `₪${avg}` },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card px-4 py-3"
            >
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-1 font-display text-xl font-bold">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש מוצר או קטגוריה"
          className="mt-6 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="mt-4 space-y-3">
          {rows.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-2xl border border-border bg-card p-3"
            >
              <img
                src={p.image}
                alt={p.name}
                className="size-16 shrink-0 rounded-xl object-cover"
                loading="lazy"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {p.category} · {p.abv}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    מחיר
                    <input
                      type="number"
                      value={p.price}
                      onChange={(e) =>
                        patch(p.id, { price: Number(e.target.value) || 0 })
                      }
                      className="w-24 rounded-lg border border-input bg-background px-2 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                  </label>
                  <button
                    onClick={() => patch(p.id, { inStock: !p.inStock })}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      p.inStock
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {p.inStock ? "במלאי" : "אזל"}
                  </button>
                  <button
                    onClick={() => patch(p.id, { featured: !p.featured })}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      p.featured
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {p.featured ? "מקודם" : "רגיל"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
