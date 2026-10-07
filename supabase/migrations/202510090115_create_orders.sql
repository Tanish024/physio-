-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto with schema extensions;

-- Orders and Order Items tables
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text,
  customer_email text not null,
  address text,
  city text,
  postal_code text,
  subtotal numeric(10,2) default 0,
  shipping numeric(10,2) default 0,
  total numeric(10,2) default 0,
  status text default 'created',
  created_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text,
  name text not null,
  quantity int not null check (quantity > 0),
  price numeric(10,2) not null check (price >= 0)
);

-- Indexes
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_order_items_order on public.order_items(order_id);

-- RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy orders_select_own on public.orders for select using (
  auth.uid() = user_id or user_id is null
);

create policy orders_insert_self on public.orders for insert with check (
  auth.uid() = user_id or user_id is null
);

create policy order_items_select_by_order on public.order_items for select using (
  exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or o.user_id is null))
);

create policy order_items_insert_by_order on public.order_items for insert with check (
  exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or o.user_id is null))
);
