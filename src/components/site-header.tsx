import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";

import { BrandLockup } from "@/components/brand-lockup";
import { ThemeToggle } from "@/components/theme-toggle";
import { WhatsappButton } from "@/components/whatsapp-button";

/** Thin service strip above the header — the promises customers ask about most. */
export function AnnouncementBar() {
  return (
    <div className="border-b border-border bg-background text-[11px] tracking-wide text-muted-foreground">
      <div className="mx-auto flex h-8 max-w-6xl items-center justify-center gap-3 px-5 md:px-8">
        <span>כל המשקאות כשרים</span>
        <span aria-hidden className="size-1 rounded-full bg-gold/70" />
        <span>משלוח חינם מעל ₪550</span>
        <span aria-hidden className="hidden size-1 rounded-full bg-gold/70 sm:block" />
        <span className="hidden sm:inline">אקספרס עד 4 שעות</span>
      </div>
    </div>
  );
}

export const headerIconClass =
  "relative grid size-10 shrink-0 place-items-center rounded-full border border-border text-foreground transition-colors hover:border-gold/60 hover:text-gold active:scale-95";

export function SiteHeader({
  count,
  onCart,
  nav,
  leading,
}: {
  count: number;
  /** When omitted the cart icon links straight to /cart. */
  onCart?: () => void;
  /** Desktop navigation, rendered next to the logo. */
  nav?: ReactNode;
  /** Optional element before the logo (e.g. a back arrow on inner pages). */
  leading?: ReactNode;
}) {
  const badge = count > 0 && (
    <span className="absolute -top-1 -left-1 grid min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold leading-5 text-background">
      {count}
    </span>
  );

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      <AnnouncementBar />
      <div className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:h-[4.5rem] md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {leading}
            <Link to="/" aria-label="KYMRUN — דף הבית" className="shrink-0">
              <BrandLockup compact />
            </Link>
            {nav && <nav className="ms-10 hidden items-center gap-7 lg:flex">{nav}</nav>}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <WhatsappButton />
            {onCart ? (
              <button onClick={onCart} aria-label="עגלת קניות" className={headerIconClass}>
                <ShoppingBag className="size-[18px]" />
                {badge}
              </button>
            ) : (
              <Link to="/cart" aria-label="עגלת קניות" className={headerIconClass}>
                <ShoppingBag className="size-[18px]" />
                {badge}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/** Text link styled for the header nav: quiet until hovered or active, then a gold underline. */
export function navLinkClass(active = false) {
  return `relative py-2 text-[13px] font-medium tracking-wide transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-center after:bg-gold after:transition-transform ${
    active
      ? "text-foreground after:scale-x-100"
      : "text-muted-foreground after:scale-x-0 hover:text-foreground hover:after:scale-x-100"
  }`;
}
