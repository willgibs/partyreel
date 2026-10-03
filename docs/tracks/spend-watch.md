---
track: spend-watch
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "4c23717e"            # the launch-prep SHA the branch was cut from
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
