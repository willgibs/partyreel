---
track: limits-watch
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "baf669eb"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/jobs/limits-watch
  - src/lib/jobs/spend-watch-run
  - src/app/api/cron/spend-watch/
  - src/app/admin/jobs/
  - docs/systems/admin-observability.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/jobs/spend-watch.ts
  - usher/kit/vercel-usage.mjs
---

# lp/limits-watch

**Goal.** Watch every vendor's free-tier meter against its plan limit, on /admin and by email, so a slow climb toward a ceiling is seen weeks before it is hit, never after.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Why (Will, 2026-10-04, after Vercel's Hobby Active CPU reached 3h 56m of 4h with zero real users):** "Always hate seeing us break limits without catching them scaling." The spend watch (`spend-watch.ts`) is a circuit breaker for a runaway loop (ten times the busiest reading of the week). Nothing watches the slow climb toward a plan's hard ceiling, and on Hobby a broken limit pauses every function (Vercel unlocked the account once already). Partyreel runs with no AI managing it: the watch is an /admin card and an email, never a script an agent remembers to run.

**What to build:**
- **A limits reading in the spend watch's daily run.** Hobby allows two crons and both exist (purge, spend watch), so add no cron.
- **Each meter:** its 30-day (or plan-period) use against its plan limit, the share, the trailing-week rate, and the days left to the ceiling at that rate.
- **Thresholds:** a WARN at 60% (or 30 days left), a CRITICAL at 85% (or 7 days left).
- **An email to Will on each crossing,** through the spend watch's own Resend seam (`spend-watch-resend.ts`), once a crossing, never daily.
- **A "Plan limits" card on `/admin/jobs`** beside the spend watch's, every meter with its bar and its words. Use the existing card style. A missing reading is "No reading", never a zero.
- **The meters,** each with its limit's home in one constant file, the vendor's current limits read from its own pages (cite them in WHY-comments) and never guessed:
  - **Vercel** (Hobby): Active CPU (4 h), Function Invocations (1M), Fast Origin Transfer (10 GB), Fast Data Transfer (100 GB), CDN Requests (1M), ISR Reads (1M), Image transformations (5K).
    - Hobby's API answers no Active CPU or Fast Origin Transfer: read `GET /v2/usage?type=requests` (daily function invocations, request hits and misses, bandwidth) as `usher/kit/vercel-usage.mjs` does, and estimate Active CPU from a calibration constant (44 ms a call, read off the dashboard 2026-10-04).
    - Name in the card which meters are estimated.
  - **Supabase** (free): database size (500 MB) by SQL, monthly active users (50,000) from `auth.users` sign-ins, and whatever the Management API answers.
  - **Cloudflare R2** (free 10 GB-month, 1M Class A, 10M Class B): storage from our own byte counters; operations need Cloudflare's analytics API.
  - **Resend** (3,000 a month, 100 a day): from our own mail log if one exists.
  - The export and backup **Workers** (100,000 requests a day).
- **★ Secrets are questions, never guessed.** The Vercel reading needs a Vercel token in the app's server env, and a Vercel token can deploy and delete: weigh it (a team-scoped token used only by the cron, sensitive on Vercel) against reading Vercel from the kit only, and recommend one. The same for a Cloudflare analytics token and a Supabase access token. Build every meter our existing credentials can read; leave the others wired to `missing` with their Question.
- **Never a request to the Vercel alias or partyreel.com from your machine** (the team is at Hobby's Active CPU limit): local `pnpm dev` and tests only. The Vercel API itself (`api.vercel.com`) is fine to read.

`admin-observability.md` gets a "Plan limits" section beside "The spend watch": the rule, the meters, where the limits live.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule.

- **Q1. Does the app hold a Vercel token at all?** Recommended, and built: yes, one dedicated token, `VERCEL_USAGE_TOKEN`
  (optional in `src/lib/env.ts`), that the spend watch's cron uses for one GET of `/v2/usage`; `limits-watch-vercel.ts`
  calls no other path, takes the token as an argument and never prints it or a response body (an error says only the HTTP
  status). Why not the kit alone: the kit is an agent remembering to run a script, the failure Will named ("no AI managing
  it"), and it guards only what an agent does, not what guests do. Why the risk is bounded: Vercel has no read-only token
  (it can deploy and delete), but the app's env already holds the service-role key and R2's write keys, so mint a fresh
  token scoped to the team (never the kit's personal `VERCEL_TOKEN`, which never expires and spans every team), a one-year
  expiry, non-sensitive until launch and then Sensitive. If he overrules: delete the `VERCEL_USAGE_TOKEN` lines (env.ts,
  `.env.example`) and the Vercel meters read "Not wired" for good. The middle road, not built: a GitHub Action holds the
  token as its secret and posts the numbers through `/api/internal/job-run`, which keeps the token out of the runtime env
  for the price of a workflow and a route. ★ Until a token is set the watch is blind to Vercel, so the first CPU alert
  cannot go.
- **Q2. A Supabase personal access token for egress and Realtime messages?** Recommended: no. It can delete the project
  and read its keys, more than a deploy token can. Those two meters read "Not wired"; the dashboard's Usage page and the
  spend cap's own refusal (on today, PRICING.md) stand in, and at launch (cap off) a quota is a bill, not an outage. Revisit
  if Supabase offers a read-only scoped token.
- **Q3. A Cloudflare analytics token for R2 operations and Workers requests?** Recommended: yes, an API token with
  `Account Analytics: Read` only (a read scope: it cannot deploy or delete), as `CLOUDFLARE_ANALYTICS_TOKEN`
  (`R2_ACCOUNT_ID` is already in env). Not built now: the GraphQL Analytics query cannot be verified without the token in
  hand, and a guessed query is what the brief forbids, so the four meters are wired to "Not wired" with their words.
- **Q4. Supabase's limits are Pro's, not Free's.** The brief says free (500 MB, 50,000 MAU); the org "Partyreel Team" is on
  Pro (`get_organization` plan `pro`, 2026-10-04; durability-backups.md's "Supabase Pro's daily backup"), so the file holds
  Pro's: 8 GB disk, 100,000 MAU, 250 GB egress, 5M Realtime messages. Recommended: as built.
- **Q5. Three Vercel limits the brief named are not readable meters.** ISR Reads (1M) has no Hobby allowance on Vercel's
  Hobby, fair-use or ISR pages and the usage API's `data_cache` answers no rows, so it is not a meter (`NOT_WATCHED`, said
  on the card). Fast Origin Transfer (10 GB) and image transformations (5K) are on the Hobby page but Hobby's API reports
  neither: their rows read "No reading" and say where to look. Recommended: as built; if he wants Fast Origin Transfer
  watched, calibrate it by hand like Active CPU (read the dashboard's total once, divide by the same hour's 30-day calls: one
  constant, and the card names it estimated).

## System-doc edits (in place, owned facts only)

- `docs/systems/admin-observability.md`: a "Plan limits" section beside "The spend watch" (the rule, the meters and where
  each number comes from, how a climb is projected, the once-a-crossing mail, a gap against a failure, the token's rules);
  the spend watch's "What could not be read" line points at it; the "Open this before you" list gains its bullet.

## Deferred (ROADMAP one-liners, bucket named)

- Launch checkpoint: the plan limits' cutover settings `[eng]`: at the launch plans, edit `src/lib/jobs/limits-watch-limits.ts`
  (the one home): Vercel Pro's credit for Hobby's allowances (its API answers Active CPU with Observability Plus, so the
  estimate can go), Resend Pro's 50,000 a month (`RESEND_DAILY_QUOTA` null removes the day meter), Workers Paid's 10M
  requests, each vendor's plan name, and the Supabase `past` wording with the spend cap's state.
- Now: the plan limits' Cloudflare reader `[eng+human]`: R2 operations and Workers requests through the GraphQL Analytics
  API, once Will mints a `CLOUDFLARE_ANALYTICS_TOKEN` (Account Analytics: Read) (Q3).
- Now: a Library specimen of the Plan limits card `[eng]` (`src/app/admin/jobs/limits-card.tsx`, presentation-only) healthy,
  critical, with a failed read and with gaps, so `lab:smoke` renders it, beside the spend watch card's line.
- Now: the plan limits at an hourly cadence `[eng]`: each run reads 31 days of Resend's list (up to 40 pages) and one
  Vercel call; at the Pro cutover's hourly cron, narrow the Resend pass (the month to date from `sent_emails`, plus a
  one-day list) before it multiplies.

## Handoff (replaces the chat report)

- **Commits.** Work commit `79bd40c51`, pushed to `origin/lp/limits-watch`. `launch-prep` had not moved since the base
  `288e67275` (`git fetch origin`, `git log 288e67275..origin/launch-prep` empty before this handoff), so there is no sync
  commit.
- **Gates**, each on its own exit code, all on `79bd40c51` (my dev server on 3138 ran for the smoke only, then stopped): `pnpm typecheck` 0; `pnpm
  lint` 0; `pnpm test` 0 (906 files, 11,076 tests, run through `scripts/build-lock.sh`); `pnpm build` 0 (through the lock);
  `pnpm lab:smoke --base http://localhost:3138` 0 (189 checks, 0 failing; `.env.example` widened its scope to the whole lab).
  No board, so no `lab:demo`. `pnpm test` ran again after this manifest commit, which changes docs only.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every line under an `owns` prefix (`src/lib/jobs/limits-watch*`,
  `src/lib/jobs/spend-watch-run*`, `src/app/admin/jobs/`, `docs/systems/admin-observability.md`) or this file, except four
  small ones, each said here: `supabase/migrations/20261004170000_limits_watch_readings.sql` (new: the SQL the database-size
  and R2-bytes readings need, which no existing function answers; the Orchestrator applies it); `src/lib/env.ts` and
  `.env.example` (`VERCEL_USAGE_TOKEN`, optional: CLAUDE.md's rule that a new secret goes in env.ts); `src/lib/email/templates.ts`
  (one word: `export` on `composeMail`, so the alert wears the shared mail shell from the job's own file). No other live
  lane claims any of them (peer sweep of `docs/tracks/`). `src/app/admin/jobs/page.tsx` shows 367 changed lines but `git diff -w`
  is 57: the Fragment that puts the new card beside the spend watch's re-indents the job card.
- **The items.**
  - `src/lib/jobs/limits-watch-limits.ts`: 16 meters (Vercel 6, Supabase 4, Cloudflare 4, Resend 2), each limit the vendor's
    own number for the plan we are on, its page and the date read in the WHY-comment; the Active CPU calibration (44 ms a
    call, 2026-10-04) and the team id live here; Resend's daily limit is imported from `spend-watch.ts`'s `RESEND_DAILY_QUOTA`.
  - `src/lib/jobs/limits-watch.ts` (+ test, 36 cases): thresholds (WARN 60% or 30 days, CRITICAL 85% or 7), the rolling-window
    projection that counts the days rolling out (a steady meter never warns on days left), a gauge's slope from our own earlier
    readings, month and day shapes, once-a-crossing (`planCrossings`, `nextTold`), the stored record and its defensive parse.
  - `src/lib/jobs/limits-watch-vercel.ts` (+ test): one GET of `/v2/usage?type=requests` into four meters; Active CPU
    estimated; a refused token says only its status.
  - `src/lib/jobs/limits-watch-resend.ts` (+ test): one pass over Resend's list, tallied by UTC day, a floor past the page cap.
  - `src/lib/jobs/limits-watch-run.ts` (+ test, 17 cases): takes every meter, judges, mails, keeps the record; never throws;
    called by `spend-watch-run.ts` as step 5b (so no new cron; `vercel.json` untouched), which fails the run on a failed read
    and holds it at attention for a CRITICAL meter (`spend-watch-run.test.ts` gained 4 cases).
  - `src/lib/jobs/limits-watch-mail.ts` (+ test): one operator mail a run to the spend watch's recipient, through `sendOnce`
    (kind `spend_watch`, key by the day and the crossings it names); no new mail kind.
  - `src/app/admin/jobs/limits-card.tsx` (+ test, 14 cases) beside the spend watch's card in `page.tsx`: a bar and its words
    per meter, "No reading" and why (a failed read in the failure tone), "estimated", "at least", what a break costs, a
    header counting the meters unread, a stale banner; `attention-line.tsx` is the spend watch card's line, moved to share.
  - `supabase/migrations/20261004170000_limits_watch_readings.sql`: `limits_watch_readings()`, INVOKER, service role only, a
    section that fails is missing alone. The rolled-back check at its foot ran on the live project BEFORE any apply
    (2026-10-04) and ended `ROLLED BACK: every limits-watch check held` (both sections numbers, equal to direct readings, a
    media write moved exactly `media_bytes` by 12,345, the client roles refused); `pg_proc` read back empty afterwards.
- **Verified live, locally** (nothing sent to the Vercel alias or partyreel.com; `api.vercel.com` read only): the readers against
  the real Vercel API, Resend's list and the database with the mail stubbed: Active CPU 3 h 55 m of 4 h (98%, estimated)
  CRITICAL, CDN requests 741,768 of 1,000,000 (74%) CRITICAL at 4.95 days left, invocations 32%, Fast Data Transfer 33%,
  Resend 12 of 3,000 a month; and one real manual `GET /api/cron/spend-watch` (no Vercel token set, so no crossing and no mail)
  that closed ok, wrote its `counts.limits` (one `job_runs` row, 2026-10-04 17:19Z), read back through PostgREST by
  `readLatestLimits()` and was drawn as the card in the browser at 820 and 375 px, dark and light, with no horizontal overflow.
- **Assets requested from Will:** none.
- **Board ideas:** the Library's compositions page could draw the Plan limits card (and the spend watch's, a ROADMAP line) at
  counts the test data never reaches; the usher kit's `vercel-usage.mjs` could read the card's latest Vercel record instead of
  calling the API a second time once the token is set.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:**
  - Migration: apply `supabase/migrations/20261004170000_limits_watch_readings.sql` by its own protocol, then regenerate
    `src/lib/db/types.ts` and drop the `untypedRpc` seam in `limits-watch-run.ts`. Until it applies the two meters read "Not
    wired yet: the migration is not applied" and the run stays ok.
  - Vercel env: `VERCEL_USAGE_TOKEN` on the `partyreel` app project (the admin project's cron stops before reading), a token
    scoped to the team with a one-year expiry, non-sensitive until launch (Q1). No Worker, Stripe or `vercel.json` change.
- **Calls his to overrule:**
  - Supabase's limits are Pro's (Q4), and ISR Reads is not a meter (Q5).
  - A gap (no credential, no vendor API) does not fail the spend watch's run; a failed read does; a CRITICAL meter holds it at
    Needs a look (the bell); a WARNING is the card and the mail only.
  - Resend is read from Resend's own list (every sender, Supabase Auth's sign-in codes included), not our `sent_emails` log,
    which never sees them; the daily meter is the week's busiest UTC day.
  - Vendor GB counts as 10^9 bytes, so a share reads high, never low; MAU and R2's bytes are floors, flagged "at least".
  - One combined mail a run, kind `spend_watch`, told-based (a meter is mailed when its level rises above what it was last
    told, forgets a level only once clearly fallen: 5 points of share, a fifth fewer days); the history unreadable holds the mail
    and fails the run.
- **Look at first:** Active CPU reads 98% (3 h 55 m of 4 h, estimated) and CDN requests 74% with about 5 days left at this
  week's rate, so set `VERCEL_USAGE_TOKEN` (Q1) and press Run now on the spend watch's card: the first mail names both. Until the
  token is set the watch cannot see Vercel at all. Then `/admin/jobs`, the Plan limits card under the spend watch's.
