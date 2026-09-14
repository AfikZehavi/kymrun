import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, Upload } from "lucide-react";

import {
  getCatalog,
  saveProduct,
  deleteProduct,
  saveCategory,
  deleteCategory,
  type DbProduct,
} from "@/lib/catalog.functions";
import { resolveImage } from "@/lib/images";
import { ThemeToggle } from "@/components/theme-toggle";

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

const SESSION_KEY = "kymrun-admin-session";

type Creds = { user: string; pass: string };

function AdminGate() {
  const [creds, setCreds] = useState<Creds | null>(null);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const check = useServerFn(saveCategory);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) setCreds(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  if (!ready) return null;
  if (creds) return <AdminPage creds={creds} />;

  return (
    <div
      dir="rtl"
      className="grid min-h-screen place-items-center bg-background px-5 text-foreground"
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setChecking(true);
          const candidate = { user, pass };
          try {
            // Credentials are verified on the server.
            await check({
              data: { ...candidate, slug: "gift", label: "מתנות" },
            });
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(candidate));
            setCreds(candidate);
          } catch {
            setError(true);
          } finally {
            setChecking(false);
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
          disabled={checking}
          className="w-full rounded-2xl bg-primary py-3 text-base font-semibold text-primary-foreground active:scale-[0.98] disabled:opacity-60"
        >
          {checking ? "בודק..." : "כניסה"}
        </button>
      </form>
    </div>
  );
}

const emptyForm = {
  name: "",
  subtitle: "",
  category_slug: "",
  price: "",
  discount_percent: "0",
  abv: "",
  note: "",
  in_stock: true,
  imageUrl: "",
  imageFile: "",
};

function AdminPage({ creds }: { creds: Creds }) {
  const qc = useQueryClient();
  const fetchCatalog = useServerFn(getCatalog);
  const doSaveProduct = useServerFn(saveProduct);
  const doDeleteProduct = useServerFn(deleteProduct);
  const doSaveCategory = useServerFn(saveCategory);
  const doDeleteCategory = useServerFn(deleteCategory);

  const { data } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => fetchCatalog(),
  });

  const products = useMemo(() => data?.products ?? [], [data]);
  const cats = useMemo(() => data?.categories ?? [], [data]);

  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [catLabel, setCatLabel] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["catalog"] });
  }

  const rows = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.trim();
    return products.filter(
      (p) => p.name.includes(q) || p.subtitle.includes(q),
    );
  }, [products, query]);

  async function patch(p: DbProduct, next: Partial<DbProduct>) {
    try {
      await doSaveProduct({
        data: { ...creds, product: { id: p.id, ...next } },
      });
      refresh();
    } catch {
      toast.error("השמירה נכשלה");
    }
  }

  async function removeProduct(id: string) {
    try {
      await doDeleteProduct({ data: { ...creds, id } });
      refresh();
      toast.success("המוצר נמחק");
    } catch {
      toast.error("המחיקה נכשלה");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 300) {
      toast.error("התמונה גדולה מדי", { description: "נא לבחור קובץ עד 300KB" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, imageFile: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    const slug = form.category_slug || cats[0]?.slug;
    if (!form.name.trim() || !slug) {
      toast.error("חסרים שדות", { description: "נא למלא שם ולבחור קטגוריה" });
      return;
    }
    try {
      await doSaveProduct({
        data: {
          ...creds,
          product: {
            name: form.name.trim(),
            subtitle: form.subtitle.trim(),
            category_slug: slug,
            price: Number(form.price) || 0,
            discount_percent: Math.min(
              95,
              Math.max(0, Number(form.discount_percent) || 0),
            ),
            image: form.imageFile || form.imageUrl.trim() || "hero-bottle",
            abv: form.abv.trim(),
            note: form.note.trim(),
            in_stock: form.in_stock,
            sort: 1,
          },
        },
      });
      setForm({ ...emptyForm });
      if (fileRef.current) fileRef.current.value = "";
      setShowForm(false);
      refresh();
      toast.success("המוצר נוסף");
    } catch {
      toast.error("ההוספה נכשלה");
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const label = catLabel.trim();
    if (!label) return;
    const slug = `cat-${Date.now().toString(36)}`;
    try {
      await doSaveCategory({ data: { ...creds, slug, label } });
      setCatLabel("");
      refresh();
      toast.success("הקטגוריה נוספה", { description: label });
    } catch {
      toast.error("ההוספה נכשלה");
    }
  }

  async function removeCategory(slug: string) {
    try {
      await doDeleteCategory({ data: { ...creds, slug } });
      refresh();
      toast.success("הקטגוריה נמחקה");
    } catch {
      toast.error("לא ניתן למחוק", {
        description: "יש מוצרים שמשויכים לקטגוריה הזו",
      });
    }
  }

  const active = rows.filter((r) => r.in_stock).length;
  const avg = rows.length
    ? Math.round(rows.reduce((s, r) => s + Number(r.price), 0) / rows.length)
    : 0;

  return (
    <div dir="rtl" className="min-h-screen bg-background px-5 py-8 text-foreground lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-[0.14em]">
              KYMRUN · ניהול
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              השינויים נשמרים במסד הנתונים ומופיעים באתר לכולם.
            </p>
          </div>
          <ThemeToggle />
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
              <div className="mt-1 font-display text-xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card p-4">
          <h2 className="font-display text-lg font-bold">קטגוריות</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {cats.map((c) => (
              <span
                key={c.slug}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm"
              >
                {c.label}
                <button
                  onClick={() => removeCategory(c.slug)}
                  aria-label={`מחק ${c.label}`}
                  className="text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
          <form onSubmit={addCategory} className="mt-4 flex gap-2">
            <input
              value={catLabel}
              onChange={(e) => setCatLabel(e.target.value)}
              placeholder="שם קטגוריה חדשה (למשל: בירה)"
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              הוסף
            </button>
          </form>
        </section>

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
              <Field label="שם מוצר">
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="למשל: KYMRUN — רוזה ריזרב"
                  className={inputCls}
                />
              </Field>
              <Field label="תיאור קצר">
                <input
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subtitle: e.target.value }))
                  }
                  placeholder="למשל: יין אדום · ישראל"
                  className={inputCls}
                />
              </Field>
              <Field label="קטגוריה">
                <select
                  value={form.category_slug || cats[0]?.slug || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category_slug: e.target.value }))
                  }
                  className={inputCls}
                >
                  {cats.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="מחיר (₪)">
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="0"
                  className={inputCls}
                />
              </Field>
              <Field label="הנחה (%)">
                <input
                  type="number"
                  value={form.discount_percent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, discount_percent: e.target.value }))
                  }
                  className={inputCls}
                />
              </Field>
              <Field label="אחוז אלכוהול">
                <input
                  value={form.abv}
                  onChange={(e) => setForm((f) => ({ ...f, abv: e.target.value }))}
                  placeholder="40%"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="mt-4">
              <label className="block text-xs text-muted-foreground">תיאור</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                rows={2}
                className={inputCls}
              />
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
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80">
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
                  src={form.imageFile || form.imageUrl}
                  alt="תצוגה מקדימה"
                  className="mt-3 h-24 w-24 rounded-xl object-cover"
                />
              )}
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={form.in_stock}
                onChange={(e) =>
                  setForm((f) => ({ ...f, in_stock: e.target.checked }))
                }
                className="size-4 accent-primary"
              />
              במלאי
            </label>

            <button
              type="submit"
              className="mt-4 w-full rounded-2xl bg-primary py-3 text-base font-semibold text-primary-foreground active:scale-[0.98] md:w-auto md:px-8"
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
          {rows.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 rounded-2xl border border-border bg-card p-3"
            >
              <img
                src={resolveImage(p.image)}
                alt={p.name}
                className="size-16 shrink-0 rounded-xl object-cover"
                loading="lazy"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {p.subtitle} · {p.abv}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    מחיר
                    <input
                      type="number"
                      defaultValue={Number(p.price)}
                      onBlur={(e) =>
                        patch(p, { price: Number(e.target.value) || 0 })
                      }
                      className="w-24 rounded-lg border border-input bg-background px-2 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    הנחה %
                    <input
                      type="number"
                      defaultValue={p.discount_percent}
                      onBlur={(e) =>
                        patch(p, {
                          discount_percent: Math.min(
                            95,
                            Math.max(0, Number(e.target.value) || 0),
                          ),
                        })
                      }
                      className="w-20 rounded-lg border border-input bg-background px-2 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                  </label>
                  <select
                    value={p.category_slug}
                    onChange={(e) => patch(p, { category_slug: e.target.value })}
                    className="rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
                  >
                    {cats.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => patch(p, { in_stock: !p.in_stock })}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      p.in_stock
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {p.in_stock ? "במלאי" : "אזל"}
                  </button>
                  <button
                    onClick={() => patch(p, { featured: !p.featured })}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      p.featured
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {p.featured ? "מקודם" : "רגיל"}
                  </button>
                  <button
                    onClick={() => removeProduct(p.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/20"
                  >
                    <Trash2 className="size-3" />
                    מחק
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

const inputCls =
  "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
