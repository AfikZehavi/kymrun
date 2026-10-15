import { Minus, Plus } from "lucide-react";

export function QuantityStepper({
  value,
  onChange,
  max = 50,
  size = "lg",
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  size?: "sm" | "lg";
}) {
  const box = size === "lg" ? "h-12 grid-cols-[40px_32px_40px]" : "h-9 grid-cols-[32px_28px_32px]";
  return (
    <div className={`grid shrink-0 items-center rounded-md border border-border ${box}`}>
      <button
        aria-label="הגדל כמות"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="grid h-full place-items-center text-muted-foreground transition-colors hover:text-gold disabled:opacity-30"
      >
        <Plus className="size-3.5" />
      </button>
      <output className="text-center font-display text-sm">{value}</output>
      <button
        aria-label="הפחת כמות"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        className="grid h-full place-items-center text-muted-foreground transition-colors hover:text-gold disabled:opacity-30"
      >
        <Minus className="size-3.5" />
      </button>
    </div>
  );
}
