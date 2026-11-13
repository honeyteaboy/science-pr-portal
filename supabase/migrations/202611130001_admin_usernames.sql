-- Add unique usernames for staff/admin accounts created from the admin dashboard.
-- Admin Auth users use an internal synthetic address; no confirmation email is sent.
alter table public.profiles
  add column if not exists username text;

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null;
