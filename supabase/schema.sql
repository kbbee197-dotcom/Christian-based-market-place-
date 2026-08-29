-- ============================================================
-- Christian Marketplace — Supabase schema
-- Run this in: Supabase project > SQL Editor > New query > Run
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- USERS & PROFILES ----------
-- Supabase already creates auth.users. This table adds public profile data.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  role text not null default 'shopper' check (role in ('shopper', 'seller', 'admin')),
  created_at timestamptz not null default now()
);

-- ---------- SELLERS / STORES ----------
create table sellers_stores (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  store_name text not null,
  store_slug text unique not null,
  description text,
  logo_url text,
  stripe_account_id text,          -- Stripe Connect standard account id
  stripe_onboarded boolean not null default false,
  approved boolean not null default false, -- admin moderation gate
  created_at timestamptz not null default now()
);

-- ---------- PRODUCTS ----------
create table products (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references sellers_stores(id) on delete cascade,
  title text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'usd',
  image_urls text[] default '{}',
  inventory_count integer default 0,
  is_active boolean not null default true,
  flagged boolean not null default false, -- moderation flag
  created_at timestamptz not null default now()
);

-- ---------- VIDEOS / POSTS ----------
create table videos_posts (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  video_url text not null,        -- Cloudinary/Mux playback URL
  thumbnail_url text,
  caption text,
  flagged boolean not null default false, -- moderation flag
  created_at timestamptz not null default now()
);

-- ---------- COMMENTS ----------
create table comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references videos_posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  flagged boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- LIKES ----------
create table likes (
  user_id uuid not null references profiles(id) on delete cascade,
  post_id uuid not null references videos_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- ---------- FOLLOWS ----------
create table follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  creator_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, creator_id),
  check (follower_id <> creator_id)
);

-- ---------- CART ITEMS ----------
create table cart_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ---------- ORDERS ----------
create table orders (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid not null references profiles(id) on delete cascade,
  store_id uuid not null references sellers_stores(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'shipped', 'completed', 'refunded', 'cancelled')),
  total_cents integer not null check (total_cents >= 0),
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null
);

-- ============================================================
-- Row Level Security — turn on and lock down by default,
-- then open specific policies. This is a starting point, not
-- a finished security review.
-- ============================================================
alter table profiles enable row level security;
alter table sellers_stores enable row level security;
alter table products enable row level security;
alter table videos_posts enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table follows enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Public read access to feed content
create policy "Public profiles are viewable" on profiles for select using (true);
create policy "Public stores are viewable" on sellers_stores for select using (approved = true);
create policy "Public active products are viewable" on products for select using (is_active = true and flagged = false);
create policy "Public posts are viewable" on videos_posts for select using (flagged = false);
create policy "Public comments are viewable" on comments for select using (flagged = false);
create policy "Public likes are viewable" on likes for select using (true);
create policy "Public follows are viewable" on follows for select using (true);

-- Authenticated write access, scoped to the acting user
create policy "Users manage their own profile" on profiles for update using (auth.uid() = id);
create policy "Users create their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users create their own store" on sellers_stores for insert with check (auth.uid() = owner_id);
create policy "Owners manage their store" on sellers_stores for update using (auth.uid() = owner_id);
create policy "Owners manage their products" on products for all using (
  auth.uid() = (select owner_id from sellers_stores where sellers_stores.id = products.store_id)
);
create policy "Users create posts as themselves" on videos_posts for insert with check (auth.uid() = creator_id);
create policy "Users manage their own posts" on videos_posts for update using (auth.uid() = creator_id);
create policy "Users comment as themselves" on comments for insert with check (auth.uid() = author_id);
create policy "Users manage their own likes" on likes for all using (auth.uid() = user_id);
create policy "Users manage their own follows" on follows for all using (auth.uid() = follower_id);
create policy "Users manage their own cart" on cart_items for all using (auth.uid() = user_id);
create policy "Users view their own orders" on orders for select using (
  auth.uid() = buyer_id or auth.uid() = (select owner_id from sellers_stores where sellers_stores.id = orders.store_id)
);
create policy "Users view their own order items" on order_items for select using (
  auth.uid() = (select buyer_id from orders where orders.id = order_items.order_id)
);

-- ---------- ADMIN OVERRIDE POLICIES ----------
create or replace function is_admin() returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

create policy "Admins manage stores" on sellers_stores for all using (is_admin());
create policy "Admins manage products" on products for all using (is_admin());
create policy "Admins manage posts" on videos_posts for all using (is_admin());
create policy "Admins manage comments" on comments for all using (is_admin());

-- To make your own account an admin, run (replace with your username):
-- update profiles set role = 'admin' where username = 'your_username';
