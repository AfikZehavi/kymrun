import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone } from "lucide-react";

import { InquiryForm } from "@/components/inquiry-form";
import { SiteFooter } from "@/components/site-footer";

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
            { icon: Phone, t: "טלפון", d: "03-000-0000" },
            { icon: MessageCircle, t: "וואטסאפ", d: "052-000-0000" },
            { icon: Mail, t: "אימייל", d: "service@kymrun.co.il" },
          ].map((c) => (
            <div
              key={c.t}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <c.icon className="size-5 text-primary" />
              <p className="mt-3 text-sm font-semibold">{c.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <InquiryForm kind="contact" submitLabel="שליחת הודעה" withEvent={false} />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          פרטי הקשר לדוגמה — שלחו לנו את המספרים והכתובת האמיתיים ונעדכן.
        </p>
      </div>

      <SiteFooter />
    </div>
  );
}
