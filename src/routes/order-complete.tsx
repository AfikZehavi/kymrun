import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Check, X } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { PHONE_DISPLAY, WHATSAPP_URL } from "@/lib/contact";
import { useCartStore } from "@/lib/use-shopify-cart";

export const Route = createFileRoute("/order-complete")({
  validateSearch: (s: Record<string, unknown>) => ({
    status: s["status"] === "ok" ? "ok" : "fail",
  }),
  head: () => ({
    meta: [{ title: "סטטוס הזמנה — KYMRUN" }, { name: "robots", content: "noindex" }],
  }),
  component: OrderComplete,
});

function OrderComplete() {
  const { status } = Route.useSearch();
  const ok = status === "ok";
  const clearCart = useCartStore((st) => st.clearCart);
  // The cart is kept through payment; empty it only once the payment went through.
  useEffect(() => {
    if (ok) clearCart();
  }, [ok, clearCart]);
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader count={0} />
      <main className="mx-auto max-w-lg px-5 py-20 text-center md:py-28">
        <div
          className={`mx-auto grid size-16 place-items-center rounded-full border ${
            ok ? "border-gold/50 text-gold" : "border-destructive/50 text-destructive"
          }`}
        >
          {ok ? <Check className="size-7" /> : <X className="size-7" />}
        </div>
        <span className="eyebrow mt-6 block">{ok ? "התשלום התקבל" : "התשלום לא הושלם"}</span>
        <h1 className="mt-3 font-display text-4xl font-medium">
          {ok ? "תודה על ההזמנה" : "משהו השתבש בתשלום"}
        </h1>
        <div className="gold-rule mx-auto mt-6 w-28" />
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground md:text-base">
          {ok
            ? "ההזמנה שלך התקבלה. ניצור איתך קשר לתיאום המשלוח, ובמסירה תתבקש להציג תעודה מזהה."
            : "לא חויבת. אפשר לחזור לסל ולנסות שוב, או לדבר איתנו ונעזור להשלים את ההזמנה."}
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="h-12 px-8 text-[15px]">
            <Link to={ok ? "/" : "/cart"}>{ok ? "חזרה לחנות" : "חזרה לסל"}</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 px-8 text-[15px]">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              וואטסאפ · {PHONE_DISPLAY}
            </a>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
