import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { BUSINESS, legalLinks } from "@/lib/legal";

export type LegalSection = { title: string; items: ReactNode[] };

export function LegalPage({
  title,
  intro,
  sections,
  children,
}: {
  title: string;
  intro?: ReactNode;
  sections: LegalSection[];
  children?: ReactNode;
}) {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <main id="main-content" className="mx-auto max-w-md px-5 pt-10 md:max-w-3xl md:px-8">
        <Link to="/" className="text-xs tracking-widest text-muted-foreground hover:text-foreground">
          → חזרה לחנות
        </Link>

        <h1 className="mt-5 font-display text-3xl font-bold lg:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">עודכן לאחרונה: {BUSINESS.updated}</p>
        {intro && <div className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{intro}</div>}

        <div className="mt-8 space-y-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-display text-lg font-bold">{s.title}</h2>
              <ul className="mt-3 list-disc space-y-2 pe-5 text-sm leading-relaxed text-muted-foreground">
                {s.items.map((i, k) => (
                  <li key={k}>{i}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {children}

        <nav aria-label="מסמכים משפטיים" className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-6 text-sm">
          {legalLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              activeProps={{ className: "text-foreground underline" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </main>

      <SiteFooter />
    </div>
  );
}

/** "KYMRUN (legal name, ID)" for use inside legal text; skips details that aren't filled in yet. */
export function operatorText() {
  const extra = [BUSINESS.legalName, BUSINESS.businessId && `ח.פ/ע.מ ${BUSINESS.businessId}`]
    .filter(Boolean)
    .join(", ");
  return extra ? `${BUSINESS.brand} (${extra})` : BUSINESS.brand;
}
