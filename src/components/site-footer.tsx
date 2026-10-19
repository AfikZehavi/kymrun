import { Link } from "@tanstack/react-router";

import { PHONE_DISPLAY, PHONE_TEL, WHATSAPP_URL } from "@/lib/contact";
import { BrandLockup } from "@/components/brand-lockup";
import { legalLinks } from "@/lib/legal";

const linkClass = "text-muted-foreground transition-colors hover:text-gold";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card/50">
      <div className="mx-auto max-w-6xl px-5 pt-14 pb-10 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex justify-start">
              <BrandLockup />
            </div>
            <p className="mt-5 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
              בית למשקאות פרימיום כשרים. בחירה קפדנית, אחסון מבוקר ושירות אישי, מהמדף שלנו לשולחן
              שלך.
            </p>
          </div>

          <nav className="text-sm">
            <p className="eyebrow">החנות</p>
            <div className="mt-4 grid gap-2.5">
              <Link to="/events" className={linkClass}>
                אירועים וטעימות פרטיות
              </Link>
              <Link to="/shipping" className={linkClass}>
                משלוחים ואזורי חלוקה
              </Link>
              <Link to="/contact" className={linkClass}>
                יצירת קשר
              </Link>
            </div>
            <p className="eyebrow mt-8">מידע משפטי</p>
            <div className="mt-4 grid gap-2.5">
              {legalLinks.map((l) => (
                <Link key={l.to} to={l.to} className={linkClass}>
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="text-sm">
            <p className="eyebrow">שירות לקוחות</p>
            <div className="mt-4 grid gap-2.5 text-muted-foreground">
              <p>א׳ עד ה׳ 09:00 עד 18:00 · ו׳ 09:00 עד 13:00</p>
              <a href={`tel:${PHONE_TEL}`} className={linkClass}>
                {PHONE_DISPLAY}
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                וואטסאפ · {PHONE_DISPLAY}
              </a>
              <a href="mailto:service@kymrun.co.il" className={linkClass}>
                service@kymrun.co.il
              </a>
            </div>
          </div>
        </div>

        <div className="gold-rule mt-12 opacity-50" />

        <div className="mt-8 space-y-2 text-[11px] leading-relaxed text-muted-foreground">
          <p>
            אזהרה: צריכה מופרזת של אלכוהול מסכנת חיים ומזיקה לבריאות. אין למכור או לספק משקאות
            משכרים לקטינים מתחת לגיל 18. אין לשתות ולנהוג.
          </p>
          <p>
            מסירת המשלוח מותנית בהצגת תעודת זהות בפני השליח. שליח רשאי לסרב למסור הזמנה למי שאינו
            מציג תעודה מזהה, למי שנראה מתחת לגיל 18 או למי שנראה שיכור. במקרה של סירוב מסירה תיגבה
            עלות המשלוח.
          </p>
          <p>
            ביטול עסקה בהתאם לחוק הגנת הצרכן ותקנותיו, תוך 14 ימים, בבקבוקים סגורים ושלמים. דמי ביטול
            עד 5% ממחיר העסקה או ₪100, הנמוך מביניהם. פרטים מלאים בעמוד ביטול עסקה.
          </p>
          <p>
            התמונות להמחשה בלבד. המחירים כוללים מע״מ. אספקה בכפוף לזמינות מלאי ולאזורי השירות.
            ט.ל.ח.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} KYMRUN · כל הזכויות שמורות</p>
          <Link to="/accessibility" className={`${linkClass} underline-offset-4 hover:underline`}>
            הצהרת נגישות
          </Link>
        </div>
      </div>
    </footer>
  );
}
