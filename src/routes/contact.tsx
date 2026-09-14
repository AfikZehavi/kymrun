import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone } from "lucide-react";

import { InquiryForm } from "@/components/inquiry-form";
import { SiteFooter } from "@/components/site-footer";
import { PHONE_DISPLAY, PHONE_TEL, WHATSAPP_URL } from "@/lib/contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "יצירת קשר | KYMRUN" },
      {
        name: "description",
        content:
          "מענה אישי על בחירת בקבוק, מתנות, אירועים ומשלוחים. כתבו לנו ונחזור אליכם באותו יום עסקים.",
      },
      { property: "og:title", content: "יצירת קשר | KYMRUN" },
      {
        property: "og:description",
        content: "מענה אישי על בקבוקים, מתנות, אירועים ומשלוחים.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pt-10 md:max-w-3xl md:px-8 lg:max-w-4xl">
        <Link to="/" className="text-xs tracking-widest text-muted-foreground hover:text-foreground">
          → חזרה לחנות
        </Link>

        <h1 className="mt-5 font-display text-3xl font-bold lg:text-5xl">
          כאן בשבילכם
        </h1>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
          לא בטוחים איזה בקבוק מתאים? רוצים לשדרג מתנה? כתבו לנו ונחזור אליכם עם
          המלצה אישית.
        </p>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            {
              icon: Phone,
              t: "טלפון",
              d: PHONE_DISPLAY,
              href: `tel:${PHONE_TEL}`,
            },
            {
              icon: MessageCircle,
              t: "וואטסאפ",
              d: PHONE_DISPLAY,
              href: WHATSAPP_URL,
            },
            {
              icon: Mail,
              t: "אימייל",
              d: "service@kymrun.co.il",
              href: "mailto:service@kymrun.co.il",
            },
          ].map((c) => (
            <a
              key={c.t}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <c.icon className="size-5 text-primary" />
              <p className="mt-3 text-sm font-semibold">{c.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </a>
          ))}
        </div>

        <div className="mt-8">
          <InquiryForm kind="contact" submitLabel="שליחת הודעה" withEvent={false} />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          מעדיפים לדבר? {PHONE_DISPLAY} — טלפון או וואטסאפ.
        </p>
      </div>

      <SiteFooter />
    </div>
  );
}
