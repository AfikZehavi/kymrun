import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

import { submitInquiry, type InquiryKind } from "@/lib/inquiries.functions";

const field =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

/** Quote promise: 4 working hours, unless close to Shabbat / holiday entry. */
export function quotePromise(now = new Date()): string {
  const day = now.getDay();
  const hour = now.getHours();
  const nearShabbat = (day === 5 && hour >= 12) || day === 6;
  return nearShabbat
    ? "קיבלנו — סמוך לכניסת שבת, ונחזור אליך עם הצעת מחיר במוצאי שבת."
    : "הצעת מחיר אצלך תוך 4 שעות.";
}

export function InquiryForm({
  kind,
  submitLabel,
  withEvent = true,
}: {
  kind: InquiryKind;
  submitLabel: string;
  withEvent?: boolean;
}) {
  const send = useServerFn(submitInquiry);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      kind,
      full_name: String(form.get("full_name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      city: String(form.get("city") ?? ""),
      event_date: String(form.get("event_date") ?? ""),
      guests: Number(form.get("guests") ?? 0) || 0,
      budget: String(form.get("budget") ?? ""),
      message: String(form.get("message") ?? ""),
    };
    setBusy(true);
    try {
      await send({ data: payload });
      setDone(true);
      toast.success("הפנייה נשלחה", { description: quotePromise() });
    } catch {
      toast.error("השליחה נכשלה", {
        description: "בדקו את הפרטים ונסו שוב, או התקשרו אלינו.",
      });
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-primary/30 bg-card p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/15 text-primary">
          <Check className="size-6" />
        </span>
        <h3 className="mt-4 font-display text-xl font-bold">תודה, קיבלנו</h3>
        <p className="mt-2 text-sm text-muted-foreground">{quotePromise()}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-3xl border border-border bg-card p-5 lg:p-7"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <input name="full_name" required placeholder="שם מלא" className={field} />
        <input
          name="phone"
          required
          inputMode="tel"
          placeholder="טלפון"
          className={field}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="email"
          required
          type="email"
          placeholder="אימייל"
          className={field}
        />
        <input name="city" placeholder="עיר / כתובת האירוע" className={field} />
      </div>
      {withEvent && (
        <div className="grid gap-3 md:grid-cols-3">
          <input name="event_date" placeholder="תאריך מבוקש" className={field} />
          <input
            name="guests"
            inputMode="numeric"
            placeholder="מספר אורחים"
            className={field}
          />
          <input name="budget" placeholder="תקציב משוער" className={field} />
        </div>
      )}
      <textarea
        name="message"
        rows={4}
        placeholder={
          kind === "contact"
            ? "במה נוכל לעזור?"
            : "ספרו לנו על האירוע: אופי, קהל, העדפות טעם, סגנון אירוח"
        }
        className={`${field} resize-none`}
      />
      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {busy && <Loader2 className="size-4 animate-spin" />}
        {submitLabel}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        {quotePromise()} · מכירה מגיל 18 בלבד
      </p>
    </form>
  );
}
