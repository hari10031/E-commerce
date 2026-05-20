-- Migration 001: Rename product types
-- saree/banana/gold -> saree/dress/jewellery
-- Run in the Supabase SQL Editor.

alter type product_type rename value 'banana' to 'dress';
alter type product_type rename value 'gold' to 'jewellery';
