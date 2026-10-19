import { speedById } from "./delivery";
import { PHONE_DISPLAY, PHONE_TEL } from "./contact";

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
  invoice_number?: string | null;
  invoice_url?: string | null;
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
  payment: {
    confirmationCode: string;
    index: string;
    verified: boolean;
    invoice?: { number: string; url: string } | { error: string } | undefined;
  },
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
  const shipLabel = speed ? `${speed.label} (${speed.window})` : order.shipping_method;
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
  <h2 style="margin:0 0 4px">${payment.verified ? `הזמנה חדשה שולמה ✅ #${shortId}` : `⚠️ הזמנה #${shortId} : לבדוק בטרנזילה לפני משלוח`}</h2>
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
    טרנזילה · קוד אישור: <b>${esc(payment.confirmationCode || "אין")}</b> · אינדקס: <b>${esc(payment.index || "אין")}</b><br>
    ${payment.verified ? "✅ התשלום אומת ישירות מול טרנזילה (סכום וקוד אישור)." : "⚠️ התשלום לא אומת אוטומטית מול טרנזילה. יש לוודא את העסקה בממשק טרנזילה לפני שליחת המשלוח."}<br>
    ${
      payment.invoice && "url" in payment.invoice
        ? `🧾 חשבונית מס/קבלה ${esc(payment.invoice.number)} הופקה (קישור אליה נשלח ללקוח במייל האישור) · <a href="${esc(payment.invoice.url)}">צפייה בחשבונית</a><br>`
        : payment.invoice
          ? `⚠️ הפקת החשבונית נכשלה (${esc(payment.invoice.error)}). יש להפיק ידנית בטרנזילה.<br>`
          : ""
    }מזהה הזמנה מלא: ${esc(order.id)}
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
      subject: `${payment.verified ? "הזמנה חדשה" : "⚠️ לבדיקה: הזמנה"} #${shortId} · ${order.full_name} · ${ils(order.total)} · ${speed?.label ?? ""}`,
      html,
    }),
  });
  if (!res.ok) {
    console.error("[order-email] Resend failed", res.status, (await res.text()).slice(0, 300));
    return false;
  }
  return true;
}

/** "Thanks for your order" email to the customer (an order confirmation, not a tax receipt). */
export async function sendCustomerConfirmation(order: PaidOrder) {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey || !order.email) return false;
  const from = process.env["ORDER_EMAIL_FROM"] || "KYMRUN <onboarding@resend.dev>";
  const speed = speedById(order.shipping_method);
  const shortId = order.id.slice(0, 8).toUpperCase();
  const firstName = order.full_name.trim().split(/\s+/)[0] ?? "";

  const rows = (order.items ?? [])
    .map(
      (l) =>
        `<tr><td style="padding:10px 8px;border-bottom:1px solid #eee">${esc(l.name)}${l.qty > 1 ? ` <span style="color:#888">× ${esc(l.qty)}</span>` : ""}</td>` +
        `<td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:left;white-space:nowrap">${ils(l.price * l.qty)}</td></tr>`,
    )
    .join("");

  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222;line-height:1.6">
  <p style="margin:0 0 4px;letter-spacing:4px;font-size:13px;color:#a8875a">KYMRUN</p>
  <h2 style="margin:0 0 8px">תודה ${esc(firstName)}, ההזמנה התקבלה 🍷</h2>
  <p style="margin:0 0 20px;color:#555">התשלום עבר בהצלחה ואנחנו כבר מכינים את ההזמנה שלך. מספר הזמנה: <b>#${shortId}</b></p>
  <table style="width:100%;border-collapse:collapse">
    ${rows}
    <tr><td style="padding:10px 8px;color:#555">משלוח · ${esc(speed ? `${speed.label} (${speed.window})` : order.shipping_method)}</td><td style="padding:10px 8px;text-align:left">${Number(order.shipping) ? ils(order.shipping) : "חינם"}</td></tr>
    <tr><td style="padding:10px 8px;font-weight:700;border-top:2px solid #222">סה״כ שולם</td><td style="padding:10px 8px;text-align:left;font-weight:700;border-top:2px solid #222">${ils(order.total)}</td></tr>
  </table>
  ${
    order.invoice_url
      ? `<p style="margin:20px 0 0"><a href="${esc(order.invoice_url)}" style="display:inline-block;padding:10px 18px;background:#222;color:#fff;border-radius:6px;text-decoration:none">🧾 חשבונית מס/קבלה ${esc(order.invoice_number ?? "")}</a></p>`
      : ""
  }
  <h3 style="margin:24px 0 6px;font-size:15px">כתובת למשלוח</h3>
  <p style="margin:0;color:#555">${esc(order.full_name)}<br>${esc(order.address)}<br>${esc(order.phone)}</p>
  <p style="margin:24px 0 0;padding:14px;background:#f6f3ee;border-radius:8px;font-size:14px">
    נחזור אליך לתיאום המשלוח. שאלות? וואטסאפ או טלפון: <a href="https://wa.me/${PHONE_TEL.replace("+", "")}" style="color:#7a5c33">${PHONE_DISPLAY}</a>
  </p>
  <p style="margin:20px 0 0;color:#999;font-size:12px">מכירת משקאות אלכוהוליים מגיל 18 בלבד. ‏KYMRUN · kymrun.co.il</p>
</div>`;

  const text = [
    `תודה ${firstName}, ההזמנה התקבלה.`,
    `מספר הזמנה: #${shortId}`,
    ...(order.items ?? []).map((l) => `${l.name} × ${l.qty}: ${ils(l.price * l.qty)}`),
    `משלוח: ${speed?.label ?? order.shipping_method}: ${Number(order.shipping) ? ils(order.shipping) : "חינם"}`,
    `סה״כ שולם: ${ils(order.total)}`,
    `כתובת: ${order.address}`,
    ...(order.invoice_url ? [`חשבונית מס/קבלה: ${order.invoice_url}`] : []),
    `שאלות? ${PHONE_DISPLAY}`,
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [order.email],
      subject: `ההזמנה שלך ב-KYMRUN התקבלה · #${shortId}`,
      html,
      text,
    }),
  });
  if (!res.ok) {
    console.error("[order-email] customer email failed", res.status, (await res.text()).slice(0, 300));
    return false;
  }
  return true;
}
