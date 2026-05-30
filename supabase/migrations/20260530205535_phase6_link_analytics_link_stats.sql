-- Phase 6 (link analytics) — aggregate per-day scan/view counters, NO PII.
--
-- WHY aggregate counters (not a per-hit log): privacy-first + lightweight. We store
-- only counts of link traffic per event per day — never an IP, user-agent, or any
-- visitor identity. <=2 rows/event/day. (Same per-period counter idea as storage_ledger.)
create type public.link_hit_kind as enum ('qr_scan', 'album_view');

create table public.link_stats (
  event_id uuid not null references public.events (id) on delete cascade,
  kind public.link_hit_kind not null,
  day date not null default current_date,
  count integer not null default 0,
  primary key (event_id, kind, day)
);

alter table public.link_stats enable row level security;

-- Hosts read their OWN events' stats (mirrors media_host_all's ownership check). There is
-- deliberately NO write policy — writes happen ONLY via the service-role record_link_hit
-- RPC below. Because this table HAS a policy, it gets no rls_enabled_no_policy advisor INFO.
create policy link_stats_host_select on public.link_stats
  for select to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = link_stats.event_id and e.host_id = (select auth.uid())
    )
  );

-- Atomic upsert-increment for one hit. SECURITY DEFINER so it writes past the
-- (write-denying) RLS, but REVOKED from anon/authenticated and called ONLY by the
-- service-role admin client from the guest pages' after() — the server has already
-- validated the token, so there's NO anon capability-token surface here. This function
-- must NEVER appear in the anon advisor list (same locked-down class as purge_media_rows).
create or replace function public.record_link_hit(
  p_event_id uuid,
  p_kind public.link_hit_kind
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.link_stats (event_id, kind, day, count)
  values (p_event_id, p_kind, current_date, 1)
  on conflict (event_id, kind, day)
  do update set count = link_stats.count + 1;
$$;

revoke execute on function public.record_link_hit(uuid, public.link_hit_kind)
  from public, anon, authenticated;
