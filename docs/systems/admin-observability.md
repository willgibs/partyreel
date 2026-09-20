# Admin / operations portal & observability

> ROLE: the operator's tool for running Partyreel + the error-tracking that feeds it.
> BELONGS HERE: the `admin.partyreel.com` perimeter, the `requireAdmin` seam + MFA, every admin surface, the reports/safety queue, Sentry wiring. · NOT HERE: host-side moderation (→ [host-app.md](host-app.md)), the cap/Stripe internals the Accounts/Metrics pages read (→ [billing-caps.md](billing-caps.md)), backup health that P8 will surface (→ [durability-backups.md](durability-backups.md)).
> GROWS BY: integrate-in-place.

## What binds the admin's design (Will, 2026-09-18 and 2026-09-20)

The portal carries the platform's FOUNDATIONAL identity and is otherwise free: the wordmark
(`src/lib/brand/wordmark.ts`, `Logo`), the faces with their weights and spacing, the achromatic Graphite
base. Beyond that it is "an on-brand devtool, not a separate brand identity": real colour is wanted here
(charts, state), density, tables and its own chrome are its to choose, and bible 1 and 2 bind the product,
not the portal past that foundation. The security seam (`requireAdmin`, the host guard, AAL2) is never a
design variable.

The `admin` board asked the SHAPE as seven decisions and Will ruled all seven on 2026-09-20. The answers
bind every surface here:

- **The home opens on the numbers, with the queue beneath** (`home=kpi`): four figures and a fortnight's
  trend, then everything waiting on the operator, worst first. The nine badged cards are gone.
- **A rail, plus a command palette** (`nav=rail-palette`): 232px at `lg` from `navGroups()`, with pending
  counts; the dropdown survives below `lg`. ⌘K reaches a surface, an action or an account.
- **Hybrid density** (`density=hybrid`): a table for data (`ui/table.tsx`), a list beside the message for
  the two prose inboxes (`inbox-pane.tsx`). Reports stays sectioned, in admin-triage's own language.
- **A state's colour reaches the row** (`colour=rows`, his note: "Makes it a bit harder to miss"): four
  states, four voices, and a failed or overdue run tints its own row with a leading edge. The map is
  `src/lib/admin/tone.ts` so a chip and the row under it cannot disagree.
- **One destructive sheet, sized to the damage** (`destructive=sheet`): every destructive act opens the
  same panel and lists what it touches; only a permanent act with something to identify makes you type.
- **The band under the bar on every page** (`health=portal`), absent on a good day.
- **A 44px tool bar** (`chrome=devtool`): a breadcrumb, a live tag, the health chip and an initial.

★ NO OPERATOR AUDIT TABLE. "Write it down" was the `arm` option Will did NOT pick, and nothing records
an operator's own actions today beyond their effect (the forensic trail is its own thing, and covers
holds and evidence only). An `admin_actions` table is a ROADMAP proposal, not a shipped fact.

## What it does

An internal portal on **`admin.partyreel.com`**, built from THIS repository by its **own Vercel project**
(route segment [`src/app/admin/`](../../src/app/admin) with its own `AdminShell`, distinct from the host
`AppShell`; the deployment shape is the Perimeter invariant below). Three hard gates, all behind ONE seam
([`admin-context.ts`](../../src/lib/auth/admin-context.ts)): `getUser()` + `profiles.is_admin` + **AAL2**
(free app-based TOTP MFA).

## The seam (never bypass it)

`requireAdmin()` (pages/layouts: anon → `/login`, non-admin → `notFound()` 404, leak-proof; exposes
`ctx.aal`) and `requireAdminAction()` (actions/routes: returns an `ActionResult`, **requires AAL2** for
writes) are the ONLY entry points. **Never read `profiles.is_admin` directly** — this single seam is the
swap point for a future `staff_members`+roles model (solo admin now, team later). *(Cross-cutting landmine.)*

## Invariants (don't break)

- **MFA is a hard gate, reachable at AAL1 on purpose.** The `/admin` layout renders the enroll/step-up gate
  until the session is AAL2; the gate itself is reachable at AAL1 so you never lock yourself out of first
  enrollment — ship any AAL2 page-gate together with its AAL1 fallback. Break-glass = delete the factor in
  the Supabase dashboard (`auth.mfa_factors`). `getAuthenticatorAssuranceLevel()` →
  `currentLevel`/`nextLevel` (`nextLevel === 'aal2'` → "step up", else "enroll").
- **Keep admin auth cookies HOST-ISOLATED.** `@supabase/ssr` cookies are host-only by default — do NOT set
  a `.partyreel.com` cookie `domain`, or the AAL2 admin session leaks to the apex. The admin signs in
  separately at the subdomain. Two deployments do not make this safe by themselves: both projects talk to
  the one Supabase project, so a domain-scoped cookie would still hand the apex an AAL2 session.
- **The auth callback's `redirectTo` must be the BARE `/auth/callback` (query-free).** On the admin host,
  `callbackUrl()` ([`login-form.tsx`](../../src/components/auth/login-form.tsx)) uses
  `window.location.origin` (NOT the apex `NEXT_PUBLIC_SITE_URL`) so the cookie lands on the subdomain; the
  [callback route](../../src/app/(auth)/auth/callback/route.ts) picks the landing per host (admin → `/admin`).
- **Perimeter: two deployments, one tree** (the admin split, 2026-09-18). Two Vercel projects build the
  same commit of this one repository and differ by ONE variable, `NEXT_PUBLIC_SURFACE`, whose only reader
  is [`src/lib/surface`](../../src/lib/surface): `partyreel-admin` (`=admin`) serves `admin.partyreel.com`,
  `partyreel` (`=app`) serves the apex. The proxy ([`proxy.ts`](../../src/proxy.ts)) applies that rule
  before every other rule it has.
  - On the **admin** surface it is an ALLOW-LIST: `/admin`, `/login`, `/auth`, `/api/cron` and
    `/api/design-gate` (the probe the admin layout's own `AppDesignIsland` calls), plus `/`, which
    redirects to `/admin`, and `/robots.txt`, which the shared `robots.ts` already Disallows entirely.
    Everything else is REWRITTEN to a path no route serves, so the marketing site, the host app, the guest
    links and the lab answer with the same real 404 a mistyped URL gets.
  - On the **app** surface `/admin` is a 404 whatever the Host header says, with `assertAdminSurface()`
    inside `requireAdmin()` (and the same one-liner in `requireAdminAction`) as belt and braces.
  - **UNSET serves both**, byte for byte as before the split, so unsetting the variable IS the rollback.
    Dev is unset, which is why `/admin` stays reachable on localhost; auth and MFA still only complete on
    a real host. Canonical path is `/admin/*` everywhere so `AdminShell` nav works in dev and prod.
  Both projects still BUILD every route: the surface rule is enforced when a request is served, never
  compiled away. That is the deliberate trade for one code path and a one-variable rollback; the security
  boundary is still RLS plus the `requireAdmin` seam, never reachability.
- **The crons run on the APP surface only.** `vercel.json` is one file in one repo, so BOTH projects
  register its cron and Vercel invokes `/api/cron/purge` once per project. The route answers on the admin
  surface and stops before the admin client exists: no sweep, no DB read and no heartbeat, because a
  second run row a day would make `/admin/jobs` report a cadence the job does not have and would mask a
  real missed run. Vercel's per-project cron disable (the project's `crons.disabledAt`) is worth setting on
  `partyreel-admin` as well; the code guard is the one that lives in the repo and survives a project being
  recreated. Crons only fire on production deployments, so no preview ever purges.
- **Host and preview are per PROJECT.** `NEXT_PUBLIC_ADMIN_HOST` is set on each project and per
  environment: production `admin.partyreel.com`, preview that project's own `launch-prep` alias host. So
  Supabase's auth redirect allow-list needs the admin project's preview `/auth/callback` alongside the
  production one, and the app project's preview alias no longer signs anyone into the portal.

## Gotchas (why it's like this — don't revert)

- **Do NOT append a `?next=` query to the `redirectTo` (cost a deploy in R1).** A non-wildcard Supabase
  redirect-allow-list entry (`https://admin.partyreel.com/auth/callback`) does NOT match a query-bearing
  URL, so Supabase silently falls back to the **Site URL** (apex) and the login lands on
  `partyreel.com/?code=…` (never exchanged → no session). Keep `redirectTo` query-free, or widen the
  allow-list entry to `…/auth/callback**`.
- **Locale/tz renders need `suppressHydrationWarning`.** `new Date(x).toLocaleString()` (or any
  `Intl`/locale/timezone formatting) renders in the server's tz/locale during SSR and the browser's on
  hydration → a React **#418** text mismatch. Wrap those spans (the report timestamp in
  [`report-review.tsx`](../../src/components/app/report-review.tsx) does). It only fires when such a value
  actually renders (an empty list hid it once).

## Surfaces

**The shell** ([`admin-shell.tsx`](../../src/components/admin/admin-shell.tsx)) is a 44px tool bar
([`admin-bar.tsx`](../../src/components/admin/admin-bar.tsx): the wordmark, a breadcrumb from `NAV` and
the pathname, a live tag from `VERCEL_ENV`, the health chip, the alerts bell and an initial opening the
operator menu with the address and sign-out), a health band under it
([`health-band.tsx`](../../src/components/admin/health-band.tsx), rendered only when a job needs a look
or the heartbeat is unreadable), and a 232px rail at `lg`
([`admin-rail.tsx`](../../src/components/admin/admin-rail.tsx), `navGroups()` with pending counts on
Support, Applicants, Reports and Jobs). Below `lg` the rail is not drawn and the original dropdown
([`admin-nav.tsx`](../../src/components/admin/admin-nav.tsx)) is the nav. The rail goes full bleed: the
product's centred `Container` is wrong beside a fixed rail.

★ **Every pending number is ONE read per request.** The layout and the home both want them, and a layout
cannot hand anything to a page, so [`lib/admin/pending.ts`](../../src/lib/admin/pending.ts) wraps the
four counts plus the heartbeat in React's `cache()`. `serverNow()` beside it is the one clock read a page
may take: `Date.now()` in a component body is impure and `react-hooks/purity` refuses it.

★ **An unreadable heartbeat is never rendered as a count.** [`readJobHealth()`](../../src/lib/jobs/health-summary.ts)
returns `readable: false` and the band says so in words; `countUnhealthyJobs()` still answers 1, because a
BELL has nowhere to put a sentence and a silent bell would be the worse lie.

**The command palette** ([`admin-palette.tsx`](../../src/components/admin/admin-palette.tsx) on the new
primitive [`ui/command-palette.tsx`](../../src/components/ui/command-palette.tsx)) indexes the surfaces
from `nav.ts`, a short list of actions, and accounts through an AAL2-gated action
([`palette-actions.ts`](../../src/lib/admin/palette-actions.ts), limit 8). ★ **It jumps and never acts**:
"Pause the purge sweep" scrolls the jobs console to that job's card (`#job-<id>`), where the switch and
its sheet live. A palette that fired a kill switch would be the portal's cheapest click on its most
expensive act.

**Destructive acts** all open [`destructive-sheet.tsx`](../../src/components/admin/destructive-sheet.tsx)
on the product's one responsive Sheet: delete account (typed; the server still re-verifies the
confirmation against the row), remove media, delete announcement, release legal hold (the arm-then-confirm
is retired), the exports and reel kill switches and a job pause on their OFF edge (`GuardedSwitch`), and
Run now on the purge sweep. The two report verdicts are admin-triage's and are unchanged.

Triage writes go through `requireAdminAction` + the service-role admin client (the deny-all tables);
shared `TriageStatusControl` + `TriageFilter`.

- **Support / Applicants** — triage `contact_submissions` / `job_applications` (status
  `new`/`in_progress`/`closed`, single-sourced in [`triage.ts`](../../src/lib/constants/triage.ts) + a DB
  CHECK; reply-from-inbox `mailto`; `handled_by`/`handled_at`; rail counts). Both draw the shared
  `InboxPane`: a list beside the message, with the chosen row in the URL as `?id=` (linkable, survives a
  triage write's revalidate, and needs no client state).
- **Reports** — the review queue (dismiss/action on open reports + an Open/All history filter, resolved rows read-only).
- **Accounts (P4, READ-ONLY)** — host browser (search by email/name) + tier + subscription/Event-Pass state
  + ACTIVE storage vs effective cap + the raw `storage_used_bytes` + counts + a test/live-aware Stripe
  deep-link. Service-role reads in [`queries/accounts.ts`](../../src/lib/db/queries/accounts.ts) (the only
  cross-host `profiles` reader) reuse the over-capacity active-bytes query; `buildStripeCustomerUrl`
  ([`stripe/dashboard.ts`](../../src/lib/stripe/dashboard.ts)) is pure + unit-tested. The Stripe webhook
  stays the SOLE writer of tier/cap → [billing-caps.md](billing-caps.md).
- **Albums (P5)** — proactive moderation: a recent-uploads feed across all events + an album drill-in, with
  direct soft-remove + restore within the grace. Cross-host media reads via service-role
  ([`queries/moderation.ts`](../../src/lib/db/queries/moderation.ts)); render via the shared
  `toGridItems`/`MediaTile`/`MediaLightbox` path. No migration, no new RPC, no new grants.
- **Overview** — the four figures with their fortnight delta ([`lib/admin/kpi.ts`](../../src/lib/admin/kpi.ts),
  pure), a server-drawn signup sparkline, and the ranked queue
  ([`lib/admin/queue.ts`](../../src/lib/admin/queue.ts)). ★ **Paid subscribers carries no delta**: the
  Stripe webhook is the sole writer of `tier` and writes no history, so `null` is the honest answer and a
  plausible arrow would be a fabrication.
- **Metrics (P6)** — platform KPIs (accounts / content / engagement / growth) + live Stripe revenue +
  `recharts` charts. A migration-free service-role aggregator
  ([`queries/metrics.ts`](../../src/lib/db/queries/metrics.ts), SPLIT into `getPlatformDbMetrics()` for
  everything Postgres can answer and `getPlatformMetrics()` for that plus revenue, so the home never waits
  on Stripe) feeds pure reducers
  ([`metrics/aggregate.ts`](../../src/lib/metrics/aggregate.ts)); revenue is read LIVE from Stripe
  (`getPlatformRevenue`, [`stripe/revenue.ts`](../../src/lib/stripe/revenue.ts), pure `computeMrrCents`).
  Charts ([`metrics-charts.tsx`](../../src/components/admin/metrics-charts.tsx)) seed `ResponsiveContainer`
  with `initialDimension` (no size warning); `react-is` is pinned to React 19 via a pnpm override.
- **Announcements (P7)** — operator compose/publish to the host notification bell; an AAL2-gated action
  ([`announcements/actions.ts`](../../src/app/admin/announcements/actions.ts)) inserts via the service-role
  client (the table has no host write policy). Hosts read it via the unchanged notification center →
  [notifications-analytics-growth.md](notifications-analytics-growth.md).
- **Forensics** — the legal-hold + evidence-preservation surface: 24h capture-coverage
  health signal, the preserve form (hold + copy-to-preservation-prefix), per-hold audit-logged
  evidence/record exports, two-step hold release, the `forensic_audit_log` trail. Full model + the
  CSAM runbook: [trust-safety-forensics.md](trust-safety-forensics.md).
- **Jobs (P8)** — the backend-job console: every job (the purge cron and its four promoted
  sub-sweeps, the backup Worker's reconcile and prune plus its queue and dead-letter depths, the
  nightly DB-backup Action, and the rolling email / limiter signals) with its health, its last runs
  and what each reported, a per-job kill switch, and Run now where the app can actually start the
  job. Model + invariants below.
- **Security** — MFA status.

## Backend jobs (zero silent failures)

Every backend job reports through ONE heartbeat table whatever it runs on, because a job that persists
no run is indistinguishable from a healthy one when it stops firing. The catalog
([`jobs/catalog.ts`](../../src/app/admin/jobs/catalog.ts)) is the single source for what jobs exist,
their cadence, their flag key and whether the app can start them; the store is
[`queries/jobs.ts`](../../src/lib/db/queries/jobs.ts); the machinery the jobs themselves call is
[`src/lib/jobs/`](../../src/lib/jobs); `job_runs` and the `ops_flags` rows are deny-all,
service-role only.

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
| `purge_cron` | scheduled | daily 04:00 | `purge_cron_enabled` | every sweep's tally, the freshness scan |
| `purge_orphans` | scheduled | inside the purge | `purge_orphans_enabled` | pages scanned, objects deleted, breaker trips |
| `purge_deleted_accounts` | scheduled | inside the purge | `purge_deleted_accounts_enabled` | accounts finished / held, bytes freed, rows failed |
| `purge_inactivity` | scheduled | inside the purge | `purge_inactivity_enabled` | candidates, warned, removed, rows failed |
| `purge_over_capacity` | scheduled | inside the purge | `purge_over_capacity_enabled` | grace opened, reminded, reduced, rows failed |
| `backup_reconcile` | scheduled | daily 05:00 | `backup_reconcile_enabled` | checked / copied / failed, plus both queue depths |
| `backup_prune` | scheduled | weekly Mon 06:00 | `backup_prune_enabled` | scanned / gone / deleted, mode, plus both queue depths |
| `backup_queue` | derived | every Worker run | none | the live copy queue's backlog + its oldest message |
| `backup_dead_letters` | derived | every Worker run | none | objects the live path gave up on: ANY is a failure |
| `db_backup` | scheduled | daily 06:00 | `db_backup_enabled` | the GitHub Action's dump |
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
- ★ **The missed-run signal rides the purge cron**, the only scheduled app-side code (and it runs on the
  APP surface only, see the Perimeter invariant): at the end of
  every run it checks EVERY job for a terminal row within 1.5x its own cadence and raises one Sentry
  `job_missed_run` warning per silent job. The verdict comes from `jobHealth`, the SAME pure function
  the page renders, so the alert and the console can never drift apart. ★ **A freshness rule can only
  page on SILENCE**, so the two kinds that are never silent alert at their own source instead: a
  depth reading raises `job_dead_letters_pending` / `job_queue_backlog` inside `/api/internal/job-run`
  the moment the Worker hands it over, and a signal failure raises its Sentry event where it happens
  (`src/lib/jobs/failure-log.ts`). Calling `jobHealth` without the signal or reading inputs returns
  `never`, never `missed`, so the scan never pages on a number it did not take.
- **A sub-sweep is a job.** The four purge sweeps that loop over ACCOUNTS (orphans, account deletion,
  inactivity, over-capacity) open and close a row of their own inside the parent run, through
  `createSweepRunner` ([`jobs/purge-sweeps.ts`](../../src/lib/jobs/purge-sweeps.ts)), which the
  cron's `runSweep` delegates to; the other seven still ride the parent row. Each has its own switch
  and fails CLOSED on an unreadable one, matching the parent (they all delete or soft-delete).
- ★ **Per-row isolation never buys silence** (QA #27). `forEachIsolated`
  ([`jobs/isolate.ts`](../../src/lib/jobs/isolate.ts)) lets the accounts BEHIND a bad row still run,
  and the tally travels with the sweep's result: any `rows_failed` closes that sub-sweep's run as an
  ERROR. Five consecutive failures abort the loop instead, because that is a dead dependency rather
  than a bad row, and a run that "completed" against a dead database is the lie being removed.
- **A signal's failure count is a FLOOR, not a census.** The failure log damps a burst to one row per
  quarter hour per instance so a database outage cannot storm the very table the console reads; every
  event still reaches Sentry unthrottled, and the card says so.
- **Heartbeat writes degrade, health reads do not.** A job must not die because its bookkeeping failed,
  so the writes swallow and report (the caller raises the warning, since Sentry never enters
  `src/lib/db/*`). The reads use `mustQuery` and throw, and the page draws a LOUD banner instead of a
  calm page of empty cards: a health console that renders "nothing to report" when it can read nothing
  is the exact failure this surface removes.
- **A job that cannot reach the database** (the Cloudflare Worker, the GitHub Action) reports through
  [`/api/internal/job-run`](../../src/app/api/internal/job-run/route.ts), authenticated with the shared
  internal-jobs bearer (`PRUNE_API_SECRET`, reused rather than minting a second secret). That endpoint
  can PAUSE a job but never START one, so those two get no Run now button: the app has no way to
  trigger them, and a button that lies is worse than a sentence that explains. Its `counts` field is
  a free-form record on both ends, which is what lets the Worker add the queue depths ADDITIVELY: an
  app deploy predating the Worker's stores the extra keys harmlessly, one postdating it reads them.
  Only a `scheduled` job may open a run there (a start against a signal or a reading would leave a
  `running` row nothing will ever close). → [durability-backups.md](durability-backups.md).
- ★ **A missing reading is never a zero.** An unreadable queue contributes no key at all, the card
  says "No reading", and a stale reading inherits its source's health — a depth of zero read four
  days ago is not a healthy queue. A fabricated zero on a dead-letter card is this console's failure
  mode in its purest form: the health signal inventing the answer it exists to go and find.

## Safety (reports / operator review)

`create_report` (anon capability-token RPC, insert-only, NEVER auto-hides) + a discreet report dialog on
the event page; operator review in `/admin/reports`. `reports` is RLS deny-all (operator-internal). v1 is
reports/review only — no scanner/NSFW filter (v2+).

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
★ **Guest capability tokens are scrubbed from EVERY channel, not just error events**
([`telemetry-redaction.ts`](../../src/lib/security/telemetry-redaction.ts)). `/e/<qr_token>` puts the
authorization in the URL PATH, and `beforeSend` only strips query strings and only sees errors, so the
token used to leave intact on navigation/fetch breadcrumbs, pageload transactions, the `extra` bag and
the replay's URL list. Three hooks, wired in all three runtimes: `addEventProcessor` (every event type,
and it runs BEFORE `beforeSend`, which still gets its turn), `beforeBreadcrumb` (catches it before the
scope buffers it) and the replay's `beforeAddRecordingEvent`. Redaction matches the token SHAPE (32
lowercase hex, a dash-stripped uuid) as well as the `/e/` route, so it catches fields nobody thought
about; real UUIDs keep their dashes and are never touched. Add a new capture site and it is covered
automatically -- do not hand-scrub at call sites.

## See also

[host-app.md](host-app.md) (host-side moderation) · [billing-caps.md](billing-caps.md) · [durability-backups.md](durability-backups.md) (P8) · [database-security.md](database-security.md) (the seam's `is_admin` lock).
