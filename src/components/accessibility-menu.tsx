import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Accessibility, X } from "lucide-react";

// Accessibility menu: text size, high contrast, highlighted links, readable font, no animations.
// Each choice is a class on <html> (styles in styles.css) and is remembered on this device.

type Prefs = { text: 0 | 1 | 2; contrast: boolean; links: boolean; font: boolean; motion: boolean };
const DEFAULTS: Prefs = { text: 0, contrast: false, links: false, font: false, motion: false };
const KEY = "kymrun-a11y";

function apply(p: Prefs) {
  const c = document.documentElement.classList;
  c.toggle("a11y-text-1", p.text === 1);
  c.toggle("a11y-text-2", p.text === 2);
  c.toggle("a11y-contrast", p.contrast);
  c.toggle("a11y-links", p.links);
  c.toggle("a11y-font", p.font);
  c.toggle("a11y-motion", p.motion);
}

export function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null") as Partial<Prefs> | null;
      if (saved) setPrefs({ ...DEFAULTS, ...saved });
    } catch {
      /* storage blocked: start from defaults */
    }
  }, []);

  useEffect(() => {
    apply(prefs);
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }, [prefs]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = (k: "contrast" | "links" | "font" | "motion") =>
    setPrefs((p) => ({ ...p, [k]: !p[k] }));

  const options: { key: "contrast" | "links" | "font" | "motion"; label: string }[] = [
    { key: "contrast", label: "ניגודיות גבוהה" },
    { key: "links", label: "הדגשת קישורים" },
    { key: "font", label: "גופן קריא" },
    { key: "motion", label: "עצירת אנימציות" },
  ];

  const item =
    "flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-sm transition-colors";

  return (
    <>
      <a
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          const target = document.querySelector<HTMLElement>("main, h1");
          if (target) {
            target.setAttribute("tabindex", "-1");
            target.focus();
            target.scrollIntoView({ block: "start" });
          }
        }}
        className="sr-only z-[70] rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:right-4 focus:top-4"
      >
        דלג לתוכן הראשי
      </a>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="a11y-panel"
        aria-label="תפריט נגישות"
        title="נגישות"
        className="fixed left-0 top-1/2 z-[60] grid size-11 -translate-y-1/2 place-items-center rounded-r-lg bg-[#1d4ed8] text-white shadow-lg transition-transform hover:scale-105"
      >
        <Accessibility className="size-6" aria-hidden />
      </button>

      {open && (
        <div
          id="a11y-panel"
          ref={panelRef}
          role="dialog"
          aria-label="תפריט נגישות"
          dir="rtl"
          className="fixed left-14 top-1/2 z-[60] w-[min(18rem,calc(100vw-4.5rem))] -translate-y-1/2 rounded-lg border border-border bg-card p-4 text-foreground shadow-2xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold">נגישות</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="סגירת תפריט הנגישות"
              className="grid size-8 place-items-center rounded-md hover:bg-muted"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
              <span className="text-sm">גודל טקסט</span>
              <div className="flex gap-1" role="group" aria-label="גודל טקסט">
                {([0, 1, 2] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, text: n }))}
                    aria-pressed={prefs.text === n}
                    aria-label={["רגיל", "גדול", "גדול מאוד"][n]}
                    className={`grid size-8 place-items-center rounded-md border font-semibold ${
                      prefs.text === n ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    }`}
                    style={{ fontSize: `${12 + n * 3}px` }}
                  >
                    א
                  </button>
                ))}
              </div>
            </div>

            {options.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => toggle(o.key)}
                aria-pressed={prefs[o.key]}
                className={`${item} ${
                  prefs[o.key] ? "border-primary bg-primary/15" : "border-border hover:bg-muted"
                }`}
              >
                {o.label}
                <span aria-hidden className="text-xs text-muted-foreground">
                  {prefs[o.key] ? "פעיל" : "כבוי"}
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPrefs(DEFAULTS)}
              className={`${item} justify-center border-border hover:bg-muted`}
            >
              איפוס הגדרות
            </button>
          </div>

          <Link
            to="/accessibility"
            onClick={() => setOpen(false)}
            className="mt-3 block text-center text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            להצהרת הנגישות
          </Link>
        </div>
      )}
    </>
  );
}
