export type Product = {
  id: string;
  handle: string;
  variantId: string;
  name: string;
  category: string;
  group: string;
  basePrice: number;
  price: number;
  discount: number;
  image: string;
  abv: string;
  note: string;
  inStock: boolean;
  featured: boolean;
  compareAtPrice: { amount: string; currencyCode: string } | null;
  currencyCode: string;
};

export type Category = { id: string; label: string };

export type CartLine = { product: Product; qty: number };
