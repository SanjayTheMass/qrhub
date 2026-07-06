-- ============================================================
-- QrHub Schema — Run this FIRST in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
-- profiles (extends Supabase auth.users)
-- ----------------------------------------------------------------
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  email         text unique not null,
  full_name     text,
  plan          text not null default 'free' check (plan in ('free', 'pro')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ----------------------------------------------------------------
-- urls
-- ----------------------------------------------------------------
create table public.urls (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  short_code    text unique not null,
  original_url  text not null,
  title         text,
  is_active     boolean not null default true,
  click_count   integer not null default 0,
  expires_at    timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ----------------------------------------------------------------
-- qr_codes
-- ----------------------------------------------------------------
create table public.qr_codes (
  id                uuid default gen_random_uuid() primary key,
  user_id           uuid references public.profiles(id) on delete cascade not null,
  url_id            uuid references public.urls(id) on delete cascade not null,
  name              text not null,
  foreground_color  text not null default '#000000',
  background_color  text not null default '#FFFFFF',
  logo_url          text,
  qr_image_url      text,
  scan_count        integer not null default 0,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ----------------------------------------------------------------
-- click_events
-- ----------------------------------------------------------------
create table public.click_events (
  id           bigserial primary key,
  url_id       uuid references public.urls(id) on delete cascade not null,
  qr_id        uuid references public.qr_codes(id) on delete set null,
  clicked_at   timestamptz default now(),
  country      text,
  city         text,
  device_type  text default 'unknown' check (device_type in ('mobile', 'tablet', 'desktop', 'unknown')),
  browser      text,
  os           text,
  referrer     text,
  ip_hash      text
);

-- ----------------------------------------------------------------
-- subscriptions
-- ----------------------------------------------------------------
create table public.subscriptions (
  id                        uuid default gen_random_uuid() primary key,
  user_id                   uuid references public.profiles(id) on delete cascade unique not null,
  razorpay_order_id         text,
  razorpay_payment_id       text unique,
  plan                      text not null,
  billing_period            text check (billing_period in ('monthly', 'yearly')),
  status                    text not null default 'created'
                              check (status in ('created', 'paid', 'failed', 'cancelled', 'expired')),
  amount                    integer,
  currency                  text default 'INR',
  paid_at                   timestamptz,
  valid_until               timestamptz,
  created_at                timestamptz default now(),
  updated_at                timestamptz default now()
);

-- ----------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------
create index idx_urls_short_code    on public.urls(short_code);
create index idx_urls_user_id       on public.urls(user_id);
create index idx_urls_is_active     on public.urls(is_active);
create index idx_qr_user_id         on public.qr_codes(user_id);
create index idx_qr_url_id          on public.qr_codes(url_id);
create index idx_clicks_url_id      on public.click_events(url_id);
create index idx_clicks_clicked_at  on public.click_events(clicked_at);
create index idx_clicks_qr_id       on public.click_events(qr_id);

-- ----------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger trg_urls_updated_at
  before update on public.urls
  for each row execute procedure public.set_updated_at();

create trigger trg_qr_codes_updated_at
  before update on public.qr_codes
  for each row execute procedure public.set_updated_at();

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------
-- Auto-create profile when user signs up via Supabase Auth
-- ----------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

