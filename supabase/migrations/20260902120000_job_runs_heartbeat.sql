-- Backend-job heartbeat + kill switches (admin-portal P8, QA #15).
--
-- Until now NOTHING persisted a backend-job run: the purge cron, the backup Worker's reconcile and
-- prune, and the nightly DB-backup Action each answered "did you run?" only from a provider console
-- (Vercel logs, the Cloudflare dashboard, the Actions tab). A job that stopped firing was therefore
-- indistinguishable from a healthy one, which is the exact failure `durability-backups.md` names for
-- Pillar C. This migration adds the two pieces /admin/jobs needs:
--
-- 1) job_runs — one row per RUN. The job opens a row at start (`running`), closes it at the end with
--    a status, a duration and per-job counts. A run refused by its kill switch closes immediately as
--    `skipped`, so a paused job still reports in and never reads as missed. The freshness signal is
--    derived: no terminal row within 1.5x the job's cadence raises a Sentry event (from the daily
--    purge cron, the only scheduled app-side code) and shows on /admin/jobs.
--
-- 2) four ops_flags rows — the per-job kill switches, reusing the existing generic flag table
--    (`export_enabled` / `reel_render_enabled` are its siblings). Off = the job logs a skipped run
--    and exits, no redeploy needed. The two Cloudflare Worker jobs read their flag through the app's
--    /api/internal/job-run endpoint, because a Worker cannot reach the database.
--
-- ADDITIVE ONLY and compatible with main's deployed code: nothing here changes an existing table,
-- grant, RPC or trigger, so the currently deployed app keeps working before and after the apply. Ahead
-- of the apply the app tolerates the table's ABSENCE in exactly one place, the heartbeat write itself
-- (src/lib/db/queries/jobs.ts) — a job must never fail because its heartbeat could not be recorded, so
-- the write degrades to a captured warning and the sweep still runs. Every READ path (the /admin/jobs
-- page, the missed-run scan) uses mustQuery and surfaces the failure loudly instead.
--
-- No new RPC: /admin/jobs is already behind requireAdmin + AAL2 and reads through the service-role
-- admin client, exactly like /admin/exports. So the 0028/0029 advisor split is UNCHANGED by this
-- migration; job_runs joins the accepted `rls_enabled_no_policy` deny-all INFO set next to ops_flags.

create table public.job_runs (
  id uuid primary key default gen_random_uuid(),
  -- 'purge_cron' | 'backup_reconcile' | 'backup_prune' | 'db_backup'. Deliberately NOT an enum or a
  -- CHECK: the job catalog is TypeScript (src/app/admin/jobs/catalog.ts) and a new job must never
  -- need a migration to start reporting. An unknown id shows on /admin/jobs as an unrecognized job.
  job text not null,
  status text not null check (status in ('running', 'ok', 'error', 'skipped')),
  -- 'schedule' | 'manual' — how the run was triggered (operator Run now vs the cron).
  triggered_by text not null default 'schedule',
  started_at timestamptz not null default now(),
  -- Null while the run is in flight. A row still null well past the cadence is a STUCK run, and the
  -- freshness scan treats it exactly like a missing one (it never reported a result).
  finished_at timestamptz,
  duration_ms integer,
  -- Per-job tallies, free-form so a job can report what it actually did without a schema change
  -- (the purge cron reports its per-sweep summary; the Worker reports scanned/copied/deleted).
  counts jsonb,
  -- One short operator-readable line: the skip reason, or the error.
  note text
);

alter table public.job_runs enable row level security;
-- Deny-all: no RLS policy. Reads/writes happen ONLY via the service-role admin client (the jobs
-- themselves + the /admin/jobs readout), mirroring export_log.

-- The two access shapes: "the last N runs of this job" (the page + the freshness scan) and "the last
-- N runs across everything" (the page's combined feed).
create index job_runs_job_time_idx on public.job_runs (job, started_at desc);
create index job_runs_started_idx on public.job_runs (started_at desc);

-- Least-privilege (mirrors export_log / ops_flags): RLS already denies; revoke the default writes too
-- so the grant surface reads "service-role-only".
revoke insert, update, delete on public.job_runs from authenticated, anon;

-- Seed every kill switch ON. `on conflict do nothing` keeps a re-apply idempotent, and it is what
-- makes this safe to apply while the older code is still deployed: a flag nobody reads yet is inert.
insert into public.ops_flags (key, enabled) values
  ('purge_cron_enabled', true),
  ('backup_reconcile_enabled', true),
  ('backup_prune_enabled', true),
  ('db_backup_enabled', true)
on conflict (key) do nothing;
