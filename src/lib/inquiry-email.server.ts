// Emails the store owner when someone sends the events / tasting / contact form (Resend).
// Needs RESEND_API_KEY. Goes to INQUIRY_EMAIL_TO, or ORDER_EMAIL_TO when that isn't set.

export type Inquiry = {
  kind: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  event_date: string;
  guests: number;
  budget: string;
  message: string;
};

const esc = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

const kindLabel: Record<string, string> = {
  event: "אירוע",
  tasting: "טעימת יין פרטית",
  contact: "פנייה כללית",
  gold: "פנייה מהחדר הסודי",
};

export async function sendInquiryEmail(q: Inquiry) {
  const apiKey = process.env["RESEND_API_KEY"];
  const to = process.env["INQUIRY_EMAIL_TO"] || process.env["ORDER_EMAIL_TO"];
  if (!apiKey || !to) {
    console.error("[inquiry-email] RESEND_API_KEY / INQUIRY_EMAIL_TO not set; skipping email");
    return false;
  }
  const from = process.env["INQUIRY_EMAIL_FROM"] || "KYMRUN <onboarding@resend.dev>";
  // The form puts the chosen event type on the message's first line.
  const [first = "", ...rest] = q.message.split("\n");
  const pickedType = first.startsWith("סוג האירוע:") ? first.replace("סוג האירוע:", "").trim() : "";
  const message = pickedType ? rest.join("\n").trim() : q.message;
  const type = pickedType || kindLabel[q.kind] || q.kind;
  const when = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });

  const field = (k: string, v: string) =>
    v
      ? `<tr><td style="padding:6px 0;color:#777;width:130px">${k}</td><td style="padding:6px 0;font-weight:600">${v}</td></tr>`
      : "";

  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#222">
  <h2 style="margin:0 0 4px">פנייה חדשה: ${esc(type)}</h2>
  <p style="margin:0 0 20px;color:#777">${esc(when)}</p>
  <table style="width:100%;border-collapse:collapse">
    ${field("סוג", esc(type))}
    ${field("שם", esc(q.full_name))}
    ${field("טלפון", `<a href="tel:${esc(q.phone)}">${esc(q.phone)}</a>`)}
    ${field("אימייל", `<a href="mailto:${esc(q.email)}">${esc(q.email)}</a>`)}
    ${field("מיקום", esc(q.city))}
    ${field("תאריך", esc(q.event_date))}
    ${field("אורחים", q.guests ? esc(q.guests) : "")}
    ${field("תקציב", esc(q.budget))}
  </table>
  ${message ? `<h3 style="margin:24px 0 8px">פרטים מהלקוח</h3><p style="margin:0;padding:12px;background:#f6f3ee;border-radius:6px;white-space:pre-wrap">${esc(message)}</p>` : ""}
  <p style="margin:24px 0 0;color:#777;font-size:13px">אפשר להשיב למייל הזה ישירות כדי לענות ללקוח.</p>
</div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: to
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      reply_to: q.email || undefined,
      subject: `פנייה חדשה · ${type} · ${q.full_name}${q.event_date ? ` · ${q.event_date}` : ""}`,
      html,
    }),
  });
  if (!res.ok) {
    console.error("[inquiry-email] Resend failed", res.status, (await res.text()).slice(0, 300));
    return false;
  }
  return true;
}
