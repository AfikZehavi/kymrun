import { createFileRoute } from "@tanstack/react-router";

// Tranzila reports the payment result here (notify_url_address), server to server.
// Fields may arrive in the POST body or the query string depending on the terminal's notify format.
// This URL is public, so a "paid" report is only trusted after checking the transaction
// with Tranzila's API (when TRANZILA_APP_KEY / TRANZILA_APP_SECRET are set).
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
    .select("id,total,status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return new Response("not found", { status: 404 });
  const status = (order as any).status as string;
  // Tranzila may retry; a paid order is final.
  if (status === "paid") return new Response("OK");

  const total = Number((order as any).total);
  const confirmationCode = (fields.get("ConfirmationCode") ?? "").slice(0, 100);
  const index = (fields.get("index") ?? "").slice(0, 100);
  const reportedOk = (response === "000" || response === "0") && Math.abs(total - sum) < 0.01;

  if (!reportedOk) {
    // Only a pending order is marked failed, and a later genuine success can still mark it paid.
    await supabaseAdmin
      .from("orders")
      .update({ status: "failed", tranzila_response: response.slice(0, 20) } as never)
      .eq("id", orderId)
      .eq("status", "pending");
    return new Response("OK");
  }

  const { tranzilaApiConfigured, verifyTranzilaPayment, createTranzilaInvoice } = await import(
    "@/lib/tranzila.server"
  );
  let verified = false;
  if (tranzilaApiConfigured()) {
    // One real transaction can't pay for two orders.
    const { data: reused } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("tranzila_index", index)
      .eq("status", "paid")
      .neq("id", orderId)
      .limit(1);
    if (index && reused?.length) {
      console.error(
        "[tranzila notify] transaction index already used by another order",
        orderId,
        index,
      );
      return new Response("OK");
    }
    const check = await verifyTranzilaPayment(index, total);
    if (!check.ok) {
      console.error("[tranzila notify] payment not verified", orderId, check.reason);
      // On a temporary problem ask Tranzila to retry.
      if (check.retry) return new Response("retry", { status: 503 });
      // Otherwise leave the order unpaid, but still tell the owner so a real payment that failed
      // the automatic check isn't missed (the email says to check it in Tranzila first).
      try {
        const { data: full } = await supabaseAdmin.from("orders").select("*").eq("id", orderId).single();
        const { sendPaidOrderEmail } = await import("@/lib/order-email.server");
        if (full) await sendPaidOrderEmail(full as any, { confirmationCode, index, verified: false });
      } catch (e) {
        console.error("[tranzila notify] warning email failed", e);
      }
      return new Response("OK");
    }
    verified = true;
  }

  // Only the request that actually moves the order to "paid" gets a row back, so the email is sent once.
  const { data: updated } = await supabaseAdmin
    .from("orders")
    .update({
      status: "paid",
      tranzila_response: response.slice(0, 20),
      tranzila_index: (index || confirmationCode).slice(0, 100),
    } as never)
    .eq("id", orderId)
    .in("status", ["pending", "failed"])
    .select("*")
    .maybeSingle();

  if (updated) {
    const order = updated as any;
    // Tax invoice/receipt, only for a payment Tranzila confirmed (a failure here never blocks the emails).
    let invoice: { number: string; url: string } | { error: string } | undefined;
    if (verified) {
      try {
        const { speedById } = await import("@/lib/delivery");
        const shipLabel = speedById(order.shipping_method)?.label ?? order.shipping_method;
        const r = await createTranzilaInvoice(order, index, shipLabel);
        if (r.ok) {
          invoice = { number: r.number, url: r.url };
          order.invoice_number = r.number;
          order.invoice_url = r.url;
          await supabaseAdmin
            .from("orders")
            .update({ invoice_number: r.number, invoice_url: r.url } as never)
            .eq("id", orderId);
        } else {
          console.error("[tranzila notify] invoice failed", orderId, r.reason);
          invoice = { error: r.reason };
        }
      } catch (e) {
        console.error("[tranzila notify] invoice failed", orderId, e);
        invoice = { error: String(e) };
      }
    }
    try {
      const { sendPaidOrderEmail } = await import("@/lib/order-email.server");
      if (await sendPaidOrderEmail(order, { confirmationCode, index, verified, invoice })) {
        await supabaseAdmin
          .from("orders")
          .update({ paid_email_sent_at: new Date().toISOString() } as never)
          .eq("id", orderId);
      }
    } catch (e) {
      // A mail outage must not make Tranzila think the notification failed.
      console.error("[tranzila notify] email failed", e);
    }
    try {
      const { sendCustomerConfirmation } = await import("@/lib/order-email.server");
      await sendCustomerConfirmation(order);
    } catch (e) {
      console.error("[tranzila notify] customer email failed", e);
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
