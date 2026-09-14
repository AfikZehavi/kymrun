export type Product = {
  id: string;
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
};

export type Category = { id: string; label: string };

export type CartLine = { product: Product; qty: number };
