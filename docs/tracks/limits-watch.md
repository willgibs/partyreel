---
track: limits-watch
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
