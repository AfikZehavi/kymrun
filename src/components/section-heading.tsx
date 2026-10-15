import type { ReactNode } from "react";

/** Editorial section title: gold eyebrow, serif heading, fading hairline. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  aside,
  align = "start",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  /** Small element shown opposite the title (count, link). Ignored when centered. */
  aside?: ReactNode;
  align?: "start" | "center";
}) {
  if (align === "center") {
    return (
      <div className="mb-8 flex flex-col items-center text-center md:mb-12">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="mt-3 font-display text-[1.75rem] font-medium leading-tight md:text-4xl lg:text-[2.75rem]">
          {title}
        </h2>
        <div className="gold-rule mt-5 w-28" />
        {description && (
          <p className="mt-5 max-w-[52ch] text-sm leading-relaxed text-muted-foreground md:text-base">
            {description}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6 md:mb-10">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="mt-2 font-display text-[1.75rem] font-medium leading-tight md:text-4xl">
            {title}
          </h2>
        </div>
        {aside && <div className="shrink-0 pb-1.5">{aside}</div>}
      </div>
      {description && (
        <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      <div className="gold-rule mt-5" />
    </div>
  );
}
