-- ============================================================================
-- unlock_attempts — failed album-password unlock attempts, for the venue-NAT-aware
-- rate-limiter (security Phase 2, Part C). Service-role-only (deny-all RLS, the
-- sent_emails model): the /api/guests/unlock route reads/writes it via the admin
-- client. NO raw IP or qr_token is stored — only HMAC hashes (privacy, mirroring
-- link_stats' "no PII" stance): token_hash = HMAC(secret, "t:"||qr_token) is the
-- per-event scope; ip_hash = HMAC(secret, "i:"||qr_token||":"||ip) is the per-IP key.
-- ONLY FAILURES are recorded; a successful unlock deletes that ip_hash's rows, so a
-- venue crowd entering the correct shared password is never rate-limited. Pruned daily
-- by the lifecycle cron (sweepUnlockAttempts). No PK / FK: an append-only transient log.
-- ============================================================================
create table public.unlock_attempts (
  token_hash text not null,
  ip_hash text not null,
  attempted_at timestamptz not null default now()
);

alter table public.unlock_attempts enable row level security;
-- Deny-all: no RLS policy. Writes/reads happen ONLY via the service-role admin client.

create index unlock_attempts_token_time_idx on public.unlock_attempts (token_hash, attempted_at);
create index unlock_attempts_ip_time_idx on public.unlock_attempts (ip_hash, attempted_at);

-- Least-privilege: revoke the default write grants (RLS already denies; this matches the
-- Part B sweep so the grant surface reflects "service-role-only").
revoke insert, update, delete on public.unlock_attempts from authenticated, anon;
