-- Migration 004: Harden the new-user trigger
-- The original handle_new_user() could abort Supabase sign-up entirely if the
-- profiles insert failed ("Database error creating new user"). This version
-- pins search_path, is idempotent, and never blocks auth sign-up — the backend
-- /auth/register endpoint also upserts the profile as a backup.
-- Run in the Supabase SQL Editor.

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, phone, role, employee_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'User'),
    new.raw_user_meta_data->>'phone',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer'),
    case when new.raw_user_meta_data->>'role' = 'employee'
         then 'pending'::employee_status else null end
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  -- Never block auth sign-up because of profile creation.
  return new;
end;
$$ language plpgsql security definer set search_path = public;
