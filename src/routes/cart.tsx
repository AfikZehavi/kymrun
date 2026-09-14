import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Loader2,
  Minus,
  Plus,
  Gift,
  ShoppingBag,
  Trash2,
  Truck,
  UserCheck,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCart } from "@/lib/use-cart";
import { ThemeToggle } from "@/components/theme-toggle";
import { lookupCustomer, saveCustomer } from "@/lib/customers.functions";
import { useSecretGift } from "@/lib/use-secret-gift";
import { goldDiscountFor, useGold } from "@/lib/gold";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "הסל שלך — KYMRUN" },
      {
        name: "description",
        content: "עגלת הקניות של KYMRUN. יין, וויסקי וספיריטים פרימיום כשרים.",
      },
      {
        property: "og:title",
        content: "הסל שלך — KYMRUN",
      },
      {
        property: "og:description",
        content: "עגלת הקניות של KYMRUN. יין, וויסקי וספיריטים פרימיום כשרים.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

const FREE_SHIPPING_FROM = 550;

function CartPage() {
  const { gift } = useSecretGift();
  const { active: goldActive, member: goldMember } = useGold();
  const { cart, changeQty, remove, clear, count, subtotal, hydrated } =
    useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [lookup, setLookup] = useState<"idle" | "loading" | "found" | "new">(
    "idle",
  );
  const [submitting, setSubmitting] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const detailsValid =
    emailValid &&
    fullName.trim().length >= 2 &&
    phone.trim().length >= 6 &&
    address.trim().length >= 4;

  async function checkEmail() {
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setLookup("idle");
      return;
    }
    setLookup("loading");
    try {
      const res = await lookupCustomer({ data: { email: value } });
      if (res.exists && res.customer) {
        setFullName(res.customer.full_name);
        setPhone(res.customer.phone);
        setAddress(res.customer.address);
        setLookup("found");
      } else {
        setLookup("new");
      }
    } catch {
      setLookup("idle");
    }
  }

  const remaining = Math.max(FREE_SHIPPING_FROM - subtotal, 0);
  const progress = Math.min((subtotal / FREE_SHIPPING_FROM) * 100, 100);
  const goldDiscount = goldActive ? goldDiscountFor(cart) : 0;
  const shipping = goldActive ? 0 : remaining > 0 ? 35 : 0;
  const total = Math.max(subtotal - goldDiscount + shipping, 0);

  const ready = subtotal > 0 && detailsValid && !submitting;

  async function placeOrder() {
    if (!ready) return;
    setSubmitting(true);
    try {
      await saveCustomer({
        data: {
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
        },
      });
      setOrderPlaced(true);
    } catch {
      setOrderPlaced(true);
    } finally {
      setSubmitting(false);
    }
  }

  // Avoid hydration mismatch with localStorage; render safe placeholders until hydrated.
  if (!hydrated) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground">
        <CartHeader />
        <main className="mx-auto max-w-md px-5 py-8 md:max-w-2xl lg:max-w-4xl">
          <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        </main>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <CartHeader />

      <main className="mx-auto max-w-md px-5 py-6 pb-32 md:max-w-2xl md:py-10 lg:max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowRight className="size-4" />
            חזרה לחנות
          </Link>
        </div>

        <h1 className="font-display text-2xl font-bold md:text-3xl">
          הסל שלך
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count === 0 ? "הסל ריק — הוסיפו בקבוק מהמדף" : `${count} פריטים בסל`}
        </p>

        {cart.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-3xl border border-border bg-card p-10 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-muted">
              <ShoppingBag className="size-7 text-muted-foreground" />
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold">
              הסל שלך ריק
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              בחרו יין, וויסקי או מארז מתנה ונתחיל.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.98]"
            >
              המשך לחנות
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
            <section className="space-y-3">
              {cart.map((line) => (
                <article
                  key={line.product.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                >
                  <img
                    src={line.product.image}
                    alt={line.product.name}
                    width={768}
                    height={960}
                    loading="lazy"
                    className="size-20 rounded-xl object-cover md:size-24"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold md:text-base">
                      {line.product.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {line.product.category} · {line.product.abv}
                    </p>
                    <p className="mt-2 font-display text-base font-bold md:text-lg">
                      ₪{line.product.price * line.qty}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        aria-label="הפחת"
                        onClick={() => changeQty(line.product.id, -1)}
                        className="grid size-8 place-items-center rounded-full border border-border bg-secondary transition-colors hover:bg-primary/10"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">
                        {line.qty}
                      </span>
                      <button
                        aria-label="הוסף"
                        onClick={() => changeQty(line.product.id, 1)}
                        className="grid size-8 place-items-center rounded-full border border-border bg-secondary transition-colors hover:bg-primary/10"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => remove(line.product.id)}
                      aria-label={`הסר ${line.product.name} מהסל`}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                      הסר
                    </button>
                  </div>
                </article>
              ))}

              <button
                onClick={clear}
                className="mt-2 text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                רוקן את הסל
              </button>
              <div className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h2 className="font-display text-lg font-semibold">
                  פרטי המשלוח
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  נתחיל באימייל — אם כבר הזמנת אצלנו, נמלא את השאר עבורך.
                </p>

                <div className="mt-4 space-y-3">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-xs font-medium text-muted-foreground"
                    >
                      אימייל
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        dir="ltr"
                        maxLength={255}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setLookup("idle");
                        }}
                        onBlur={checkEmail}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-right text-sm outline-none transition-colors focus:border-primary"
                      />
                      {lookup === "loading" && (
                        <Loader2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {lookup === "found" && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-primary">
                        <UserCheck className="size-3.5" />
                        טוב לראות אותך שוב — מילאנו את הפרטים שלך
                      </p>
                    )}
                    {lookup === "new" && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        לקוח חדש — נשמח להכיר, מלא את הפרטים למטה
                      </p>
                    )}
                    {email.length > 0 && !emailValid && (
                      <p className="mt-1.5 text-xs text-destructive">
                        כתובת אימייל לא תקינה
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-1.5 block text-xs font-medium text-muted-foreground"
                    >
                      שם מלא
                    </label>
                    <input
                      id="fullName"
                      autoComplete="name"
                      maxLength={100}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="ישראל ישראלי"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1.5 block text-xs font-medium text-muted-foreground"
                    >
                      טלפון
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      dir="ltr"
                      maxLength={30}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="050-0000000"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-right text-sm outline-none transition-colors focus:border-primary"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="address"
                      className="mb-1.5 block text-xs font-medium text-muted-foreground"
                    >
                      כתובת למשלוח
                    </label>
                    <input
                      id="address"
                      autoComplete="street-address"
                      maxLength={255}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="רחוב, מספר, עיר"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="font-display text-lg font-semibold">
                סיכום הזמנה
              </h2>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">סכום ביניים</span>
                  <span className="font-display font-semibold">₪{subtotal}</span>
                </div>
                {goldDiscount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      הנחת GOLD (15%)
                    </span>
                    <span className="font-display font-semibold text-amber-500 dark:text-amber-300">
                      −₪{goldDiscount}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">משלוח</span>
                  <span className="font-display font-semibold">
                    {shipping > 0 ? `₪${shipping}` : "חינם"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-base font-bold">
                  <span>סה"כ לתשלום</span>
                  <span className="font-display">₪{total}</span>
                </div>
              </div>

              {goldActive ? (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-400/35 bg-amber-400/10 p-4">
                  <Crown className="mt-0.5 size-4 shrink-0 text-amber-500 dark:text-amber-300" />
                  <p className="text-xs leading-relaxed">
                    חברות KYMRUN GOLD פעילה
                    {goldMember?.name ? ` · ${goldMember.name}` : ""} — משלוח
                    חינם ו-15% על משקאות ייחודיים.
                  </p>
                </div>
              ) : (
                <div className="mt-5 rounded-xl bg-muted/60 p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Truck className="size-4" />
                    {remaining > 0 ? (
                      <span>עוד ₪{remaining} למשלוח חינם</span>
                    ) : (
                      <span>משלוח חינם — מגיע אליך</span>
                    )}
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {GOLD_ENABLED && (
                    <Link
                      to="/gold"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:underline dark:text-amber-300"
                    >
                      <Crown className="size-3.5" />
                      חברי GOLD לא משלמים על משלוח — להצטרפות
                    </Link>
                  )}
                </div>
              )}

              {gift && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/35 bg-primary/10 p-4">
                  <Gift className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-xs leading-relaxed">
                    זכית במתנה בחדר הסודי — קוד{" "}
                    <span className="font-mono font-bold">{gift.code}</span>.
                    המתנה תצורף להזמנה הזו.
                  </p>
                </div>
              )}

              <button
                onClick={placeOrder}
                disabled={!ready}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                לתשלום · ₪{subtotal + (remaining > 0 ? 35 : 0)}
              </button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                מכירה לגיל 18 ומעלה · אימות גיל במסירה
              </p>
            </section>
          </div>
        )}
      </main>

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
              clear();
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

function CartHeader() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-white dark:bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between gap-4 px-5 md:h-[4.5rem] md:max-w-2xl md:px-8 lg:max-w-4xl">
        <Link to="/" className="min-w-0 leading-none">
          <span className="font-display text-lg font-bold tracking-[0.18em]">
            KYMRUN
          </span>
          <span className="block text-[10px] tracking-widest text-muted-foreground">
            משקאות פרימיום · כשר
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/cart"
            aria-label="עגלת קניות"
            className="relative grid size-11 shrink-0 place-items-center rounded-full border border-border bg-muted text-foreground transition-transform active:scale-95 dark:bg-card"
          >
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -top-1 -left-1 grid size-5 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
