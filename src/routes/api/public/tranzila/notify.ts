import { createFileRoute } from "@tanstack/react-router";

// Tranzila reports the payment result here (notify_url_address), server to server.
// Fields may arrive in the POST body or the query string depending on the terminal's notify format.
async function handleNotify(request: Request) {
  const fields = new URLSearchParams(new URL(request.url).search);
  if (request.method === "POST") {
    for (const [k, v] of new URLSearchParams(await request.text())) fields.set(k, v);
  }
  const orderId = fields.get("orderId") ?? "";
  const response = fields.get("Response") ?? "";
  const sum = Number(fields.get("sum") ?? "0");
  const supplier = fields.get("supplier");
  const terminal = process.env["TRANZILA_TERMINAL"];

  if (!/^[0-9a-f-]{36}$/i.test(orderId) || !terminal || (supplier && supplier !== terminal)) {
    return new Response("ignored", { status: 400 });
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id,total,status,paid_email_sent_at")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return new Response("not found", { status: 404 });
  // Tranzila may retry; once an order is settled, just acknowledge.
  if ((order as any).status !== "pending") return new Response("OK");

  const ok =
    (response === "000" || response === "0") && Math.abs(Number((order as any).total) - sum) < 0.01;
  const confirmationCode = (fields.get("ConfirmationCode") ?? "").slice(0, 100);
  const index = (fields.get("index") ?? fields.get("TranzilaTK") ?? "").slice(0, 100);

  // Only the request that moves the order out of "pending" gets a row back, so the email is sent once.
  const { data: updated } = await supabaseAdmin
    .from("orders")
    .update({
      status: ok ? "paid" : "failed",
      tranzila_response: response.slice(0, 20),
      tranzila_index: (index || confirmationCode).slice(0, 100),
    } as never)
    .eq("id", orderId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (ok && updated) {
    try {
      const { sendPaidOrderEmail } = await import("@/lib/order-email.server");
      if (await sendPaidOrderEmail(updated as any, { confirmationCode, index })) {
        await supabaseAdmin
          .from("orders")
          .update({ paid_email_sent_at: new Date().toISOString() } as never)
          .eq("id", orderId);
      }
    } catch (e) {
      // A mail outage must not make Tranzila think the notification failed.
      console.error("[tranzila notify] email failed", e);
    }
  }
  return new Response("OK");
}

export const Route = createFileRoute("/api/public/tranzila/notify")({
  server: {
    handlers: {
      POST: async ({ request }) => handleNotify(request),
      GET: async ({ request }) => handleNotify(request),
    },
  },
});
