-- ============================================
-- APPLY THIS MIGRATION TO YOUR SUPABASE PROJECT
-- ============================================
-- Go to your Supabase Dashboard > SQL Editor
-- Copy and paste this entire script
-- Click "Run" to create the orders tables
-- ============================================

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto with schema extensions;

-- Orders table
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

-- Order Items table
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text,
  name text not null,
  quantity int not null check (quantity > 0),
  price numeric(10,2) not null check (price >= 0)
);

-- Indexes for better performance
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_order_items_order on public.order_items(order_id);

-- Enable Row Level Security
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Drop existing policies if they exist (to avoid conflicts)
drop policy if exists orders_select_own on public.orders;
drop policy if exists orders_insert_self on public.orders;
drop policy if exists order_items_select_by_order on public.order_items;
drop policy if exists order_items_insert_by_order on public.order_items;

-- RLS Policy: Users can view their own orders (or orders without user_id)
create policy orders_select_own on public.orders for select using (
  auth.uid() = user_id or user_id is null
);

-- RLS Policy: Users can create orders for themselves (or anonymous orders)
create policy orders_insert_self on public.orders for insert with check (
  auth.uid() = user_id or user_id is null
);

-- RLS Policy: Users can view order items for their orders
create policy order_items_select_by_order on public.order_items for select using (
  exists(
    select 1 from public.orders o 
    where o.id = order_id 
    and (o.user_id = auth.uid() or o.user_id is null)
  )
);

-- RLS Policy: Users can insert order items for their orders
create policy order_items_insert_by_order on public.order_items for insert with check (
  exists(
    select 1 from public.orders o 
    where o.id = order_id 
    and (o.user_id = auth.uid() or o.user_id is null)
  )
);

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on public.orders to anon, authenticated;
grant all on public.order_items to anon, authenticated;

-- ============================================
-- VERIFICATION QUERIES (Optional - run after)
-- ============================================
-- Check if tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('orders', 'order_items');

-- Check if policies were created:
-- SELECT * FROM pg_policies WHERE tablename IN ('orders', 'order_items');
