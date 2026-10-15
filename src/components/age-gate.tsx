import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand-lockup";

const KEY = "kymrun-age-approved-until";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export function AgeGate() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [status, setStatus] = useState<"checking" | "ask" | "approved" | "denied">("checking");
  const excluded = pathname.startsWith("/admin-kymrun-37") || pathname.startsWith("/api/");
  useEffect(() => {
    try {
      const expires = Number(localStorage.getItem(KEY));
      setStatus(expires > Date.now() && expires <= Date.now() + THIRTY_DAYS ? "approved" : "ask");
    } catch { setStatus("ask"); }
  }, []);
  function approve() {
    try { localStorage.setItem(KEY, String(Date.now() + THIRTY_DAYS)); } catch { /* approval still works for this visit */ }
    setStatus("approved");
  }
  if (excluded || status === "approved") return null;
  return (
    <Dialog open>
      <DialogContent dir="rtl" aria-describedby="age-description" className="z-[100] w-[calc(100%-2rem)] max-w-md gap-6 rounded-lg p-6 text-center sm:p-8 [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <div className="flex justify-center"><BrandLockup /></div>
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary"><ShieldCheck className="size-6" /></div>
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="font-display text-xl leading-relaxed">{status === "denied" ? "הכניסה מגיל 18 ומעלה בלבד" : "ברוכים הבאים לקמרון"}</DialogTitle>
          <DialogDescription id="age-description" className="pt-2 text-sm leading-relaxed">
            {status === "denied" ? "לא ניתן להיכנס לחנות או לרכוש משקאות אלכוהוליים מתחת לגיל 18." : "החנות מיועדת לבני ובנות 18 ומעלה. האם מלאו לך 18 שנים?"}
          </DialogDescription>
        </DialogHeader>
        {status !== "denied" && <div className="grid gap-3">
          <Button onClick={approve} className="h-auto min-h-12 whitespace-normal">אני בן/בת 18 ומעלה</Button>
          <Button variant="outline" onClick={() => setStatus("denied")} className="h-auto min-h-12 whitespace-normal">אני מתחת לגיל 18</Button>
        </div>}
      </DialogContent>
    </Dialog>
  );
}