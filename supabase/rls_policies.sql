-- ============================================================
-- QrHub RLS Policies — Run this SECOND in Supabase SQL Editor
-- ============================================================
-- Note: The backend uses the SERVICE_ROLE key which bypasses RLS.
-- These policies protect direct frontend/anon access only.

alter table public.profiles     enable row level security;
alter table public.urls         enable row level security;
alter table public.qr_codes     enable row level security;
alter table public.click_events enable row level security;
alter table public.subscriptions enable row level security;

-- ----------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------
create policy "profiles: owner select"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id);

-- ----------------------------------------------------------------
-- urls
-- ----------------------------------------------------------------
create policy "urls: owner select"
  on public.urls for select
  using (auth.uid() = user_id);

create policy "urls: owner insert"
  on public.urls for insert
  with check (auth.uid() = user_id);

create policy "urls: owner update"
  on public.urls for update
  using (auth.uid() = user_id);

create policy "urls: owner delete"
  on public.urls for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- qr_codes
-- ----------------------------------------------------------------
create policy "qr_codes: owner select"
  on public.qr_codes for select
  using (auth.uid() = user_id);

create policy "qr_codes: owner insert"
  on public.qr_codes for insert
  with check (auth.uid() = user_id);

create policy "qr_codes: owner update"
  on public.qr_codes for update
  using (auth.uid() = user_id);

create policy "qr_codes: owner delete"
  on public.qr_codes for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- click_events — read-only for URL owners
-- ----------------------------------------------------------------
create policy "click_events: url owner select"
  on public.click_events for select
  using (
    exists (
      select 1 from public.urls
      where urls.id = click_events.url_id
        and urls.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- subscriptions
-- ----------------------------------------------------------------
create policy "subscriptions: owner select"
  on public.subscriptions for select
  using (auth.uid() = user_id);
