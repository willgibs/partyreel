-- Abuse-focused rate limiter for the now-server-mediated guest write endpoints (join / report /
-- capture-email). The "H3b" piece deferred when create_guest/create_report/capture_guest_email were
-- server-mediated (ADR-0016) — those routes currently have NO throttle.
--
-- DESIGN (Will's directive): ABUSE-focused, NOT volume-focused. This is an event app — heavy traffic from
-- ONE NAT IP (a wedding/venue behind one WiFi/CGNAT) is NORMAL + legitimate, so a naive per-IP volume cap
-- would block the core use case. The venue-safe signal is **cross-event BREADTH**: one IP touching many
-- DISTINCT events = a scraper/bot (a venue is exactly ONE event → never trips). A per-(IP,event) backstop
-- with a HIGH ceiling only catches absurd single-event floods (well above any venue); raw volumetric DoS is
-- the Vercel edge firewall's job, not the app's. Mirrors the venue-NAT-aware unlock_attempts infra
-- (HMAC hashes only, deny-all, cron-pruned) but as a generic, action-keyed sibling table so unlock's
-- count-failures/clear-on-success semantics stay clean.
--
-- PRIVACY: stores ONLY HMAC hashes (keyed by UNLOCK_COOKIE_SECRET) — never a raw IP or qr_token. No PK/FK:
-- an append-only transient log, pruned by the lifecycle cron (sweepActionAttempts).

create table public.action_attempts (
  kind text not null, -- 'join' | 'report' | 'capture'
  ip_hash text not null, -- HMAC(secret, "a-ip:"||ip)
  scope_hash text, -- HMAC(secret, "a-scope:"||kind||":"||qr_token); NULL for per-IP-only kinds (capture)
  created_at timestamptz not null default now()
);

alter table public.action_attempts enable row level security;
-- Deny-all: no RLS policy. Reads/writes happen ONLY via the service-role admin client.

create index action_attempts_kind_ip_time_idx on public.action_attempts (kind, ip_hash, created_at);
create index action_attempts_kind_scope_time_idx on public.action_attempts (kind, scope_hash, created_at);

-- Least-privilege (mirrors unlock_attempts): RLS already denies; revoke the default writes too so the grant
-- surface reads "service-role-only".
revoke insert, update, delete on public.action_attempts from authenticated, anon;

-- The breadth + backstop snapshot in ONE round-trip. PostgREST can't COUNT(DISTINCT), so this SECURITY
-- DEFINER fn does it (service-role-only — NOT new external surface). Windows are passed by the caller (the
-- pure decision module owns the per-kind thresholds). `is not distinct from` makes the per-IP (NULL-scope)
-- count work for capture.
create or replace function public.action_rate(
  p_kind text,
  p_ip_hash text,
  p_scope_hash text,
  p_breadth_since timestamptz,
  p_scope_since timestamptz
) returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'distinct_scopes', (
      select count(distinct scope_hash) from public.action_attempts
      where kind = p_kind and ip_hash = p_ip_hash and created_at > p_breadth_since
    ),
    'scope_hits', (
      select count(*) from public.action_attempts
      where kind = p_kind and ip_hash = p_ip_hash and created_at > p_scope_since
        and scope_hash is not distinct from p_scope_hash
    )
  );
$$;

revoke execute on function public.action_rate(text, text, text, timestamptz, timestamptz)
  from public, anon, authenticated;
grant execute on function public.action_rate(text, text, text, timestamptz, timestamptz) to service_role;
