import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Crown, Check, Loader2, Truck, Percent, Sparkles } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { WhatsappButton } from "@/components/whatsapp-button";
import { SiteFooter } from "@/components/site-footer";
import { GOLD_ENABLED, GOLD_PRICE_YEAR, useGold } from "@/lib/gold";
import { submitInquiry } from "@/lib/inquiries.functions";

export const Route = createFileRoute("/gold")({
  head: () => ({
    meta: [
      { title: "KYMRUN GOLD — מועדון החברים" },
      {
        name: "description",
        content:
          "KYMRUN GOLD: משלוח חינם לתמיד ו-15% הנחה קבועה על משקאות ייחודיים. הצטרפות בכמה קליקים.",
      },
      { property: "og:title", content: "KYMRUN GOLD — מועדון החברים" },
      {
        property: "og:description",
        content:
          "משלוח חינם לתמיד ו-15% הנחה על משקאות ייחודיים במועדון KYMRUN GOLD.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GoldPage,
});

function GoldPage() {
  const { member, hydrated, join, leave } = useGold();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const ready =
    fullName.trim().length >= 2 && emailValid && phone.trim().length >= 6 && !submitting;

  async function handleJoin() {
    if (!ready) return;
    setSubmitting(true);
    try {
      await submitInquiry({
        data: {
          kind: "gold",
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          message: "בקשת הצטרפות ל-KYMRUN GOLD",
        },
      });
    } catch {
      /* keep the local membership even if the server call fails */
    }
    join({ name: fullName.trim(), email: email.trim().toLowerCase() });
    setSubmitting(false);
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-white backdrop-blur-md dark:bg-background/85">
        <div className="mx-auto flex h-16 max-w-md items-center justify-between gap-4 px-5 md:h-[4.5rem] md:max-w-2xl md:px-8 lg:max-w-5xl">
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
            <WhatsappButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 py-6 md:max-w-2xl md:py-10 lg:max-w-5xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowRight className="size-4" />
          חזרה לחנות
        </Link>

        {!GOLD_ENABLED ? (
          <p className="mt-10 text-sm text-muted-foreground">
            מועדון החברים אינו פעיל כרגע.
          </p>
        ) : (
          <>
            <div className="mt-6 overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-bl from-card via-card to-amber-400/10 p-6 lg:p-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 px-3 py-1 text-[11px] font-semibold tracking-wide text-amber-500 dark:text-amber-300">
                <Crown className="size-3.5" />
                KYMRUN GOLD
              </span>
              <h1 className="mt-4 font-display text-3xl font-bold leading-tight lg:text-5xl">
                מועדון החברים של הבית
              </h1>
              <p className="mt-3 max-w-[58ch] text-sm leading-relaxed text-muted-foreground lg:text-base">
                חברות שנתית ב-₪{GOLD_PRICE_YEAR}. משלוח חינם בכל הזמנה, בלי סכום
                מינימום, ו-15% הנחה קבועה על המשקאות הייחודיים במדף.
              </p>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                {
                  icon: Truck,
                  t: "משלוח חינם לתמיד",
                  d: "בכל הזמנה ובכל סכום, בכל אזורי השירות שלנו.",
                },
                {
                  icon: Percent,
                  t: "15% על משקאות ייחודיים",
                  d: "ההנחה מחושבת אוטומטית בסל, בלי קודים.",
                },
                {
                  icon: Sparkles,
                  t: "קדימות והטבות",
                  d: "גישה מוקדמת למהדורות מוגבלות והזמנות לטעימות.",
                },
              ].map((b) => (
                <div
                  key={b.t}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <b.icon className="size-5 text-amber-500 dark:text-amber-300" />
                  <p className="mt-3 font-display text-lg font-bold">{b.t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {b.d}
                  </p>
                </div>
              ))}
            </div>

            <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm lg:p-8">
              {hydrated && member ? (
                <div className="text-center">
                  <div className="mx-auto grid size-14 place-items-center rounded-full bg-amber-400/15 text-amber-500 dark:text-amber-300">
                    <Check className="size-7" />
                  </div>
                  <h2 className="mt-4 font-display text-xl font-bold">
                    החברות שלך פעילה, {member.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    ההטבות מופיעות אוטומטית בסל — משלוח חינם ו-15% על בקבוקים
                    ייחודיים.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      to="/"
                      className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                    >
                      למדף המשקאות
                    </Link>
                    <button
                      onClick={leave}
                      className="rounded-2xl border border-border px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      ביטול החברות
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-xl font-bold">
                    הצטרפות ל-GOLD
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    משאירים פרטים ואנחנו מפעילים את החברות. התשלום נגבה בהזמנה
                    הראשונה.
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <input
                      aria-label="שם מלא"
                      value={fullName}
                      maxLength={100}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="שם מלא"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                    />
                    <input
                      aria-label="אימייל"
                      type="email"
                      dir="ltr"
                      maxLength={255}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-right text-sm outline-none transition-colors focus:border-primary"
                    />
                    <input
                      aria-label="טלפון"
                      type="tel"
                      dir="ltr"
                      maxLength={30}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="050-0000000"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-right text-sm outline-none transition-colors focus:border-primary"
                    />
                  </div>

                  <button
                    onClick={handleJoin}
                    disabled={!ready}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50 md:w-auto md:px-10"
                  >
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    הצטרפות ל-GOLD · ₪{GOLD_PRICE_YEAR} לשנה
                  </button>
                  <p className="mt-3 text-xs text-muted-foreground">
                    ניתן לבטל בכל רגע. מכירה לגיל 18 ומעלה.
                  </p>
                </>
              )}
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
