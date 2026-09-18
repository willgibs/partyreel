---
track: admin-jobs
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **The lane's `owns` does not cover the files four of the six changes have to touch.** The goal says
  the limiter observability goes "in both the abuse store and the unlock limiter", but `owns` lists
  only `src/lib/security/abuse-rate-limit.ts` — the PURE core, which by construction can hold no
  observability at all. Same for the alerts bell (`operator-alerts.tsx` is owned, the layout that
  feeds it is not) and the account-deletion sweep's loop. **Recommended, and what I did:** treat all
  four exactly as the goal already treats the purge route — build everything possible in owned files,
  and hand the rest as one exact patch below. Kept the lane check clean. If the intent was that I
  edit them, the patch is the same change and lands in one command.
- **Kill switches for the four sub-sweeps: four new `ops_flags` rows, or inherit the purge cron's?**
  **Recommended, and what I did:** four of their own. Pausing the inactivity sweep for a night
  without giving up storage reclamation is a real operator need, it costs nothing (a missing row
  already reads as enabled and `setJobEnabled` upserts), and the parent switch still stops all five.
- **The rolling signals: a query or a row per day?** **A QUERY, and the cost is why.** Six bounded
  head-counts per page load: `sent_emails` (bounded by the 3,000/month Resend tier),
  `action_attempts` and `unlock_attempts` (both pruned to 24h by the purge cron's own sweeps), and
  three `job_runs` counts on the existing `(job, started_at desc)` index. A row-per-day aggregate
  would need a table, a writer, a backfill and its own failure mode to save that, on a page only an
  operator opens. The migration adds `sent_emails (sent_at desc)` as the first step of the other
  road if it is ever needed.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/admin-observability.md` — the Surfaces bullet for Jobs, widened to what the console
  now holds.
- `docs/systems/admin-observability.md` — "Backend jobs": the THREE KINDS table (scheduled / signal /
  derived) and the full JOBS table, replacing the old four-job prose.
- `docs/systems/admin-observability.md` — the missed-run bullet, extended with why a freshness rule
  can only page on SILENCE and where the depth and signal alerts are raised instead.
- `docs/systems/admin-observability.md` — three new bullets: a sub-sweep is a job; per-row isolation
  never buys silence; a signal's failure count is a floor, not a census.
- `docs/systems/admin-observability.md` — the internal-route bullet, extended with why `counts` is
  additive and why only a `scheduled` job may open a run; plus the new "a missing reading is never a
  zero" bullet.
- `docs/systems/durability-backups.md` — the failure-points table: the queue-backlog row now says the
  depth is reported, and a new row for objects stuck in the DLQ.
- `docs/systems/durability-backups.md` — a new ★ paragraph on the queue and dead-letter depth
  reading (the bindings, the count keys, the guarded reads, no-key-rather-than-zero).
- `docs/systems/lifecycle-recovery.md` — "The daily cron": the sweep list corrected to include
  `deleted_accounts`, the four promoted sub-sweeps, and QA #27 marked closed with how.
- `docs/systems/lifecycle-recovery.md` — the `sendOnce` invariant, plus two new ★ bullets: every
  fallible call is above the claim, and a failed send is no longer silent.

## Deferred (ROADMAP one-liners, bucket named)

- **Abuse + jobs + observability:** replay a dead letter from `/admin/jobs` (the depth is reported
  and the daily reconcile is the remedy; an actual replay wants a DLQ consumer in `wrangler.jsonc`,
  which changes delivery semantics and is not cheap).
- **Abuse + jobs + observability:** #37/#38, the reconcile and orphan pagination cursors, untouched —
  they did not fall out of the isolation work.
- **Abuse + jobs + observability:** a per-day `job_signals` aggregate if `sent_emails` ever outgrows a
  24h head-count (the `sent_at` index in this round's migration is the first step).

## Handoff (replaces the chat report)

- Head **`35364fa1`** (this commit), pushed. `origin/launch-prep` HAD moved: synced by merge at **`ef044ee8`**
  (docs only, `docs/tracks/orchestrator.md`); the whole gate re-run on the synced tree.

**Gate, each step its own exit code, on the synced tree**

| step | exit |
| --- | --- |
| `pnpm design:rules` | 0 |
| `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` | 0 |
| `pnpm typecheck` | 0 |
| `pnpm lint` | 0 (the 8 known warnings, 0 errors) |
| `pnpm test` | **1** — see "Look at first"; 2255 pass, the ONE failure is pre-existing on the cut |
| `pnpm build` (server killed by port first) | 0 |
| `pnpm lab:smoke --base http://localhost:3134` | 260 checks, 0 failing |
| `npm test` in `workers/backup` | 0 (4 files, 38 tests) |

**Lane check** — `git diff --name-only origin/launch-prep...HEAD`:

```
docs/systems/admin-observability.md
docs/systems/durability-backups.md
docs/systems/lifecycle-recovery.md
docs/tracks/admin-jobs.md
src/app/admin/jobs/actions.ts
src/app/admin/jobs/catalog.test.ts
src/app/admin/jobs/catalog.ts
src/app/admin/jobs/page.tsx
src/app/api/internal/job-run/route.ts
src/components/admin/operator-alerts.tsx
src/lib/db/queries/jobs.ts
src/lib/email/send.ts
src/lib/jobs/failure-log.ts
src/lib/jobs/health-summary.ts
src/lib/jobs/isolate.test.ts
src/lib/jobs/isolate.ts
src/lib/jobs/purge-sweeps.ts
src/lib/jobs/sweep-tally.test.ts
src/lib/jobs/sweep-tally.ts
src/lib/jobs/throttle.ts
supabase/migrations/20260918120000_job_subsweeps_and_signals.sql
workers/backup/src/index.ts
workers/backup/src/job-heartbeat.ts
workers/backup/src/queue-metrics.test.ts
workers/backup/src/queue-metrics.ts
```

Every line is an `owns` prefix, this manifest, a listed system doc, or the migration.

**The nine new jobs, one line each** (kind · what it reports · health rule · kill switch · alert)

| job | kind | reports | health | switch | alert |
| --- | --- | --- | --- | --- | --- |
| `purge_orphans` | scheduled, daily inside the purge | pages scanned, objects deleted, breaker trips | the standard cadence rule (1.5x daily) | `purge_orphans_enabled`, fails CLOSED unreadable | `job_missed_run` via the existing scan |
| `purge_deleted_accounts` | scheduled, same | accounts finished / held, bytes freed, `rows_failed` | same, plus `rows_failed > 0` closes the run as an error | `purge_deleted_accounts_enabled`, fails closed | `job_missed_run`; each isolated row also raises its own `captureError` |
| `purge_inactivity` | scheduled, same | candidates, warned, removed, `rows_failed` | same | `purge_inactivity_enabled`, fails closed | same |
| `purge_over_capacity` | scheduled, same | grace opened, reminded, reduced, `rows_failed` | same | `purge_over_capacity_enabled`, fails closed | same |
| `backup_queue` | derived, read on every Worker run | the live copy queue's backlog + oldest message | `>= 500` is `attention`; an unwell source outranks the number; no reading is `never`, never a zero | none (nothing to pause) | `job_queue_backlog` raised inside `/api/internal/job-run` as the reading arrives |
| `backup_dead_letters` | derived, same | objects the live path gave up on + oldest | **ANY dead letter is `failed`**; same source + no-reading rules | none | `job_dead_letters_pending`, same place |
| `email_delivery` | signal, rolling 24h | sends vs failed-or-refused sends | any failure → `failed`; activity and no failure → `ok`; nothing at all → "No activity", never green | none | a Sentry event per failure at the send site, unthrottled |
| `abuse_limiter` | signal, rolling 24h | actions recorded vs limiter errors | same | none | same, at the store |
| `unlock_limiter` | signal, rolling 24h | failed unlocks recorded vs limiter errors | same | none | same, at the store |

**Migration** — `supabase/migrations/20260918120000_job_subsweeps_and_signals.sql`, **written, not
applied**. Additive only: four `ops_flags` seed rows (`on conflict do nothing`) and
`create index if not exists sent_emails_sent_at_idx`. Nothing depends on it — a missing flag row
already reads as enabled and `setJobEnabled` upserts — so applying it before or after the deploy is
equally safe. Run `get_advisors` after the apply out of habit; no table, grant, policy or RPC changes,
so the accepted advisor set should be unchanged.

**Worker deploy** — `partyreel-backup`, from `workers/backup/`, and it needs the
`wrangler.jsonc` change in the patch below FIRST (the two producer bindings). `wrangler whoami` must
show the P3 Cloudflare team. `wrangler deploy --dry-run --outdir=dist` was run here and lists
`env.BACKUP_QUEUE (partyreel-backup)` and `env.BACKUP_DLQ (partyreel-backup-dlq)` as Queue bindings
alongside the two R2 buckets. Producer bindings do NOT change delivery: the DLQ still has no
consumer, nothing drains it, and the daily reconcile stays the thing that copies what the queue
missed. No new secret, no new var.

**Env changes** — none.

### The cross-lane patch (apply at the merge, or four cards read "No runs yet" forever)

Six files outside this lane's `owns`. **Everything in this branch that depends on them is inert until
this lands**: the four sub-sweep cards would show "No runs yet" indefinitely, the two limiter signals
would show "No activity" indefinitely, the bell would not count jobs, and
`src/lib/jobs/{isolate,purge-sweeps,health-summary}.ts` would be unreferenced code with passing tests.

It was written, APPLIED locally, gated (typecheck 0, lint 0, `pnpm test` the same single pre-existing
failure, `pnpm build` 0, the Worker dry-run clean), then reverted so the lane check stays clean.
`git apply --check` passes at this head. Review it with `git diff -w` afterwards: 198 semantic lines,
the rest is the one-level reindent of two loop bodies into a callback.

| file | change |
| --- | --- |
| `src/app/api/cron/purge/route.ts` | `runSweep` delegates to `createSweepRunner(triggeredBy)`; per-row isolation on the `over_capacity`, `renewal_nudges` and `inactive_free_events` loops, each returning `rows_failed` / `rows_not_attempted` / `rows_note` |
| `src/lib/lifecycle/account-deletion.ts` | per-row isolation on the candidate loop, same tally fields |
| `src/lib/security/abuse-rate-limit-store.ts` | `checkAbuseRate` records the read failure into the `abuse_limiter` signal and rethrows; `recordAbuseEvent` reports its swallowed INSERT error (the worse half: a failing insert means the limiter counts nothing, so every later decision reads zero hits and ALLOWS) |
| `src/lib/security/unlock-rate-limit-store.ts` | the same two, for `checkUnlockRate` and `recordUnlockFailure` |
| `src/app/admin/layout.tsx` | `countUnhealthyJobs()` into the alerts bell's counts |
| `workers/backup/wrangler.jsonc` | the two queue producer bindings the depth reading needs |

Extract and apply:

```bash
awk '/^--- BEGIN CROSS-LANE PATCH/{f=1;next} /^--- END CROSS-LANE PATCH/{f=0} f' \
  docs/tracks/admin-jobs.md > /tmp/admin-jobs-cross-lane.patch
git apply --check /tmp/admin-jobs-cross-lane.patch && git apply /tmp/admin-jobs-cross-lane.patch
```

The patch itself is the last section of this file, between the two markers.

**What to verify live after the deploy** (the alias, then prod)

1. `/admin/jobs` lists **13 cards**. Before the first purge run after the merge, the four sub-sweeps
   read "No runs yet" and the two Worker readings read "No reading" — both correct, and neither is
   green. `backup_queue` / `backup_dead_letters` turn into a number after the first Worker run
   (05:00 UTC daily) with the new bindings deployed.
2. The morning after the first purge run: four sub-sweep cards `Healthy`, each with its own counts
   ("candidates 0, grace opened 0"), and four new rows per day in **Recent runs**.
3. Flip one sub-sweep's switch off and back on: the card reads `Paused` immediately, and the next
   purge run writes a `skipped` row for it while the parent run and the other three stay `Healthy`.
   (Verified locally through `/api/internal/job-run`: paused → `{"ok":true,"paused":true}` plus a
   `skipped` row noted "Paused from /admin/jobs.")
4. `Transactional email` shows "N sent, 0 failed or refused" once anything sends; before that it
   reads "No activity", which is the honest pre-launch state and deliberately NOT green.
5. Sentry: `job_dead_letters_pending` and `job_queue_backlog` are the two new warning types, tagged
   `area: cron`, raised from `/api/internal/job-run`. `job_missed_run` now covers 10 scheduled jobs
   rather than 4 — check `checked: 10` in the purge run's `job_health` counts.
6. The alerts bell shows a **Jobs** row with an "unhealthy" count whenever anything is overdue,
   failed or needs a look; paused jobs are deliberately not counted.

**Look at first**

1. ★ **`pnpm test` is RED on `launch-prep` itself, and was before this branch existed.**
   `src/lib/env-example-parity.test.ts` fails because `NEXT_PUBLIC_SURFACE` was added to
   `src/lib/env.ts` by the round's cut commit (`40a26a55`) and never to `.env.example`. Verified by
   stashing this branch's work and running the file on the clean cut: same failure. Neither file is
   in any track's `owns`; the fix is one line in `.env.example`. Every other test passes (2255).
2. ★ **The cross-lane patch above.** Without it, four cards read "No runs yet" forever, which is
   itself the silence this round exists to remove.
3. The Worker deploy needs the `wrangler.jsonc` hunk before it, or the depths simply never report
   (the bindings are optional and the Worker degrades to "no reading" rather than failing).
4. `job_runs` gained nine new values in its `job` column. That is by design (the column is
   unconstrained precisely so a new job needs no migration), but the Recent-runs feed will look
   busier: five rows per purge run instead of one.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-18). The jobs console stopped meaning four crons: the
catalog grew three KINDS of entry (a `scheduled` job with its own rows, a `signal` whose only question
is what failed in the last 24 hours, a `derived` reading that rides another job's counts), all
resolving through the one pure `jobHealth`, and nine jobs joined it. The backup Worker now reads the
Cloudflare queue and dead-letter depths on every run and carries them in the heartbeat's free-form
counts, with any dead letter reading as a failure and alerting where the number arrives, since a
freshness rule can only page on silence. The purge cron's four account-looping sweeps became jobs of
their own with their own switches, and per-row isolation (QA #27) closed, arranged so a night that
lost rows still closes red. `sendOnce` and both rate limiters stopped failing invisibly (QA #19), and
`getResend()` joined `assertResendEnv` above the claim it could otherwise burn.

--- BEGIN CROSS-LANE PATCH (extract with the awk line in Handoff; everything below is the patch) ---
diff --git a/src/app/admin/layout.tsx b/src/app/admin/layout.tsx
index 61948f1b..933ab7ef 100644
--- a/src/app/admin/layout.tsx
+++ b/src/app/admin/layout.tsx
@@ -9,6 +9,7 @@ import { requireAdmin } from "@/lib/auth/admin-context";
 import { countApplicationsByStatus } from "@/lib/db/queries/applications";
 import { countOpenReports } from "@/lib/db/queries/reports";
 import { countContactByStatus } from "@/lib/db/queries/support";
+import { countUnhealthyJobs } from "@/lib/jobs/health-summary";
 import { PageHeading } from "@/components/shared/page-heading";
 
 // The operations portal segment. Canonical path is /admin on every host; in prod
@@ -64,14 +65,20 @@ export default async function AdminLayout({
 
   // Pending-work counts for the header alerts bell (the same queries the Overview cards use). Cheap
   // head-counts; refresh on page-load + post-triage revalidation (no real-time, matching the host bell).
-  const [support, applicants, reports] = await Promise.all([
+  // `jobs` is backend health: "the purge sweep has not run in three days" is pending work in exactly
+  // the sense the other three are, and it never throws (an unreadable console resolves to one).
+  const [support, applicants, reports, jobs] = await Promise.all([
     countContactByStatus("new"),
     countApplicationsByStatus("new"),
     countOpenReports(),
+    countUnhealthyJobs(),
   ]);
 
   return (
-    <AdminShell email={ctx.email} alerts={{ support, applicants, reports }}>
+    <AdminShell
+      email={ctx.email}
+      alerts={{ support, applicants, reports, jobs }}
+    >
       {children}
       {/* Key-gated, inert otherwise: a board's candidate block on the portal's
           own pages (the second round, 2026-09-15). */}
diff --git a/src/app/api/cron/purge/route.ts b/src/app/api/cron/purge/route.ts
index 1a7ace3a..d8c95369 100644
--- a/src/app/api/cron/purge/route.ts
+++ b/src/app/api/cron/purge/route.ts
@@ -57,6 +57,8 @@ import {
 } from "@/lib/email/templates";
 import { sendOnce } from "@/lib/email/send";
 import { assertCronEnv, serverEnv } from "@/lib/env";
+import { forEachIsolated, tallyNote } from "@/lib/jobs/isolate";
+import { createSweepRunner } from "@/lib/jobs/purge-sweeps";
 import {
   INACTIVE_DAYS,
   WARN_BEFORE_DAYS,
@@ -294,13 +296,13 @@ export async function GET(request: Request): Promise<Response> {
   // Each sweep is independently guarded so one failure doesn't abort the rest. The catch
   // ALSO reports to Sentry — a failed sweep was previously buried in the 200 response body
   // (Vercel never alerts on it), so a broken sweep meant storage silently wasn't reclaimed.
+  //
+  // The guard now lives in `createSweepRunner` (src/lib/jobs/purge-sweeps.ts), which also gives the
+  // FOUR promoted sub-sweeps a `job_runs` row, a kill switch and a card of their own. For every
+  // other sweep its behaviour is byte-identical to the inline try/catch this replaced.
+  const sweepRunner = createSweepRunner(triggeredBy);
   const runSweep = async (name: string, fn: () => Promise<unknown>) => {
-    try {
-      sweeps[name] = await fn();
-    } catch (e) {
-      captureError("cron", e, { sweep: name });
-      sweeps[name] = { error: String(e) };
-    }
+    sweeps[name] = await sweepRunner.run(name, fn);
   };
 
   await runSweep("expired_events", () =>
@@ -710,130 +712,149 @@ async function sweepOverCapacity(admin: AdminClient, now: Date) {
   let reduced = 0;
   let cleared = 0;
 
-  for (const p of candidates ?? []) {
-    const cap = effectiveStorageCap(toBillingTier(p.tier), p.storage_cap_bytes);
-    if (cap === null) continue; // unlimited tier — not subject to the cap
+  // ★ PER-ROW ISOLATION (QA #27). This loop opens grace windows, sends email and auto-reduces
+  // media. One bounced address or one bad profile used to abort it, so every account BEHIND that
+  // row was skipped for the night, silently — the sweep's own catch turned the throw into one
+  // `{ error }` on the parent run and nothing said "and 93 accounts were never looked at". Each
+  // account is isolated now, and the tally travels with the result so the sweep still closes RED.
+  const rows_tally = await forEachIsolated(
+    candidates ?? [],
+    async (p) => {
+      const cap = effectiveStorageCap(
+        toBillingTier(p.tier),
+        p.storage_cap_bytes,
+      );
+      if (cap === null) return; // unlimited tier — not subject to the cap
 
-    // ACTIVE bytes = non-removed media in non-deleted events.
-    const { data: media, error: mErr } = await admin
-      .from("media")
-      .select(
-        "id, file_size_bytes, events!media_event_id_fkey!inner(host_id, deleted_at)",
-      )
-      .eq("events.host_id", p.id)
-      .is("events.deleted_at", null)
-      .neq("status", "removed");
-    if (mErr) throw new Error(`select active media: ${mErr.message}`);
-    const rows = (media ?? []) as unknown as {
-      id: string;
-      file_size_bytes: number;
-    }[];
-    const activeBytes = rows.reduce((s, m) => s + m.file_size_bytes, 0);
-
-    // ENGAGE at the write-path line, not the bare cap (QA #26): uploads are accepted up to
-    // cap + cap/10, so a host inside that deliberate headroom is exactly where the product put
-    // them — emailing "over your limit" and later auto-removing their media is wrong. Once truly
-    // over, the reduce below still targets the REAL cap (hysteresis, so it can't flap).
-    const engageAt = capWithWriteHeadroom(cap);
-
-    if (activeBytes <= engageAt) {
-      if (p.storage_grace_until) {
+      // ACTIVE bytes = non-removed media in non-deleted events.
+      const { data: media, error: mErr } = await admin
+        .from("media")
+        .select(
+          "id, file_size_bytes, events!media_event_id_fkey!inner(host_id, deleted_at)",
+        )
+        .eq("events.host_id", p.id)
+        .is("events.deleted_at", null)
+        .neq("status", "removed");
+      if (mErr) throw new Error(`select active media: ${mErr.message}`);
+      const rows = (media ?? []) as unknown as {
+        id: string;
+        file_size_bytes: number;
+      }[];
+      const activeBytes = rows.reduce((s, m) => s + m.file_size_bytes, 0);
+
+      // ENGAGE at the write-path line, not the bare cap (QA #26): uploads are accepted up to
+      // cap + cap/10, so a host inside that deliberate headroom is exactly where the product put
+      // them — emailing "over your limit" and later auto-removing their media is wrong. Once truly
+      // over, the reduce below still targets the REAL cap (hysteresis, so it can't flap).
+      const engageAt = capWithWriteHeadroom(cap);
+
+      if (activeBytes <= engageAt) {
+        if (p.storage_grace_until) {
+          await admin
+            .from("profiles")
+            .update({ storage_grace_until: null })
+            .eq("id", p.id);
+          cleared++;
+        }
+        return;
+      }
+
+      if (!p.storage_grace_until) {
+        const graceUntil = new Date(
+          now.getTime() + OVER_CAP_GRACE_DAYS * 86_400_000,
+        );
         await admin
           .from("profiles")
-          .update({ storage_grace_until: null })
+          .update({ storage_grace_until: graceUntil.toISOString() })
           .eq("id", p.id);
-        cleared++;
+        graceOpened++;
+        if (p.email) {
+          const { subject, html } = overCapGraceStartEmail({
+            capLabel: formatBytes(cap),
+            deadline: fmtDate(graceUntil),
+            dashboardUrl,
+          });
+          await sendOnce({
+            kind: "over_cap_grace_start",
+            dedupeKey: `${p.id}:${graceUntil.toISOString()}`,
+            profileId: p.id,
+            to: p.email,
+            subject,
+            html,
+          });
+        }
+        return;
       }
-      continue;
-    }
 
-    if (!p.storage_grace_until) {
-      const graceUntil = new Date(
-        now.getTime() + OVER_CAP_GRACE_DAYS * 86_400_000,
-      );
-      await admin
-        .from("profiles")
-        .update({ storage_grace_until: graceUntil.toISOString() })
-        .eq("id", p.id);
-      graceOpened++;
-      if (p.email) {
-        const { subject, html } = overCapGraceStartEmail({
-          capLabel: formatBytes(cap),
-          deadline: fmtDate(graceUntil),
-          dashboardUrl,
-        });
-        await sendOnce({
-          kind: "over_cap_grace_start",
-          dedupeKey: `${p.id}:${graceUntil.toISOString()}`,
-          profileId: p.id,
-          to: p.email,
-          subject,
-          html,
-        });
-      }
-      continue;
-    }
-
-    const graceUntil = new Date(p.storage_grace_until);
-    if (now >= graceUntil) {
-      const ids = selectForAutoReduce(rows, cap);
-      if (ids.length) {
-        const { error: rmErr } = await admin
-          .from("media")
-          .update({
-            status: "removed",
-            removed_at: now.toISOString(),
-            // QA #2: mark these as SYSTEM-binned so sweepStandbyBudget (same invocation, seconds
-            // later) excludes them. Without it the standby sweep hard-deletes the media this sweep
-            // just promised the host was recoverable for 30 days.
-            removed_by_system: true,
-          })
-          .in("id", ids);
-        if (rmErr) throw new Error(`auto-reduce remove: ${rmErr.message}`);
-      }
-      await admin
-        .from("profiles")
-        .update({ storage_grace_until: null })
-        .eq("id", p.id);
-      reduced++;
-      if (p.email) {
-        const recoverableUntil = fmtDate(
-          new Date(now.getTime() + RECENTLY_DELETED_WINDOW_DAYS * 86_400_000),
-        );
-        const { subject, html } = overCapReducedEmail({
-          recoverableUntil,
-          dashboardUrl,
-        });
-        await sendOnce({
-          kind: "over_cap_reduced",
-          dedupeKey: `${p.id}:${graceUntil.toISOString()}`,
-          profileId: p.id,
-          to: p.email,
-          subject,
-          html,
-        });
-      }
-    } else if (
-      now.getTime() >=
-      graceUntil.getTime() - OVER_CAP_REMINDER_DAYS * 86_400_000
-    ) {
-      if (p.email) {
-        const { subject, html } = overCapReminderEmail({
-          deadline: fmtDate(graceUntil),
-          dashboardUrl,
-        });
-        const sent = await sendOnce({
-          kind: "over_cap_reminder",
-          dedupeKey: `${p.id}:${graceUntil.toISOString()}`,
-          profileId: p.id,
-          to: p.email,
-          subject,
-          html,
-        });
-        if (sent) reminded++;
+      const graceUntil = new Date(p.storage_grace_until);
+      if (now >= graceUntil) {
+        const ids = selectForAutoReduce(rows, cap);
+        if (ids.length) {
+          const { error: rmErr } = await admin
+            .from("media")
+            .update({
+              status: "removed",
+              removed_at: now.toISOString(),
+              // QA #2: mark these as SYSTEM-binned so sweepStandbyBudget (same invocation, seconds
+              // later) excludes them. Without it the standby sweep hard-deletes the media this sweep
+              // just promised the host was recoverable for 30 days.
+              removed_by_system: true,
+            })
+            .in("id", ids);
+          if (rmErr) throw new Error(`auto-reduce remove: ${rmErr.message}`);
+        }
+        await admin
+          .from("profiles")
+          .update({ storage_grace_until: null })
+          .eq("id", p.id);
+        reduced++;
+        if (p.email) {
+          const recoverableUntil = fmtDate(
+            new Date(now.getTime() + RECENTLY_DELETED_WINDOW_DAYS * 86_400_000),
+          );
+          const { subject, html } = overCapReducedEmail({
+            recoverableUntil,
+            dashboardUrl,
+          });
+          await sendOnce({
+            kind: "over_cap_reduced",
+            dedupeKey: `${p.id}:${graceUntil.toISOString()}`,
+            profileId: p.id,
+            to: p.email,
+            subject,
+            html,
+          });
+        }
+      } else if (
+        now.getTime() >=
+        graceUntil.getTime() - OVER_CAP_REMINDER_DAYS * 86_400_000
+      ) {
+        if (p.email) {
+          const { subject, html } = overCapReminderEmail({
+            deadline: fmtDate(graceUntil),
+            dashboardUrl,
+          });
+          const sent = await sendOnce({
+            kind: "over_cap_reminder",
+            dedupeKey: `${p.id}:${graceUntil.toISOString()}`,
+            profileId: p.id,
+            to: p.email,
+            subject,
+            html,
+          });
+          if (sent) reminded++;
+        }
       }
-    }
-  }
+    },
+    {
+      onError: (p, e) =>
+        captureError("cron", e, {
+          sweep: "over_capacity",
+          // The profile ID, never the address: a Sentry extra is not the place for a recipient.
+          profile_id: p.id,
+        }),
+    },
+  );
 
   return {
     candidates: candidates?.length ?? 0,
@@ -841,6 +862,11 @@ async function sweepOverCapacity(admin: AdminClient, now: Date) {
     reminded,
     reduced,
     cleared,
+    // The isolation tally travels WITH the result: `rows_failed` is what makes this sub-sweep's run
+    // close as an error, so keeping the accounts behind a bad row alive never buys a green night.
+    rows_failed: rows_tally.failed,
+    rows_not_attempted: rows_tally.skipped,
+    rows_note: tallyNote("accounts", rows_tally) ?? undefined,
   };
 }
 
@@ -866,23 +892,40 @@ async function sweepRenewalNudges(admin: AdminClient, now: Date) {
   const siteUrl = await getSiteUrl();
   const renewUrl = `${siteUrl}/dashboard`;
   let nudged = 0;
-  for (const p of data ?? []) {
-    if (!p.email || !p.tier_expires_at) continue;
-    const { subject, html } = renewalNudgeEmail({
-      expiresOn: fmtDate(new Date(p.tier_expires_at)),
-      renewUrl,
-    });
-    const sent = await sendOnce({
-      kind: "renewal_nudge",
-      dedupeKey: `${p.id}:${p.tier_expires_at}`,
-      profileId: p.id,
-      to: p.email,
-      subject,
-      html,
-    });
-    if (sent) nudged++;
-  }
-  return { eligible: data?.length ?? 0, nudged };
+  // PER-ROW ISOLATION (QA #27): one refused address stopped every nudge behind it. This sweep is
+  // not a promoted job (it only emails), so its tally rides the parent run's counts.
+  const tally = await forEachIsolated(
+    data ?? [],
+    async (p) => {
+      if (!p.email || !p.tier_expires_at) return;
+      const { subject, html } = renewalNudgeEmail({
+        expiresOn: fmtDate(new Date(p.tier_expires_at)),
+        renewUrl,
+      });
+      const sent = await sendOnce({
+        kind: "renewal_nudge",
+        dedupeKey: `${p.id}:${p.tier_expires_at}`,
+        profileId: p.id,
+        to: p.email,
+        subject,
+        html,
+      });
+      if (sent) nudged++;
+    },
+    {
+      onError: (p, e) =>
+        captureError("cron", e, {
+          sweep: "renewal_nudges",
+          profile_id: p.id,
+        }),
+    },
+  );
+  return {
+    eligible: data?.length ?? 0,
+    nudged,
+    rows_failed: tally.failed,
+    rows_not_attempted: tally.skipped,
+  };
 }
 
 /**
@@ -918,87 +961,108 @@ async function sweepInactiveFreeEvents(admin: AdminClient, now: Date) {
   let warned = 0;
   let removed = 0;
 
-  for (const e of events ?? []) {
-    const prof = e.profiles as unknown as {
-      email: string | null;
-      last_active_at: string;
-    };
+  // ★ PER-ROW ISOLATION (QA #27). This loop SOFT-DELETES a host's event and emails them about
+  // it, so a single bad row used to mean every candidate behind it was neither warned nor
+  // removed that night, with nothing but one `{ error }` on the parent run to show for it.
+  const tally = await forEachIsolated(
+    events ?? [],
+    async (e) => {
+      const prof = e.profiles as unknown as {
+        email: string | null;
+        last_active_at: string;
+      };
 
-    // Newest upload (any status — a recent upload means the event is still in use).
-    // mustQuery, because this read can only ever move the verdict toward DELETION:
-    // swallowed, a failed query looked identical to "this event has never had an
-    // upload", so a busy album whose other timestamps were old got warned and then
-    // removed for inactivity. A transient DB error must abort the sweep (it resumes
-    // next night), never silently age out live events.
-    const media = await mustQuery(
-      admin
-        .from("media")
-        .select("created_at")
-        .eq("event_id", e.id)
-        .order("created_at", { ascending: false })
-        .limit(1),
-      "cron/purge: newest upload for inactivity",
-    );
-    const latestUpload = media?.[0]?.created_at;
+      // Newest upload (any status — a recent upload means the event is still in use).
+      // mustQuery, because this read can only ever move the verdict toward DELETION:
+      // swallowed, a failed query looked identical to "this event has never had an
+      // upload", so a busy album whose other timestamps were old got warned and then
+      // removed for inactivity. A transient DB error must abort the sweep (it resumes
+      // next night), never silently age out live events.
+      const media = await mustQuery(
+        admin
+          .from("media")
+          .select("created_at")
+          .eq("event_id", e.id)
+          .order("created_at", { ascending: false })
+          .limit(1),
+        "cron/purge: newest upload for inactivity",
+      );
+      const latestUpload = media?.[0]?.created_at;
 
-    const activityMs = Math.max(
-      new Date(prof.last_active_at).getTime(),
-      new Date(e.created_at).getTime(),
-      new Date(e.updated_at).getTime(),
-      latestUpload ? new Date(latestUpload).getTime() : 0,
-    );
-    const action = inactivityAction(activityMs, nowMs);
-    if (action === "none") continue;
-
-    if (action === "remove") {
-      // purge_at is DERIVED by the set_event_purge_at trigger from deleted_at (single source,
-      // un-spoofable — mirrors media). We still compute purgeAt locally for the email's
-      // "recoverable until" date, but the persisted value comes from the trigger, not this write.
-      const purgeAt = new Date(
-        nowMs + RECENTLY_DELETED_WINDOW_DAYS * 86_400_000,
+      const activityMs = Math.max(
+        new Date(prof.last_active_at).getTime(),
+        new Date(e.created_at).getTime(),
+        new Date(e.updated_at).getTime(),
+        latestUpload ? new Date(latestUpload).getTime() : 0,
       );
-      const { error: delErr } = await admin
-        .from("events")
-        .update({ deleted_at: now.toISOString() })
-        .eq("id", e.id)
-        .is("deleted_at", null);
-      if (delErr) throw new Error(`inactive soft-delete: ${delErr.message}`);
-      removed++;
-      if (prof.email) {
-        const { subject, html } = inactivityRemovedEmail({
+      const action = inactivityAction(activityMs, nowMs);
+      if (action === "none") return;
+
+      if (action === "remove") {
+        // purge_at is DERIVED by the set_event_purge_at trigger from deleted_at (single source,
+        // un-spoofable — mirrors media). We still compute purgeAt locally for the email's
+        // "recoverable until" date, but the persisted value comes from the trigger, not this write.
+        const purgeAt = new Date(
+          nowMs + RECENTLY_DELETED_WINDOW_DAYS * 86_400_000,
+        );
+        const { error: delErr } = await admin
+          .from("events")
+          .update({ deleted_at: now.toISOString() })
+          .eq("id", e.id)
+          .is("deleted_at", null);
+        if (delErr) throw new Error(`inactive soft-delete: ${delErr.message}`);
+        removed++;
+        if (prof.email) {
+          const { subject, html } = inactivityRemovedEmail({
+            eventName: e.name,
+            recoverableUntil: fmtDate(purgeAt),
+            dashboardUrl,
+          });
+          await sendOnce({
+            kind: "inactivity_removed",
+            dedupeKey: e.id,
+            profileId: e.host_id,
+            to: prof.email,
+            subject,
+            html,
+          });
+        }
+      } else if (prof.email) {
+        const deadline = new Date(activityMs + INACTIVE_DAYS * 86_400_000);
+        const { subject, html } = inactivityWarningEmail({
           eventName: e.name,
-          recoverableUntil: fmtDate(purgeAt),
+          deadline: fmtDate(deadline),
           dashboardUrl,
         });
-        await sendOnce({
-          kind: "inactivity_removed",
-          dedupeKey: e.id,
+        const sent = await sendOnce({
+          kind: "inactivity_warning",
+          dedupeKey: `${e.id}:${activityMs}`,
           profileId: e.host_id,
           to: prof.email,
           subject,
           html,
         });
+        if (sent) warned++;
       }
-    } else if (prof.email) {
-      const deadline = new Date(activityMs + INACTIVE_DAYS * 86_400_000);
-      const { subject, html } = inactivityWarningEmail({
-        eventName: e.name,
-        deadline: fmtDate(deadline),
-        dashboardUrl,
-      });
-      const sent = await sendOnce({
-        kind: "inactivity_warning",
-        dedupeKey: `${e.id}:${activityMs}`,
-        profileId: e.host_id,
-        to: prof.email,
-        subject,
-        html,
-      });
-      if (sent) warned++;
-    }
-  }
+    },
+    {
+      onError: (e, err) =>
+        captureError("cron", err, {
+          sweep: "inactive_free_events",
+          // The event id, never the host's address.
+          event_id: e.id,
+        }),
+    },
+  );
 
-  return { candidates: events?.length ?? 0, warned, removed };
+  return {
+    candidates: events?.length ?? 0,
+    warned,
+    removed,
+    rows_failed: tally.failed,
+    rows_not_attempted: tally.skipped,
+    rows_note: tallyNote("events", tally) ?? undefined,
+  };
 }
 
 /**
diff --git a/src/lib/lifecycle/account-deletion.ts b/src/lib/lifecycle/account-deletion.ts
index 92dd4b88..ac37f2c0 100644
--- a/src/lib/lifecycle/account-deletion.ts
+++ b/src/lib/lifecycle/account-deletion.ts
@@ -39,6 +39,7 @@ import "server-only";
 
 import { mustCount, mustQuery } from "@/lib/db/must-query";
 import { partitionEventsByHold } from "@/lib/forensics/legal-hold";
+import { forEachIsolated, tallyNote } from "@/lib/jobs/isolate";
 import { captureError, captureWarning } from "@/lib/observability/sentry";
 import { deleteR2Objects } from "@/lib/r2/delete";
 import { reelOutputKey } from "@/lib/r2/keys";
@@ -126,6 +127,10 @@ export type AccountDeletionSweepResult = {
   freed_bytes: number;
   /** Present only before migration 20260902130000 is applied. */
   skipped?: "not_provisioned";
+  /** Accounts this run isolated and failed on, so its heartbeat closes as an error (QA #27). */
+  rows_failed?: number;
+  rows_not_attempted?: number;
+  rows_note?: string;
 };
 
 export type AccountPurgeResult = {
@@ -393,19 +398,37 @@ export async function sweepDeletedAccounts(
     throw error;
   }
 
-  for (const { id: userId } of candidates) {
-    result.accounts += 1;
-    const one = await purgeAccount(admin, userId, handled);
-    result.events += one.events;
-    result.hold_blocked_events += one.hold_blocked_events;
-    result.media_rows += one.media_rows;
-    result.r2_deleted += one.r2_deleted;
-    result.r2_errored += one.r2_errored;
-    result.freed_bytes += one.freed_bytes;
-    if (one.outcome === "deleted") result.accounts_deleted += 1;
-    else result.accounts_held += 1;
-  }
+  // ★ PER-ROW ISOLATION (QA #27). One account whose R2 delete or auth delete threw used to abort
+  // the whole sweep, so every account BEHIND it in the queue waited another day — for a deletion
+  // that is immediate by ruling, and with nothing but one `{ error }` on the run to show for it.
+  // Each account is isolated now; `rows_failed` travels with the tally so the sweep's own run still
+  // closes RED (src/lib/jobs/purge-sweeps.ts reads it), and the next run retries the failed ones.
+  const tally = await forEachIsolated(
+    candidates,
+    async ({ id: userId }) => {
+      result.accounts += 1;
+      const one = await purgeAccount(admin, userId, handled);
+      result.events += one.events;
+      result.hold_blocked_events += one.hold_blocked_events;
+      result.media_rows += one.media_rows;
+      result.r2_deleted += one.r2_deleted;
+      result.r2_errored += one.r2_errored;
+      result.freed_bytes += one.freed_bytes;
+      if (one.outcome === "deleted") result.accounts_deleted += 1;
+      else result.accounts_held += 1;
+    },
+    {
+      onError: (row, e) =>
+        captureError("cron", e, {
+          sweep: "deleted_accounts",
+          user_id: row.id,
+        }),
+    },
+  );
 
+  result.rows_failed = tally.failed;
+  result.rows_not_attempted = tally.skipped;
+  result.rows_note = tallyNote("accounts", tally) ?? undefined;
   return result;
 }
 
diff --git a/src/lib/security/abuse-rate-limit-store.ts b/src/lib/security/abuse-rate-limit-store.ts
index c46c051a..5e296f1d 100644
--- a/src/lib/security/abuse-rate-limit-store.ts
+++ b/src/lib/security/abuse-rate-limit-store.ts
@@ -11,6 +11,7 @@ import { createHmac } from "node:crypto";
 
 import { mustQuery } from "@/lib/db/must-query";
 import { serverEnv } from "@/lib/env";
+import { recordSignalFailure } from "@/lib/jobs/failure-log";
 import {
   ABUSE_LIMITS,
   abuseRateDecision,
@@ -62,16 +63,33 @@ export async function checkAbuseRate(
   // alert could never fire: the one path nobody would ever learn was broken.
   // Throwing here does NOT change the allow/deny posture (the callers still fail
   // open, on purpose); it just makes the outage visible.
-  const data = await mustQuery(
-    admin.rpc("action_rate", {
-      p_kind: kind,
-      p_ip_hash: ipHash,
-      p_scope_hash: scopeHash,
-      p_breadth_since: breadthSince,
-      p_scope_since: scopeSince,
-    }),
-    `security/abuse-limiter: action_rate(${kind})`,
-  );
+  //
+  // ROADMAP QA #19, the second half: throwing makes the outage visible to the CALLER, which then
+  // fails open with a captureWarning. What nothing counted was how often that happened, so the
+  // console could not tell a limiter that has been dead for a week from one nobody tripped. The
+  // failure is recorded into the `abuse_limiter` signal on the way past; the throw is unchanged.
+  let data: unknown;
+  try {
+    data = await mustQuery(
+      admin.rpc("action_rate", {
+        p_kind: kind,
+        p_ip_hash: ipHash,
+        p_scope_hash: scopeHash,
+        p_breadth_since: breadthSince,
+        p_scope_since: scopeSince,
+      }),
+      `security/abuse-limiter: action_rate(${kind})`,
+    );
+  } catch (e) {
+    await recordSignalFailure({
+      job: "abuse_limiter",
+      area: "security",
+      operation: `action_rate(${kind})`,
+      error: e,
+      extra: { kind },
+    });
+    throw e;
+  }
   const snap = (data ?? {}) as {
     distinct_scopes?: number;
     scope_hits?: number;
@@ -83,14 +101,31 @@ export async function checkAbuseRate(
   );
 }
 
-/** Record ONE action event (best-effort; callers ignore errors). */
+/**
+ * Record ONE action event (best-effort; callers ignore errors).
+ *
+ * ★ THE SILENT HALF OF QA #19, and the worse one. Every call site wraps this in `.catch(() => {})`,
+ * so a failing INSERT means the counters never accumulate, which means every later decision reads
+ * zero hits, which means ALLOWED — the limiter is off and looks identical to one nobody has tripped.
+ * Reporting it here rather than at the seven call sites covers all of them at once, and the swallow
+ * upstream is left exactly as it was: the write is genuinely best-effort, it just is not silent.
+ */
 export async function recordAbuseEvent(
   kind: AbuseKind,
   ipHash: string,
   scopeHash: string,
 ): Promise<void> {
   const admin = createAdminClient();
-  await admin
+  const { error } = await admin
     .from("action_attempts")
     .insert({ kind, ip_hash: ipHash, scope_hash: scopeHash });
+  if (error) {
+    await recordSignalFailure({
+      job: "abuse_limiter",
+      area: "security",
+      operation: `action_attempts insert (${kind})`,
+      error: new Error(error.message),
+      extra: { kind, code: error.code },
+    });
+  }
 }
diff --git a/src/lib/security/unlock-rate-limit-store.ts b/src/lib/security/unlock-rate-limit-store.ts
index 75d2711f..c129a0ea 100644
--- a/src/lib/security/unlock-rate-limit-store.ts
+++ b/src/lib/security/unlock-rate-limit-store.ts
@@ -10,6 +10,7 @@ import { createHmac } from "node:crypto";
 
 import { mustCount } from "@/lib/db/must-query";
 import { serverEnv } from "@/lib/env";
+import { recordSignalFailure } from "@/lib/jobs/failure-log";
 import {
   UNLOCK_EVENT_WINDOW_MIN,
   UNLOCK_IP_WINDOW_MIN,
@@ -57,36 +58,64 @@ export async function checkUnlockRate(
   // could not surface, because swallowing the error meant nothing ever threw.
   // NOTE this pair escaped the no-swallowed-db-error lint: `ipRes.count ?? 0` is a
   // property read, not a destructure, so the rule's AST pattern never saw it.
-  const [ipCount, evCount] = await Promise.all([
-    mustCount(
-      admin
-        .from("unlock_attempts")
-        .select("*", { count: "exact", head: true })
-        .eq("ip_hash", ipHash)
-        .gt("attempted_at", ipSince),
-      "security/unlock-limiter: per-IP failures",
-    ),
-    mustCount(
-      admin
-        .from("unlock_attempts")
-        .select("*", { count: "exact", head: true })
-        .eq("token_hash", tokenHash)
-        .gt("attempted_at", eventSince),
-      "security/unlock-limiter: per-event failures",
-    ),
-  ]);
-  return unlockRateDecision(ipCount, evCount);
+  // The counts are recorded into the `unlock_limiter` signal on their way past (QA #19): the route
+  // still fails OPEN on a throw, on purpose, but a week of silent fail-open is now a number on
+  // /admin/jobs instead of an open brute-force window nobody would ever learn about.
+  try {
+    const [ipCount, evCount] = await Promise.all([
+      mustCount(
+        admin
+          .from("unlock_attempts")
+          .select("*", { count: "exact", head: true })
+          .eq("ip_hash", ipHash)
+          .gt("attempted_at", ipSince),
+        "security/unlock-limiter: per-IP failures",
+      ),
+      mustCount(
+        admin
+          .from("unlock_attempts")
+          .select("*", { count: "exact", head: true })
+          .eq("token_hash", tokenHash)
+          .gt("attempted_at", eventSince),
+        "security/unlock-limiter: per-event failures",
+      ),
+    ]);
+    return unlockRateDecision(ipCount, evCount);
+  } catch (e) {
+    await recordSignalFailure({
+      job: "unlock_limiter",
+      area: "security",
+      operation: "unlock_attempts windowed counts",
+      error: e,
+    });
+    throw e;
+  }
 }
 
-/** Record ONE failed attempt (best-effort; the caller ignores errors). */
+/**
+ * Record ONE failed attempt (best-effort; the caller ignores errors).
+ *
+ * ★ A failing INSERT here is the limiter switching itself off: no failures are counted, so no
+ * threshold is ever reached, so every attempt is allowed. Silent until now, and indistinguishable
+ * from a night when nobody typed a wrong password.
+ */
 export async function recordUnlockFailure(
   tokenHash: string,
   ipHash: string,
 ): Promise<void> {
   const admin = createAdminClient();
-  await admin
+  const { error } = await admin
     .from("unlock_attempts")
     .insert({ token_hash: tokenHash, ip_hash: ipHash });
+  if (error) {
+    await recordSignalFailure({
+      job: "unlock_limiter",
+      area: "security",
+      operation: "unlock_attempts insert",
+      error: new Error(error.message),
+      extra: { code: error.code },
+    });
+  }
 }
 
 /** On a SUCCESSFUL unlock, clear that IP's failures for the event (the venue-crowd fix). */
diff --git a/workers/backup/wrangler.jsonc b/workers/backup/wrangler.jsonc
index d2836c2a..3bc208d6 100644
--- a/workers/backup/wrangler.jsonc
+++ b/workers/backup/wrangler.jsonc
@@ -17,7 +17,18 @@
   // Consumer for the R2 object-create event notifications (the human wires the bucket -> queue
   // subscription with `wrangler r2 bucket notification create ... --prefix events/`). Poison
   // messages land in the DLQ after max_retries.
+  //
+  // The two PRODUCER bindings exist only so the Worker can call `Queue.metrics()` and report each
+  // queue's realtime backlog on every scheduled run (src/queue-metrics.ts). This Worker never sends
+  // to either queue; the depths were visible on the Cloudflare dashboard and nowhere else, and a
+  // dead letter is a media object with no backup copy, which is exactly the silence /admin/jobs
+  // exists to end. Producer bindings do not change delivery: the DLQ still has no consumer, so
+  // nothing drains it, and the daily reconcile stays the thing that copies what the queue missed.
   "queues": {
+    "producers": [
+      { "binding": "BACKUP_QUEUE", "queue": "partyreel-backup" },
+      { "binding": "BACKUP_DLQ", "queue": "partyreel-backup-dlq" },
+    ],
     "consumers": [
       {
         "queue": "partyreel-backup",
--- END CROSS-LANE PATCH ---
