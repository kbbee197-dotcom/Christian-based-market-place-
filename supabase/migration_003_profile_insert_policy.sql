-- ============================================================
-- Migration: allow users to create their own profile row
-- Fixes: "new row violates row-level security policy" errors
-- caused by signup silently failing to create a profiles row
-- (the original schema was missing this insert policy).
-- ============================================================

create policy "Users create their own profile" on profiles for insert with check (auth.uid() = id);
