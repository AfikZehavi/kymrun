import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { ZoneChecker } from "@/components/zone-checker";
import { deliverySpeeds, deliveryZones } from "@/lib/delivery";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "משלוחים ואזורי חלוקה | KYMRUN" },
      {
        name: "description",
        content:
          "משלוח עד 4 שעות, עד 24 שעות או עד 48 שעות. בדקו את זמני האספקה לעיר שלכם ואת תנאי המסירה מגיל 18.",
      },
      { property: "og:title", content: "משלוחים ואזורי חלוקה | KYMRUN" },
      {
        property: "og:description",
        content: "אקספרס עד 4 שעות ומשלוח חינם מעל ₪350. בדקו את האזור שלכם.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pt-10 md:max-w-3xl md:px-8 lg:max-w-5xl">
        <Link to="/" className="text-xs tracking-widest text-muted-foreground hover:text-foreground">
          → חזרה לחנות
        </Link>

        <h1 className="mt-5 font-display text-3xl font-bold lg:text-5xl">
          משלוחים ואזורי חלוקה
        </h1>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
          אריזה ממוגנת, נהגים שלנו וזמנים שאפשר לסמוך עליהם. משלוח חינם בהזמנה
          מעל ₪350.
        </p>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {deliverySpeeds.map((s) => (
            <div
              key={s.id}
              className="rounded-3xl border border-border bg-card p-6"
            >
              <p className="font-display text-2xl font-bold">{s.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.window}</p>
              <p className="mt-4 font-display text-lg font-bold text-primary">
                ₪{s.price}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {s.note}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <ZoneChecker />
        </div>

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">כל אזורי השירות</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {deliveryZones.map((z) => (
              <div
                key={z.name}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <p className="text-sm font-semibold">{z.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {z.cities.join(" · ")}
                </p>
                <p className="mt-3 text-xs font-medium text-primary">
                  {z.speeds.includes("express")
                    ? "כולל אקספרס עד 4 שעות"
                    : z.speeds.includes("next")
                      ? "עד 24 שעות"
                      : "עד 48 שעות"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
          <h2 className="font-display text-lg font-bold text-foreground">
            תנאי מסירה
          </h2>
          <ul className="mt-3 list-disc space-y-2 pe-5">
            <li>מסירה בכפוף להצגת תעודת זהות בפני השליח (גיל 18 ומעלה).</li>
            <li>לא תימסר הזמנה לקטין או למי שנראה שיכור.</li>
            <li>אקספרס עד 4 שעות: להזמנות עד 17:00, בימים א׳ עד ה׳, באזורי שירות נבחרים.</li>
            <li>בערבי שבת וחג האספקה מסתיימת 3 שעות לפני כניסת השבת/החג.</li>
            <li>בסירוב מסירה עקב אי הצגת תעודה, עלות המשלוח תיגבה.</li>
          </ul>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
