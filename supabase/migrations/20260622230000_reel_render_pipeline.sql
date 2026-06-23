-- Reel .mp4 export (Slice 3): the host renders the curated reel into a downloadable video on Remotion
-- Lambda (AWS), written directly to R2. This adds the render-tracking columns to highlight_reels, the
-- reel-render kill-switch flag, and the observability log (mirrors export_log + ops_flags).
--
-- highlight_reels already carries the COMPOSER config (theme/seed/length/cover) + status (reel_status =
-- pending|processing|ready) + output_key. The render LIFECYCLE adds:
--   * render_id          — the Remotion Lambda renderId (correlates the async webhook back to the row).
--   * rendered_hash      — sha256 of the render inputs (ordered media + theme/seed/length/cover +
--                          watermark + a version). The cache key: a re-download with an UNCHANGED hash
--                          serves the existing output_key mp4 for $0; a changed hash forces a re-render.
--   * render_error       — set on a Lambda error/timeout (status stays non-'ready' → the UI shows "failed").
--   * render_started_at  — stamped when a render is kicked off; a stale 'processing' (a silently-dead
--                          Lambda) is re-triggerable once it ages past the guard window.
--   * rendered_at        — when the mp4 landed (the webhook confirmed + HEADed the R2 object).
--   * render_cost_usd    — the render's accrued Lambda cost (from the webhook), for /admin/reels.
-- No reel_status enum churn: failure = render_error set + status left non-'ready'.
--
-- All writes stay service-role-only: the table already revoked insert/update/delete from authenticated
-- (the reel_config migration), so the render route/webhook (service-role) + upsert_reel_config are the
-- only writers. No new grants needed.

alter table public.highlight_reels
  add column render_id         text,
  add column rendered_hash     text,
  add column render_error      text,
  add column render_started_at timestamptz,
  add column rendered_at       timestamptz,
  add column render_cost_usd   numeric;

-- The reel-render kill-switch (mirrors export_enabled). The render route reads it and refuses to start a
-- new render when off, so an operator can halt ALL new renders from /admin without a redeploy.
insert into public.ops_flags (key, enabled) values ('reel_render_enabled', true)
on conflict (key) do nothing;

-- reel_render_log — the observability log for /admin/reels (P8: backend jobs operable + observable). Each
-- render ATTEMPT/COMPLETION writes one row: who (an HMAC-of-IP, never raw), what event, the renderId, the
-- outcome, and (on completion) duration + cost. Deny-all (RLS on, no policy) + writes revoked → the grant
-- surface reads "service-role-only". No FK on event_id (a transient log must never block an event delete).
create table public.reel_render_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_id uuid, -- the rendered event (no FK — see header)
  requester_hash text, -- HMAC(secret, ip); never a raw IP
  render_id text, -- the Remotion Lambda renderId (trace key)
  outcome text not null, -- 'minted' | 'cached' | 'rejected_empty' | 'rejected_mode' | 'rate_limited' | 'completed' | 'failed'
  duration_sec numeric,
  cost_usd numeric,
  error text
);

alter table public.reel_render_log enable row level security;
-- Deny-all: no RLS policy. Reads/writes happen ONLY via the service-role admin client.

create index reel_render_log_created_idx on public.reel_render_log (created_at desc);
create index reel_render_log_event_time_idx on public.reel_render_log (event_id, created_at desc);

-- Least-privilege (mirrors export_log / action_attempts): RLS already denies; revoke the default writes
-- too so the grant surface reads "service-role-only".
revoke insert, update, delete on public.reel_render_log from authenticated, anon;
