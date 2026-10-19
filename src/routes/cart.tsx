import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Crown,
  Loader2,
  Lock,
  Gift,
  ShieldCheck,
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
import { useCartStore, useCartSync } from "@/lib/use-shopify-cart";
import { SiteHeader } from "@/components/site-header";
import { QuantityStepper } from "@/components/quantity-stepper";
import { Button } from "@/components/ui/button";
import { lookupCustomer, saveCustomer } from "@/lib/customers.functions";
import { toast } from "sonner";
import { createOrder } from "@/lib/store.functions";
import { ProductImage } from "@/components/product-image";
import { SECRET_ROOM_ENABLED, useSecretGift } from "@/lib/use-secret-gift";
import { GOLD_ENABLED, goldDiscountForItems, useGold } from "@/lib/gold";
import { FREE_SHIPPING_FROM, availableSpeeds, deliverySpeeds, shippingPrice } from "@/lib/delivery";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "הסל שלך | KYMRUN" },
      {
        name: "description",
        content: "עגלת הקניות של KYMRUN. יין, וויסקי וספיריטים פרימיום כשרים.",
      },
      {
        property: "og:title",
        content: "הסל שלך | KYMRUN",
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

function CartPage() {
  const { gift } = useSecretGift();
  const { active: goldActive, member: goldMember } = useGold();
  useCartSync();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const isLoading = useCartStore((s) => s.isLoading);
  const [mounted, setMounted] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.quantity * parseFloat(i.price.amount), 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [lookup, setLookup] = useState<"idle" | "loading" | "found" | "new">("idle");
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
  const goldDiscount = goldActive ? goldDiscountForItems(items) : 0;
  // Same rules the server uses; the server recomputes the real price when the order is created.
  const available = availableSpeeds(address);
  const method = available.find((s) => s.id === shippingMethod) ?? available[available.length - 1]!;
  const shipping = goldActive ? 0 : shippingPrice(method.id, subtotal);
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
      const res = await createOrder({
        data: {
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          shipping_method: method.id,
          items: items.map((i) => ({ id: i.variantId, qty: i.quantity })),
        },
      });
      if (res.paymentUrl) {
        // The cart is kept until the payment succeeds, so a failed payment can be retried.
        window.location.href = res.paymentUrl;
        return;
      }
      clearCart();
      setOrderPlaced(true);
    } catch {
      toast.error("לא הצלחנו לשלוח את ההזמנה, נסו שוב או התקשרו 050-4001575");
    } finally {
      setSubmitting(false);
    }
  }

  // Avoid hydration mismatch with localStorage; render safe placeholders until mounted.
  if (!mounted) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground">
        <SiteHeader count={0} />
        <main className="mx-auto max-w-6xl px-5 py-10 md:px-8">
          <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        </main>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader count={count} />

      <main className="mx-auto max-w-6xl px-5 pt-8 pb-32 md:px-8 md:pt-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-gold"
        >
          <ArrowRight className="size-3.5" />
          המשך בקניות
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">הזמנה</span>
            <h1 className="mt-2 font-display text-4xl font-medium md:text-5xl">הסל שלך</h1>
          </div>
          {items.length > 0 && (
            <ol className="flex items-center gap-3 text-xs text-muted-foreground">
              {["סל", "פרטים", "תשלום"].map((step, i) => (
                <li key={step} className="flex items-center gap-3">
                  {i > 0 && <span aria-hidden className="h-px w-6 bg-border" />}
                  <span className={`flex items-center gap-1.5 ${i < 2 ? "text-foreground" : ""}`}>
                    <span
                      className={`grid size-5 place-items-center rounded-full border font-display text-[11px] ${
                        i < 2 ? "border-gold text-gold" : "border-border"
                      }`}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="gold-rule mt-6" />

        {items.length === 0 ? (
          <div className="surface-glow mx-auto mt-12 flex max-w-lg flex-col items-center rounded-lg border border-border bg-card px-6 py-14 text-center">
            <div className="grid size-16 place-items-center rounded-full border border-gold/40">
              <ShoppingBag className="size-6 text-gold" strokeWidth={1.5} />
            </div>
            <h2 className="mt-5 font-display text-2xl font-medium">הסל שלך ריק</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              בחרו יין, וויסקי או מארז מתנה ונתחיל.
            </p>
            <Button asChild className="mt-8 h-12 px-8 text-[15px]">
              <Link to="/">לחנות</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-14">
            <div className="min-w-0">
              <section aria-label="פריטים בסל">
                <ul className="divide-y divide-border border-y border-border">
                  {items.map((line) => {
                    const img = line.product.node.images.edges[0]?.node.url ?? "";
                    const unit = parseFloat(line.price.amount);
                    return (
                      <li key={line.variantId} className="flex gap-4 py-5 md:gap-6">
                        {img ? (
                          <ProductImage
                            src={img}
                            alt={line.product.node.title}
                            width={768}
                            height={960}
                            loading="lazy"
                            containerClassName="h-28 w-[5.5rem] shrink-0 rounded-md ring-1 ring-border md:h-32 md:w-24"
                            className="p-2"
                          />
                        ) : (
                          <div className="grid h-28 w-[5.5rem] shrink-0 place-items-center rounded-md bg-muted md:h-32 md:w-24">
                            <ShoppingBag className="size-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[11px] tracking-wide text-gold/90">
                                {line.product.node.productType}
                              </p>
                              <p className="mt-1 line-clamp-2 font-display text-base font-medium leading-snug md:text-lg">
                                {line.product.node.title}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                ₪{fmt(unit)} ליחידה
                              </p>
                            </div>
                            <p className="shrink-0 font-display text-lg">
                              ₪{fmt(unit * line.quantity)}
                            </p>
                          </div>
                          <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                            <QuantityStepper
                              size="sm"
                              value={line.quantity}
                              onChange={(q) => updateQuantity(line.variantId, q)}
                            />
                            <button
                              onClick={() => removeItem(line.variantId)}
                              aria-label={`הסר ${line.product.node.title} מהסל`}
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                              הסרה
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <button
                  onClick={clearCart}
                  className="mt-3 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  רוקן את הסל
                </button>
              </section>

              <section className="mt-10 rounded-lg border border-border bg-card p-5 md:p-7">
                <span className="eyebrow">שלב 2</span>
                <h2 className="mt-1.5 font-display text-2xl font-medium">פרטי המשלוח</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  נתחיל באימייל. אם כבר הזמנת אצלנו, נמלא את השאר עבורך.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label htmlFor="email" className={labelClass}>
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
                        className={`${fieldClass} text-right`}
                      />
                      {lookup === "loading" && (
                        <Loader2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {lookup === "found" && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-gold">
                        <UserCheck className="size-3.5" />
                        טוב לראות אותך שוב, מילאנו את הפרטים שלך
                      </p>
                    )}
                    {lookup === "new" && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        לקוח חדש? נשמח להכיר, מלא את הפרטים למטה
                      </p>
                    )}
                    {email.length > 0 && !emailValid && (
                      <p className="mt-1.5 text-xs text-destructive">כתובת אימייל לא תקינה</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="fullName" className={labelClass}>
                      שם מלא
                    </label>
                    <input
                      id="fullName"
                      autoComplete="name"
                      maxLength={100}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="ישראל ישראלי"
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className={labelClass}>
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
                      className={`${fieldClass} text-right`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="address" className={labelClass}>
                      כתובת למשלוח
                    </label>
                    <input
                      id="address"
                      autoComplete="street-address"
                      maxLength={255}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="רחוב, מספר, עיר"
                      className={fieldClass}
                    />
                  </div>
                </div>

                <fieldset className="mt-7">
                  <legend className={labelClass}>סוג משלוח</legend>
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {deliverySpeeds.map((s) => {
                      const enabled = available.some((a) => a.id === s.id);
                      const selected = enabled && method.id === s.id;
                      const price = shippingPrice(s.id, subtotal);
                      return (
                        <label
                          key={s.id}
                          className={`relative flex cursor-pointer flex-col rounded-md border p-4 transition-colors ${
                            selected
                              ? "border-gold bg-gold/10"
                              : "border-input hover:border-gold/50"
                          } ${enabled ? "" : "pointer-events-none opacity-40"}`}
                        >
                          <input
                            type="radio"
                            name="shipping_method"
                            value={s.id}
                            checked={selected}
                            disabled={!enabled}
                            onChange={() => setShippingMethod(s.id)}
                            className="sr-only"
                          />
                          <span className="font-display text-base font-medium">{s.label}</span>
                          <span className="mt-0.5 text-xs text-muted-foreground">{s.window}</span>
                          <span className="mt-2 text-sm font-semibold">
                            {price === 0 ? "חינם" : `₪${price}`}
                          </span>
                          {!enabled && (
                            <span className="mt-1 text-[11px] text-muted-foreground">
                              לא זמין לכתובת הזו
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">{method.note}</p>
                </fieldset>
              </section>
            </div>

            <aside className="lg:sticky lg:top-32">
              <section className="surface-glow rounded-lg border border-gold/25 bg-card p-6 md:p-7">
                <h2 className="font-display text-2xl font-medium">סיכום הזמנה</h2>

                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">סכום ביניים · {count} פריטים</dt>
                    <dd className="font-display">₪{fmt(subtotal)}</dd>
                  </div>
                  {goldDiscount > 0 && (
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">הנחת GOLD (15%)</dt>
                      <dd className="font-display text-gold">−₪{fmt(goldDiscount)}</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">משלוח · {method.label}</dt>
                    <dd className="font-display">{shipping > 0 ? `₪${shipping}` : "חינם"}</dd>
                  </div>
                </dl>
                <div className="gold-rule my-5" />
                <div className="flex items-baseline justify-between">
                  <span className="whitespace-nowrap text-sm font-medium">סה״כ לתשלום</span>
                  <span className="font-display text-3xl">₪{fmt(total)}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">המחירים כוללים מע״מ</p>

                {goldActive ? (
                  <div className="mt-5 flex items-start gap-3 rounded-md border border-gold/35 bg-gold/10 p-4">
                    <Crown className="mt-0.5 size-4 shrink-0 text-gold" />
                    <p className="text-xs leading-relaxed">
                      חברות KYMRUN GOLD פעילה
                      {goldMember?.name ? ` · ${goldMember.name}` : ""}: משלוח חינם ו־15% על משקאות
                      ייחודיים.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 rounded-md border border-border bg-background/50 p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Truck className="size-4 text-gold" strokeWidth={1.5} />
                      {remaining > 0 ? (
                        <span>עוד ₪{fmt(remaining)} למשלוח רגיל חינם</span>
                      ) : (
                        <span>משלוח רגיל (עד 48 שעות) חינם בהזמנה הזו</span>
                      )}
                    </div>
                    <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gold transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {GOLD_ENABLED && (
                      <Link
                        to="/gold"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
                      >
                        <Crown className="size-3.5" />
                        חברי GOLD לא משלמים על משלוח. להצטרפות
                      </Link>
                    )}
                  </div>
                )}

                {SECRET_ROOM_ENABLED && gift && (
                  <div className="mt-4 flex items-start gap-3 rounded-md border border-gold/35 bg-gold/10 p-4">
                    <Gift className="mt-0.5 size-4 shrink-0 text-gold" />
                    <p className="text-xs leading-relaxed">
                      זכית במתנה בחדר הסודי! קוד{" "}
                      <span className="font-mono font-bold">{gift.code}</span>. המתנה תצורף להזמנה
                      הזו.
                    </p>
                  </div>
                )}

                <Button
                  onClick={placeOrder}
                  disabled={!ready}
                  className="mt-6 h-[3.25rem] w-full text-base"
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Lock className="size-4" />
                  )}
                  לתשלום מאובטח · ₪{fmt(total)}
                </Button>
                {!detailsValid && (
                  <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
                    מלאו את פרטי המשלוח כדי להמשיך
                  </p>
                )}

                <ul className="mt-5 space-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="size-3.5 text-gold" />
                    תשלום מאובטח בדף סליקה מוצפן
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="size-3.5 text-gold" />
                    מכירה לגיל 18 ומעלה · אימות גיל במסירה
                  </li>
                </ul>
              </section>
            </aside>
          </div>
        )}
      </main>

      <Dialog open={orderPlaced} onOpenChange={setOrderPlaced}>
        <DialogContent dir="rtl" className="max-w-sm rounded-lg text-right">
          <DialogHeader className="items-center text-center">
            <div className="mb-2 grid size-14 place-items-center rounded-full border border-gold/50 text-gold">
              <Check className="size-6" />
            </div>
            <DialogTitle className="font-display text-2xl font-medium">ההזמנה התקבלה</DialogTitle>
            <DialogDescription>נחזור אליך בטלפון לתיאום התשלום והמשלוח.</DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => {
              setOrderPlaced(false);
              clearCart();
            }}
            className="mt-2 h-12 w-full text-base"
          >
            מעולה
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const labelClass = "mb-1.5 block text-xs font-medium text-muted-foreground";
const fieldClass =
  "h-12 w-full rounded-md border border-input bg-background/60 px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/70 focus:ring-1 focus:ring-gold/30";

/** Display-only: cart math is float, so round for humans (server recomputes totals). */
const fmt = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 2 });
