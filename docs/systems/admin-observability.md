# Admin / operations portal & observability

> ROLE: the operator's tool for running Partyreel + the error-tracking that feeds it.
> BELONGS HERE: the `admin.partyreel.com` perimeter, the `requireAdmin` seam + MFA, every admin surface, the reports/safety queue, Sentry wiring. · NOT HERE: host-side moderation (→ [host-app.md](host-app.md)), the cap/Stripe internals the Accounts/Metrics pages read (→ [billing-caps.md](billing-caps.md)), backup health that P8 will surface (→ [durability-backups.md](durability-backups.md)).
> GROWS BY: integrate-in-place.

## What binds the admin's design (Will, 2026-09-18)

The portal carries the platform's FOUNDATIONAL identity and is otherwise free: the wordmark
(`src/lib/brand/wordmark.ts`, `Logo`), the faces with their weights and spacing, the achromatic Graphite
base. Beyond that it is "an on-brand devtool, not a separate brand identity": real colour is wanted here
(charts, state), density, tables and its own chrome are its to choose, and bible 1 and 2 bind the product,
not the portal past that foundation. The security seam (`requireAdmin`, the host guard, AAL2) is never a
design variable. The `admin` board (round one, 2026-09-18) asks the shape; its picks land here as they wire.

## What it does

An internal portal served on the **`admin.partyreel.com` subdomain by the SAME Next app** (route segment
[`src/app/admin/`](../../src/app/admin) with its own `AdminShell`, distinct from the host `AppShell`).
Three hard gates, all behind ONE seam ([`admin-context.ts`](../../src/lib/auth/admin-context.ts)):
`getUser()` + `profiles.is_admin` + **AAL2** (free app-based TOTP MFA).

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
  separately at the subdomain.
- **The auth callback's `redirectTo` must be the BARE `/auth/callback` (query-free).** On the admin host,
  `callbackUrl()` ([`login-form.tsx`](../../src/components/auth/login-form.tsx)) uses
  `window.location.origin` (NOT the apex `NEXT_PUBLIC_SITE_URL`) so the cookie lands on the subdomain; the
  [callback route](../../src/app/(auth)/auth/callback/route.ts) picks the landing per host (admin → `/admin`).
- **Perimeter:** the proxy ([`proxy.ts`](../../src/proxy.ts)) redirects the subdomain root → `/admin`; the
  layout host-guards so the **apex 404s `/admin`** (existence never leaks) when `NEXT_PUBLIC_ADMIN_HOST` is
  set. Unset (dev) → `/admin` is reachable on localhost, but auth/MFA only complete on the live subdomain.
  Canonical path is `/admin/*` on every host so `AdminShell` nav works in dev + prod.

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

Reached via a single header dropdown ([`admin-nav.tsx`](../../src/components/admin/admin-nav.tsx),
`usePathname` active-section) + a header operator-alerts bell
([`operator-alerts.tsx`](../../src/components/admin/operator-alerts.tsx) surfaces pending support /
applicants / open reports from the existing count queries). Triage writes go through `requireAdminAction` +
the service-role admin client (the deny-all tables); shared `TriageStatusControl` + `TriageFilter`.

- **Support / Applicants** — triage `contact_submissions` / `job_applications` (status
  `new`/`in_progress`/`closed`, single-sourced in [`triage.ts`](../../src/lib/constants/triage.ts) + a DB
  CHECK; reply-from-inbox `mailto`; `handled_by`/`handled_at`; Overview count badges).
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
- **Metrics (P6)** — platform KPIs (accounts / content / engagement / growth) + live Stripe revenue +
  `recharts` charts. A migration-free service-role aggregator
  ([`queries/metrics.ts`](../../src/lib/db/queries/metrics.ts)) feeds pure reducers
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
- **Jobs (P8)** — the backend-job console: every job (the purge cron, the backup Worker's reconcile
  and prune, the nightly DB-backup Action) with its health, its last runs and what each reported, a
  per-job kill switch, and Run now where the app can actually start the job. Model + invariants below.
- **Security** — MFA status.

## Backend jobs (zero silent failures)

Every backend job reports through ONE heartbeat table whatever it runs on, because a job that persists
no run is indistinguishable from a healthy one when it stops firing. The catalog
([`jobs/catalog.ts`](../../src/app/admin/jobs/catalog.ts)) is the single source for what jobs exist,
their cadence, their flag key and whether the app can start them; the store is
[`queries/jobs.ts`](../../src/lib/db/queries/jobs.ts); `job_runs` and the four `ops_flags` rows are
deny-all, service-role only.

- **A run opens a row and closes it** with a status (`running`/`ok`/`error`/`skipped`), a duration and
  free-form `counts`, so the console says what a run DID, not just that it happened.
- **A paused job logs a SKIPPED run** rather than nothing. Pausing is a decision, so it must never read
  as a fault or trip the missed-run alert.
- **The kill switches differ in posture, deliberately.** The purge cron fails CLOSED on an unreadable
  switch (it hard-deletes bytes, and one skipped daily run costs nothing); the backup reconcile and the
  DB-backup Action fail OPEN (a missing backup is worse than a missing log line); the backup prune fails
  CLOSED (it is the only job that deletes from the last-resort copy).
- ★ **The missed-run signal rides the purge cron**, the only scheduled app-side code: at the end of
  every run it checks EVERY job for a terminal row within 1.5x its own cadence and raises one Sentry
  `job_missed_run` warning per silent job. The verdict comes from `jobHealth`, the SAME pure function
  the page renders, so the alert and the console can never drift apart.
- **Heartbeat writes degrade, health reads do not.** A job must not die because its bookkeeping failed,
  so the writes swallow and report (the caller raises the warning, since Sentry never enters
  `src/lib/db/*`). The reads use `mustQuery` and throw, and the page draws a LOUD banner instead of a
  calm page of empty cards: a health console that renders "nothing to report" when it can read nothing
  is the exact failure this surface removes.
- **A job that cannot reach the database** (the Cloudflare Worker, the GitHub Action) reports through
  [`/api/internal/job-run`](../../src/app/api/internal/job-run/route.ts), authenticated with the shared
  internal-jobs bearer (`PRUNE_API_SECRET`, reused rather than minting a second secret). That endpoint
  can PAUSE a job but never START one, so those two get no Run now button: the app has no way to
  trigger them, and a button that lies is worse than a sentence that explains.
  → [durability-backups.md](durability-backups.md).

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
