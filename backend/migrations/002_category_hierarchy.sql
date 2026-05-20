-- Migration 002: Hierarchical sub-categories
-- Adds a self-referential parent_id so categories form a tree.
-- Run in the Supabase SQL Editor.

alter table categories
  add column parent_id uuid references categories(id) on delete cascade;

create index idx_categories_parent on categories(parent_id);
