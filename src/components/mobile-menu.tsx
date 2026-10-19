import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, GlassWater, Menu } from "lucide-react";

import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { legalLinks } from "@/lib/legal";
import { PHONE_DISPLAY, WHATSAPP_URL } from "@/lib/contact";

const links = [
  { to: "/", label: "החנות" },
  { to: "/shipping", label: "משלוחים ואזורי חלוקה" },
  { to: "/contact", label: "יצירת קשר" },
] as const;

/** Phone / tablet menu (the desktop nav is hidden below lg). Events get their own highlighted card. */
export function MobileMenu({ buttonClass }: { buttonClass: string }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" aria-label="תפריט" className={`${buttonClass} lg:hidden`}>
          <Menu className="size-[18px]" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" dir="rtl" className="w-[min(20rem,88vw)] overflow-y-auto p-0">
        <div className="p-6 pt-12">
          <SheetTitle className="font-display text-xl">תפריט</SheetTitle>
          <SheetDescription className="sr-only">ניווט באתר KYMRUN</SheetDescription>

          <Link
            to="/events"
            onClick={close}
            className="mt-5 flex items-center gap-3 rounded-lg border border-gold/50 bg-gold/10 p-4"
          >
            <GlassWater className="size-6 shrink-0 text-gold" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">אירועים וטעימות פרטיות</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                בר לאירוע, טעימת יין בבית ומתנות לעובדים
              </span>
            </span>
            <ChevronLeft className="size-4 shrink-0 text-gold" aria-hidden />
          </Link>

          <nav aria-label="ניווט ראשי" className="mt-4 grid">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={close}
                className="border-b border-border py-3.5 text-[15px] font-medium hover:text-gold"
              >
                {l.label}
              </Link>
            ))}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-border py-3.5 text-[15px] font-medium hover:text-gold"
            >
              וואטסאפ · {PHONE_DISPLAY}
            </a>
          </nav>

          <nav aria-label="מידע משפטי" className="mt-6 grid gap-2.5 text-sm text-muted-foreground">
            {legalLinks.map((l) => (
              <Link key={l.to} to={l.to} onClick={close} className="hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
