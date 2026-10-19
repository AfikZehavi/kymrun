import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, GlassWater, Sparkles, Users } from "lucide-react";

import { InquiryForm, quotePromise } from "@/components/inquiry-form";
import type { InquiryKind } from "@/lib/inquiries.functions";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "אירועים וטעימות יין פרטיות | KYMRUN" },
      {
        name: "description",
        content:
          "הפקת בר ומשקאות לאירועים פרטיים ועסקיים, וטעימות יין פרטיות בבית או במשרד. ספרו לנו על האירוע וקבלו הצעת מחיר תוך 4 שעות.",
      },
      { property: "og:title", content: "אירועים וטעימות יין פרטיות | KYMRUN" },
      {
        property: "og:description",
        content:
          "בר לאירועים, מארזי מתנה לעובדים וטעימות יין מודרכות אצלכם בבית או בעסק.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});

const offers = [
  {
    icon: GlassWater,
    title: "טעימת יין פרטית",
    body: "מומחה יין מגיע אליכם הביתה או למשרד עם 6 יינות כשרים, כלים וכיבוד מותאם. 90 דקות של סיפור, השוואה וטעם.",
  },
  {
    icon: Sparkles,
    title: "בר לאירוע",
    body: "חתונה, אירוע חברה או ערב מצומצם: בונים רשימת משקאות לפי הקהל, הכמות והתקציב, כולל אספקה והחזרת עודפים.",
  },
  {
    icon: Users,
    title: "מתנות לעובדים ולקוחות",
    body: "מארזים ממותגים, הקדשה אישית וחלוקה לכתובות שונות. כמויות מ-10 יחידות.",
  },
];

const eventTypes: { label: string; kind: InquiryKind }[] = [
  { label: "טעימת יין פרטית", kind: "tasting" },
  { label: "בר לאירוע", kind: "event" },
  { label: "מתנות לעובדים ולקוחות", kind: "event" },
  { label: "אחר", kind: "event" },
];

function EventsPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pt-10 md:max-w-3xl md:px-8 lg:max-w-6xl">
        <Link to="/" className="text-xs tracking-widest text-muted-foreground hover:text-foreground">
          → חזרה לחנות
        </Link>

        <h1 className="mt-5 font-display text-3xl font-bold leading-tight lg:text-5xl">
          אירועים, ברים
          <br />
          <span className="text-primary">וטעימות פרטיות</span>
        </h1>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground lg:text-lg">
          ספרו לנו על האירוע, הקהל, הסגנון והתקציב, ונבנה רשימה מדויקת, כולל
          אספקה, קירור והשירות שביום עצמו פשוט עובד.
        </p>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold">
          <Clock className="size-4 text-primary" />
          {quotePromise()}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {offers.map((o) => (
            <div
              key={o.title}
              className="rounded-3xl border border-border bg-card p-6"
            >
              <o.icon className="size-6 text-primary" />
              <h2 className="mt-4 font-display text-lg font-bold">{o.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {o.body}
              </p>
            </div>
          ))}
        </div>

        <section id="request" className="mt-12 scroll-mt-20">
          <h2 className="font-display text-2xl font-bold lg:text-3xl">
            ספרו לנו על האירוע
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            השאירו פרטים, ספרו לנו מה מתכננים ונחזור אליכם.
          </p>
          <div className="mt-5">
            <InquiryForm kind="event" submitLabel="שלחו ונחזור אליכם" eventTypes={eventTypes} />
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
