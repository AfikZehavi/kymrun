import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Upload } from "lucide-react";

import {
  products as baseProducts,
  type Product,
  CUSTOM_PRODUCTS_KEY,
} from "./index";
import placeholder from "@/assets/hero-bottle.jpg";

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
  component: AdminGate,
});

const ADMIN_USER = "adminkymrunhere22!!";
const ADMIN_PASS = "kymrunToWin2423";
const SESSION_KEY = "kymrun-admin-session";

function AdminGate() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      setAuthed(sessionStorage.getItem(SESSION_KEY) === "1");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!authed) {
    return (
      <div
        dir="rtl"
        className="grid min-h-screen place-items-center bg-background px-5 text-foreground"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (user === ADMIN_USER && pass === ADMIN_PASS) {
              try {
                sessionStorage.setItem(SESSION_KEY, "1");
              } catch {
                /* ignore */
              }
              setAuthed(true);
            } else {
              setError(true);
            }
          }}
          className="w-full max-w-sm space-y-4 rounded-3xl border border-border bg-card p-6 text-right shadow-2xl shadow-black/40"
        >
          <div>
            <h1 className="font-display text-2xl font-bold tracking-[0.18em]">
              KYMRUN
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">כניסת מנהל</p>
          </div>
          <input
            value={user}
            onChange={(e) => {
              setUser(e.target.value);
              setError(false);
            }}
            placeholder="שם משתמש"
            autoComplete="username"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <input
            value={pass}
            onChange={(e) => {
              setPass(e.target.value);
              setError(false);
            }}
            type="password"
            placeholder="סיסמה"
            autoComplete="current-password"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          {error && (
            <p className="text-sm text-destructive">שם משתמש או סיסמה שגויים</p>
          )}
          <button
            type="submit"
            className="w-full rounded-2xl bg-primary py-3 text-base font-semibold text-primary-foreground active:scale-[0.98]"
          >
            כניסה
          </button>
        </form>
      </div>
    );
  }

  return <AdminPage />;
}

type Override = { price: number; inStock: boolean; featured: boolean };
const STORAGE_KEY = "kymrun-admin-overrides";

const groupOptions: { id: Product["group"]; label: string }[] = [
  { id: "gift", label: "מתנה" },
  { id: "whisky", label: "ויסקי" },
  { id: "wine", label: "יין" },
  { id: "spirits", label: "ספיריטים" },
];

const emptyForm = {
  name: "",
  category: "",
  group: "wine" as Product["group"],
  price: "",
  inStock: true,
  imageUrl: "",
  imageFile: "",
};

function AdminPage() {
  const [overrides, setOverrides] = useState<Record<number, Override>>({});
  const [customProducts, setCustomProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const rawOvr = localStorage.getItem(STORAGE_KEY);
      if (rawOvr) setOverrides(JSON.parse(rawOvr));
    } catch {
      /* ignore */
    }
    try {
      const rawProd = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
      if (rawProd) setCustomProducts(JSON.parse(rawProd));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }, [overrides, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(customProducts));
  }, [customProducts, loaded]);

  const baseIds = useMemo(
    () => new Set(baseProducts.map((p) => p.id)),
    [],
  );

  const rows = useMemo(() => {
    const baseRows = baseProducts.map((p) => ({
      ...p,
      ...(overrides[p.id] ?? { price: p.price, inStock: true, featured: false }),
    }));
    const all = [...baseRows, ...customProducts];
    if (!query.trim()) return all;
    const q = query.trim();
    return all.filter((p) => p.name.includes(q) || p.category.includes(q));
  }, [overrides, customProducts, query]);

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

  function updateCustom(id: number, next: Partial<Product>) {
    setCustomProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...next } : p)),
    );
  }

  function deleteCustom(id: number) {
    setCustomProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("המוצר נמחק");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024 * 2) {
      toast.error("התמונה גדולה מדי", { description: "נא לבחור קובץ עד 2MB" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, imageFile: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  }

  function addProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim()) {
      toast.error("חסרים שדות", { description: "נא למלא שם וקטגוריה" });
      return;
    }
    const price = Number(form.price) || 0;
    const newProduct: Product = {
      id: -(Date.now()),
      name: form.name.trim(),
      category: form.category.trim(),
      group: form.group,
      price,
      image: form.imageFile || form.imageUrl.trim() || placeholder,
      abv: "—%",
      note: "",
      inStock: form.inStock,
      featured: false,
    };
    setCustomProducts((prev) => [newProduct, ...prev]);
    setForm({ ...emptyForm });
    if (fileRef.current) fileRef.current.value = "";
    setShowForm(false);
    toast.success("המוצר נוסף", { description: newProduct.name });
  }

  const active = rows.filter((r) => r.inStock !== false).length;
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
              setCustomProducts([]);
              toast.success("אופס לערכי ברירת המחדל");
            }}
            className="shrink-0 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            איפוס
          </button>
        </header>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "מוצרים", value: rows.length },
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

        <button
          onClick={() => setShowForm((v) => !v)}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          <Plus className="size-5" />
          {showForm ? "סגור טופס" : "הוסף מוצר"}
        </button>

        {showForm && (
          <form
            onSubmit={addProduct}
            className="mt-4 rounded-2xl border border-border bg-card p-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs text-muted-foreground">
                  שם מוצר
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="למשל: KYMRUN — רוזה ריזרב"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground">
                  קטגוריה
                </label>
                <input
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  placeholder="למשל: יין אדום · ישראל"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground">
                  סוג
                </label>
                <select
                  value={form.group}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      group: e.target.value as Product["group"],
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {groupOptions.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground">
                  מחיר (₪)
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  placeholder="0"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs text-muted-foreground">
                תמונה — קישור או העלאה
              </label>
              <div className="mt-1 flex flex-col gap-3 md:flex-row md:items-start">
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imageUrl: e.target.value }))
                  }
                  placeholder="https://... או השאר ריק לתמונה כללית"
                  className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/80">
                  <Upload className="size-4" />
                  העלאת תמונה
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              {(form.imageUrl || form.imageFile) && (
                <img
                  src={form.imageFile || form.imageUrl || placeholder}
                  alt="תצוגה מקדימה"
                  className="mt-3 h-24 w-24 rounded-xl object-cover"
                />
              )}
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) =>
                  setForm((f) => ({ ...f, inStock: e.target.checked }))
                }
                className="size-4 accent-primary"
              />
              במלאי
            </label>

            <button
              type="submit"
              className="mt-4 w-full rounded-2xl bg-primary py-3 text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98] md:w-auto md:px-8"
            >
              שמור מוצר
            </button>
          </form>
        )}

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש מוצר או קטגוריה"
          className="mt-6 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="mt-4 space-y-3">
          {rows.map((p) => {
            const isBase = baseIds.has(p.id);
            return (
              <div
                key={p.id}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 rounded-2xl border border-border bg-card p-3"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="size-16 shrink-0 rounded-xl object-cover"
                  loading="lazy"
                />
                <div className="min-w-0">
                  {isBase ? (
                    <div className="truncate text-sm font-semibold">
                      {p.name}
                    </div>
                  ) : (
                    <input
                      value={p.name}
                      onChange={(e) =>
                        updateCustom(p.id, { name: e.target.value })
                      }
                      className="w-full truncate rounded-lg border border-input bg-background px-2 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}
                  {isBase ? (
                    <div className="text-xs text-muted-foreground">
                      {p.category} · {p.abv}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <input
                        value={p.category}
                        onChange={(e) =>
                          updateCustom(p.id, { category: e.target.value })
                        }
                        className="w-40 rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
                      />
                      <select
                        value={p.group}
                        onChange={(e) =>
                          updateCustom(p.id, {
                            group: e.target.value as Product["group"],
                          })
                        }
                        className="rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
                      >
                        {groupOptions.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                      מחיר
                      <input
                        type="number"
                        value={p.price}
                        onChange={(e) =>
                          isBase
                            ? patch(p.id, { price: Number(e.target.value) || 0 })
                            : updateCustom(p.id, {
                                price: Number(e.target.value) || 0,
                              })
                        }
                        className="w-24 rounded-lg border border-input bg-background px-2 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                      />
                    </label>
                    <button
                      onClick={() =>
                        isBase
                          ? patch(p.id, { inStock: !p.inStock })
                          : updateCustom(p.id, { inStock: !p.inStock })
                      }
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        p.inStock
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {p.inStock ? "במלאי" : "אזל"}
                    </button>
                    {isBase && (
                      <button
                        onClick={() =>
                          patch(p.id, { featured: !p.featured })
                        }
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          p.featured
                            ? "bg-accent text-accent-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {p.featured ? "מקודם" : "רגיל"}
                      </button>
                    )}
                    {!isBase && (
                      <button
                        onClick={() => deleteCustom(p.id)}
                        className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                      >
                        <Trash2 className="size-3" />
                        מחק
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
