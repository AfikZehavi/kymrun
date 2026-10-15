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
    <div className="surface-glow rounded-lg border border-gold/25 bg-card p-6">
      <p className="flex items-center gap-2 font-display text-xl font-medium">
        <MapPin className="size-5 text-gold" strokeWidth={1.5} />
        בדיקת אזור משלוח
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground">
        הקלידו עיר ונראה אילו זמני אספקה זמינים אצלכם.
      </p>

      <form onSubmit={check} className="mt-5 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="למשל: תל אביב"
          aria-label="עיר או יישוב"
          className="h-11 min-w-0 flex-1 rounded-md border border-input bg-background/60 px-4 text-sm outline-none transition-colors focus:border-gold/70"
        />
        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98]"
        >
          <Search className="size-4" />
          בדיקה
        </button>
      </form>

      {result &&
        (result.zone ? (
          <div className="mt-4 rounded-md border border-border bg-background/60 p-4">
            <p className="font-display text-base font-medium">{result.zone.name}</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {result.zone.speeds.map((id) => {
                const s = speedById(id);
                if (!s) return null;
                return (
                  <li key={id} className="flex items-center justify-between gap-3">
                    <span>{s.label}</span>
                    <span className="font-display text-foreground">₪{s.price}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">משלוח חינם בהזמנה מעל ₪550.</p>
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-border bg-background/60 p-4 text-sm text-muted-foreground">
            לא מצאנו את היישוב ברשימה — עדיין אפשר לשלוח, נחזור אליכם עם זמן אספקה ומחיר מדויק דרך{" "}
            <span className="font-semibold text-foreground">יצירת קשר</span>.
          </div>
        ))}
    </div>
  );
}
