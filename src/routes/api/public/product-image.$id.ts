import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/product-image/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!/^[0-9a-f-]{36}$/i.test(params.id)) return new Response("not found", { status: 404 });
        const { publicDb } = await import("@/lib/store.server");
        const { data } = await publicDb().from("products").select("image").eq("id", params.id).maybeSingle();
        const img = (data as { image?: string } | null)?.image ?? "";
        const m = /^data:([^;]+);base64,(.*)$/s.exec(img);
        if (!m) return new Response("not found", { status: 404 });
        const bytes = Uint8Array.from(atob(m[2]!), (c) => c.charCodeAt(0));
        return new Response(bytes, {
          headers: { "Content-Type": m[1]!, "Cache-Control": "public, max-age=86400" },
        });
      },
    },
  },
});
