-- ============================================================
-- NanaBanana — Supabase Database Schema
-- Run in: Supabase SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

create type user_role as enum ('admin', 'employee', 'customer');
create type employee_status as enum ('pending', 'approved', 'rejected');
create type order_status as enum ('placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
create type product_type as enum ('saree', 'dress', 'jewellery');

-- ── Profiles extends auth.users ──────────────────────────────────────────────
create table profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  name            text not null,
  phone           text,
  role            user_role default 'customer',
  employee_status employee_status,
  fcm_token       text,
  whatsapp        text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_profiles_role on profiles(role);
create index idx_profiles_employee_status on profiles(employee_status) where employee_status is not null;

-- Auto-create profile on Supabase signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, phone, role, employee_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'User'),
    new.raw_user_meta_data->>'phone',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer'),
    case when new.raw_user_meta_data->>'role' = 'employee' then 'pending'::employee_status else null end
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Categories ───────────────────────────────────────────────────────────────
create table categories (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  slug        text unique not null,
  description text,
  image_url   text,
  parent_id   uuid references categories(id) on delete cascade,
  created_at  timestamptz default now()
);

create index idx_categories_slug on categories(slug);
create index idx_categories_parent on categories(parent_id);

-- ── Products ─────────────────────────────────────────────────────────────────
create table products (
  id            uuid default uuid_generate_v4() primary key,
  title         text not null,
  description   text,
  type          product_type not null,
  category_id   uuid references categories(id) on delete set null,
  base_price    numeric(10,2) not null check (base_price > 0),
  discount_pct  numeric(5,2) default 0 check (discount_pct >= 0 and discount_pct <= 100),
  coupon_code   text,
  coupon_disc   numeric(5,2),
  published     boolean default false,
  created_by    uuid references profiles(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_products_published on products(published);
create index idx_products_type on products(type);
create index idx_products_category on products(category_id);
create index idx_products_created_at on products(created_at desc);
create index idx_products_title_search on products using gin(to_tsvector('english', title));

-- ── Product images ────────────────────────────────────────────────────────────
create table product_images (
  id            uuid default uuid_generate_v4() primary key,
  product_id    uuid references products(id) on delete cascade,
  url           text not null,
  alt_text      text,
  is_primary    boolean default false,
  color         text,
  display_order int default 0
);

create index idx_product_images_product on product_images(product_id);

-- ── Variants ─────────────────────────────────────────────────────────────────
create table variants (
  id          uuid default uuid_generate_v4() primary key,
  product_id  uuid references products(id) on delete cascade,
  color       text,
  size        text,
  quantity    int default 0 check (quantity >= 0),
  sold_count  int default 0 check (sold_count >= 0),
  sku         text unique,
  image_url   text,
  created_at  timestamptz default now()
);

create index idx_variants_product on variants(product_id);
create index idx_variants_sku on variants(sku);
create index idx_variants_low_stock on variants(quantity) where quantity < 5;

-- ── Addresses ────────────────────────────────────────────────────────────────
create table addresses (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references profiles(id) on delete cascade,
  line1      text not null,
  line2      text,
  city       text not null,
  state      text not null,
  pincode    text not null,
  country    text default 'India',
  is_default boolean default false,
  created_at timestamptz default now()
);

create index idx_addresses_user on addresses(user_id);

-- ── Orders ────────────────────────────────────────────────────────────────────
create table orders (
  id                  uuid default uuid_generate_v4() primary key,
  user_id             uuid references profiles(id),
  address_id          uuid references addresses(id),
  status              order_status default 'placed',
  total_amount        numeric(10,2) not null,
  discount_amount     numeric(10,2) default 0,
  coupon_applied      text,
  razorpay_order_id   text,
  razorpay_payment_id text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index idx_orders_user on orders(user_id);
create index idx_orders_status on orders(status);
create index idx_orders_created_at on orders(created_at desc);

-- ── Order items ───────────────────────────────────────────────────────────────
create table order_items (
  id         uuid default uuid_generate_v4() primary key,
  order_id   uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  variant_id uuid references variants(id),
  quantity   int not null check (quantity > 0),
  unit_price numeric(10,2) not null
);

create index idx_order_items_order on order_items(order_id);

-- ── Cart items ────────────────────────────────────────────────────────────────
create table cart_items (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  variant_id uuid references variants(id) on delete cascade,
  quantity   int default 1 check (quantity > 0),
  created_at timestamptz default now(),
  unique(user_id, variant_id)
);

create index idx_cart_user on cart_items(user_id);

-- ── Wishlist items ────────────────────────────────────────────────────────────
create table wishlist_items (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

create index idx_wishlist_user on wishlist_items(user_id);

-- ── Coupons ───────────────────────────────────────────────────────────────────
create table coupons (
  id           uuid default uuid_generate_v4() primary key,
  code         text unique not null,
  discount_pct numeric(5,2) not null,
  max_uses     int,
  used_count   int default 0,
  expires_at   timestamptz,
  active       boolean default true,
  created_at   timestamptz default now()
);

create index idx_coupons_code on coupons(code);
create index idx_coupons_active on coupons(active) where active = true;

-- ── Offline sales (employee "mark as sold") ──────────────────────────────────
create table offline_sales (
  id          uuid default uuid_generate_v4() primary key,
  variant_id  uuid references variants(id) on delete set null,
  product_id  uuid references products(id) on delete set null,
  sold_by     uuid references profiles(id),
  quantity    int not null check (quantity > 0),
  unit_price  numeric(10,2) not null,
  created_at  timestamptz default now()
);

create index idx_offline_sales_sold_by on offline_sales(sold_by);
create index idx_offline_sales_created_at on offline_sales(created_at desc);

-- ── In-app notifications ──────────────────────────────────────────────────────
create table notifications (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references profiles(id) on delete cascade,
  title      text not null,
  body       text not null,
  read       boolean default false,
  created_at timestamptz default now()
);

create index idx_notifications_user_unread on notifications(user_id, read) where read = false;

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- Service role (used by backend) bypasses RLS automatically
alter table profiles enable row level security;
alter table cart_items enable row level security;
alter table wishlist_items enable row level security;
alter table orders enable row level security;
alter table addresses enable row level security;
alter table notifications enable row level security;

-- ── Storage buckets ───────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('category-images', 'category-images', true) on conflict do nothing;

create policy "Public read product images"
  on storage.objects for select using (bucket_id = 'product-images');

create policy "Public read category images"
  on storage.objects for select using (bucket_id = 'category-images');

-- ── RPC functions ─────────────────────────────────────────────────────────────

-- Atomic stock decrement (prevents race conditions at scale)
create or replace function decrement_variant_stock(variant_id uuid, qty int)
returns void as $$
begin
  update variants
  set quantity   = greatest(quantity - qty, 0),
      sold_count = sold_count + qty
  where id = variant_id;
end;
$$ language plpgsql security definer;

-- Daily revenue for last 30 days (analytics chart)
create or replace function daily_sales_last_30_days()
returns table(date text, revenue numeric) as $$
  select
    to_char(date_trunc('day', created_at), 'DD/MM') as date,
    sum(total_amount) as revenue
  from orders
  where created_at >= now() - interval '30 days'
    and status != 'cancelled'
  group by date_trunc('day', created_at)
  order by date_trunc('day', created_at);
$$ language sql security definer;

-- Increment coupon usage count
create or replace function increment_coupon_usage(code text)
returns void as $$
  update coupons set used_count = used_count + 1 where coupons.code = increment_coupon_usage.code;
$$ language sql security definer;
