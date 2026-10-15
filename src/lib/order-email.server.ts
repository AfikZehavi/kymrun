import { speedById } from "./delivery";

// Sends the store owner a paid-order email through Resend (https://resend.com).
// Needs RESEND_API_KEY and ORDER_EMAIL_TO. Without a verified domain, Resend only delivers
// from onboarding@resend.dev to the Resend account's own address, so ORDER_EMAIL_TO must be that address.

type Line = { name: string; qty: number; price: number };
export type PaidOrder = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  items: Line[];
  total: number | string;
  shipping: number | string;
  shipping_method: string;
};

const esc = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
const ils = (n: number | string) =>
  `₪${Number(n).toLocaleString("he-IL", { maximumFractionDigits: 2 })}`;

export async function sendPaidOrderEmail(
  order: PaidOrder,
  payment: { confirmationCode: string; index: string },
) {
  const apiKey = process.env["RESEND_API_KEY"];
  const to = process.env["ORDER_EMAIL_TO"];
  if (!apiKey || !to) {
    console.error(
      "[order-email] RESEND_API_KEY / ORDER_EMAIL_TO not set; skipping email for order",
      order.id,
    );
    return false;
  }
  const from = process.env["ORDER_EMAIL_FROM"] || "KYMRUN <onboarding@resend.dev>";
  const speed = speedById(order.shipping_method);
  const shipLabel = speed ? `${speed.label} — ${speed.window}` : order.shipping_method;
  const shortId = order.id.slice(0, 8).toUpperCase();
  const when = new Date(order.created_at).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });

  const rows = (order.items ?? [])
    .map(
      (l) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${esc(l.name)}</td>` +
        `<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${esc(l.qty)}</td>` +
        `<td style="padding:8px;border-bottom:1px solid #eee;text-align:left">${ils(l.price * l.qty)}</td></tr>`,
    )
    .join("");
  const field = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;color:#777;width:130px">${k}</td><td style="padding:6px 0;font-weight:600">${v}</td></tr>`;

  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#222">
  <h2 style="margin:0 0 4px">הזמנה חדשה שולמה ✅ #${shortId}</h2>
  <p style="margin:0 0 20px;color:#777">${esc(when)}</p>
  <h3 style="margin:0 0 8px">משלוח</h3>
  <table style="width:100%;border-collapse:collapse">
    ${field("סוג משלוח", `${esc(shipLabel)} (${ils(order.shipping)})`)}
    ${field("שם", esc(order.full_name))}
    ${field("טלפון", `<a href="tel:${esc(order.phone)}">${esc(order.phone)}</a>`)}
    ${field("כתובת", esc(order.address))}
    ${field("אימייל", esc(order.email))}
  </table>
  <h3 style="margin:24px 0 8px">פריטים</h3>
  <table style="width:100%;border-collapse:collapse">
    <tr style="background:#f6f3ee"><th style="padding:8px;text-align:right">מוצר</th><th style="padding:8px">כמות</th><th style="padding:8px;text-align:left">סה״כ</th></tr>
    ${rows}
    <tr><td style="padding:8px">משלוח</td><td></td><td style="padding:8px;text-align:left">${ils(order.shipping)}</td></tr>
    <tr><td style="padding:8px;font-weight:700">סה״כ שולם</td><td></td><td style="padding:8px;text-align:left;font-weight:700">${ils(order.total)}</td></tr>
  </table>
  <p style="margin:24px 0 0;padding:12px;background:#f6f3ee;border-radius:6px;font-size:13px">
    טרנזילה · קוד אישור: <b>${esc(payment.confirmationCode || "—")}</b> · אינדקס: <b>${esc(payment.index || "—")}</b><br>
    מומלץ לוודא את העסקה בממשק טרנזילה לפני שליחת המשלוח. מזהה הזמנה מלא: ${esc(order.id)}
  </p>
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
      reply_to: order.email || undefined,
      subject: `הזמנה חדשה #${shortId} · ${order.full_name} · ${ils(order.total)} · ${speed?.label ?? ""}`,
      html,
    }),
  });
  if (!res.ok) {
    console.error("[order-email] Resend failed", res.status, (await res.text()).slice(0, 300));
    return false;
  }
  return true;
}
