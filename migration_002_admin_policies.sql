-- ============================================================
-- Migration: admin override policies
-- Run this if you already ran the original schema.sql before.
-- (New projects: this is already included at the bottom of schema.sql.)
-- ============================================================

create or replace function is_admin() returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

create policy "Admins manage stores" on sellers_stores for all using (is_admin());
create policy "Admins manage products" on products for all using (is_admin());
create policy "Admins manage posts" on videos_posts for all using (is_admin());
create policy "Admins manage comments" on comments for all using (is_admin());

-- To make your own account an admin, run (replace with your username):
-- update profiles set role = 'admin' where username = 'your_username';
