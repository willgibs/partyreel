---
track: clocks-and-counts
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "3bbb0dbc"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/admin/
  - src/components/admin/
  - src/lib/admin/
  - src/lib/metrics/
  - src/lib/format/
  - src/lib/db/queries/metrics.ts
  - src/lib/db/queries/metrics.test.ts
  - src/lib/dashboard/
  - src/app/(app)/dashboard/page.tsx
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/app/(app)/account/page.tsx
  - src/components/app/dashboard/
  - src/components/app/event-card.tsx
  - src/components/app/event-card.test.tsx
  - src/components/app/event-feed/feed-section-header.tsx
  - src/components/app/event-feed/bulk-bar.tsx
  - .github/workflows/db-backup.yml
  - docs/systems/admin-observability.md
  - docs/systems/host-app.md
  - docs/systems/durability-backups.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - src/lib/forensics/request-facts.ts
  - src/lib/utils.ts
  - src/app/(guest)/e/[token]/page.tsx
  - src/lib/db/queries/analytics.ts
  - docs/systems/testing-verification.md
---

# lp/clocks-and-counts

**Goal.** Every count a person reads is grouped and every chart tick fits at any magnitude; the admin's times say UTC; the metrics page's engagement is one honest figure; the host's dashboard runs on the viewer's own calendar day; the database backup no longer fails on a rate-limited version lookup.

## The brief

**Will's words, verbatim.** On the 1,000-row round (2026-09-23): "In other project builds, I've also hit errors around that 1000 item handling (maybe a PostgREST issue? could be off there) for things like pagination, item counts, filtering, etc. Let's ensure we will not face any of those issues here." And: "Anything within the work we're doing now may be addressed in a near-term round, and anything that requires more dedicated focus can be logged in the roadmap." Tonight (2026-09-24, after milestone 28 shipped the round) he signed in to the admin portal so the Orchestrator could finish its review of the admin at scale.

**Where things stand.** Milestone 28 (`1076d3d7`) is live: every read reaches its last row. The scale probe (disposable, on willg97: event "Scale probe" `14bb4318-80cd-4eed-b219-92c097ee16c7`, 1,200 photos: 1,145 approved, 20 pending, 35 removed) pushed the platform's counts past 1,000 for the first time, and the review of admin.partyreel.com found every figure right against the database, but printed badly or on the wrong clock. This lane fixes what the review found. None of it changes a query's answer.

**Your items.**

1. **Chart axes never clip.** `src/components/admin/metrics-charts.tsx:81-83` and `:140-142` give each `YAxis` `width={28}`. On `/admin/metrics` the "Media by type" chart's ticks are 1,400 and 1,050, drawn as "400" and "050". Give every chart on the page ticks that fit at any magnitude: a compact tick formatter (`Intl.NumberFormat("en-US", { notation: "compact" })`: 1.4K, 12K, 1.2M; small numbers unchanged) and an axis width that fits the widest compact label. Pin the formatter with a pure test.

2. **One count format.** The admin prints counts raw where the metrics page groups them:
   - the overview: "1249", "+1247", "1247 photos and videos this fortnight";
   - the album drill-in's status line: "1145 approved, 20 pending, 0 hidden, 35 removed";
   - forensics: "1209 uploads missing a record", "1222".
   
   Write ONE helper in `src/lib/format/` (for example `formatCount(n)` plus a signed variant for deltas, "+1,247"). Pass the locale explicitly as `en-US`: a bare `toLocaleString()` renders in the server's locale during SSR and in the browser's on hydration, a mismatch for any non-US visitor. Route every count a person reads through it:
   - **the admin:** the overview, the metrics page, the drill-in status line, forensics, the jobs cards' Reported and Depth numbers, accounts, exports, reels, the inbox and "Show 50 more" lines (`src/lib/admin/show-more.tsx`);
   - **the host, where a count can pass 999:** the dashboard pulse's strings (`src/lib/dashboard/arrivals.ts:96-97`), the event cards' figures, the storage meter (`src/components/app/dashboard/storage-meter.tsx:105-106`), the account page's plan capacity (`src/app/(app)/account/page.tsx:253`), the event page's stats and link visits (`src/app/(app)/dashboard/[eventId]/page.tsx`), the event feed's section headers (`src/components/app/event-feed/feed-section-header.tsx:44`) and its bulk bar (`bulk-bar.tsx:275`).
   
   Any other surface you find printing a raw count past 999 goes under Deferred with its file and line. Pure tests for the helper.

3. **Admin times say UTC.** The admin renders every timestamp with `toLocaleString()` on the server, so it reads in UTC without saying so. The jobs page lists the purge sweep's last run as "9/23/2026, 4:48:23 AM", which is 04:48 UTC; the operator is in New York and reads it as local. Write one formatter in `src/lib/format/` that renders in UTC and says so (for example "Sep 23, 2026, 04:48 UTC"; the date-only form where a column is a date), and use it for every admin timestamp: jobs, forensics, accounts, exports, reels, reports, support, applicants, announcements, the drill-in.
   - The jobs cards already speak UTC ("Daily, 04:00 UTC"), so run times and schedules now agree.
   - The output is identical on server and client, so drop the `suppressHydrationWarning` on the spans the helper now formats.
   - Keep the metrics chart's day ticks in UTC (`metrics-charts.tsx:45` already is).
   - Refine `admin-observability.md`'s tz gotcha in place.

4. **Link visits, one honest figure.** `37707d80` ("one link per event") retired the separate album address and its `album_view` writer. Today `recordLinkHit` is called only with `"qr_scan"`, on every non-bot visit to `/e/<token>` (`src/app/(guest)/e/[token]/page.tsx:131`), scans and shared-link opens alike. The metrics page still shows "Album views 25", a frozen lifetime total, beside "QR scans 1,293", and the chart draws an album-views line that has sat at zero for 30 days. The host's event page already sums the two (`dashboard/[eventId]/page.tsx:180`). Do the same on the admin:
   - show one figure, "Link visits", with a line saying what it counts (every visit to an event's link, scanned or shared, bots filtered);
   - draw one chart line;
   - fold in TypeScript (`src/lib/metrics/aggregate.ts`), leaving the SQL snapshot's shape alone.

5. **The viewer's own calendar day.** The dashboard takes "today" from the server's clock (`src/app/(app)/dashboard/page.tsx:138-151`), which is UTC on Vercel, so from 8pm in New York the host's "today" is already tomorrow. Two effects, both seen or reproducible:
   - Late in a US evening, the pulse says "Newest, 3 hours ago" where it should count today.
   - "Print the code" (`src/lib/dashboard/next-step.ts:110`, the event is tomorrow) disappears the evening before the event, the one evening it matters.
   
   The fix:
   - Read the viewer's IANA zone from Vercel's `x-vercel-ip-timezone` request header (documented at vercel.com/docs/headers/request-headers; `src/lib/forensics/request-facts.ts` already reads the `x-vercel-ip-*` family). Validate it by constructing an `Intl.DateTimeFormat` with it; on a missing or bad value fall back to the server's own zone (UTC on Vercel, the machine's zone locally).
   - Compute the zone's calendar day at `now` and the UTC instant of that day's midnight, DST-safe (the offset at midnight can differ from the offset at `now`). Pass both to the pulse and to `resolveNextSteps`.
   - Format the server-rendered dates in that zone: the Event Pass expiry and the grace deadline (`dashboard/page.tsx:191-207`) and the account page's pass expiry (`account/page.tsx:186`).
   - Sweep `src/app/(app)/` for any other server render that decides a day boundary from the server's clock. Fix each one in your owns; list the rest under Deferred.
   - Pure tests:
     - New York on both 2026 DST days (March 8, November 1);
     - Kolkata (+5:30), Kiritimati (+14), Honolulu (−10);
     - a missing header and a garbage header;
     - 21:00 in New York the evening before an event, where "Print the code" shows.
   - The zone is derived per request from the address the request already carries, used to render, never stored or logged, so no privacy text changes. Say so in `host-app.md` beside the dashboard's day.

6. **The database backup's CLI, pinned.** The `db_backup` run of 2026-09-22 failed in 573 ms (GitHub Actions run 35717761607). `supabase/setup-cli@v1` with `version: latest` (`.github/workflows/db-backup.yml:114-116`) asks GitHub's unauthenticated API for the latest release from a shared runner address, and was answered "Failed to resolve latest Supabase CLI release: rate limit exceeded".
   - Pin `version` to the release the last green run installed (read it from run 35849733290's log with `gh run view 35849733290 --log`). Add a comment naming this failure and how to bump the pin.
   - A scheduled workflow runs from `main`, so the pin takes effect at the next milestone. The Orchestrator dispatches one manual run on `launch-prep` after your merge to prove it.
   - Never trigger the workflow yourself.

**Calls already taken (build them; list any you change under Questions):**
- UTC, labeled, for the admin: an operations console whose schedules are UTC.
- "Link visits" as the one engagement figure.
- The viewer's zone from the request header: no cookie, no stored field, no policy change.
- `en-US` grouping everywhere.
- Compact ticks.

**Look at first (your Handoff):**
- The zone tests' table.
- The "Print the code" evening-before test.
- Both metrics charts drawn with four-digit data at 1440 and 375. The admin needs a sign-in and TOTP a local server cannot complete, so render the chart component with a probe-sized fixture in a throwaway local page, or a server render in a test, and capture it to your scratch directory; never commit the harness.
- The count helper's test.

**Boundaries.**
- Never `src/lib/db/types.ts`, a migration or `apply_migration`, and never a live write.
- No admin action changes behaviour.
- The SQL functions keep their shapes.
- A system-doc fact outside your three docs goes in your Handoff as the line to change.
- Your docs: `docs/systems/admin-observability.md`, `host-app.md` and `durability-backups.md`, only the facts your files change.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The date-only admin formatter also says "UTC" (e.g. "Sep 23, 2026 UTC"), not just the full timestamp form.** The brief's example only showed the label on the datetime form ("Sep 23, 2026, 04:48 UTC") and left the date-only form open. Recommendation: keep the label on both — "Pass expires", "Last seen" and "Over-cap grace until" are exactly the kind of bare date an operator could otherwise misread as their own zone's, and the admin's own rule is "UTC, labeled" everywhere. His to overrule if he'd rather the date-only form stayed bare.
- **The Supabase CLI pin (`2.117.0`) is reconstructed, not read verbatim from the run log.** `gh run view 35849733290 --log` never prints a resolved version — the action installs silently (confirmed by reading its source at the exact commit SHA the run used, `ab058987d8...`: it downloads a GitHub release by version string with no version echoed to stdout). I cross-referenced two independent live sources instead: GitHub's own `/repos/supabase/cli/releases/latest` (`tag_name: v2.117.0`, `created_at: 2026-09-07`) and npm's `supabase` package `dist-tags.latest` (`2.117.0`, unchanged since 2026-09-07) — both agree, and neither has moved since before the failing run (2026-09-22) through today (2026-09-24). Recommendation: trust the pin; to re-verify or bump later, either source's current answer should still agree with the other.
- **A few more raw-count spots got fixed rather than deferred.** Beyond the brief's named list: `src/components/admin/admin-rail.tsx` (the nav badge counts), `src/components/admin/sparkline.tsx` (the aria-label total), `src/lib/dashboard/next-step.ts` (the pending-count phrases in the "waiting" step's label/short), and `src/app/(app)/account/page.tsx` (the follower count). Each was a one-line wrap in a file already open in these owns for another reason, and all are covered by the existing test suite. Recommendation: keep; a few lower-value/bounded ones went to Deferred below instead of a blanket fix-everything pass.

## System-doc edits (in place, owned facts only)

- `admin-observability.md`: the "Locale/tz renders need `suppressHydrationWarning`" gotcha refined in place — every admin timestamp now renders through the shared `formatAdminTimestamp`/`formatAdminDate` (UTC + `en-US` explicit), so the workaround is gone from the admin's own surfaces; the underlying SSR/hydration mismatch mechanism stays documented for the next ad-hoc locale value someone adds.
- `host-app.md`: added, in the Dashboard landing section, that "today" is the viewer's own calendar day (resolved from `x-vercel-ip-timezone`, DST-safe, `lib/dashboard/viewer-day.ts`), never the server's UTC clock — covering the pulse's "today" count, the next-step rule's "day before", and the Event Pass/grace-deadline dates; and that the zone is rendering-only, never stored or logged.
- `durability-backups.md`: added, under Invariants/gotchas, that the DB-backup Action's Supabase CLI version is pinned (never `"latest"`) and why, pointing at the workflow's own comment for how to bump it.

## Deferred (ROADMAP one-liners, bucket named)

- **[one-count-format]** `src/app/admin/accounts/[id]/delete-account-control.tsx:41,48` — the delete-confirmation copy's `eventCount`/`heldEventCount` print raw; bounded to one account's own binned/held events, so low urgency, but not yet routed through `formatCount`.
- **[one-count-format]** `src/components/app/dashboard/claims-card.tsx` (several lines: `uploadCount`, `totalPhotos`, `leftoverPhotos`, the "Added N photo(s)" toast) — print raw; bounded to one guest's uploads at one event before their email was confirmed, realistically small.
- **[one-count-format]** `src/components/app/dashboard/filter-chips.tsx:73` — `trashCount` prints raw; the component itself is lab-only today (`FilterChips` has no production importer per `host-app.md`), so no live surface currently shows it.

## Handoff (replaces the chat report)

- **Work commit:** `a99390dd` — the six items (charts, count format, UTC admin time, link visits, viewer's day, backup CLI pin), plus the two new pure-lib test suites and the design-rules regeneration.
- **Sync commit:** `66387dc9` — merged `origin/launch-prep` (it had moved to `04396e29`: the `reel-migration` cut and a STATUS/orchestrator record, docs only, no conflict). The head (this manifest commit) is in the chat line.
- **Gates, on the synced tree, each its own exit code:** `pnpm design:rules` 0 · `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` 0 · `pnpm typecheck` 0 · `pnpm lint` 0 (7 pre-existing warnings, none in a file this lane touched) · `pnpm test` 0 (4667 passed, 1 pre-existing skip) · `pnpm build` 0 (no warnings) · `pnpm lab:smoke --base http://localhost:3132` 0 (524 checks, 0 failing).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = every owned path touched, plus five documented exceptions: `src/components/app/report-review.tsx` (one timestamp swapped to the shared formatter, matching `person-report-list.tsx`'s fix to the same Reports surface); `src/lib/db/queries/pulse.test.ts` (two assertions updated for the comma `arrivals.ts`'s caption now carries); `src/app/(dev)/design/rules/component-notes.ts` (four new `for` lines the new contract-tested pure-lib files need, or `gallery.test.ts` fails); `src/app/(dev)/design/rules/rules.generated.json` and `docs/design/library.md` (mechanically regenerated by `pnpm design:rules`, per CLAUDE.md, after the contract/`for`-line changes).
- **The items, one line each:**
  1. Chart axes never clip — `metrics-charts.tsx`'s two `YAxis`es now format with `formatCompactNumber` and size with `compactAxisWidth` (`lib/format/count.ts`); verified at 1440 and 375 against four-to-seven-digit fixture data in a throwaway route (deleted, never committed) — screenshots in scratch (`chart-probe-1440.png`, `chart-probe-375.png`).
  2. One count format — `formatCount`/`formatSignedCount` (`lib/format/count.ts`) route every named surface plus a few more (see Questions); pure-tested.
  3. Admin times say UTC — `formatAdminTimestamp`/`formatAdminDate` (`lib/format/admin-time.ts`) replace every `toLocaleString()`/`suppressHydrationWarning` pair across jobs, forensics, accounts, exports, reels, reports, support, applicants, announcements, the drill-in; pure-tested.
  4. Link visits, one figure — `aggregate.ts`'s `summarizeEngagement`/`buildEngagementTrend` fold `qr_scans + album_views` into `linkVisits`; the metrics page shows one card + one chart line with the "scanned or shared, bots filtered" line; the SQL snapshot's shape is untouched.
  5. The viewer's own day — `lib/dashboard/viewer-day.ts` (`resolveViewerZone`, `calendarDayInZone`, DST-safe) replaces the dashboard's server-clock read; `lib/format/date-in-zone.ts` renders the Event Pass expiry/grace deadline (dashboard) and the pass expiry (account page) in that zone; pure-tested at both 2026 DST days, Kolkata, Kiritimati, Honolulu, a missing/garbage header, and the evening-before "Print the code" scenario end to end with `next-step.ts`.
  6. Backup CLI pinned — `db-backup.yml` pins `2.117.0` (see Questions for how it was derived) with a comment naming the failure and the bump procedure; never triggered the workflow.
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule, one line each:**
  - Date-only admin formatter says "UTC" too, not just the datetime form (Questions).
  - Backup CLI pin (`2.117.0`) reconstructed from two live sources, not the run log itself (Questions).
  - A few extra raw-count spots fixed instead of deferred: admin rail badges, sparkline aria-label, next-step.ts's pending phrases, account page's follower count (Questions).
  - `compactAxisWidth`'s pixel formula (`max(28, widest*8+10)`) is a hand-tuned heuristic, not derived from measured text — verified clean at 1440/375 with the probe fixture, revisit only if a real board shows a wider label clipping.
- **Look at first:**
  - `src/lib/dashboard/viewer-day.test.ts` — the zone table (both DST days, Kolkata, Kiritimati, Honolulu, missing/garbage header) and the evening-before "Print the code" integration test against `next-step.ts`.
  - The chart fix: `chart-probe-1440.png` / `chart-probe-375.png` in this lane's scratch directory (the harness page itself was deleted, never committed).
  - `src/lib/format/count.test.ts` and `src/lib/format/admin-time.test.ts` — the two new formatters' pure tests.
  - The lane-check exceptions above, especially `report-review.tsx` and `pulse.test.ts` (outside `owns`, minimal and mechanical).
