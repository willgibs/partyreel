# Admin portal & observability

Open this before you:
- add or change an admin surface, action or page;
- touch the admin's sign-in, its MFA or the two-deployment perimeter;
- add a backend job, a kill switch or anything else that must report its health;
- change a spend guard: a reading, a floor, a ceiling or a switch the spend watch pauses;
- change a vendor's plan or a plan limit the watch measures (a plan cutover, a new meter, a credential for one);
- change what the Accounts pages read of a host (her uploads, her storage);
- add a Sentry capture.

Elsewhere: host-side moderation ([host-app.md](host-app.md)), the forensic surface and the CSAM runbook
([trust-safety-forensics.md](trust-safety-forensics.md)), the backup jobs themselves ([durability-backups.md](durability-backups.md)), announcements for the host's bell
([notifications-analytics-growth.md](notifications-analytics-growth.md)).

## The seam

`requireAdmin()` (pages and layouts) and `requireAdminAction()` (actions and routes, AAL2 required), in
`lib/auth/admin-context.ts`, are the only entry points. Nothing reads `profiles.is_admin` directly, so the seam is the
one place a future staff-and-roles model swaps in. A non-admin meets `notFound()`, so the portal's existence never
leaks. `requireAdmin()` does not enforce AAL2 (the layout draws the enroll or step-up gate from `ctx.aal`), so a
sensitive page returns null below AAL2 before it fetches.
- **MFA (free TOTP) is a hard gate that stays reachable at AAL1,** so a first enrollment can never lock itself out:
  an AAL2 page gate ships with its AAL1 fallback. Break-glass is deleting the factor in `auth.mfa_factors` from the
  Supabase dashboard.
- **Admin auth cookies stay host-only,** since both projects share one Supabase project: a `.partyreel.com` cookie
  domain would carry the AAL2 session to the apex. So the admin host's sign-in callback is built from its own origin
  and carries no query (`login-form.tsx`; the allow-list's exact entry is [auth-accounts.md](auth-accounts.md)'s).
- ★ **No operator audit table exists:** nothing records an operator's own actions beyond their effect (the forensic
  trail covers holds and evidence only).

## The perimeter: two deployments, one tree

Two Vercel projects build the same commit of this one repository and differ by one variable, `NEXT_PUBLIC_SURFACE`,
read only through `src/lib/surface` and applied by `proxy.ts` before any other rule. `partyreel-admin` (`=admin`)
serves `admin.partyreel.com` as an allow-list and rewrites everything else to the real 404; `partyreel` (`=app`) 404s
`/admin` whatever the Host header says, with `assertAdminSurface()` inside the seam as belt and braces. Unset serves
both, which is dev and also the rollback. Both projects build every route; the security boundary is RLS and the seam,
never reachability.
- ★ **The rule reaches every path only on the admin project's hosts.** The proxy's matcher takes the session pages
  everywhere and every path only where the host is `admin.<domain>` or a `partyreel-admin` vercel.app host (a matcher
  is literals read at build, so it cannot see `NEXT_PUBLIC_SURFACE`); an admin domain outside that pattern would serve
  the app's static pages and API routes unrefused, so a new one joins it in `src/proxy.ts`. Less the files the shared
  layout links from every page: Next's build output, the beacons, static images and `/manifest.webmanifest` (that one
  path, a static route that renders no session; the allow-list would 404 it on every portal page view).
- **A cron runs on the app surface only.** `vercel.json` is one file, so both projects register every cron and Vercel
  calls each route once per project; a cron route stops on the admin surface before any read (`servesApp()`), because
  a second run a day would fake a cadence and mask a real missed run.
- **`NEXT_PUBLIC_ADMIN_HOST` is per project:** on `partyreel-admin` it is `admin.partyreel.com` in production and its
  own `launch-prep` alias host in preview; on `partyreel` it is `admin.partyreel.com` in both. So Supabase's redirect
  allow-list carries the admin project's preview `/auth/callback` beside production's, and the app's preview alias
  never signs anyone into the portal.
- **Verifying:** auth and MFA complete only on a real host, and `lab:smoke` never reaches `/admin`; the Library's
  compositions page renders the portal's real components (the metrics charts at counts the test data never reaches
  included), the one automated eye on it. The admin host's sign-in plumbing short of Google walks locally under
  `NEXT_PUBLIC_ADMIN_HOST=admin.localhost pnpm dev` at `http://admin.localhost:<port>`.

## Building a surface

The portal is an on-brand devtool: it keeps the platform's foundation (the wordmark, the faces, the Graphite base) so
it reads as Partyreel, and is otherwise free, because an operator's tool wants what the product does not: real colour
for charts and state, density, tables, its own chrome. The bible's "media is the colour" and "one token set" reach it
only as far as that foundation.
- **A surface needs its `NAV` entry** (`lib/admin/nav.ts`), the one list the rail, the breadcrumb and the palette read.
- **The portal's links never prefetch** (`prefetch={false}`, held by `admin-prefetch-policy.test.ts` and
  `admin-chrome-prefetch.test.tsx`): each prefetch of a portal route is two reads of Supabase's auth server (the
  proxy, then the layout's `getUser()`), so a rail of links costs dozens a page view and every row of a long inbox one
  more. A page's own `getUser()` is the boundary and stays.
- **State colour comes from one map,** `lib/admin/tone.ts`, so a chip and the row under it cannot disagree.
- **Every destructive act opens `destructive-sheet.tsx`,** which lists what the act touches; a permanent act with
  something to identify asks you to type it, and the server re-checks what was typed against the row. The command
  palette only jumps (to the card where a switch and its sheet live), so no keystroke can fire a kill switch.
- **Every inbox speaks through one `TriageFilter` and `StatusPicker`,** each given its inbox's own words
  (`InboxWords`).
- **Pending counts and the heartbeat are read once a request** (`lib/admin/pending.ts`, in React's `cache()`, since a
  layout cannot hand a page anything), so the rail, the bell and a page agree; `serverNow()` beside it is a page's one
  clock read.
- **Every admin timestamp goes through `formatAdminTimestamp` / `formatAdminDate`** (`format/admin-time.ts`, fixed to
  `en-US` and UTC): a bare `toLocaleString()` renders the server's zone, then the browser's, and hydration throws
  (React #418).
- The home reads only what Postgres answers (`getPlatformDbMetrics()`), so it never waits on Stripe; `/admin/metrics`
  adds live revenue. The pnpm override pinning `react-is` to React 19 is for `recharts`.

## Backend jobs

A job that persists no run looks exactly like a healthy one once it stops, so every backend job, whatever it runs on,
reports through one heartbeat table, `job_runs` (deny-all, like the `ops_flags` switches). The catalog
(`app/admin/jobs/catalog.ts`) is the single source for which jobs exist, their cadence, their switch and whether the
app can start them. Three kinds share one pure `jobHealth`, so the page, the bell and the cron's scan never hold
three definitions of healthy: **scheduled** (fires on a clock, judged by its cadence), **signal** (work with no
schedule, such as a send or a limiter read: only its failure rows over a rolling 24 hours, and nothing at all reads
"No activity", never green; work it still OWES past its grace reads Needs a look, since no failure in the window
would show it: a one-time notice kept for its retry, a download the Worker checked or began but never said ended,
six hours on, the card's owed line saying which) and **derived** (a reading only a Worker can take, riding another
job's `counts`; a dead letter and a key the backup alone holds each fail at any count).
- **A run opens a row and closes it** (`running`, then `ok`, `error` or `skipped`, with a duration and free-form
  `counts`). A paused job logs a skipped run, never nothing, so a pause never reads as a missed run.
- **The kill switches fail differently on purpose.** The purge cron and its sub-sweeps fail CLOSED on an unreadable
  switch (they delete, and a skipped day costs nothing); the backup reconcile and the DB-backup Action fail OPEN (a
  missing backup is worse than a missing log line); the prune fails CLOSED (it deletes from the last-resort copy); the
  live reel's platform lever fails OPEN (a flaky read must not take the reel off every album, [reel.md](reel.md));
  guest uploads (`uploads_enabled`) fail OPEN (a switch nobody can read never stops a party); lifecycle mail
  (`lifecycle_mail_enabled`) fails CLOSED for the mail it holds (held mail goes the next night); the spend watch's own
  switch fails to the middle (unreadable, it reads and alerts but pauses nothing); Send to Google Drive's
  (`drive_export_enabled`) is read inside each lease's own transaction, so a database that cannot answer leases nothing
  ([drive-export.md](drive-export.md)). A row not seeded yet reads as on.
- ★ **The missed-run scan pages only on silence, so a job that is never silent alerts at its source.** The scan rides
  the purge cron: each run checks every job for a terminal row within 1.5 times its cadence and raises one
  `job_missed_run` warning per silent job. A depth reading raises `job_dead_letters_pending` or `job_queue_backlog`
  inside `/api/internal/job-run` as the Worker hands it over, as does a held backup prune (`backup_prune_held` and the
  ops mail) and any report carrying the backup's lone copies (`primary_missing`, the prune's run or the restore's
  pass: `backup_primary_missing`, and the ops mail at most once a day), and a signal failure raises where it happens
  (`jobs/failure-log.ts`). `jobHealth` without its inputs answers `never`, not `missed`, so the scan never pages on a
  number it did not take.
- **A sub-sweep can be a job of its own** (which, and why, is [lifecycle-recovery.md](lifecycle-recovery.md)'s): it
  opens and closes its own row inside the parent run through `createSweepRunner`, with its own switch and card; the
  rest ride the parent's row.
- ★ **Per-row isolation never buys silence:** a sweep's loop runs under `forEachIsolated` (`jobs/isolate.ts`), so the
  rows behind a bad one still run, and its tally closes the run: any failed row makes it an ERROR (the parent's too,
  for a sweep that rides it: `purgeRunVerdict`), and consecutive failures abort the loop as a dead dependency, not a
  bad row.
- **Two `counts` keys turn a finished `ok` run into Needs a look** (`attention`, outranked by a failure, a pause or a
  missed run), because each waits on a person while nothing failed: `stopped_early` (a sweep out of time with work
  left, with its `remaining`), so a backlog that outlasts a night shows on the band and the bell; and
  `breaker_tripped` (the orphan breaker refused its delete, or a spend-watch trip or pause still stands).
- ★ **A reading that could not be taken is never a calm one:** an unreadable queue, heartbeat or counter says so in
  words ("No reading", the band, the page's banner), never a zero, and a stale reading inherits its source's health.
  The bell, which has nowhere to put a sentence, still rings (`countUnhealthyJobs` answers 1).
- **Heartbeat writes degrade; health reads do not.** A job must not die because its bookkeeping failed, so writes
  swallow and report; reads throw (`mustQuery`) and the page draws a loud banner, because a console reading "nothing
  to report" when it can read nothing is the failure this surface exists to prevent.
- **A job that cannot reach the database** (the backup Worker, the GitHub Action) reports through
  `/api/internal/job-run` with the internal-jobs bearer (`PRUNE_API_SECRET`). The endpoint can pause a job but never
  start one, so those jobs show no Run now (a button that lies is worse than a sentence that explains), and only a
  `scheduled` job may open a run there, since a start against a signal or a reading would leave a `running` row
  nothing closes; its one other answer is the backup prune's release stamp
  ([durability-backups.md](durability-backups.md)). The one start the app has is the backup restore's Restore now
  (AAL2), which goes to the Worker's own door instead (`BACKUP_WORKER_URL`, the same bearer; durability-backups.md,
  "The restore").
  ★ The export Worker's daily heartbeat (the `export` job) rides its own signed report instead (`/api/export/report`,
  [uploads-and-r2.md](uploads-and-r2.md)), written as one closed row, so a Worker whose export secret drifted from the
  app's reads Missed, where the shared bearer would have let it check in healthy. The Drive Worker's sweep does the
  same (the `drive_export` job, written hourly by `/api/internal/drive/sweep` from its signed call), carrying its queue
  and dead-letter depths (`drive_queue`, `drive_dead_letters`) beside the transfers' signal (`drive_transfer`: a file
  failed for good, a stuck send, a dead lane); its controls are `/admin/exports#drive`.

## The spend watch

Supabase has no budget alert and no ceiling but its on/off spend cap, and Cloudflare has no cap at all, so our own
guard is a circuit breaker, not a budget: `spend_watch` (a scheduled job, its own route `/api/cron/spend-watch` and
its own cron, never a ride on the purge's, since it must run while the purge is paused and may be the one pausing it)
reads our own counters, judges each against a ceiling, and pauses the switch that stops its vector where a false alarm
costs no guest's moment. The rules are pure (`lib/jobs/spend-watch.ts`); the run reads, writes and tells
(`spend-watch-run.ts`); the card is `app/admin/jobs/spend-watch-card.tsx`, whose switches take an optional `toggle`
(default the Server Function) so the Library draws a whole press over a stand-in write, since the real one pauses guest
uploads for every album.
- **The readings** come in one call (`spend_watch_readings`, INVOKER and service-role only; its one DEFINER helper,
  `spend_watch_sign_ins`, counts `auth.users`): our own counters (the uploads meter, every album's change counters,
  the day's lifecycle mail, sign-ins, zips, purge runs and bytes sent to Google Drive), the snapshots diffed into rates
  an hour, and the one vendor
  reading our tokens can take, Resend's own sent-mail list (every sender, Supabase Auth's sign-in codes included).
- ★ **What could not be read:** Supabase's usage (Realtime messages, MAU, egress) needs a Management API personal token,
  which the app holds none of; R2 and Workers need a Cloudflare API token (the app holds R2's S3 keys only, which read
  no usage); Vercel's token is the plan limits' optional one below, and Sentry holds none; Resend's quota headers come
  back only on a send. What none of these can read is watched by its own dashboard's alert, and the plan limits read
  what they can of them.
- **The ceiling** is ten times the busiest reading of the trailing week, never under the reading's floor (what a quiet
  week cannot reach) and never past a vendor's own hard stop (Resend's free day stops at 100, the alert mail with it,
  so its reading caps at 80 until `RESEND_DAILY_QUOTA` goes null at the Pro cutover). A missing or warming reading
  never trips and never feeds a ceiling, and a missing one fails the run.
- ★ **A trip never raises its own ceiling:** the week's busiest leaves out every reading that tripped, so a runaway is
  never the new normal.
- **What a trip does** (`planActions`): it pauses lifecycle mail, Download all, the purge sweep or Send to Google Drive
  (its sends wait where they stand and lose nothing) on its own, but only on
  a NEW trip, so a person who turns a switch back on mid-trip is not overridden every hour; for uploads it alerts and
  the card offers the switch, since a false alarm would stop a real party; sign-ins, album changes and Resend's count
  only alert. Every trip raises one Sentry error a run and the ops mail at most once a day per set of readings.
- ★ **The watch never lifts its own pause:** a pause stays the watch's while the switch is still off at the instant it
  wrote, and its run carries `breaker_tripped` (Needs a look, the bell, the band) until a person turns it back on or
  touches it; a switch an operator turned off is never re-stamped. Guest uploads off, whoever paused them, holds it at
  attention too: every guest is refused while it lasts, so a forgotten pause keeps ringing.
- **Its two switches:** guest uploads, read first at the guest presign (`uploads_paused`, a 503 in Partyreel's words
  that says nothing about the album; a file already presigned completes; a host's own uploads are untouched);
  lifecycle mail, read by `sendOnce` before the claim, holding only the mail a sweep re-sends while its state lasts
  (`email/send-kinds.ts`): a held mail claims nothing and goes the first night after the switch is back on, while a
  one-time notice and every operator mail always send, since a held notice would be lost for good.
- **Who watches the watchman:** the purge cron's freshness scan pages on every job's silence but its own; the watch
  raises the purge's `job_missed_run` in the scan's own words.

## Plan limits

The spend watch is a circuit breaker for a runaway (ten times the busiest of the week); nothing in it saw the slow climb
toward a vendor's plan limit, which on Vercel Hobby pauses the team's functions for 30 days (the account was unlocked
once already). So its daily run also reads every meter of `lib/jobs/limits-watch-limits.ts`, judges each against the
plan's limit, and mails what newly crossed. The rules are pure (`limits-watch.ts`); the run reads, writes and tells
(`limits-watch-run.ts`, called from `spend-watch-run.ts`: no cron of its own, since Hobby allows two and both exist); the
card is `app/admin/jobs/limits-card.tsx`, beside the spend watch's.
- **The limits live in one file, each the vendor's own number for the plan we are on today,** its page and date beside
  it, never guessed. ★ The org is on Supabase **Pro**, not Free; Vercel is Hobby, Resend and Cloudflare free. A plan
  cutover is an edit there (and `RESEND_DAILY_QUOTA` going null removes the daily mail meter). GB counts as 10^9 bytes,
  the vendors saying nothing, so a share reads high, never low.
- **The meters and where each number comes from.** Vercel: one `GET /v2/usage?type=requests` (the usher kit's own call;
  `limits-watch-vercel.ts` is its only caller and takes the token as an argument) read into invocations, Fast Data
  Transfer (both directions count), CDN requests and Active CPU, which Hobby's API never answers, so it is ★ ESTIMATED
  from the calls at 44 ms of CPU a call (`VERCEL_CPU_SECONDS_PER_CALL`, read off the dashboard 2026-10-04: recalibrate
  it and the kit's together; the card names the estimate). Fast Origin Transfer and image transformations have no
  Hobby API, and ISR Reads has no Hobby allowance on Vercel's pages (`NOT_WATCHED`). Supabase: the database's size
  and R2's bytes from one SQL call, `limits_watch_readings()` (R2's is every media row's original and phone copy: a
  floor, the previews and the backup bucket left out), and monthly active users from `spend_watch_sign_ins` over 30 days
  (a floor too: Supabase also counts token refreshes). Resend: its own list of sent mail, every sender, tallied by UTC
  day in one pass (the month to date, the week's busiest day). Egress, Realtime, R2's operations and the Workers'
  requests need a token the app holds none of: **Not wired**, said on the card.
- **A meter's climb is projected by its shape** (`MeterShape`): a rolling Vercel window counts the days that roll out
  of it, so ★ a steady meter never warns on its days left (each day adds what it drops); a gauge takes the slope of our
  own earlier readings (none before two days of them); a month's meter tells days left only when its limit would come
  before the calendar resets it; a daily one reads the week's busiest day. WARNING at 60% of the limit or 30 days left
  at the trailing week's rate, CRITICAL at 85% or 7: a slow climb warns weeks before its share would.
- ★ **A crossing is mailed once.** A meter is mailed only when its level outranks the one it was last TOLD (stored in
  `counts.limits`, per meter): one message a run through `sendOnce` (kind `spend_watch`, keyed by the day and the
  crossings it names), the meter told only once the mail went, forgetting its level only once it has clearly fallen
  (5 points of share, a fifth fewer days), so a meter hovering on a threshold is mailed once. A history that cannot be
  read holds the mail and fails the run, since a duplicate is worse than a mail a day late.
- ★ **A gap is not a failure, and a failure is not a gap.** A meter with no credential (`needs`) or no vendor API
  (`unavailable`) says "No reading" and why on the card and fails nothing, so a Question left open never paints the
  watch red; a read that FAILED (a refused token, an unreadable answer) fails the spend watch's run and says which, and
  a card of mostly gaps counts them in its header. Warnings stay on the card and in the mail; a CRITICAL meter also
  holds the run at Needs a look (`breaker_tripped`, the bell).
- ★ **The Vercel token can deploy and delete,** so it is its own variable (`VERCEL_USAGE_TOKEN`, never the usher kit's
  personal `VERCEL_TOKEN`), optional (unset reads "Not wired"), team-scoped, used for that one GET and never printed (an
  error says only the HTTP status); Sensitive on Vercel at launch. The app holds no Supabase personal access token (it
  can delete the project) and no Cloudflare analytics token yet.

## Reports

`/api/reports` takes two arms, both rate-limited. An album or item report carries its `qr_token`, the capability
`create_report` validates inside the RPC, which is service-role only, so nothing but the route can hand it a reporter;
a person report (`reports.profile_id`) needs a signed-in reporter, re-checked with `getUser()`. `reports` is deny-all.
Review is human (`/admin/reports`; no scanner or NSFW filter). The rules are one pure module, `lib/admin/reports.ts`;
the kinds, their words and their order are `lib/reports/kinds.ts`, mirrored by the `report_kind` enum under a parity
test. The open queue is the review grid (`components/admin/report-queue.tsx`), its lanes read from the kinds.
- ★ **The reporter is the session's, never the body's.** The route reads `getUser()`: whether anyone is signed in,
  and an address only beside `email_confirmed_at` (`lib/reports/reporter.server.ts`); the form's Confirm your email is
  the account door's own code, so confirming makes a free account. A report keeps a confirmed address only while it
  is open (a BEFORE trigger forgets it and the answer link's hash at the close; a CHECK refuses a closed row holding
  either). A child-abuse report also keeps `reporter_hash`, the address's HMAC under `UNLOCK_COOKIE_SECRET` in its own
  `r-addr:` domain, which its limits and its bar read after the address is gone. Nothing tells the host or the person
  reported who filed a report; the queue says only what the session proved (`reporterWords`): the album's own host,
  else a guest signed in or not, and whether she can be asked.
- ★ **The instant hide** (`create_report`): a `child` report of an item from a confirmed address makes the item an
  operator's removal at once (`hid_at` equal to its `removed_at`). Never for the event's own host, never for an
  address holding three strikes, at most 3 an address and 5 an event in 24 hours (advisory-locked); otherwise the
  report is filed the same and heads the queue. Every other kind inserts only. A strike is a child-abuse report from
  the address that the operator dismissed, and it lapses 180 days after its `resolved_at` (three that lapse rather
  than one for good, so a single disagreement never costs a reporter the hide); the count reads the reports as they
  stand, so a dismissal's Undo takes its strike back, and a CHECK holds a report open exactly when it has no
  `resolved_at` (`reports_resolved_when_closed`), so no close can skip the time a strike counts from. The rule and
  both its numbers live once, in `report_strikes`, which `create_report` asks for its bar and the queue reads (its
  answer carries the lapse, `lapse_seconds`), so the operator's strike line never counts by another rule and no reader
  copies 180; the read keys on the kept hash, so the address never shows.
- **A child-abuse report tells the operator at once,** after the response (`alertUrgentReport`): a Sentry warning
  every time, an ops-inbox mail at most once per album in any ten minutes (`sendOncePerWindow`), and the urgent count
  on the rail and the bell.
- ★ **An item any report names as a sexual kind stays covered wherever an operator meets it,** open or closed (the
  queue, every closed line, both Albums views), by one rule, `readCoveredItems`, and none of those surfaces signs its
  picture: only the open queue's View shows one.
- ★ **A verdict reads its own report and answers its whole entry.** The browser names one report; the action reads
  its item, album or person and every report still open on it, and closes them together. The item a Remove takes
  down is the report's `media_id`, never an id the browser sends, and a verdict lands only on an OPEN report, so a
  second tab is told "already decided".
- ★ **What a report named outlives its item:** `reports.media_id` is no foreign key and `media_type` keeps the kind,
  written from the item as the report is filed (a trigger, which also refuses an id naming no item), so once the purge
  takes an item whose report closed, the report still names it and never reads as its album's. Read as an album
  report, it would keep every item of its album from every permanent delete.
- **A dismissal puts back what a false report's hide took** (`hideUndoOf`: into the album at the hide's own instant,
  or back to the host's Deleted), never a held item; its Undo reopens exactly the reports it closed and hides the
  item again.
- **Actioning an item makes it an operator's removal whatever its state** (one the host or a guest had removed
  becomes the operator's, keeping its `removed_at`), one instant stamping the removal and the verdict. A reported
  person is actioned out of band, so Mark actioned only closes the report. A phone's one-press Take it down makes the
  same removal and leaves the reports open.
- **A closed report is one line with its way back** (`wayBackOf`). A removal's Undo lives exactly as long as the
  removal its verdict made (still an operator's, not held): it reopens the report first, then restores the item; a
  held item has no Undo. A dismissal reopens inside 30 days of the verdict, and a child-abuse dismissal that is a
  strike for as long as the strike counts (`dismissalReopens` asks the strike rule's own lapse rather than keep a
  second clock); the write itself requires `dismissed` and either floor (`reopenGuard`). Mark actioned and an album's
  Action have no way back.
- ★ **The verdict is the review the copy promises.** Dismissed and Actioned each record who decided and when, and an
  open report keeps its item and its album from every purge until one lands, so "every report is reviewed" holds of
  every report; `report_status`'s `reviewed` is written by no code (the enum keeps the value: dropping one rebuilds
  the type). The copy promises review before removal but for the instant hide, which it names
  (`review-promise.test.ts`).
- ★ **Hold for forensics carries Take it down too, on by default,** since a hold is for what police should see. It
  reads what it reaches first (the reported item and the same uploader's other items in the event: its guest row, or
  every row the same account holds there; no guest row means the host's own uploads), makes each an operator's
  removal BEFORE any copy starts, then preserves each through `preserveMedia`, the reported item first, inside the
  page's `maxDuration` (a partial run says how far it got; pressing again is safe). Unticked, it is the quiet hold
  ([trust-safety-forensics.md](trust-safety-forensics.md)). The report stays open.
- **Ask for proof** mails the operator's own question to the reporter's confirmed address with a one-use link
  (`/report/<token>`; only its SHA-256 is stored, forgotten at the close) where her answer lands on the report
  itself. Never for a child-abuse report. It sits behind `ops_flags.report_proof_mail_enabled`, off until the
  ROADMAP's emails round: while it is off the ask is refused in words and nothing is written, and a mail that never
  went takes the ask back.

## Help feedback

`/admin/help-feedback` is the one place the help center's "Did this answer your question?" is read
(`article_feedback_summary`: each article's Yes and No with its last click). Above it sits the `help_feedback` signal:
`/api/help/feedback` reports every click it drops (the limiter could not answer, or the insert failed), because the
reader sees the same thank-you either way and nothing else would ever show it. A failed read says so in words, never
"No feedback yet".

## Accounts

`/admin/accounts` and an account's page are read-only (billing changes go through Stripe: the webhook is the sole writer
of tier and cap), and they say what the product enforces on an upload, so "why was this host refused" needs no SQL. The
reads are `lib/db/queries/accounts.ts`; the words are `app/admin/accounts/uploads.ts`, shared by the list and the page so
a row and its card never disagree. The list also carries two billing checks, the pass-to-Pro credits stuck past their
hour or waiting on Stripe and Stripe's change-plan configuration against every Pro price, and an account's page her
credits, a stuck one with its Retry, which runs the webhook's own credit path ([billing-caps.md](billing-caps.md)).
- ★ **A host's uploads are `uploads_used` asked with HER OWN tier,** as `create_media*` and `meter_upload` ask it (this
  calendar month's ledger for Free and Pro, her live passes' own year for a pass holder), against `uploadAllowance` (the
  one home, tiers.ts). `readHostMonthUploads` asks as `pro` on purpose, for the plan sheet's "what a switch to Pro is
  measured against", so reusing it would show a pass holder a ledger her allowance never reads. The list and the page
  ask one keyset read for every host they show (`uploads_windows`), which calls `uploads_used` per row in SQL instead of
  recomputing the window in TypeScript, so no figure can disagree with a refusal, and answers the tier and cap it asked
  with, so a row holds its figure to that plan's allowance even when the plan moved since the list was read; a Pro with
  no cap on record reads Unmetered, the SQL's fail-open. ★ A pass holder with no live pass (the completes' own refusal)
  reads Pass lapsed, since when, and Uploads refused (Pro pending when her last pass became Pro credit and her Pro plan
  has not landed), never "0 B" of an allowance no pass holds.
- **The hour is the month's ledger row** (`hour_started_at`, `hour_uploads`: the uploads started in the current UTC clock
  hour; a row from an earlier hour counts zero). Its ceiling is the SQL's `c_uploads_an_hour`, mirrored as `UPLOADS_AN_HOUR`
  under a parity test that reads the newest migration setting it. Unpublished: it shows here and nowhere a host reads.
- **The cap holds her albums and her Deleted together** (`host_storage_summary`), so the page draws both and the total
  against the cap; the list's Storage column is still the physical counter, which gates nothing.
- ★ **A read that fails says "No reading" and why, never a zero, and never takes the page:** the readers answer
  `{ ok: false, message }` and the page raises one Sentry warning (Sentry never enters `lib/db`). A real zero is a reading.
- ★ **Nothing here lifts a host's uploads count.** The ledger sits behind billing enforcement, and `cumulative_bytes`
  is also the spend watch's meter of what the platform pays for (it diffs snapshots of its sum), so zeroing it would
  both lift the guard and skew the watch: a lift must be additive and audited, never an edit of the ledger.

## Sentry

`@sentry/nextjs` on the free tier (`lib/observability/sentry.ts`), gated twice: with `NEXT_PUBLIC_SENTRY_DSN` unset it
is a no-op, so an unconfigured build stays green; and it reports only from a Vercel production or preview deployment
(`isVercelDeployment`), so a localhost run sends nothing though `.env.local` holds the production DSN. Session Replay
records only on error, with all media blocked and all text masked; `sendDefaultPii` is off, and `scrubEvent` strips
presigned-URL query strings and emails.
- ★ **Guest capability tokens are scrubbed from every channel** (`telemetry-redaction.ts`): `/e/<qr_token>` puts the
  authorization in the URL path, and `beforeSend` sees only errors, so breadcrumbs, transactions, `extra` and the
  replay's URL list would carry the token out. Three hooks redact by token SHAPE as well as the `/e/` route, so a new
  capture site is covered with no scrubbing at the call.
- **Capture with `captureError` / `captureWarning(area, …)` only where an error is swallowed** (the upload finalizer,
  the webhook, the cron's `runSweep`, admin actions); everything else rides `onRequestError`, and routine user
  rejections (caps, limits, a closed album) are not errors. Sentry never enters `src/lib/db/*` (capture at the route
  or action) and never touches the Stripe webhook's raw body.
- ★ **A server capture goes through the helpers, never the bare SDK:** Vercel freezes a function the instant its
  response leaves, so each helper holds its request until the flush is out (`after()`, else Vercel's request
  context). `onRequestError` is ours too (`captureRequestError`), since Sentry's own holds nothing off the Edge
  runtime (getsentry/sentry-javascript#23087).
- ★ **A Vercel project must expose its system environment variables, or its browser goes quiet** (the server and edge
  read the runtime variable): a project's first browser error must read `vercel-production` or `vercel-preview` in
  Sentry, never `production`. Both projects share the DSN and the check.
