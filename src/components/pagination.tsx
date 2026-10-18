import { ArrowLeft, ArrowRight } from "lucide-react";

/** Page numbers to show: a window of 3 around the current page, plus the last page (at most 4 numbers). */
export function pageWindow(current: number, count: number): (number | "gap")[] {
  const start = Math.max(1, Math.min(current - 1, count - 2));
  const end = Math.min(count, start + 2);
  const out: (number | "gap")[] = [];
  for (let n = start; n <= end; n++) out.push(n);
  if (end < count - 1) out.push("gap");
  if (end < count) out.push(count);
  return out;
}

const stepClass =
  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30";

export function Pagination({
  page,
  count,
  onPage,
  className = "",
}: {
  page: number;
  count: number;
  onPage: (n: number) => void;
  className?: string;
}) {
  if (count <= 1) return null;
  return (
    <nav aria-label="עמודים" className={`flex items-center justify-center gap-1.5 ${className}`}>
      <button onClick={() => onPage(page - 1)} disabled={page === 1} className={stepClass}>
        <ArrowRight className="size-4" />
        הקודם
      </button>
      <span className="px-3 text-sm text-muted-foreground md:hidden">
        {page} / {count}
      </span>
      {pageWindow(page, count).map((n, i) =>
        n === "gap" ? (
          <span key={`gap-${i}`} className="hidden w-6 text-center text-muted-foreground md:inline-block">
            …
          </span>
        ) : (
          <button
            key={n}
            onClick={() => onPage(n)}
            aria-current={n === page ? "page" : undefined}
            className={`hidden size-10 rounded-full font-display text-sm transition-colors md:inline-block ${
              n === page ? "border border-gold text-gold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {n}
          </button>
        ),
      )}
      <button onClick={() => onPage(page + 1)} disabled={page === count} className={stepClass}>
        הבא
        <ArrowLeft className="size-4" />
      </button>
    </nav>
  );
}
