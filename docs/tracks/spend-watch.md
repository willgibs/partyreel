---
track: spend-watch
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "7e89d732"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/jobs/spend-watch
  - src/app/api/cron/spend-watch/
  - src/app/admin/jobs/
  - src/lib/email/send
  - src/app/api/r2/presign-upload/
  - docs/systems/admin-observability.md
  - supabase/migrations/20261003190000_
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/PRICING.md
  - docs/systems/database-security.md
  - docs/systems/lifecycle-recovery.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/billing-caps.md
---

# lp/spend-watch

**Goal.** Our own spend guards, since Supabase has no budget alert and no ceiling but its on/off cap (its docs, 2026-10-03), Cloudflare has no cap at all, and Will wants alerts with a ceiling that extreme growth passes but a runaway loop cannot: a spend watch that reads our own counters, alerts past a multiple of the trailing peak, and stops the vector behind a runaway through switches with their /admin cards. Partyreel runs with no AI managing it.

## The brief

**Will's words (2026-10-03):** "For Supabase, yes we don't want that spend cap blocking the platform scaling, so we'll switch to budget alerts. Maybe a super high spend cap, where even extreme overnight growth would be included but some insane multiple off a runaway looped function or something can't become a database bill. If you can handle that, please do. However, until launch, we should have a spend cap that prevents even internal runaway spending. Can be adjusted at launch. ... We'll be able to address lots of this as we grow - can check usage near daily as users grow to see what could run away from us, but I'd like us to come in with as strong of a system as possible."

**The model** (the Advisor's Q15 §4 and R3, in `../partyreel-wt/_scratch/pricing/q15-advisor.md`; read it whole). Guards are circuit breakers, not budgets: every vendor without a cap gets one of ours, keyed to the trailing week's peak, with its `/admin` card and switch. Set each ceiling at 10× the trailing peak: growth is never a 10× day; a looped function is.

**Build:**
1. **`spend_watch`, a scheduled job** in the catalog (`src/app/admin/jobs/catalog.ts`), reporting through `job_runs` like every job (admin-observability.md "Backend jobs"). Its readings come from our own tables, never a guess:
   - uploads and bytes an hour (`storage_ledger`);
   - sign-ins a day (`auth.users`, the MAU proxy);
   - emails a day (`sent_emails`);
   - the live album's activity (its change log);
   - vendor usage only where an API we already hold a token for exposes it. Verify each in its own docs, and say which you could not read.
   A missing reading is never a zero. Pre-launch, Vercel Hobby runs crons at most daily, so ride the purge cron's run or say how it runs; hourly at launch is a line in your Handoff.
2. **Thresholds:** past 10× the trailing hourly or daily peak, with an absolute floor so a quiet pre-launch week never pages on noise, it alerts (Sentry and the ops mail, as the orphan breaker does) and its card reads attention.
3. **The switches that stop a vector**, each fail-safe in the right direction (the doc's "kill switches fail differently on purpose"):
   - lifecycle mail (`mail_paused`: the OTP stays, since Supabase Auth's own rate limit bounds it);
   - the existing cron and export switches;
   - a new `uploads_enabled`, refused in words a guest understands, never silently.
   ★ Auto-flip only where a false positive costs no guest's moment (mail, crons, exports). Uploads alert and offer a one-tap `/admin` switch, because blocking a real wedding by mistake is the failure worth engineering against (PRICING.md's ingress-meter principle). Write that as a Question with your recommendation, and build the recommendation.
4. **Never touch a vendor setting:** the Supabase spend cap, Vercel's Spend Management and Cloudflare's notifications are the Orchestrator's and Will's. Propose each launch posture and value in your Handoff (`cost-atlas` writes them into PRICING.md), including Supabase Auth's hourly email rate limit.

New objects follow database-security.md (deny-all, like `ops_flags` and `job_runs`). A migration is written for the Orchestrator (the Advisor reads it, then it is applied by protocol) under your reserved prefix.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree, each step on its own exit code; `pnpm lab:smoke --base http://localhost:3134`; red first for the threshold, the floor, a missing reading and each switch's direction; a rolled-back MCP check of any new SQL; captures of the job's `/admin` card healthy and tripped.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Which guards stop their vector on their own?** Recommended, built: the watch pauses lifecycle mail, Download all
  and the purge sweep by itself on a new trip, since a false alarm there delays a reminder, a zip or a night's
  reclamation and never a guest's moment; for uploads it alerts (Sentry and the ops mail) and the card offers the
  switch, one press and its sheet, since a false alarm would stop a real party. Sign-ins, album changes and Resend's
  own count alert only: no switch of ours stops them without hurting someone.
- **What does pausing lifecycle mail hold?** Recommended, built: only the mail its sweep re-sends while the state
  lasts (the inactivity warning, the over-cap reminder, the renewal nudge), each sent the first night the switch is
  back on. Never the one-time notices (an idle event put in Deleted, a grace opened, a plan reduced): their sweep never
  meets that state again, so a held one would be lost for good; each is bounded by a real change, and its sweep's own
  switch stops it. Never operator mail (the watch's own alert rides it). Sign-in codes are Supabase Auth's, untouched.
- **Does the uploads switch stop a host's own uploads too?** Recommended, built: guests only. A host's uploads are her
  signed-in account's, bounded by her plan's ingress meter, and a host refused on her own album mid-event reads as
  Partyreel broken; the runaways it guards against (a leaked link, a looping guest client, a bot) come through the
  guest door. Both is one check in the host presign route.
- **Does the watch ever lift its own pause?** Recommended, built: never. A pause it made stays until a person turns the
  switch back on (a looped function would restart), and its card reads Needs a look (bell and band) until then; and a
  person's resume wins for the rest of that trip (it pauses again only on a new trip).
- **How does it run before launch?** Recommended, built: its own route and its own daily cron at 05:00 UTC (Hobby fires
  it within that hour, after the purge's 04:00 hour has sent the night's mail), not a ride on the purge's run, since it
  must run while the purge is paused and may be the one pausing it. It also raises the purge cron's own missed run,
  which no job watched. Hourly at launch is `0 * * * *` in vercel.json and the catalog (Pro).
- **The floors** (the ceiling's least value, which a quiet week cannot reach; each a line in `spend-watch.ts`):
  uploads 1,000 an hour; bytes 10 GB an hour; album changes 2,000 an hour; lifecycle mail 50 a day; mail through
  Resend 50 a day, and never above 80 while Resend is on its free plan (its hard stop is 100 a day, the alerts' own
  mail included); accounts signed in 200 a day; Download all 100 a day; purge runs 4 a day. Recommended, built.

## System-doc edits (in place, owned facts only)

- `docs/systems/admin-observability.md`: "The spend watch" (new: the readings and what could not be read, the
  ceiling, a trip never raising its own, what a trip does, the pause it never lifts, the two switches and their
  hold, who watches the watchman, cadence); "The kill switches fail differently on purpose" and the tripped-breaker
  line refined in place; the opener's list gains the spend guards. `lifecycle-recovery.md` (a read) is not edited:
  the hold's home is the spend watch's section, and a pointer from "Sending email" is a Deferred line.

## Deferred (ROADMAP one-liners, bucket named)

- Now: a one-time lifecycle notice (a grace's start, an inactivity removal, a reduce) is lost on a night its send
  fails, since its sweep never meets the state again: a Resend outage drops it for good (found by `spend-watch`; its
  pause never holds these for that reason).
- Now: the palette could name the spend watch's two switches (`lib/admin/palette.ts`), jumping to
  `/admin/jobs#switch-uploads_enabled` and `#switch-lifecycle_mail_enabled`.
- Now: a Library specimen of the spend watch's card (healthy, tripped, a reading missing), so `lab:smoke` renders it;
  the card is presentation-only (`spend-watch-card.tsx`) for exactly that.
- Now: `lifecycle-recovery.md`'s "Sending email" could name the lifecycle-mail hold, whose home is
  `admin-observability.md` "The spend watch".
- Data: with `spend_watch` applied and the types regenerated, drop `spend-watch-run.ts`'s typed seam (`untyped`).
- Launch checkpoint: the spend watch hourly at the Vercel Pro cutover (`0 * * * *` in `vercel.json` and the catalog,
  `expectedEveryMs` an hour, the cadence words) and `RESEND_DAILY_QUOTA` null at the Resend Pro cutover.

## Handoff (replaces the chat report)

- **Commits:** the WIP `24307cc2` and the work `9fa97235`, pushed to `lp/spend-watch`; this manifest's commit is the
  head. No sync: launch-prep moved (crumbs-57's and crumbs-58's merges and records) but nothing in it touches a read
  or a file of this lane, so a merge would only cost a gate.
- **Gates on `9fa97235`, each its own exit code** (logs in `../partyreel-wt/_scratch/spend-watch/`): `pnpm
  typecheck` 0 (`gate-typecheck.log`); `pnpm lint` 0 (`gate-lint.log`); `pnpm test` 0, 859 files, 10,176 tests
  (`gate-test.log`); `zsh scripts/build-lock.sh pnpm build` 0, `ƒ /api/cron/spend-watch` (`gate-build.log`);
  `pnpm lab:smoke --base http://localhost:3134` 0, 179 checks, scope all because `vercel.json` changed
  (`gate-lab-smoke.log`; a first run after a deleted scratch route 404'd every lab page until `rm -rf .next/dev`).
  No board, so no `lab:demo`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is the owned paths and this file, plus two
  exceptions: `src/lib/email/templates.ts` (`spendWatchEmail`, the watch's ops mail: every mail is one shell and
  `composeMail` is private there, so a template elsewhere would fork it) and `vercel.json` (the watch's cron line).
- **The rules** (`src/lib/jobs/spend-watch.ts`): eight readings, each judged against ten times the busiest untripped
  reading of the trailing week, never under its floor nor past a vendor's own stop; a missing reading is never a zero
  (it says why, never trips, fails the run); a counter with no baseline warms; a new trip pauses lifecycle mail,
  Download all or the purge sweep; uploads are only ever offered; `breaker_tripped` (attention) while a trip, a pause
  of the watch's or guest uploads off stands. Red first by mutation: every rule broken alone fails its test
  (`red-first.log`).
- **The run and its route:** `spend-watch-run.ts`, `/api/cron/spend-watch` (the purge's door: cron secret in constant
  time, the app surface alone, Run now told apart), its own daily cron `0 5 * * *` and catalog entry `spend_watch`
  (Run now calls the route vercel.json schedules: `catalog.test.ts` holds the two together); it also raises the purge
  cron's own missed run, which no job watched.
- **The vendor reading:** Resend's sent-mail list, every sender (Supabase Auth's sign-in codes ride its SMTP), paged to
  3,000 and "at least" past it. Not readable with our tokens: Supabase usage (no Management token), R2 and Workers (R2's
  S3 keys read no usage), Vercel, Sentry; Resend's quota headers come back only on a send.
- **The switches:** `uploads_enabled` asked first at the guest presign (`uploads_paused`, a 503 in Partyreel's words;
  fails open); `lifecycle_mail_enabled` in `sendOnce` before the claim, holding only the re-sent three (fails closed, a
  hold recorded in `email_delivery`); `send-kinds.ts` classifies every send's kind, held to it by a compiler walk of
  `src/**` (`send-kinds.test.ts`); the watch's pause never re-stamps an operator's.
- **The card** (`spend-watch-card.tsx`, `switch-controls.tsx`): each reading against its ceiling and the week's
  busiest, "Tripped" with what to check, "No reading" with why; "What it can stop" with the two new switches in place
  (the portal's sheet on OFF) and the other two linked to their homes; the watch's own pause and an offered switch said
  beside it. Captures: `card-healthy-1440.png` (the live week's numbers), `card-tripped-1440.png`,
  `card-missing-1440.png`, `card-tripped-375.jpg`, from an uncommitted harness rendering the real card in the real
  `AdminShell` (the /admin page itself needs Google and TOTP); at 375 the table measured 311 in a 311 container, no
  page overflow.
- **The migration** `supabase/migrations/20261003190000_spend_watch.sql`: `spend_watch_readings` (INVOKER) and
  `spend_watch_sign_ins` (DEFINER, auth.users), the service role's alone, three switches seeded on. Proved on the live
  schema before any apply, rolled back: red on today's schema ("FAIL 1"), green with the file's statements at the head
  (md5 of the statements `cf17df6e`; the readings before and after each write moved exactly their own;
  `sql-proof.log`); nothing persisted (re-read). Expected advisors delta: none. Types: the two functions join Functions.
- **Live, from localhost against the project:** the cron door 401 twice; the presign gate open with no row, 503
  `uploads_paused` with `uploads_enabled` inserted false (deployed code ignores the key), open again once the row was
  deleted by its own instant (`live-local.log`); one watch run before the migration, `job_runs` `28cf35eb`, status
  error, every DB reading "No reading" in PostgREST's words, Resend 2 a day: left as the watch's first real history.
- **Assets requested from Will:** none.
- **Board ideas:** the admin bar at 375 draws the section dropdown over the "1 job needs you" chip (the phone capture);
  the guest queue could stop its batch on `uploads_paused` with one sentence rather than failing each file with it.
- **Proposed changes:** apply `20261003190000_spend_watch.sql` by protocol before the alias build that carries this
  (before it, the watch reads "No reading" and fails, never quiet); the `vercel.json` cron (both projects register it,
  the admin deployment answers and stops, like the purge). No env change (it reuses `CRON_SECRET`, `RESEND_API_KEY`,
  `CONTACT_NOTIFY_EMAIL`). **Vendor postures, for cost-atlas's PRICING.md** (every vendor setting stays yours and
  Will's): Supabase's spend cap ON until launch (verified on at 17:25Z), OFF at launch with this watch and a weekly
  look at the org's usage page (the cap is a dashboard toggle: no documented Management API, and the app holds no
  Management token); Supabase Auth's email limit 100 an hour until the Resend cutover (Resend's free 100 a day binds
  first), then 600 an hour (a 1,200-guest door's first hour), checked against the watch's Resend reading; Vercel Pro's
  Spend Management at launch with notices at $50, $100 and $150 and "pause production" at $500 the first month, then
  ten times the trailing week's busiest day times thirty; Cloudflare a usage notice at $10 now, $25, $50, $100 and
  $250 at launch; Resend free now, Pro at launch (50,000 a month, overage to five times, then a hard stop) with
  `RESEND_DAILY_QUOTA` null; Sentry free now, on-demand OFF at launch.
- **Calls his to overrule:** guest uploads only (not a host's own); the floors (1,000 uploads and 10 GB an hour, 2,000
  album changes an hour, 50 lifecycle mails, 50 Resend mails capped at 80, 200 sign-ins, 100 zips, 4 purge runs a
  day); the watch never lifts its own pause; guest uploads off keeps the watch at Needs a look; the one-time notices
  never held; `lifecycle_mail_enabled` for the brief's `mail_paused` (the table's `*_enabled` convention); the guest's
  words "Uploads are paused on Partyreel for now. Try again in a little while."; "Tripped" on the card.
- **Look at first:** `card-tripped-1440.png`, then `READINGS` in `src/lib/jobs/spend-watch.ts` (each floor and what
  each trip does).
