-- ============================================================
-- QrHub RPC Functions — Run this THIRD in Supabase SQL Editor
-- ============================================================

-- Atomically increment URL click counter
create or replace function public.increment_url_clicks(p_url_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.urls
  set click_count = click_count + 1
  where id = p_url_id;
end;
$$;

-- Atomically increment QR scan counter
create or replace function public.increment_qr_scans(p_qr_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.qr_codes
  set scan_count = scan_count + 1
  where id = p_qr_id;
end;
$$;

-- Get click counts grouped by day for a URL
create or replace function public.get_clicks_by_day(
  p_url_id  uuid,
  p_days    int default 30
)
returns table (click_date date, click_count bigint)
language sql security definer as $$
  select
    date_trunc('day', clicked_at)::date as click_date,
    count(*) as click_count
  from public.click_events
  where url_id = p_url_id
    and clicked_at >= now() - (p_days || ' days')::interval
  group by 1
  order by 1;
$$;

-- Get device breakdown for a URL
create or replace function public.get_device_breakdown(
  p_url_id  uuid,
  p_days    int default 30
)
returns table (device_type text, cnt bigint)
language sql security definer as $$
  select
    coalesce(device_type, 'unknown') as device_type,
    count(*) as cnt
  from public.click_events
  where url_id = p_url_id
    and clicked_at >= now() - (p_days || ' days')::interval
  group by 1
  order by 2 desc;
$$;

-- Get country breakdown for a URL
create or replace function public.get_country_breakdown(
  p_url_id  uuid,
  p_days    int default 30
)
returns table (country text, cnt bigint)
language sql security definer as $$
  select
    coalesce(country, 'Unknown') as country,
    count(*) as cnt
  from public.click_events
  where url_id = p_url_id
    and clicked_at >= now() - (p_days || ' days')::interval
  group by 1
  order by 2 desc
  limit 10;
$$;

