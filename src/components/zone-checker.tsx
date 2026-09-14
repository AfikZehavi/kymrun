import { useState } from "react";
import { MapPin, Search } from "lucide-react";

import { findZone, speedById, type Zone } from "@/lib/delivery";

export function ZoneChecker() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ zone: Zone | null } | null>(null);

  function check(e: React.FormEvent) {
    e.preventDefault();
    setResult({ zone: findZone(query) });
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <p className="flex items-center gap-2 font-display text-lg font-bold">
        <MapPin className="size-5 text-primary" />
        בדיקת אזור משלוח
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        הקלידו עיר ונראה אילו זמני אספקה זמינים אצלכם.
      </p>

      <form onSubmit={check} className="mt-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="למשל: תל אביב"
          className="min-w-0 flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground active:scale-[0.98]"
        >
          <Search className="size-4" />
          בדיקה
        </button>
      </form>

      {result &&
        (result.zone ? (
          <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-semibold">{result.zone.name}</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {result.zone.speeds.map((id) => {
                const s = speedById(id);
                if (!s) return null;
                return (
                  <li key={id} className="flex items-center justify-between gap-3">
                    <span>{s.label}</span>
                    <span className="font-display font-bold text-foreground">
                      ₪{s.price}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              משלוח חינם בהזמנה מעל ₪550.
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
            לא מצאנו את היישוב ברשימה — עדיין אפשר לשלוח, נחזור אליכם עם זמן
            אספקה ומחיר מדויק דרך{" "}
            <span className="font-semibold text-foreground">יצירת קשר</span>.
          </div>
        ))}
    </div>
  );
}
