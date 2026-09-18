---
track: admin-jobs
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "0681652c"         # the launch-prep SHA the branch was cut from
board: none             # an engineering lane: every backend job on the one heartbeat, zero silent failures
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/admin/jobs/
  - src/lib/db/queries/jobs.ts
  - src/app/api/internal/job-run/
  - src/lib/jobs/
  - workers/backup/src/
  - src/lib/security/abuse-rate-limit.ts
  - src/lib/email/send.ts
  - src/components/admin/operator-alerts.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/admin-observability.md
  - docs/systems/durability-backups.md
  - docs/systems/lifecycle-recovery.md
  - src/app/api/cron/purge/route.ts
  - src/lib/env.ts
  - src/lib/db/types.ts
---

# lp/admin-jobs

**Goal.** The ROADMAP's P8 mandate made literally true: every backend job manageable and health-surfaced
in `/admin/jobs` with zero silent failures. Four report today through the one heartbeat (`job_runs`,
`jobs/catalog.ts`'s pure `jobHealth`, the Sentry `job_missed_run` scan): the purge cron, the backup
reconcile, the backup prune, the DB backup. Four do not, and this lane wires them: (1) the backup Worker's
QUEUE and DEAD-LETTER depth (Cloudflare dashboard only today); (2) the purge cron's four SUB-SWEEPS
(orphan, account-deletion, inactivity, over-capacity) as jobs of their own with counts, so one bad row
stops one sweep, not the run (ROADMAP QA #27's per-row isolation belongs here); (3) transactional EMAIL
(`sent_emails`: failures and refusals in the last 24h; and the quick win, `assertResendEnv` hoisted
ABOVE the `sent_emails` claim so a throw never leaves a claim row that suppresses that dedupe key for
good); (4) the LIMITERS (`action_attempts`: a limiter error is silent today by design of fail-open; add
the observability, a `captureError` and a 24h signal, in both the abuse store and the unlock limiter,
ROADMAP QA #19). A backend job ships its `/admin` management and its health signal in the same change.
**Not in this round:** the console's LOOK (the `admin` board is drawing it; you extend today's page and
catalog), the deployment split (`admin-split` owns `src/proxy.ts` and `src/app/api/cron/purge/route.ts`:
you READ the purge route; if a sub-sweep needs a change inside it, write the exact diff in your Handoff
for the Orchestrator to land at the merge), any Worker DEPLOY or migration APPLY (you write the SQL file
and the Worker code; the Orchestrator applies and deploys), the cursors (#37/#38) unless they fall out of
the isolation work for free.

**Binds.** `docs/systems/admin-observability.md` (the heartbeat's contract; the catalog and the alerting
scan share `jobHealth` so they cannot drift), `docs/systems/durability-backups.md` (the Worker, the
Bucket Lock, the prune in dry-run: change no lifecycle rule), `docs/systems/lifecycle-recovery.md` (the
sweeps' invariants: events have no end date, deletion is the only exit), `docs/systems/database-security.md`
(service-role reads, additive-only migrations while any branch is unmerged). Zero silent failures means a
job that stops running PAGES; a calm page of empty cards is the failure mode this lane exists to remove.

## What to build

1. **The catalog**: entries for the DLQ, the four sub-sweeps, email and the limiters, each with its
   cadence, its health rule (`jobHealth` extended, pure, tested in `catalog.test.ts`), and its kill switch
   where a kill switch is meaningful (`ops_flags`).
2. **The heartbeats**: the Worker reports queue and DLQ depth on every run (its `job-heartbeat.ts`, the
   internal `job-run` route accepting the new fields; additive); the purge cron's sweeps each record their
   own run row with counts and their own failure, isolated per row; email and the limiters record a
   rolling 24h signal (a query over `sent_emails` / `action_attempts`, or a row per day, your call, said
   in Handoff with its cost).
3. **The console**: rows for the new jobs on today's `/admin/jobs` page and its `jobHealth` badges; the
   `OperatorAlerts` bell learns the new unhealthy states; Sentry `job_missed_run` covers the new jobs.
4. **The docs**: the three system docs' lines refined in place (the jobs table in admin-observability.md
   above all), listed under System-doc edits.
5. **Tests**: `catalog.test.ts` for every new health rule; the Worker's vitest for the depth report; a test
   for the sweep isolation; the email hoist; the limiter's observability.

## Verify, and the gate

Locally: `pnpm dev -p 3134` (the admin is reachable at `/admin` with `NEXT_PUBLIC_ADMIN_HOST` unset, and
signed in as the admin needs the allow-listed flow, so verify the page with the internal route and the
queries against the real database with DISPOSABLE rows, rolled back or deleted; the console itself renders
under `pnpm build`), the Worker with its own vitest, the internal route with curl and the shared secret
(never printed). Dev server on port 3134, stopped by port (`lsof -ti tcp:3134 | xargs -I{} kill {}`). The
gate, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`,
`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3134`,
and the Worker's `npm test` in `workers/backup`.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree, each step's own exit code, the Worker's tests included
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + the listed system docs + any migration file
- Each job, one line: what it reports, its health rule, its kill switch, its alert
- Proposed migrations (the SQL file's path) / Worker deploy (which Worker, what changed) / env changes / the purge route diff if any
- What the Orchestrator verifies live after the deploy (the exact signals to read on `/admin/jobs` and in Sentry)
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
