---
track: ops-hardening
status: open
cut: "26f7e52"
preview: false
owns:
  - src/app/api/cron/purge/route.ts
  - src/app/api/internal/
  - workers/backup/src/
  - .github/workflows/db-backup.yml
  - src/app/admin/jobs/
  - src/lib/db/queries/jobs.ts
  - src/lib/admin/nav.ts
  - src/components/admin/
  - src/instrumentation.ts
  - src/instrumentation-client.ts
  - src/sentry.edge.config.ts
  - src/sentry.server.config.ts
  - src/lib/security/
  - src/app/(marketing)/(paper)/contact/actions.ts
  - src/app/(marketing)/(cinema)/careers/actions.ts
  - src/lib/email/templates.ts
reads:
  - src/lib/env.ts
  - src/lib/db/types.ts
  - src/lib/supabase/admin.ts
---
# lp/ops-hardening

**Goal.** Every backend job is operable from `/admin` with zero silent failures, the public forms
cannot drain Resend, and the headers and Sentry are launch-grade. (1) **Jobs:** the purge cron, the
backup prune Worker, the DB-backup Action and the reconcile each get a kill switch (an `ops_flags` row
read at the top of the run: a paused job logs a skipped run and exits), a `job_runs` heartbeat (a row at
start, finished with status and counts), and a missed-run signal (no finish within 1.5x the cadence
raises a Sentry event and shows on `/admin/jobs`); `/admin/jobs` lists every job, its last runs, the
switch, and a run-now where the job allows it (the P8 mandate in `admin-observability.md`). (2) **Forms:**
the contact and careers limiters fail CLOSED, and a limiter error reports to Sentry (QA #19, the silent
failure). (3) **Headers:** QA #42 (`poweredByHeader` off, HSTS, `X-Content-Type-Options`,
`Referrer-Policy`, `Permissions-Policy`); no enforced CSP (report-only at most). (4) **Sentry:** guest
capability tokens ride the URL path, and `beforeSend` is error-events-only, so scrub them from
breadcrumbs, transactions and replay URLs too (QA #22). Size L.

**Rulings in force.** none. Defaults: a paused job logs a skipped run; missed = no finish within 1.5x
the cadence; no enforced CSP.

**Also touches, by ruling (explain in the lane check):** `next.config.ts` (the headers); ONE additive
migration file under `supabase/migrations/` (`job_runs` + three `ops_flags` rows; write the file only,
the Orchestrator applies it, runs `get_advisors` and regenerates `types.ts`; RLS deny-all, service-role
writes only, an admin read RPC if the page needs one).

**Verify on.** Locally: the cron route with its secret and with the flag paused (a skipped `job_runs`
row); the Worker in dry-run; a rolled-back RPC contract check for the migration; the contact limiter
tripped on purpose. The branch preview: `curl -I` for the headers. `/admin/jobs` needs the admin
sign-in, so list it under "Look at first": the Orchestrator walks it on the launch-prep alias.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/admin-observability.md`: the jobs page, the flags, the heartbeat, the alert.
- `docs/systems/durability-backups.md`: the Worker's flag and heartbeat.

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff

- to be filled at handoff

## Record

- to be filled at integration
