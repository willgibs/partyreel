-- Sub-sweep kill switches + the transactional-email signal's index (the admin-jobs round).
--
-- ADDITIVE ONLY, and deliberately small: everything else this round needed was already possible
-- against the shipped schema. `job_runs.job` is unconstrained by design (20260902120000), so the
-- four purge sub-sweeps, the two Cloudflare depth readings and the three rolling signals all write
-- and read through the existing table without a single column change. This file carries the two
-- things that genuinely could not be done in TypeScript.
--
-- 1) FOUR ops_flags ROWS — one kill switch per promoted purge sub-sweep. The purge cron ran eleven
--    sweeps behind ONE switch, so pausing the inactivity sweep for a night meant giving up storage
--    reclamation entirely. Each promoted sweep now reads its own flag at the top of its run and logs
--    a `skipped` row when it is off, exactly like a top-level job.
--
--    Strictly speaking these rows are optional: `getJobFlags` reads a MISSING row as enabled and
--    `setJobEnabled` upserts, so /admin/jobs works without them. They are seeded anyway so the live
--    table lists every switch that exists rather than only the ones somebody has already toggled —
--    an operator reading `ops_flags` directly should see the whole set.
--
-- 2) ONE INDEX on sent_emails (sent_at desc) — the /admin/jobs email signal counts sends in a
--    rolling 24h window, and `sent_emails` had no index on its time column at all (only the unique
--    (kind, dedupe_key) and the profile FK). The table is small today and stays bounded by the
--    3,000/month Resend free tier, so this is a cheap head start rather than a fix for a problem we
--    have; it also makes the same window usable outside the admin page later.
--
-- Compatible with the currently deployed code in both directions: a flag row nobody reads yet is
-- inert, and an index changes no behaviour. No grant, RPC, policy or trigger is touched, so the
-- 0028/0029 advisor split is unchanged by this migration.

-- Seed every sub-sweep switch ON. `on conflict do nothing` keeps a re-apply idempotent and makes
-- this safe to apply while the older code is still deployed.
insert into public.ops_flags (key, enabled) values
  ('purge_orphans_enabled', true),
  ('purge_deleted_accounts_enabled', true),
  ('purge_inactivity_enabled', true),
  ('purge_over_capacity_enabled', true)
on conflict (key) do nothing;

-- The 24h window the transactional-email signal counts over.
create index if not exists sent_emails_sent_at_idx
  on public.sent_emails (sent_at desc);
