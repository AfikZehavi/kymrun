CREATE TABLE public.products_backup_20261015 AS SELECT * FROM public.products;
GRANT ALL ON public.products_backup_20261015 TO service_role;
ALTER TABLE public.products_backup_20261015 ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.orders (
  id uuid primary key default gen_random_uuid(),
  email text not null default '',
  full_name text not null default '',
  phone text not null default '',
  address text not null default '',
  items jsonb not null default '[]',
  total numeric not null default 0,
  status text not null default 'pending',
  tranzila_response text not null default '',
  tranzila_index text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();