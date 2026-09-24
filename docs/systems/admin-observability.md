# Admin / operations portal & observability

> ROLE: the operator's tool for running Partyreel + the error-tracking that feeds it.
> BELONGS HERE: the `admin.partyreel.com` perimeter, the `requireAdmin` seam + MFA, every admin surface, the reports/safety queue, backend jobs, Sentry wiring. · NOT HERE: host-side moderation (→ [host-app.md](host-app.md)), the cap/Stripe internals the Accounts/Metrics pages read (→ [billing-caps.md](billing-caps.md)), the backup pipeline itself (→ [durability-backups.md](durability-backups.md)).
> GROWS BY: integrate-in-place.

## What binds the admin's design (Will, 2026-09-18 and 2026-09-20)

The portal carries the platform's FOUNDATIONAL identity (the wordmark, `src/lib/brand/wordmark.ts` and
`Logo`; the faces with their weights and spacing; the cool-grey Graphite base) and is otherwise free: an
on-brand devtool, never a separate brand. Real colour is wanted (charts, state), density, tables and
chrome are its own, and bible 1 and 2 bind it only as far as that foundation. The security seam
(`requireAdmin`, the host guard, AAL2) is never a design variable. Seven shape rules bind every surface:

- **Numbers first:** the home opens on four figures and a fortnight's trend, with everything waiting on
  the operator beneath, worst first.
- **A rail plus a command palette:** the full-bleed 232px rail from `lg`
  ([`admin-rail.tsx`](../../src/components/admin/admin-rail.tsx), `navGroups()`, counts on Support,
  Applicants, Reports and Jobs; a centred `Container` is wrong beside it), the dropdown
  ([`admin-nav.tsx`](../../src/components/admin/admin-nav.tsx)) below it; ⌘K reaches a surface, an action
  or an account.
- **Hybrid density:** a table for data (`ui/table.tsx`), a list beside the message for the two prose
  inboxes (`inbox-pane.tsx`); Reports is sectioned.
- **A state's colour reaches the row:** four tones (success, info, warning, destructive), and a failed or
  overdue run tints its own row with a leading edge; one map, `src/lib/admin/tone.ts`, so a chip and the
  row under it cannot disagree.
- **One destructive sheet, sized to the damage:** every destructive act lists what it touches; only a
  permanent act with something to identify makes you type.
- **A health band under the bar on every page**
  ([`health-band.tsx`](../../src/components/admin/health-band.tsx)), drawn only when a job needs a look or
  the heartbeat is unreadable, so absent on a good day.
- **A 44px tool bar** ([`admin-bar.tsx`](../../src/components/admin/admin-bar.tsx)): the wordmark, a
  breadcrumb (`NAV` + the pathname), a live tag (`VERCEL_ENV`), the health chip, the alerts bell and an
  initial opening the operator menu (address, sign-out).

★ NO OPERATOR AUDIT TABLE EXISTS: nothing records an operator's own actions beyond their effect (the
forensic trail covers holds and evidence only). An `admin_actions` table is a ROADMAP proposal, never a
shipped fact.

## What it does

An internal portal on **`admin.partyreel.com`**, served by its **own Vercel project** (route segment
[`src/app/admin/`](../../src/app/admin) with its own `AdminShell`, distinct from the host `AppShell`; the
deployment shape is the Perimeter invariant below). Three hard gates, all behind ONE seam
([`admin-context.ts`](../../src/lib/auth/admin-context.ts)): `getUser()` + `profiles.is_admin` + **AAL2**
(free app-based TOTP MFA).

## The seam (never bypass it)

`requireAdmin()` (pages/layouts: anon → `/login?next=/admin`, non-admin → `notFound()` 404, leak-proof;
exposes `ctx.aal`, and a sensitive page returns null below AAL2 before it fetches) and
`requireAdminAction()` (actions/routes: returns an `ActionResult`, **requires AAL2**) are the ONLY entry
points. **Never read `profiles.is_admin` directly**: this single seam is the swap point for a future
`staff_members` + roles model. *(Cross-cutting landmine.)*

## Invariants (don't break)

- **MFA is a hard gate, reachable at AAL1 on purpose.** The `/admin` layout renders the enroll/step-up gate
  until the session is AAL2; the gate itself is reachable at AAL1 so you never lock yourself out of first
  enrollment: ship any AAL2 page-gate together with its AAL1 fallback. Break-glass = delete the factor in
  the Supabase dashboard (`auth.mfa_factors`). `getAuthenticatorAssuranceLevel()` →
  `currentLevel`/`nextLevel` (`nextLevel === 'aal2'` → "step up", else "enroll").
- **Keep admin auth cookies HOST-ISOLATED.** `@supabase/ssr` cookies are host-only by default: never set a
  `.partyreel.com` cookie `domain`, or the AAL2 admin session leaks to the apex (both projects share one
  Supabase project, so two deployments alone do not prevent it); the admin signs in at the subdomain.
- **The auth callback's `redirectTo` must be the BARE `/auth/callback` (query-free).** On the admin host,
  `callbackUrl()` ([`login-form.tsx`](../../src/components/auth/login-form.tsx)) uses
  `window.location.origin` (NOT the apex `NEXT_PUBLIC_SITE_URL`) so the cookie lands on the subdomain; the
  [callback route](../../src/app/(auth)/auth/callback/route.ts) picks the landing per host (admin → `/admin`).
- **Perimeter: two deployments, one tree.** Two Vercel projects build the same commit of this one
  repository (never a second repository: one tree keeps every surface changing together) and differ by
  ONE variable, `NEXT_PUBLIC_SURFACE`, read only through [`src/lib/surface`](../../src/lib/surface):
  `partyreel-admin` (`=admin`) serves `admin.partyreel.com`, `partyreel` (`=app`) the apex, and the proxy
  ([`proxy.ts`](../../src/proxy.ts)) applies the rule before any other.
  - The **admin** surface is an ALLOW-LIST: `/admin`, `/login`, `/auth`, `/api/cron`, `/api/design-gate`
    (the probe the admin layout's own `AppDesignIsland` calls), `/` (redirects to `/admin`) and
    `/robots.txt` (the shared `robots.ts` Disallows every path this host serves). Everything else is
    REWRITTEN to a path no route serves, so the marketing site, host app, guest links and lab answer with
    the real 404 a mistyped URL gets.
  - On the **app** surface `/admin` is a 404 whatever the Host header says, with `assertAdminSurface()`
    inside `requireAdmin()` (and the same surface check in `requireAdminAction`) as belt and braces.
  - **UNSET serves both**, so unsetting the variable IS the rollback. Dev is unset, so `/admin` is
    reachable on localhost (auth and MFA complete only on a real host); the canonical path is `/admin/*`
    everywhere, so `AdminShell` nav works in both.
  Both projects BUILD every route (the rule runs per request, the price of one code path and a
  one-variable rollback); the security boundary is RLS plus the `requireAdmin` seam, never reachability.
- **The crons run on the APP surface only.** `vercel.json` is one file, so BOTH projects register its
  cron and Vercel invokes `/api/cron/purge` once per project. On the admin surface the route answers and
  stops before the admin client exists (no sweep, no DB read, no heartbeat): a second daily run row would
  fake a cadence on `/admin/jobs` and mask a real missed run. `partyreel-admin` leaves Vercel's
  per-project cron disable (the project's `crons.disabledAt`) unset, so this code guard, which survives a
  project being recreated, is the only stop today; setting the flag as well is a cheap second stop. Crons fire only on production deployments, so no preview
  ever purges.
- **Host and preview are per PROJECT.** `NEXT_PUBLIC_ADMIN_HOST` on `partyreel-admin` is
  `admin.partyreel.com` in production and its own `launch-prep` alias host in preview; on `partyreel` it
  is `admin.partyreel.com` in both. So Supabase's auth redirect allow-list needs the admin project's
  preview `/auth/callback` beside the production one, and the app project's preview alias never signs
  anyone into the portal.

## Gotchas (why it's like this — don't revert)

- **Never append a `?next=` query to the `redirectTo`.** A non-wildcard Supabase redirect-allow-list entry
  (`https://admin.partyreel.com/auth/callback`) does NOT match a query-bearing URL, so Supabase silently
  falls back to the **Site URL** (apex) and the login lands on `partyreel.com/?code=…` (never exchanged →
  no session). Keep `redirectTo` query-free, or widen the allow-list entry to `…/auth/callback**`.
- **Locale/tz renders need `suppressHydrationWarning`.** `new Date(x).toLocaleString()` (or any
  `Intl`/locale/timezone formatting) renders in the server's tz/locale during SSR and the browser's on
  hydration → a React **#418** text mismatch. Wrap those spans (the report timestamp in
  [`report-review.tsx`](../../src/components/app/report-review.tsx) does). It only fires when such a value
  actually renders, so an empty list hides it.

## Surfaces

**The shell** ([`admin-shell.tsx`](../../src/components/admin/admin-shell.tsx)) is the bar, the band and
the rail above. Every surface needs its `NAV` entry ([`lib/admin/nav.ts`](../../src/lib/admin/nav.ts)) or
the rail, the crumb and the palette cannot reach it.

★ **Every pending number is ONE read per request.** The layout and the home both want them, and a layout
cannot hand anything to a page, so [`lib/admin/pending.ts`](../../src/lib/admin/pending.ts) wraps the
pending counts and the heartbeat read in React's `cache()`. `serverNow()` beside it is the one clock read
a page may take: `Date.now()` in a component body is impure and `react-hooks/purity` refuses it.

★ **An unreadable heartbeat is never rendered as a count.** [`readJobHealth()`](../../src/lib/jobs/health-summary.ts)
returns `readable: false` and the band says so in words; `countUnhealthyJobs()` still answers 1, because a
BELL has nowhere to put a sentence and a silent bell would be the worse lie.

**The command palette** ([`admin-palette.tsx`](../../src/components/admin/admin-palette.tsx) on
[`ui/command-palette.tsx`](../../src/components/ui/command-palette.tsx)) indexes the surfaces from
`nav.ts`, a short list of actions ([`palette.ts`](../../src/lib/admin/palette.ts)) and accounts through
an AAL2-gated action ([`palette-actions.ts`](../../src/lib/admin/palette-actions.ts), limit 8). ★ **It jumps and never acts**:
"Pause or resume the purge sweep" scrolls to that job's card (`#job-<id>`), where the switch and its
sheet live, because a palette that fired a kill switch would be the portal's cheapest click on its most
expensive act.

**Destructive acts** all open [`destructive-sheet.tsx`](../../src/components/admin/destructive-sheet.tsx)
on the product's one responsive Sheet: delete account (typed; the server re-verifies the confirmation
against the row), remove media, delete announcement, release legal hold, the exports and reel kill
switches and a job pause on their OFF edge (`GuardedSwitch`), and Run now on the purge sweep. The two
report verdicts (Dismiss, Action) are direct buttons on the report.

- **Support / Applicants** — triage `contact_submissions` / `job_applications` (status
  `new`/`in_progress`/`closed`, single-sourced in [`triage.ts`](../../src/lib/constants/triage.ts) + a DB
  CHECK; reply-from-inbox `mailto`; `handled_by`/`handled_at`), written through `requireAdminAction` + the
  service-role client (deny-all tables) with the shared `TriageStatusControl` + `TriageFilter`. Both draw
  `InboxPane`: a list beside the message, the chosen row in the URL as `?id=` (linkable, survives a
  triage write's revalidate, needs no client state).
- **Reports** — the review queue, people first, then albums and items: Dismiss/Action on open reports, an
  Open/All history filter, resolved rows read-only. Actioning an item soft-removes it; a reported person
  is actioned out of band, so marking one handled only closes the report.
- **Accounts** — a read-only host browser (search by email/name, capped at 50): tier, subscription/Event-Pass
  state, ACTIVE storage (the over-capacity sweep's definition) vs effective cap, the raw
  `storage_used_bytes`, counts and a test/live-aware Stripe deep-link (`buildStripeCustomerUrl`,
  [`stripe/dashboard.ts`](../../src/lib/stripe/dashboard.ts), pure + unit-tested), read with the service
  role in [`queries/accounts.ts`](../../src/lib/db/queries/accounts.ts). Its one write is the operator's
  account deletion (`deleteAccountAsOperatorAction`, the host's own deletion path); tier/cap stay the
  Stripe webhook's and the pass recompute's alone → [billing-caps.md](billing-caps.md).
- **Albums** — proactive moderation: a recent-uploads feed across all events + an album drill-in, with
  direct soft-remove + restore within the grace. Service-role cross-host reads
  ([`queries/moderation.ts`](../../src/lib/db/queries/moderation.ts)), tiles through the shared grid-items
  path (`toModerationFeedItems`) into `MediaTile`/`MediaLightbox`; it owns no migration, RPC or grant.
- **Reels** / **Exports** — each a recent log with a 24h health count (Reels: renders that FAILED; Exports:
  every attempt that did not mint, so kill-switch, cap, limiter and empty refusals count as "rejected")
  and a platform kill switch in `ops_flags`: reel video renders (`reel_render_log`, `reel_render_enabled` → [host-app.md](host-app.md));
  album downloads (`export_log`, written by the mint routes because the Worker cannot reach the DB,
  `export_enabled` → [uploads-and-r2.md](uploads-and-r2.md)).
- **Overview** — the home: [`lib/admin/kpi.ts`](../../src/lib/admin/kpi.ts) (pure) computes the four
  figures and their fortnight delta, a server-drawn sparkline carries the signups, and
  [`lib/admin/queue.ts`](../../src/lib/admin/queue.ts) ranks the queue. ★ **Paid subscribers carries no delta**: the
  webhook and the pass recompute are the only writers of `tier` and write no history, so `null` is the honest answer and a
  plausible arrow would be a fabrication.
- **Metrics** — platform KPIs (accounts / content / engagement / growth), live Stripe revenue, `recharts`
  charts. The migration-free service-role aggregator
  ([`queries/metrics.ts`](../../src/lib/db/queries/metrics.ts)) is SPLIT so the home never waits on
  Stripe: `getPlatformDbMetrics()` for what Postgres answers, `getPlatformMetrics()` for that plus
  revenue, read LIVE (`getPlatformRevenue`, [`stripe/revenue.ts`](../../src/lib/stripe/revenue.ts); pure
  `computeMrrCents`, [`stripe/mrr.ts`](../../src/lib/stripe/mrr.ts)); pure reducers in
  [`metrics/aggregate.ts`](../../src/lib/metrics/aggregate.ts). The charts
  ([`metrics-charts.tsx`](../../src/components/admin/metrics-charts.tsx)) seed `ResponsiveContainer` with
  `initialDimension` (no size warning); `react-is` is pinned to React 19 via a pnpm override.
- **Announcements** — compose, publish and delete for the host notification bell; AAL2-gated actions
  ([`announcements/actions.ts`](../../src/app/admin/announcements/actions.ts)) write with the service-role
  client (the table has no host write policy); hosts read through the notification center →
  [notifications-analytics-growth.md](notifications-analytics-growth.md).
- **Forensics** — legal hold + evidence preservation: the 24h capture-coverage signal, the preserve form
  (hold + copy to the preservation prefix), per-hold audit-logged evidence/record exports, hold release on
  the sheet, the `forensic_audit_log` trail. For a guest who proved no email, `guest_display_name` and
  `guest_pending_email` (both captured at upload) are the WHOLE identity of the uploader; the operator
  reads them on the `?what=record` export (the forensic row, unnarrowed) and no page renders either: the
  surface is lawful process, never a host or guest view. Model + CSAM runbook:
  [trust-safety-forensics.md](trust-safety-forensics.md).
- **Jobs** — each job's health, last runs, reports and kill switch (below). **Security** — MFA status
  and the break-glass note.

## Backend jobs (zero silent failures)

Every backend job reports through ONE heartbeat table whatever it runs on, because a job that persists
no run is indistinguishable from a healthy one when it stops firing. The catalog
([`jobs/catalog.ts`](../../src/app/admin/jobs/catalog.ts)) is the single source for what jobs exist,
their cadence, their flag key and whether the app can start them (Run now); the store is
[`queries/jobs.ts`](../../src/lib/db/queries/jobs.ts); the machinery the jobs call is
[`src/lib/jobs/`](../../src/lib/jobs); `job_runs` and the `ops_flags` rows are deny-all, service-role only.

**THREE KINDS OF CATALOG ENTRY**, because "job" means three different things once everything reports.
All three resolve through the SAME pure `jobHealth`, so the page, the alerts bell and the purge
cron's scan can never hold three definitions of healthy.

| kind | what it is | rows | health |
| --- | --- | --- | --- |
| `scheduled` | fires on a clock | its own `job_runs` rows | the cadence + the missed-run rule |
| `signal` | work with no schedule (a send, a limiter read) | only its FAILURE rows | a rolling 24h window: anything failed → failed; nothing at all → "No activity", never green |
| `derived` | a reading only the Worker can take | none: it rides another job's `counts` | the value, plus the health of the run that carried it |

| job | kind | cadence | switch | what it reports |
| --- | --- | --- | --- | --- |
| `purge_cron` | scheduled | daily 04:00 UTC | `purge_cron_enabled` | every sweep's tally, the freshness scan |
| `purge_orphans` | scheduled | inside the purge | `purge_orphans_enabled` | pages scanned, objects deleted, breaker trips |
| `purge_deleted_accounts` | scheduled | inside the purge | `purge_deleted_accounts_enabled` | accounts finished / held, bytes freed, rows failed |
| `purge_inactivity` | scheduled | inside the purge | `purge_inactivity_enabled` | candidates, warned, removed, rows failed |
| `purge_over_capacity` | scheduled | inside the purge | `purge_over_capacity_enabled` | grace opened, reminded, reduced, rows failed |
| `backup_reconcile` | scheduled | daily 05:00 UTC | `backup_reconcile_enabled` | checked / copied / failed, plus both queue depths |
| `backup_prune` | scheduled | weekly Mon 06:00 UTC | `backup_prune_enabled` | scanned / gone / deleted, mode, plus both queue depths |
| `backup_queue` | derived | every Worker run | none | the live copy queue's backlog + its oldest message |
| `backup_dead_letters` | derived | every Worker run | none | objects the live path gave up on: ANY is a failure |
| `db_backup` | scheduled | daily 06:00 UTC | `db_backup_enabled` | the GitHub Action's dump |
| `email_delivery` | signal | rolling 24h | none | sends vs failed-or-refused sends |
| `abuse_limiter` | signal | rolling 24h | none | actions recorded vs limiter errors |
| `unlock_limiter` | signal | rolling 24h | none | failed unlocks recorded vs limiter errors |

- **A run opens a row and closes it** with a status (`running`/`ok`/`error`/`skipped`), a duration and
  free-form `counts`, so the console says what a run DID, not just that it happened.
- **A paused job logs a SKIPPED run** rather than nothing. Pausing is a decision, so it must never read
  as a fault or trip the missed-run alert.
- **The kill switches differ in posture, deliberately.** The purge cron fails CLOSED on an unreadable
  switch (it hard-deletes bytes, and one skipped daily run costs nothing); the backup reconcile and the
  DB-backup Action fail OPEN (a missing backup is worse than a missing log line); the backup prune fails
  CLOSED (it is the only job that deletes from the last-resort copy).
- ★ **The missed-run signal rides the purge cron**, the only scheduled app-side code (APP surface only):
  each run checks EVERY job for a terminal row within 1.5x its own cadence and raises one Sentry
  `job_missed_run` warning per silent job, judged by `jobHealth`, the SAME pure function the page
  renders, so the alert and the console never drift apart. ★ **A freshness rule can only page on SILENCE**,
  so the kinds that are never silent alert at their source: a depth reading raises
  `job_dead_letters_pending` / `job_queue_backlog` inside `/api/internal/job-run` as the Worker hands it
  over, and a signal failure raises its Sentry event where it happens (`src/lib/jobs/failure-log.ts`).
  `jobHealth` without the signal or reading inputs returns `never`, never `missed`, so the scan never
  pages on a number it did not take.
- **A sub-sweep is a job.** The four purge sweeps that loop over ACCOUNTS (orphans, account deletion,
  inactivity, over-capacity) open and close their own row inside the parent run through
  `createSweepRunner` ([`jobs/purge-sweeps.ts`](../../src/lib/jobs/purge-sweeps.ts)), which the cron's
  `runSweep` delegates to; the other eight (the freshness scan included) ride the parent row. Each has its own switch and fails CLOSED
  on an unreadable one, like the parent (they all delete or soft-delete).
- ★ **Per-row isolation never buys silence.** `forEachIsolated`
  ([`jobs/isolate.ts`](../../src/lib/jobs/isolate.ts)) lets the accounts BEHIND a bad row still run,
  and the tally travels with the sweep's result: any `rows_failed` closes that sub-sweep's run as an
  ERROR, and the parent purge run too for a sweep that rides it (`purgeRunVerdict`,
  [`jobs/sweep-tally.ts`](../../src/lib/jobs/sweep-tally.ts); its card prints no nested tally, so the
  parent's status and note are where those failures show). Five consecutive failures abort the loop
  instead, because that is a dead dependency rather than a bad row, and a run that "completed" against a
  dead database would be a lie.
- ★ **A run that stopped early reads "Needs a look".** A purge sweep whose time budget ran out with
  work left (→ [lifecycle-recovery.md](lifecycle-recovery.md)) sets `stopped_early: true` on its tally
  (the catalog's `STOPPED_EARLY_KEY`) with a counted `remaining` where it can take one; the parent run
  sets the flag and `sweeps_stopped_early` when any sweep did, and names each with what it left in its
  note. `getJobStates` reads the flag into `stoppedEarly`, and `jobHealth` turns a finished `ok` run that
  carries it into `attention` (a failure, a pause or a missed run still outranks it), so the band and the
  bell show a backlog that outlasts a night. A promoted sweep's own row closes `ok` with the stop in its
  note; the runner raises one `sweep_stopped_early` warning per sweep per run; the card's Reported line
  leads with `remaining` and never prints a rotating sweep's resume cursor (`resume_after`, which rides
  the run row for its next run).
- **A signal's failure count is a FLOOR, not a census.** The failure log damps a burst to one row per
  quarter hour per instance so a database outage cannot storm the very table the console reads; every
  event still reaches Sentry unthrottled, and the card says so.
- **Heartbeat writes degrade, health reads do not.** A job must not die because its bookkeeping failed,
  so writes swallow and report (the caller raises the warning; Sentry never enters `src/lib/db/*`).
  Reads use `mustQuery` and throw, and the page draws a LOUD banner rather than a calm page of empty
  cards: a health console that renders "nothing to report" when it can read nothing is the failure this
  surface exists to prevent.
- **A job that cannot reach the database** (the Cloudflare Worker, the GitHub Action) reports through
  [`/api/internal/job-run`](../../src/app/api/internal/job-run/route.ts) with the shared internal-jobs
  bearer (`PRUNE_API_SECRET`). The endpoint can PAUSE a job but never START one, so those two get no Run
  now button (a button that lies is worse than a sentence that explains); its free-form `counts` lets the
  Worker add keys (the queue depths) with no app change; only a `scheduled` job may open a run there,
  since a start against a signal or a reading would leave a `running` row nothing ever closes.
  → [durability-backups.md](durability-backups.md).
- ★ **A missing reading is never a zero.** An unreadable queue contributes no key at all, the card
  says "No reading", and a stale reading inherits its source's health — a depth of zero read four
  days ago is not a healthy queue. A fabricated zero on a dead-letter card is this console's failure
  mode in its purest form: the health signal inventing the answer it exists to go and find.

## Safety (reports / operator review)

[`/api/reports`](../../src/app/api/reports/route.ts) takes two arms, both insert-only (a report NEVER
hides content or blocks anyone) and rate-limited. An album or item report is anonymous, from a discreet
dialog on the event page, and its `qr_token` is the capability `create_report` (service-role only)
validates inside the RPC; a person report (`reports.profile_id`, from a public profile's menu) needs a
signed-in reporter, re-verified with `getUser()`. `reports` is RLS deny-all (operator-internal, and it
stores no reporter); operator review is `/admin/reports`. There is no scanner or NSFW filter: review is
human.

## Observability (Sentry)

App-wide via **`@sentry/nextjs`** (free Developer tier). **DSN-gated:** `NEXT_PUBLIC_SENTRY_DSN` unset →
`enabled:false` no-op (dev + an unconfigured build stay green; don't add a hard assert). One shared
`commonInit` ([`observability/sentry.ts`](../../src/lib/observability/sentry.ts)) feeds all three runtimes
([`instrumentation.ts`](../../src/instrumentation.ts) — `register()` + `onRequestError` auto-captures
unhandled throws; [`instrumentation-client.ts`](../../src/instrumentation-client.ts);
`sentry.server.config.ts` / `sentry.edge.config.ts`). `next.config.ts` wraps with `withSentryConfig`
(`useRunAfterProductionCompileHook` = Turbopack **post-build** source maps, needs `@sentry/nextjs` ≥10.13;
upload gated on the build-time `SENTRY_*` tokens). Scope: errors (always) + 10% tracing + **on-error
Session Replay** (`blockAllMedia` + `maskAllText`).

**Invariants:** add capture sites via `captureError(area, …)` / `captureWarning(area, …)` ONLY where errors
are SWALLOWED (the upload finalizer, the webhook, the cron `runSweep`, admin actions) — everything else
rides `onRequestError`; skip routine user rejections (cap/limits/closed). **Never `import @sentry/nextjs`
inside `src/lib/db/*`** (capture at the route/action layer). **Never let Sentry touch the Stripe webhook's
raw body** (capture the already-parsed error/event). PII: `sendDefaultPii:false` + `scrubEvent` strips
presigned-URL query strings + emails.

★ **BOTH HELPERS SCHEDULE A FLUSH ON THE SERVER, NEVER ON THE CLIENT.** Vercel freezes a serverless
function the instant its response leaves, so a bare SDK call can lose the envelope mid-flight: crashes
arrive (`onRequestError`'s path already awaits `Sentry.flush`) while swallowed-error warnings such as
`upload_refused_unverified` silently never do. So `captureError`/`captureWarning` call
`after(() => Sentry.flush(2000))` (`next/server`, reached only behind `typeof window` and a DYNAMIC
import: four "use client" boundaries import this file for `captureError`, and a static import would hand
a browser bundle a module it has no business resolving), falling back to a direct `Sentry.flush` when
`after()` throws outside a request scope (a script, a test).

★ **Guest capability tokens are scrubbed from EVERY channel, not just error events**
([`telemetry-redaction.ts`](../../src/lib/security/telemetry-redaction.ts)). `/e/<qr_token>` puts the
authorization in the URL PATH, and `beforeSend` only strips query strings and only sees errors, so
breadcrumbs, pageload transactions, the `extra` bag and the replay's URL list would carry the token out.
`addEventProcessor` (every event type, BEFORE `beforeSend`) and `beforeBreadcrumb` (before the scope
buffers it) run in all three runtimes, plus the replay's `beforeAddRecordingEvent` on the client.
Redaction matches the token SHAPE (32 to 64 lowercase hex: a `qr_token` is a dash-stripped uuid, a
`session_token` two of them) as well as the `/e/` route, so it catches fields nobody thought about; real
UUIDs keep their dashes. A new capture site is covered automatically: never hand-scrub at call sites.

## See also

[host-app.md](host-app.md) (host-side moderation) · [billing-caps.md](billing-caps.md) · [durability-backups.md](durability-backups.md) (the backup jobs) · [database-security.md](database-security.md) (the seam's `is_admin` lock).
