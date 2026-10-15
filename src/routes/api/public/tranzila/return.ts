import { createFileRoute } from "@tanstack/react-router";

// Tranzila sends the buyer back here after paying (success_url_address / fail_url_address),
// sometimes as a POST. Turn it into a plain redirect to the result page.
function toResultPage(request: Request) {
  const status = new URL(request.url).searchParams.get("status") === "ok" ? "ok" : "fail";
  return new Response(null, {
    status: 303,
    headers: { Location: `/order-complete?status=${status}` },
  });
}

export const Route = createFileRoute("/api/public/tranzila/return")({
  server: {
    handlers: {
      GET: async ({ request }) => toResultPage(request),
      POST: async ({ request }) => toResultPage(request),
    },
  },
});
