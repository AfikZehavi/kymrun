import { Link } from "@tanstack/react-router";
import { Crown, Truck, Percent } from "lucide-react";

import { GOLD_ENABLED, useGold } from "@/lib/gold";

/**
 * Homepage teaser for KYMRUN GOLD.
 * Renders nothing when GOLD_ENABLED is false — one flag reverts the feature.
 */
export function GoldBand() {
  const { member, hydrated } = useGold();
  if (!GOLD_ENABLED) return null;

  return (
    <div className="overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-bl from-card via-card to-amber-400/10 p-6 lg:p-10">
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 px-3 py-1 text-[11px] font-semibold tracking-wide text-amber-500 dark:text-amber-300">
        <Crown className="size-3.5" />
        KYMRUN GOLD
      </span>

      <h2 className="mt-4 font-display text-2xl font-bold leading-tight lg:text-4xl">
        {hydrated && member
          ? "אתה חבר GOLD — ההטבות כבר פעילות"
          : "מועדון החברים של קמרון"}
      </h2>
      <p className="mt-3 max-w-[56ch] text-sm leading-relaxed text-muted-foreground lg:text-base">
        משלוח חינם לתמיד, בלי סכום מינימום, ו-15% הנחה קבועה על המשקאות
        הייחודיים במדף.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-background/60 p-4">
          <Truck className="mt-0.5 size-5 shrink-0 text-amber-500 dark:text-amber-300" />
          <div>
            <p className="text-sm font-semibold">משלוח חינם, תמיד</p>
            <p className="mt-1 text-xs text-muted-foreground">
              בכל הזמנה, בכל סכום, בכל אזור שירות
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-background/60 p-4">
          <Percent className="mt-0.5 size-5 shrink-0 text-amber-500 dark:text-amber-300" />
          <div>
            <p className="text-sm font-semibold">15% על משקאות ייחודיים</p>
            <p className="mt-1 text-xs text-muted-foreground">
              הנחה אוטומטית בסל על הבקבוקים הנבחרים
            </p>
          </div>
        </div>
      </div>

      <Link
        to="/gold"
        className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
      >
        {hydrated && member ? "לפרטי החברות" : "להצטרפות ל-GOLD"}
      </Link>
    </div>
  );
}
