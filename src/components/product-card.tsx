import { Gift, ShoppingBag } from "lucide-react";

import { ProductImage } from "@/components/product-image";
import type { Product } from "@/lib/types";

const money = (n: number) =>
  new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(n);

export function ProductCard({
  product,
  onOpen,
  onAdd,
}: {
  product: Product;
  onOpen: () => void;
  onAdd: () => void;
}) {
  return (
    <article className="group flex flex-col">
      <button
        onClick={onOpen}
        className="relative block overflow-hidden rounded-lg text-right ring-1 ring-border transition-shadow duration-500 hover:shadow-[0_24px_48px_-24px_rgb(0_0_0/0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        aria-label={`פרטי ${product.name}`}
      >
        <ProductImage
          src={product.image}
          alt={product.name}
          width={768}
          height={960}
          containerClassName="aspect-[4/5] w-full"
          className="p-5 transition-transform duration-700 ease-out group-hover:scale-[1.04] md:p-7"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2.5 md:p-3">
          {product.discount > 0 ? (
            <span className="rounded-sm bg-wine px-2 py-1 text-[10px] font-semibold tracking-wider text-wine-foreground">
              ‎-{product.discount}%
            </span>
          ) : product.group === "gift" ? (
            <span className="inline-flex items-center gap-1 rounded-sm bg-[oklch(0.2_0.012_60)] px-2 py-1 text-[10px] font-semibold tracking-wider text-[oklch(0.85_0.08_82)]">
              <Gift className="size-3" />
              מארז
            </span>
          ) : (
            <span />
          )}
          {product.abv && (
            <span className="rounded-sm border border-black/10 bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-[oklch(0.3_0.01_60)] backdrop-blur-sm">
              {product.abv}
            </span>
          )}
        </div>
        {!product.inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-[oklch(0.2_0.012_60/0.85)] py-1.5 text-center text-[11px] tracking-widest text-[oklch(0.94_0.012_85)]">
            אזל מהמלאי
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col pt-3.5 md:pt-4">
        <p className="truncate text-[11px] tracking-wide text-gold/90">{product.category}</p>
        <button onClick={onOpen} className="mt-1.5 text-right">
          <h3 className="line-clamp-2 font-display text-[15px] font-medium leading-snug transition-colors group-hover:text-gold md:text-[17px]">
            {product.name}
          </h3>
        </button>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="font-display text-lg font-medium md:text-xl">
            {money(product.price)}
          </span>
          {product.discount > 0 && (
            <span className="text-xs text-muted-foreground line-through">
              {money(product.basePrice)}
            </span>
          )}
        </div>
        <div className="mt-auto pt-3 md:pt-4">
          <button
            onClick={onAdd}
            disabled={!product.inStock}
            aria-label={`הוסף ${product.name} לסל`}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border text-xs font-semibold tracking-wider transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-40 md:h-11"
          >
            <ShoppingBag className="size-3.5" />
            הוספה לסל
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="aspect-[4/5] w-full animate-pulse rounded-lg bg-muted" />
      <div className="mt-4 h-2.5 w-1/3 animate-pulse rounded bg-muted" />
      <div className="mt-2.5 h-4 w-3/4 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-5 w-1/4 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-10 w-full animate-pulse rounded-md bg-muted" />
    </div>
  );
}
