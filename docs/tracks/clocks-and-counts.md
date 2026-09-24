---
track: clocks-and-counts
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
