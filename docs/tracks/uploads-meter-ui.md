---
track: uploads-meter-ui
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c06cfaf0"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/dashboard/storage-meter
  - src/components/app/storage/storage-figures
  - docs/systems/billing-caps.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/db/queries/month-uploads.ts
  - src/lib/constants/tiers.ts
  - src/lib/billing/plan-facts.ts
---

# lp/uploads-meter-ui

**Goal.** The host sees this month's uploads against her plan's allowance in the storage ring's popover, so the allowance (Free's 300 MB a month, the pass's year, Pro's monthly) is never a surprise.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Why** (ROADMAP, crumbs-64's finding): nowhere in the app says a host's uploads this month against her plan's allowance. Ladder A's allowances live in `src/lib/constants/tiers.ts`; the month's uploads are read for the signed-in host by `readHostMonthUploads` (`src/lib/db/queries/month-uploads.ts`, the service role, her `getUser()` id only).

**The work** (recommended placement, Will's to overrule):
- The storage ring's popover on the dashboard (`storage-meter.tsx`) gains one quiet line under the storage figures: "Uploads this month: 1.2 GB of 300 MB" for Free, "this pass's year" for a pass, a month for Pro. The tier's own words come from `tiers.ts`, the one home.
- It reads only on the popover's open, or with the facts the page already reads. Never a poll, never a new call on every dashboard load: the compute budget counts every call.
- Unlimited or unknown says nothing rather than a guess. A failed read omits the line, never a zero.
- A line at or past the allowance takes the warning tone and says what pauses (new uploads, hers and her guests') and when it resumes.

Marketing words stay punchy; the app's words are exact. Wiring rigor: the whole gate. Nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app. Port 3131 is yours. Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is near its end).

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
