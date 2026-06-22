-- "Download all" zip export (the streaming export Worker, workers/export): two service-role-only tables.
--
-- 1) export_log — the observability log for the admin portal (P8: backend jobs must be operable +
--    observable from /admin). The mint routes are the natural choke point (they authorize + build the
--    manifest), so each export ATTEMPT writes one row here: who (scope + an HMAC-of-IP, never a raw IP),
--    what event, how many items / bytes, the token nonce (jti) for replay/trace, and the outcome. The
--    Worker itself can't reach the DB (same constraint as the backup Worker), so Worker-side stream
--    failures surface in Cloudflare's structured logs, not here.
--
-- 2) ops_flags — a tiny single-row-per-key settings table backing the export KILL-SWITCH. The mint route
--    reads `export_enabled` and refuses to mint when off, so an operator can halt ALL new exports from
--    /admin within ~2 min (live tokens expire) WITHOUT a Worker redeploy. Generic so future ops toggles
--    reuse it.
--
-- Both are DENY-ALL (RLS on, no policy) + the default writes revoked, so the grant surface reads
-- "service-role-only" — reads/writes happen ONLY via the service-role admin client (the mint routes + the
-- admin readout/toggle). No FK on export_log.event_id (a transient observability log must never couple to
-- the events lifecycle / block a delete); the admin readout resolves event names with a separate lookup.

create table public.export_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  scope text not null, -- 'host' | 'guest'
  event_id uuid, -- the exported event (no FK — see header)
  requester_hash text, -- HMAC(secret, ip); never a raw IP
  item_count integer not null default 0,
  total_bytes bigint not null default 0,
  jti text, -- the manifest-token nonce (replay/trace key)
  outcome text not null, -- 'minted' | 'rejected_cap' | 'rejected_empty' | 'rejected_mode' | 'rejected_access' | 'rate_limited'
  error text
);

alter table public.export_log enable row level security;
-- Deny-all: no RLS policy. Reads/writes happen ONLY via the service-role admin client.

create index export_log_created_idx on public.export_log (created_at desc);
create index export_log_event_time_idx on public.export_log (event_id, created_at desc);

-- Least-privilege (mirrors action_attempts): RLS already denies; revoke the default writes too so the
-- grant surface reads "service-role-only".
revoke insert, update, delete on public.export_log from authenticated, anon;

create table public.ops_flags (
  key text primary key,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.ops_flags enable row level security;
-- Deny-all: no RLS policy. The mint route reads + the admin toggle writes, both service-role only.

revoke insert, update, delete on public.ops_flags from authenticated, anon;

-- Seed the export kill-switch ON. `on conflict do nothing` keeps re-apply idempotent.
insert into public.ops_flags (key, enabled) values ('export_enabled', true)
on conflict (key) do nothing;
