// Local cart (products come from the site's own database; payment via Tranzila).
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ShopifyProduct } from "./shopify";

export interface CartItem {
  lineId: string | null;
  product: ShopifyProduct;
  variantId: string;
  variantTitle: string;
  price: { amount: string; currencyCode: string };
  compareAtPrice: { amount: string; currencyCode: string } | null;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  addItem: (item: Omit<CartItem, "lineId">) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      addItem: async (item) => {
        const items = get().items;
        const ex = items.find((i) => i.variantId === item.variantId);
        set({
          items: ex
            ? items.map((i) => (i.variantId === item.variantId ? { ...i, quantity: i.quantity + item.quantity } : i))
            : [...items, { ...item, lineId: null }],
        });
      },
      updateQuantity: async (variantId, quantity) => {
        if (quantity <= 0) return get().removeItem(variantId);
        set({ items: get().items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)) });
      },
      removeItem: async (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) });
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "kymrun-cart-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);

export function useCartSync() {}
