# Admin portal & observability

Open this before you:
- add or change an admin surface, action or page;
- touch the admin's sign-in, its MFA or the two-deployment perimeter;
- add a backend job, a kill switch or anything else that must report its health;
- add a Sentry capture.

Elsewhere: host-side moderation ([host-app.md](host-app.md)), the forensic surface and the CSAM runbook
([trust-safety-forensics.md](trust-safety-forensics.md)), the backup jobs themselves ([durability-backups.md](durability-backups.md)), announcements for the host's bell
([notifications-analytics-growth.md](notifications-analytics-growth.md)).

## The seam

`requireAdmin()` (pages and layouts: anon to `/login?next=<the portal page asked for>`, a non-admin to `notFound()`,
so the portal's existence never leaks; it exposes `ctx.aal`, and a sensitive page returns null below AAL2 before it
fetches) and `requireAdminAction()` (actions and routes; requires AAL2) are the only entry points. Nothing reads
`profiles.is_admin` directly: the seam is the one place a future staff-and-roles model swaps in.
- **MFA (free TOTP) is a hard gate that stays reachable at AAL1,** so a first enrollment can never lock itself out:
  an AAL2 page gate ships with its AAL1 fallback. Break-glass is deleting the factor in `auth.mfa_factors` from the
  Supabase dashboard.
- **Admin auth cookies stay host-only:** a `.partyreel.com` cookie domain would carry the AAL2 session to the apex,
  since both projects share one Supabase project.
- **The auth callback's `redirectTo` is the bare `/auth/callback`,** built from `window.location.origin` on the
  admin host (not the apex `NEXT_PUBLIC_SITE_URL`), so the cookie lands on the subdomain; the callback picks the
  landing per host. A `?next=` on it breaks sign-in silently: a non-wildcard allow-list entry does not match a
  query-bearing URL, so Supabase falls back to the Site URL and the login lands on `partyreel.com/?code=…`, never
  exchanged. The page the gate was asked for rides a cookie instead (auth-accounts.md, "A sign-in lands").
- ★ **No operator audit table exists:** nothing records an operator's own actions beyond their effect (the forensic
  trail covers holds and evidence only; an `admin_actions` table is a ROADMAP proposal).

## The perimeter: two deployments, one tree

Two Vercel projects build the same commit of this one repository, so every surface changes together, and differ by
one variable, `NEXT_PUBLIC_SURFACE`, read only through `src/lib/surface` and applied by `proxy.ts` before any other
rule. `partyreel-admin` (`=admin`) serves `admin.partyreel.com` as an allow-list (the portal, sign-in, the cron route,
the design-gate probe) and rewrites everything else to the real 404; `partyreel` (`=app`) 404s `/admin` whatever the
Host header says, with `assertAdminSurface()` inside the seam as belt and braces. Unset serves both, which is dev and
also the rollback. Both projects build every route; the security boundary is RLS and the seam, never reachability.
- **The purge cron runs on the app surface only.** `vercel.json` is one file, so both projects register the cron
  and Vercel calls `/api/cron/purge` once per project; on the admin surface the route stops before the admin client
  exists (no sweep, no read, no heartbeat), because a second daily run row would fake a cadence and mask a real
  missed run. That code guard is the stop (a second, `crons.disabledAt` on `partyreel-admin`, is on the ROADMAP).
  Crons fire only on production deployments.
- **`NEXT_PUBLIC_ADMIN_HOST` is per project:** on `partyreel-admin` it is `admin.partyreel.com` in production and its
  own `launch-prep` alias host in preview; on `partyreel` it is `admin.partyreel.com` in both. So Supabase's redirect
  allow-list carries the admin project's preview `/auth/callback` beside production's, and the app's preview alias
  never signs anyone into the portal.
- **Verifying:** auth and MFA complete only on a real host, and `lab:smoke` can never reach `/admin`; the Library's
  compositions page renders the real rail, band, queue, table, palette and sheet, the one automated eye on the portal.
  The admin host's sign-in plumbing short of Google (the gate's page, the login form's cookie, the callback) walks
  locally under `NEXT_PUBLIC_ADMIN_HOST=admin.localhost pnpm dev` at `http://admin.localhost:<port>`.

## Building a surface

The portal is an on-brand devtool: it carries the platform's foundational identity (the wordmark, the faces with their
weights and spacing, the cool-grey Graphite base) so it reads as Partyreel, and is otherwise free, because an
operator's tool wants what the product does not: real colour for charts and state, density, tables, its own chrome.
The bible's "media is the colour" and "one token set" reach it only as far as that foundation. The security seam is
never a design variable.
- **A surface needs its `NAV` entry** (`lib/admin/nav.ts`), or the rail, the breadcrumb and the palette cannot reach
  it; `nav.test.ts` fails on a page the nav cannot reach.
- **State colour comes from one map,** `lib/admin/tone.ts`, so a chip and the row under it cannot disagree.
- **Every destructive act opens `destructive-sheet.tsx`,** which lists what the act touches; only a permanent act
  with something to identify asks you to type, and the server re-checks what was typed against the row. A confirm
  can carry one `note` (optional, or required as a hold's reason is), typed into it rather than a form beside it.
- **Every inbox speaks through one filter bar and one status picker** (`TriageFilter`, `StatusPicker`), each given
  its inbox's own words (`InboxWords`): Reports says Open, Dismissed and Actioned and lands on Open; Support and
  Applicants say New, In progress and Closed and land on All.
- ★ **The command palette jumps and never acts:** its actions scroll to the card where the switch and its sheet live,
  because a palette that fired a kill switch would be the portal's cheapest click on its most expensive act.
- ★ **Every pending number is one read per request.** A layout cannot hand anything to a page, so
  `lib/admin/pending.ts` wraps the pending counts and the heartbeat read in React's `cache()`; `serverNow()` beside it
  is the one clock read a page takes (`Date.now()` in a component body is impure, and `react-hooks/purity` refuses
  it).
- ★ **An unreadable heartbeat is never a count:** `readJobHealth()` returns `readable: false` and the band says so in
  words, while `countUnhealthyJobs()` still answers 1, because a bell has nowhere to put a sentence and a silent bell
  would be the worse lie.
- ★ **Paid subscribers carries no delta:** the webhook and the pass recompute write `tier` and keep no history, so
  `null` is the honest answer and any arrow would be invented.
- **Every admin timestamp goes through `formatAdminTimestamp` / `formatAdminDate`** (`format/admin-time.ts`, fixed to
  `en-US` and UTC), so the server's render and the browser's hydration print the same string: a bare
  `toLocaleString()` renders the server's zone, then the browser's, and React throws #418.
- The home reads only what Postgres answers (`getPlatformDbMetrics()`), so it never waits on Stripe; `/admin/metrics`
  adds live revenue. The pnpm override pinning `react-is` to React 19 is for `recharts`.

## Backend jobs

A job that persists no run looks exactly like a healthy one once it stops, so every backend job, whatever it runs on,
reports through one heartbeat table, `job_runs` (deny-all, like the `ops_flags` switches). The catalog
(`app/admin/jobs/catalog.ts`) is the single source for which jobs exist, their cadence, their switch and whether the
app can start them. Three kinds share one pure `jobHealth`, so the page, the bell and the cron's scan never hold
three definitions of healthy:
- **scheduled** (fires on a clock; its own rows; judged by its cadence and the missed-run rule);
- **signal** (work with no schedule, such as a send, a limiter read or the help center's feedback beacon; only its
  FAILURE rows, over a rolling 24 hours: anything failed is failed, nothing at all is "No activity", never green);
- **derived** (a reading only the Worker can take, riding another job's `counts`; its value, with the health of the
  run that carried it).

- **A run opens a row and closes it** with a status (`running`, `ok`, `error`, `skipped`), a duration and free-form
  `counts`, so the console says what a run did. A paused job logs a skipped run, never nothing: a pause is a decision,
  not a fault, and never trips the missed-run alert.
- **The kill switches fail differently on purpose.** The purge cron and its sub-sweeps fail CLOSED on an unreadable
  switch (they delete, and a skipped day costs nothing); the backup reconcile and the DB-backup Action fail OPEN (a
  missing backup is worse than a missing log line); the prune fails CLOSED (it deletes from the last-resort copy); the
  live reel's platform lever fails OPEN (a flaky read must not take the reel off every album, [reel.md](reel.md)).
- ★ **The missed-run signal rides the purge cron,** the only scheduled app-side code: each run checks every job for a
  terminal row within 1.5 times its cadence and raises one `job_missed_run` warning per silent job, judged by
  `jobHealth`. ★ **A freshness rule can page only on SILENCE,** so the kinds that are never silent alert at their
  source: a depth reading raises `job_dead_letters_pending` or `job_queue_backlog` inside `/api/internal/job-run` as
  the Worker hands it over, and a signal failure raises where it happens (`jobs/failure-log.ts`). `jobHealth` without
  its inputs returns `never`, not `missed`, so the scan never pages on a number it did not take.
- **A sub-sweep is a job:** the purge sweeps that loop over accounts (orphans, account deletion, inactivity,
  over-capacity) open and close their own row inside the parent run through `createSweepRunner`, with their own
  switch; the rest ride the parent's row.
- ★ **Per-row isolation never buys silence.** `forEachIsolated` lets the accounts behind a bad row still run, and the
  tally travels with the result: any `rows_failed` closes that sweep's run as an ERROR (the parent's too, for a sweep
  that rides it: `purgeRunVerdict`), and five consecutive failures abort the loop, because that is a dead dependency,
  not a bad row, and a run that "completed" against a dead database would be a lie.
- ★ **A run that stopped early reads "Needs a look":** a sweep out of time with work left sets `stopped_early` (with a
  counted `remaining` where it can take one), and `jobHealth` turns a finished `ok` run carrying it into `attention`
  (a failure, a pause or a missed run still outranks it), so the band and the bell show a backlog that outlasts a
  night. The card leads with `remaining` and never prints a rotating sweep's resume cursor.
- **A tripped orphan breaker reads attention too:** it deletes nothing, fires its Sentry error and the email, and closes
  its run `ok` carrying `breaker_tripped`, which `jobHealth` reads as `attention` (a failure, a pause or a missed run
  outranks it).
- **A signal's failure count is a floor, not a census:** the log damps a burst to one row per quarter hour per
  instance, so a database outage cannot storm the table the console reads; Sentry still gets every event.
- **Heartbeat writes degrade; health reads do not.** A job must not die because its bookkeeping failed, so writes
  swallow and report (the caller raises the warning; Sentry never enters `src/lib/db/*`). Reads throw (`mustQuery`)
  and the page draws a loud banner, because a console reading "nothing to report" when it can read nothing is the
  failure this surface exists to prevent.
- **A job that cannot reach the database** (the Worker, the GitHub Action) reports through `/api/internal/job-run`
  with the internal-jobs bearer (`PRUNE_API_SECRET`). The endpoint can pause a job but never start one, so those jobs
  show no Run now (a button that lies is worse than a sentence that explains), and only a `scheduled` job may open a
  run there, since a start against a signal or a reading would leave a `running` row nothing closes.
- ★ **A missing reading is never a zero:** an unreadable queue contributes no key and the card says "No reading", and
  a stale reading inherits its source's health.

## Reports

`/api/reports` takes two arms, both rate-limited. An album or item report carries its `qr_token`, the capability
`create_report` validates inside the RPC, which is service-role only, so nothing but the route can hand it a reporter;
a person report (`reports.profile_id`) needs a signed-in reporter, re-checked with `getUser()`. `reports` is deny-all.
Review is human (`/admin/reports`; no scanner or NSFW filter). The rules are one pure module, `lib/admin/reports.ts`;
the kinds, their words and their order are `lib/reports/kinds.ts`, mirrored by the `report_kind` enum under a parity
test (admin-triage r2):
- ★ **The reporter is the session's, never the body's.** The route reads `getUser()`: whether anyone is signed in,
  and an address only beside `email_confirmed_at` (`lib/reports/reporter.server.ts`). The form's Confirm your email is
  the account door's own code, so confirming makes a free account. A report keeps a confirmed address only while it
  is open (a BEFORE trigger forgets it and the answer link's hash at the close; a CHECK refuses a closed row holding
  either). A child-abuse report also keeps `reporter_hash`, the address's HMAC under `UNLOCK_COOKIE_SECRET` in its own
  `r-addr:` domain, which its limits and its bar read after the address is gone. Nothing tells the host or the person
  reported who filed a report. The queue says only what the session proved (`reporterWords`): the album's own host
  (the kept address, or the kept hash, is hers), else a guest signed in or not; and whether she can be asked, which a
  report reopened after its close no longer can, though its hash still says a confirmed address sent it.
- ★ **The instant hide** (`create_report`): a `child` report of an item from a confirmed address makes the item an
  operator's removal at once (`hid_at` equal to its `removed_at`). Never for the event's own host, never for an
  address a dismissed child-abuse report bars, at most 3 an address and 5 an event in 24 hours (advisory-locked);
  otherwise the report is filed the same and heads the queue. Every other kind inserts only. A child-abuse report
  tells the operator after the response (`alertUrgentReport`: a Sentry warning every time, an ops-inbox mail once
  per album per ten minutes) and on the rail and the bell (the urgent count).
- **The open queue is the review grid** (`components/admin/report-queue.tsx`): the five harm kinds in front, worst
  first, the two sexual kinds covered until View (★ and covered on every closed line whose item any report names as
  one, with no picture signed: build 23's NIT-7); People between; Something else in the sweep, ticked and dismissed
  in one press. Space opens a report whole. At phone width each report carries Take it down and Hold for forensics,
  one press each; sweeps, notes and proof wait for a desk. The Library's compositions page renders it over writes
  that change nothing.
- ★ **A verdict reads its own report and answers its whole entry.** The browser names one report; the action reads
  its item, album or person and every report still open on it, and closes them together. The item a Remove takes
  down is the report's `media_id`, never an id the browser sends, and a verdict lands only on an OPEN report, so a
  second tab is told "already decided". Dismiss and Mark actioned are one press; Remove opens the confirm; each may
  carry `resolution_note`.
- **A dismissal puts back what a false report's hide took** (`hideUndoOf`: into the album at the hide's own instant,
  or back to the host's Deleted), never a held item; its Undo reopens exactly the reports it closed and hides the
  item again, `hid_at` moving to the new removal.
- **Actioning an item makes it an operator's removal whatever its state** (one the host or a guest had removed
  becomes the operator's, keeping its `removed_at`), one instant stamping the removal and the verdict. A reported
  person is actioned out of band, so Mark actioned only closes the report. A phone's Take it down makes the same
  removal and leaves the reports open; its toast's Undo restores only that press's removal.
- **A closed report is one line with its way back** (`wayBackOf`, measured at the page's one clock read). A removal's
  Undo lives exactly as long as the removal ITS verdict made (the removal's `removed_at` equal to the verdict's
  `resolved_at`, still an operator's, not held): it reopens the report first, then restores the item where it was; a
  held item reads Held and has no Undo. ★ A dismissal reopens, from its toast's Undo or its line, inside 30 days of
  the verdict (the write itself requires `dismissed` and the window's floor); Mark actioned and an album's Action have
  no way back.
- ★ **Hold for forensics carries Take it down too, ON by default** (Will, 2026-09-29: "a hold is for what police
  should see"). It reads what it reaches first (the reported item and the same uploader's other items in the event:
  its guest row, or every row the same account holds there; no guest row means the host's own uploads), makes each
  an operator's removal BEFORE any copy starts, then preserves each through `preserveMedia`, the reported item alone
  first, the rest four at a time inside the page's `maxDuration` (a partial run says how far it got; pressing again
  is safe). Unticked it is the quiet hold, and nothing leaves the album (trust-safety-forensics.md). The report stays
  open.
- **Ask for proof** mails the operator's own question to the reporter's confirmed address with a one-use link
  (`/report/<token>`; only its SHA-256 is stored, forgotten at the close) where her answer lands on the report
  itself. Never for a child-abuse report. ★ Behind `ops_flags.report_proof_mail_enabled`, seeded OFF: while it is
  off the ask is refused in words and nothing is written, and a mail that never went takes the ask back.

## Help feedback

`/admin/help-feedback` (under Watching: a reading, never an inbox) is the one place the help center's "Did this answer
your question?" is read: `article_feedback_summary` gives each article's Yes and No with its last click, newest first,
and a row where No outnumbers Yes is tinted. Above it, the `help_feedback` signal: its own rows are the success half,
and `/api/help/feedback` writes a failure row for every click it drops, whether the limiter could not answer or the
insert failed, because the reader sees the same thank-you either way and nothing else would ever show it. A failed read
says so in words, never "No feedback yet".

## Sentry

`@sentry/nextjs` on the free tier, DSN-gated: with `NEXT_PUBLIC_SENTRY_DSN` unset it is a no-op, so dev and an
unconfigured build stay green without a hard assert. Session Replay records only on error, with all media blocked and
all text masked; `sendDefaultPii` is off, and `scrubEvent` strips presigned-URL query strings and emails.
- **Capture with `captureError` / `captureWarning(area, …)` only where an error is swallowed** (the upload finalizer,
  the webhook, the cron's `runSweep`, admin actions); everything else rides `onRequestError`, and routine user
  rejections (caps, limits, a closed album) are not errors. Sentry never enters `src/lib/db/*` (capture at the route
  or action) and never touches the Stripe webhook's raw body.
- ★ **Both helpers schedule a flush on the server, never the client.** Vercel freezes a function the instant its
  response leaves, so a bare SDK call can lose the envelope: crashes arrive (`onRequestError` already flushes) while
  swallowed-error warnings silently never do. The helpers call `after(() => Sentry.flush(2000))` behind a
  `typeof window` check and a dynamic import (four client boundaries import the file), and flush directly when
  `after()` throws outside a request scope.
- ★ **Guest capability tokens are scrubbed from every channel** (`telemetry-redaction.ts`): `/e/<qr_token>` puts the
  authorization in the URL path, and `beforeSend` sees only errors, so breadcrumbs, pageload transactions, `extra`
  and the replay's URL list would carry the token out. `addEventProcessor`, `beforeBreadcrumb` and the replay's
  `beforeAddRecordingEvent` redact by token SHAPE (32 to 64 lowercase hex; real UUIDs keep their dashes) as well as
  the `/e/` route, so a new capture site is covered with no scrubbing at the call.
