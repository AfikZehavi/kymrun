import { useCallback, useEffect, useState } from "react";
import type { CartLine } from "./types";

/**
 * Master switch for the KYMRUN GOLD membership.
 * Set to false to hide every GOLD surface (home band, /gold page, cart perks)
 * without removing any code.
 */
export const GOLD_ENABLED = true;

export const GOLD_DISCOUNT = 0.15;
export const GOLD_PRICE_YEAR = 349;

const KEY = "kymrun-gold";

export type GoldMember = { email: string; name: string; joinedAt: string };

export function readGold(): GoldMember | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GoldMember) : null;
  } catch {
    return null;
  }
}

export function saveGold(member: Omit<GoldMember, "joinedAt">): GoldMember {
  const full: GoldMember = { ...member, joinedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(full));
  } catch {
    /* storage unavailable */
  }
  return full;
}

export function clearGold() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}

/** 15% off the unique (featured) bottles in the cart — legacy CartLine shape. */
export function goldDiscountFor(cart: CartLine[]): number {
  const base = cart
    .filter((l) => l.product.featured)
    .reduce((s, l) => s + l.qty * l.product.price, 0);
  return Math.round(base * GOLD_DISCOUNT);
}

/** 15% off the unique (featured) bottles in the Shopify cart. */
export function goldDiscountForItems(
  items: { quantity: number; price: { amount: string } }[],
): number {
  // featured flag is not stored on Shopify cart items; approximate with nothing
  // so the visible total matches what Shopify charges (no local discount).
  return 0;
}

export function useGold() {
  const [member, setMember] = useState<GoldMember | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMember(readGold());
    setHydrated(true);
  }, []);

  const join = useCallback((data: Omit<GoldMember, "joinedAt">) => {
    setMember(saveGold(data));
  }, []);

  const leave = useCallback(() => {
    clearGold();
    setMember(null);
  }, []);

  return { member, hydrated, join, leave, active: GOLD_ENABLED && !!member };
}
