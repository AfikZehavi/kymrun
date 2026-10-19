import crest from "@/assets/kymrun-heritage-crest.png";

/** One switch removes the heritage crest everywhere without changing the layout code. */
export const BRAND_CREST_ENABLED = true;

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex min-w-0 flex-col items-center leading-none">
      {BRAND_CREST_ENABLED && (
        <img
          src={crest}
          alt=""
          aria-hidden="true"
          width={1093}
          height={432}
          className={
            compact
              ? "mb-0.5 h-5 w-auto max-w-24 object-contain opacity-80 dark:invert"
              : "mb-1 h-8 w-auto max-w-36 object-contain opacity-80 dark:invert"
          }
        />
      )}
      <span
        className={`font-display font-medium tracking-[0.32em] ${compact ? "text-lg" : "text-2xl"}`}
        style={{ marginInlineEnd: "-0.32em" }}
      >
        KYMRUN
      </span>
      <span className="mt-1 block text-[10px] tracking-[0.1em] text-gold">
        משקאות פרימיום · כשר
      </span>
    </span>
  );
}
