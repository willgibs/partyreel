---
track: ops-hardening
status: handed-off
cut: "26f7e52"
preview: true
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

- `docs/systems/admin-observability.md`: `**Jobs (P8)**` joins the Surfaces list, and the "P8
  (planned)" paragraph becomes a "Backend jobs" section (the heartbeat contract, the skipped-run rule,
  the four fail-open/fail-closed postures, the missed-run signal riding the purge cron, why the writes
  degrade while the reads throw, and why the two remote jobs have no Run now). The Sentry PII line is
  refined in place with the capability-token scrub.
- `docs/systems/durability-backups.md`: the DB-backup row in the failure-points table no longer says a
  persistent failure is only as visible as the Actions tab; the prune's "observability is alert-only,
  the heartbeat is deferred to P8" line is now the shipped heartbeat; the closing P8 pointer becomes
  the Worker's derived-URL rule plus its two opposite postures.
- `docs/systems/database-security.md` (ADDED to the stub's list; the fact lives in the owned
  `src/lib/security/`): `public-form-limit.ts` joins the rate-limiter list, and the rate-limit gotcha
  gains the one limiter that fails CLOSED, with the reason it is the exception.

## Deferred (ROADMAP one-liners, bucket named)

- **QA hardening bucket:** a report-only CSP, then an enforced one (a per-request nonce threaded
  through the streaming render plus an inventory of every inline style; ruled out of this round as its
  own project, and the manifest allowed report-only "at most").
- **QA hardening bucket:** `X-Frame-Options` / CSP `frame-ancestors` (clickjacking) was not in this
  round's named header set; it is a one-line add once the CSP question above is settled.
- **QA hardening bucket:** Session Replay records DOM snapshots, and an `href` in the captured markup
  can still carry `/e/<qr_token>`; walking every node of every snapshot in a hot path costs more than
  it buys, so the replay scrub covers custom (breadcrumb + performance) frames only.
- **QA hardening bucket:** a dedicated `JOB_API_SECRET` instead of reusing `PRUNE_API_SECRET` as the
  shared internal-jobs bearer (cleaner naming; deliberately not done here to avoid a third secret in
  three homes plus a Worker secret plus a GitHub secret).
- **Launch checkpoint:** submit the apex to the HSTS preload list `[human]` (a one-way door for the
  domain and every future subdomain; `max-age` already meets the list's requirement).
- **Launch checkpoint:** add `PRUNE_API_SECRET` as a GitHub Actions repo secret so the nightly DB
  backup reports to `/admin/jobs` (see Proposed changes below).

## Handoff

- Head is the last commit on `lp/ops-hardening`, pushed; the gates below ran on `206f8c1`, the
  pre-handoff merge, which the handoff commits only add this file to. Preview
  `partyreel-git-lp-ops-hardening-partyreel.vercel.app` (`preview: true`) for the headers curl; the
  sign-in-gated `/admin/jobs` walk belongs on the launch-prep alias after the migration is applied.
- Synced with `origin/launch-prep` at `4a092ea` (it had moved 23 commits, incl. milestone-18 and the
  demo-seed merge); merged, no conflicts.
- Gates on the synced tree, each on its own exit code: typecheck ok, lint ok (0 errors, the
  pre-existing `contact-form.tsx` react-compiler warning), test ok (1561), build ok (244 pages).
  The Worker's own gates ran separately in `workers/backup`: typecheck ok, test ok (26), and
  `wrangler deploy --dry-run` bundles at 13.16 KiB with its bindings unchanged.
- Lane check `git diff --name-only origin/launch-prep...HEAD` = 29 files, all owned except three,
  each allowed by the manifest: `next.config.ts` (the headers, by ruling),
  `supabase/migrations/20260902120000_job_runs_heartbeat.sql` (the ONE additive migration, by ruling),
  and the three `docs/systems/` files listed above. `src/instrumentation.ts` is owned but UNCHANGED:
  `register()` already loads the two runtime configs, so the scrub needed no edit there.
- **Proposed migrations:** `supabase/migrations/20260902120000_job_runs_heartbeat.sql`, additive only.
  Creates `job_runs` (deny-all, RLS on, no policy, default writes revoked, two indexes) and seeds four
  `ops_flags` rows `on conflict do nothing`. No RPC, no grant change, no DDL on an existing object, so
  the 0028/0029 advisor split is unchanged and `job_runs` joins the accepted `rls_enabled_no_policy`
  INFO set next to `ops_flags`. Compatible with `main`'s deployed code (which reads none of it). After
  applying: `get_advisors`, then regenerate `types.ts` — and then DELETE the `JobRunsDatabase` block
  and the cast in `jobRunsDb()` at the top of `src/lib/db/queries/jobs.ts`, which exist only because
  the generated types cannot know the table before it is applied (the file says so).
- **Proposed config, both optional and both fail-safe if skipped:** (1) a GitHub Actions repo secret
  `PRUNE_API_SECRET` (the same value as the Vercel env var and the Worker secret) so the nightly DB
  backup gates and reports; without it the workflow runs exactly as before and `db_backup` simply shows
  as "No runs yet". (2) nothing for the Worker: its job endpoint is DERIVED from the existing
  `PRUNE_API_URL`, so `wrangler.jsonc` and its secrets are untouched and a redeploy is all that is
  needed. No new env var was added to `env.ts`.
- **Look at first**, in this order:
  1. `/admin/jobs` on the launch-prep alias AFTER the migration is applied (it needs the admin sign-in,
     so it could not be walked from here). Before the migration it deliberately draws a red "Heartbeat
     unreadable" banner rather than a calm page of empty cards.
  2. The four cards' health, then Run now on the purge sweep, then pause it and hit Run now again: the
     response should be `{"ok":true,"skipped":true,"reason":"paused"}` and a `skipped` row should
     appear. Unpause afterwards.
  3. The headers on the branch preview: `curl -sI https://partyreel-git-lp-ops-hardening-partyreel.vercel.app/`
     should show the four headers and NO `x-powered-by`.
- **Verified locally** (dev server on :3021 against prod Supabase/R2, all test data deleted after):
  the four headers on a page and on an API route with `x-powered-by` gone; `/api/cron/purge` 401 with
  no secret, 401 with a wrong one, 200 with the real one (all sweeps zero, nothing deleted);
  `/api/internal/job-run` 401 unauthenticated, 401 on a wrong bearer, 400 on a malformed body, an
  unknown job id, an over-long note and a nested `counts`; the heartbeat degrading correctly with
  `job_runs` absent (the run completes, only `job_health` reports the missing table, by name); the
  paused paths for both `purge_cron` and `backup_prune` (flags inserted, exercised, then DELETED, so
  `ops_flags` is back to its original two rows); and the contact limiter tripped on purpose end to end,
  refusing at the ceiling with the real copy and writing NO `contact_submissions` row and no Resend
  send, after an accepted submission proved `action_attempts.kind` really is generic. The one thing
  local testing could not reach is a `job_runs` row, because the migration is the Orchestrator's.
- **Verified on the deployed branch preview** (`13acb01`, READY): all four headers present on `/`
  and on `/contact` over real HTTPS with NO `x-powered-by` anywhere; `/api/internal/job-run` 401s
  unauthenticated and on a wrong bearer, and `/api/cron/purge` 401s unauthenticated. CI green on the
  branch tip (run 33681906803).
- **One bug this round found in its own work**, worth knowing because it is the shape of the window
  this branch ships into: the cron's two EARLY-RETURN paths (paused, switch unreadable) called the
  freshness scan unguarded, so a correctly-skipped run answered 500 against a database without
  `job_runs`. Fixed in `d7e67b9`; the scan now degrades to a captured error on those paths too.

## Record

Merged into `launch-prep` at `<sha>` (2026-09-02). Every backend job is now operable from `/admin`
with zero silent failures. One additive migration adds `job_runs` (deny-all, service-role only) and
four `ops_flags` kill switches; the purge cron, the backup Worker's reconcile and prune, and the
nightly DB-backup Action each open a run and close it with a status, a duration and their own counts,
and a paused job logs a SKIPPED run so pausing never reads as a fault. The two jobs that cannot reach
the database report through a new `/api/internal/job-run` on a URL DERIVED from `PRUNE_API_URL`, so
nothing new had to be deployed. Their postures are opposite on purpose: the reconcile and the DB
backup run anyway when the heartbeat is unreachable, the prune and the purge cron refuse. The purge
cron, the only scheduled app-side code, carries the platform freshness scan and raises one Sentry
`job_missed_run` per job with no terminal row inside 1.5x its cadence, using the same pure `jobHealth`
the console renders. `/admin/jobs` shows all four with their last runs, the switches, and Run now for
the one job the app can honestly start; an unreadable heartbeat draws a loud banner instead of empty
cards. The public /contact and /careers forms gained the one limiter in the app that fails CLOSED,
because they have no capability token behind them and each accepted submission spends the Resend quota
the breaker alerts also send on. `next.config.ts` drops `X-Powered-By` and adds HSTS, nosniff, a
referrer policy and a Permissions-Policy (no CSP: that is its own round). And guest capability tokens
are scrubbed from every telemetry channel, not just error events: an event processor, a breadcrumb
hook and a replay-frame hook in all three runtimes, matching the token shape as well as the `/e/` route.
