import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload, Pencil } from "lucide-react";

import {
  getAdminCatalog,
  checkAdmin,
  saveProduct,
  deleteProduct,
  saveCategory,
  deleteCategory,
  type DbProduct,
  type ProductInput,
} from "@/lib/catalog.functions";
import { resolveImage } from "@/lib/images";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Pagination } from "@/components/pagination";

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
  const check = useServerFn(checkAdmin);

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
            await check({ data: candidate });
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
          <h1 className="font-display text-2xl font-bold tracking-[0.18em]">KYMRUN</h1>
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
        {error && <p className="text-sm text-destructive">שם משתמש או סיסמה שגויים</p>}
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
  english_name: "",
  volume_ml: "",
  country: "",
  producer: "",
  grape_variety: "",
  kosher_passover: false,
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
  const fetchCatalog = useServerFn(getAdminCatalog);
  const doSaveProduct = useServerFn(saveProduct);
  const doDeleteProduct = useServerFn(deleteProduct);
  const doSaveCategory = useServerFn(saveCategory);
  const doDeleteCategory = useServerFn(deleteCategory);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin-catalog"],
    queryFn: () => fetchCatalog({ data: creds }),
    retry: 2,
  });

  const products = useMemo(() => data?.products ?? [], [data]);
  const cats = useMemo(() => data?.categories ?? [], [data]);

  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [catLabel, setCatLabel] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["admin-catalog"] });
    qc.invalidateQueries({ queryKey: ["store-catalog"] });
    qc.invalidateQueries({ queryKey: ["store-product"] });
  }

  const rows = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.trim();
    return products.filter((p) => p.name.includes(q) || p.subtitle.includes(q));
  }, [products, query]);

  const ADMIN_PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [query]);
  const pageCount = Math.max(1, Math.ceil(rows.length / ADMIN_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * ADMIN_PAGE_SIZE, currentPage * ADMIN_PAGE_SIZE);
  function goToPage(n: number) {
    setPage(n);
    document.getElementById("admin-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function patch(p: DbProduct, next: ProductInput) {
    const t = toast.loading("שומר...");
    try {
      await doSaveProduct({
        data: { ...creds, product: { id: p.id, ...next } },
      });
      refresh();
      toast.success("נשמר ומופיע באתר", { id: t });
    } catch {
      toast.error("השמירה נכשלה", { id: t });
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
    if (file.size > 1024 * 1024 * 4) {
      toast.error("התמונה גדולה מדי", { description: "נא לבחור קובץ עד 4MB" });
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
    const t = toast.loading("מוסיף לחנות...");
    try {
      await doSaveProduct({
        data: {
          ...creds,
          product: {
            ...(editingId ? { id: editingId } : {}),
            english_name: form.english_name.trim(),
            volume_ml: Math.max(0, Math.floor(Number(form.volume_ml) || 0)),
            country: form.country.trim(),
            producer: form.producer.trim(),
            grape_variety: form.grape_variety.trim(),
            kosher_passover: form.kosher_passover,
            name: form.name.trim(),
            subtitle: form.subtitle.trim(),
            category_slug: slug,
            price: Number(form.price) || 0,
            discount_percent: Math.min(95, Math.max(0, Number(form.discount_percent) || 0)),
            imageData: form.imageFile || form.imageUrl.trim() || undefined,
            abv: form.abv.trim(),
            note: form.note.trim(),
            in_stock: form.in_stock,
            ...(!editingId ? { sort: 1 } : {}),
          },
        },
      });
      setEditingId(null);
      setForm({ ...emptyForm });
      if (fileRef.current) fileRef.current.value = "";
      setShowForm(false);
      refresh();
      toast.success(editingId ? "פרטי הבקבוק נשמרו" : "המוצר נוסף לחנות", { id: t });
    } catch {
      toast.error("ההוספה נכשלה", { id: t });
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
            <h1 className="font-display text-2xl font-bold tracking-[0.14em]">KYMRUN · ניהול</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              כל שינוי נשמר ישירות בחנות ומופיע באתר תוך דקה.
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
            <div key={s.label} className="rounded-2xl border border-border bg-card px-4 py-3">
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
          onClick={() => {
            setEditingId(null);
            setForm({ ...emptyForm });
            setShowForm((v) => !v);
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          <Plus className="size-5" />
          {showForm ? "סגור טופס" : "הוסף מוצר"}
        </button>

        {showForm && (
          <form
            onSubmit={addProduct}
            id="bottle-form"
            className="mt-4 rounded-2xl border border-border bg-card p-4"
          >
            <h2 className="mb-4 font-display text-lg font-bold">
              {editingId ? "עריכת פרטי בקבוק" : "בקבוק חדש"}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="שם מוצר">
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="למשל: KYMRUN רוזה ריזרב"
                  className={inputCls}
                />
              </Field>
              <Field label="תיאור קצר">
                <input
                  value={form.subtitle}
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                  placeholder="למשל: יין אדום · ישראל"
                  className={inputCls}
                />
              </Field>
              {(
                [
                  ["english_name", "שם באנגלית"],
                  ["country", "ארץ ייצור"],
                  ["producer", "יצרן / יקב"],
                  ["grape_variety", "זן ענבים"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    aria-label={label}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
              ))}
              <Field label="נפח (מ״ל)">
                <input
                  aria-label="נפח (מ״ל)"
                  type="number"
                  min="0"
                  step="1"
                  value={form.volume_ml}
                  onChange={(e) => setForm((f) => ({ ...f, volume_ml: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="כשרות">
                <p className="mt-2 text-sm">כשר</p>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.kosher_passover}
                    onChange={(e) => setForm((f) => ({ ...f, kosher_passover: e.target.checked }))}
                  />
                  כשר לפסח
                </label>
              </Field>
              <Field label="קטגוריה">
                <select
                  value={form.category_slug || cats[0]?.slug || ""}
                  onChange={(e) => setForm((f) => ({ ...f, category_slug: e.target.value }))}
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
                  onChange={(e) => setForm((f) => ({ ...f, discount_percent: e.target.value }))}
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
              <label htmlFor="bottle-note" className="block text-xs text-muted-foreground">
                תיאור הבקבוק (מופיע בעמוד המוצר)
              </label>
              <textarea
                id="bottle-note"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                rows={4}
                maxLength={600}
                placeholder="2 עד 3 משפטים: היקב והסדרה, הזן, הטעמים העיקריים ולמה הוא מתאים. למשל: קברנה סוביניון של יקב… יין מלא עם פרי שחור ותבלינים. מתאים לסטייק ולבשר על האש."
                className={inputCls}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">{form.note.length} / 600 תווים</p>
            </div>

            <div className="mt-4">
              <label className="block text-xs text-muted-foreground">תמונה: קישור או העלאה</label>
              <div className="mt-1 flex flex-col gap-3 md:flex-row md:items-start">
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
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
                onChange={(e) => setForm((f) => ({ ...f, in_stock: e.target.checked }))}
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

        {isPending && (
          <div
            role="status"
            className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" />
            טוען את המוצרים...
          </div>
        )}
        {isError && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-destructive/40 bg-card p-6 text-center text-sm"
          >
            <p>לא הצלחנו לטעון את המוצרים.</p>
            <Button className="mt-3" onClick={() => refetch()}>
              נסה שוב
            </Button>
          </div>
        )}

        <div id="admin-list" className="mt-4 scroll-mt-4 space-y-3">
          {pageRows.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 rounded-2xl border border-border bg-card p-3"
            >
              <label className="relative block cursor-pointer" title="החלפת תמונה">
                <img
                  src={resolveImage(p.image)}
                  alt={p.name}
                  className="size-16 shrink-0 rounded-xl object-cover"
                  loading="lazy"
                />
                <span className="absolute inset-x-0 bottom-0 flex justify-center rounded-b-xl bg-background/80 py-0.5">
                  <Upload className="size-3" />
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const r = new FileReader();
                    r.onload = () => patch(p, { imageData: String(r.result) });
                    r.readAsDataURL(file);
                  }}
                />
              </label>
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 text-sm font-semibold">
                    {p.name}
                    {!p.note?.trim() && (
                      <span className="ms-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                        אין תיאור
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`ערוך פרטי ${p.name}`}
                    title="ערוך פרטי בקבוק"
                    onClick={() => {
                      setEditingId(p.id);
                      setForm({
                        ...emptyForm,
                        name: p.name,
                        subtitle: p.subtitle,
                        category_slug: p.category_slug,
                        price: String(p.price),
                        discount_percent: String(p.discount_percent),
                        abv: p.abv,
                        note: p.note,
                        in_stock: p.in_stock,
                        english_name: p.english_name,
                        volume_ml: p.volume_ml ? String(p.volume_ml) : "",
                        country: p.country,
                        producer: p.producer,
                        grape_variety: p.grape_variety,
                        kosher_passover: p.kosher_passover,
                      });
                      setShowForm(true);
                      requestAnimationFrame(() =>
                        document
                          .getElementById("bottle-form")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                      );
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.subtitle}
                  {p.abv ? ` · ${p.abv}` : ""}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    מחיר
                    <input
                      type="number"
                      defaultValue={Number(p.price)}
                      onBlur={(e) => patch(p, { price: Number(e.target.value) || 0 })}
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
                          discount_percent: Math.min(95, Math.max(0, Number(e.target.value) || 0)),
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
        <Pagination page={currentPage} count={pageCount} onPage={goToPage} className="mt-6" />
      </div>
    </div>
  );
}

const inputCls =
  "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
