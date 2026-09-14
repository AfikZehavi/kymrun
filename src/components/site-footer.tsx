import { Link } from "@tanstack/react-router";

import { PHONE_DISPLAY, PHONE_TEL, WHATSAPP_URL } from "@/lib/contact";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card/40">
      <div className="mx-auto max-w-md px-5 py-10 md:max-w-3xl md:px-8 lg:max-w-6xl">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-display text-lg font-bold tracking-[0.18em]">
              KYMRUN
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              בית למשקאות פרימיום כשרים. בחירה קפדנית, אחסון מבוקר ושירות אישי —
              מהמדף שלנו לשולחן שלך.
            </p>
          </div>

          <nav className="grid gap-2 text-sm">
            <Link to="/events" className="text-muted-foreground hover:text-foreground">
              אירועים וטעימות פרטיות
            </Link>
            <Link to="/shipping" className="text-muted-foreground hover:text-foreground">
              משלוחים ואזורי חלוקה
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground">
              יצירת קשר
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground">
              תקנון, ביטולים והחזרות
            </Link>
          </nav>

          <div className="text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">שירות לקוחות</p>
            <p className="mt-2">א׳–ה׳ 09:00–18:00 · ו׳ 09:00–13:00</p>
            <p className="mt-1">
              <a href={`tel:${PHONE_TEL}`} className="hover:text-foreground">
                {PHONE_DISPLAY}
              </a>
            </p>
            <p className="mt-1">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                וואטסאפ · {PHONE_DISPLAY}
              </a>
            </p>
            <p className="mt-1">service@kymrun.co.il</p>
          </div>
        </div>

        <div className="mt-8 space-y-2 border-t border-border pt-6 text-[11px] leading-relaxed text-muted-foreground">
          <p>
            אזהרה: צריכה מופרזת של אלכוהול מסכנת חיים ומזיקה לבריאות. אין למכור
            או לספק משקאות משכרים לקטינים מתחת לגיל 18. אין לשתות ולנהוג.
          </p>
          <p>
            מסירת המשלוח מותנית בהצגת תעודת זהות בפני השליח. שליח רשאי לסרב
            למסור הזמנה למי שאינו מציג תעודה מזהה, למי שנראה מתחת לגיל 18 או למי
            שנראה שיכור. במקרה של סירוב מסירה תיגבה עלות המשלוח.
          </p>
          <p>
            ביטול עסקה בהתאם לחוק הגנת הצרכן, התשמ״א־1981 ותקנותיו: ניתן לבטל
            עד 14 ימים ממועד קבלת המוצר או מסמך פרטי העסקה, בבקבוקים סגורים,
            שלמים ובאריזתם המקורית בלבד. דמי ביטול עד 5% ממחיר העסקה או ₪100,
            הנמוך מביניהם. מוצרים שנפתחו, נפגמו או הותאמו אישית (חריטה, הקדשה,
            מארז בהרכבה אישית) אינם ניתנים להחזרה.
          </p>
          <p>
            התמונות להמחשה בלבד. המחירים כוללים מע״מ. אספקה בכפוף לזמינות מלאי
            ולאזורי השירות. ט.ל.ח. © {new Date().getFullYear()} KYMRUN.
          </p>
          <p>
            <Link to="/terms" className="underline hover:text-foreground">
              לתקנון המלא ולמדיניות ההחזרות
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
