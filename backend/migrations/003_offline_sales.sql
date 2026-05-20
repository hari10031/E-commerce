-- Migration 003: Offline sales (employee "mark as sold")
-- Records in-person sales attributed to the employee who made them.
-- Run in the Supabase SQL Editor.

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
