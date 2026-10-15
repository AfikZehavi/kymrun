-- One-time setup for a fresh Supabase project: the same tables, permissions and
-- triggers the Lovable database has (supabase/migrations + drizzle/migrations combined),
-- without the old sample products. Safe to run once in the SQL Editor.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Catalog (publicly readable)
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  sort int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  category_slug text NOT NULL REFERENCES public.categories(slug) ON UPDATE CASCADE,
  price numeric(10,2) NOT NULL DEFAULT 0,
  discount_percent int NOT NULL DEFAULT 0,
  image text NOT NULL DEFAULT 'hero-bottle',
  abv text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  in_stock boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  sort int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  english_name text NOT NULL DEFAULT '',
  volume_ml integer NOT NULL DEFAULT 0,
  country text NOT NULL DEFAULT '',
  producer text NOT NULL DEFAULT '',
  grape_variety text NOT NULL DEFAULT '',
  kosher_passover boolean NOT NULL DEFAULT false
);

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories are public" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "products are public" ON public.products FOR SELECT TO anon, authenticated USING (true);

-- Private tables (server only, via the secret / service_role key)
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'contact',
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  event_date text NOT NULL DEFAULT '',
  guests integer NOT NULL DEFAULT 0,
  budget text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.inquiries TO service_role;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]',
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  tranzila_response text NOT NULL DEFAULT '',
  tranzila_index text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
