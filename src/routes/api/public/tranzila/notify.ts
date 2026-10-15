import { createFileRoute } from "@tanstack/react-router";

// Tranzila posts the payment result here (configure as notify URL on the terminal).
export const Route = createFileRoute("/api/public/tranzila/notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = new URLSearchParams(await request.text());
        const orderId = body.get("orderId") ?? "";
        const response = body.get("Response") ?? "";
        const sum = Number(body.get("sum") ?? "0");
        const supplier = body.get("supplier") ?? "";
        const terminal = process.env["TRANZILA_TERMINAL"];
        if (!/^[0-9a-f-]{36}$/i.test(orderId) || !terminal || supplier !== terminal) {
          return new Response("ignored", { status: 400 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: order } = await supabaseAdmin.from("orders").select("id,total,status").eq("id", orderId).maybeSingle();
        if (!order) return new Response("not found", { status: 404 });
        const ok = response === "000" && Math.abs(Number((order as any).total) - sum) < 0.01;
        await supabaseAdmin
          .from("orders")
          .update({
            status: ok ? "paid" : "failed",
            tranzila_response: response.slice(0, 20),
            tranzila_index: (body.get("index") ?? body.get("ConfirmationCode") ?? "").slice(0, 100),
          } as never)
          .eq("id", orderId);
        return new Response("ok");
      },
    },
  },
});
