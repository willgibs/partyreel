---
track: crumbs-64
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "ee0629d7"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/sections/pricing/
  - src/components/app/pricing/
  - src/lib/billing/storage-guard
  - src/components/guest/reel/
  - src/app/admin/accounts/
  - src/lib/jobs/spend-watch
  - src/lib/constants/tiers
  - content/help/how-long-an-event-pass-lasts.mdx
  - src/app/(app)/account/page.tsx
  - src/app/llms.txt
  - src/app/llms-full.txt
  - docs/systems/billing-caps.md
  - docs/systems/admin-observability.md
  - docs/systems/reel.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/crumbs-64

**Goal.** Red-team 52's findings before milestone 36: the pricing matrix's row explainers readable by a finger (the MEDIUM), its three LOWs and its NITs.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Red-team 52** (build 52, `e8d11584`, Ladder A on `/pricing`, the plan sheet, the reel's tap): every number matched and the walks passed, with one MEDIUM, three LOWs and NITs. Its ledger is `../partyreel-wt/_scratch/redteam-52/ledger.txt` (read the MEDIUM, LOW and NIT lines whole; each names its file and line).
- **MEDIUM:** `/pricing`'s comparison matrix (`comparison-table.tsx`, `#compare`) opens its 17 dotted-underlined row explainers on a mouse's hover and a keyboard's focus, but never by a finger: a tap focuses the label and the trigger stays closed. The subhead tells readers to hover them, so Uploads and Deleted are unreadable on a phone. A tap must open one, and another tap or a tap outside close it, at 375 with touch, without breaking hover and keyboard. The subhead's words must hold for touch too. Then check the 375 tooltip's edge (a NIT: it sits too close to the screen's edge).
- **LOW, the plan sheet and a Pro size switch are blind to the uploads allowance:** each size's card names its storage and estimate but never its uploads a month (100 / 200 / 500 GB), and `checkPlanChange` (`src/lib/billing/storage-guard.ts`) checks storage only, so a downgrade below this month's uploads passes silently. Say each size's uploads on its card, and give a switch below this month's uploads its honest words. Never block what the webhook allows; the Stripe webhook stays the sole writer of the tier (`billing-caps.md`).
- **LOW, the reel at a desk:** a click aimed with a moving mouse hides the controls the move just raised (the move wakes the dock at +15 ms, the click toggles it away). A click within a beat of the move's wake must keep it up. The NIT beside it: a finger's press on Play or Pause wakes the dock on the pointer's 2.4 s rest instead of the finger's 4.2 s (`onTogglePlay` calls `wake()` with no touch flag).
- **LOW, `/admin/accounts`' Cap column** reads a null `storage_cap_bytes` as "Unlimited" for every account, Free included: say each account's real cap from its tier (`tier_limits`, `src/lib/constants/tiers.ts`).
- **NITs:**
  - the pass article's doubled phrase ("50 GB over its year of uploads for about a year", from `tiers.ts`' words, wherever it lands: the help and `llms.txt`);
  - `/account#plan`'s "paid once" where the sheet, the pricing page and its FAQ say "one payment, no subscription";
  - the plan sheet's first open, before `/api/stripe/plan-facts` answers, titled "Your Pro plan" with Switch on her own size (a quiet loading state until the facts land);
  - admin's Spend watch still calling the uploads meter "ingress" (`spend-watch.ts`).
- **And identity r4's finding:** the live reel dock's Style and Hold keys never show their open fill (`data-state="closed"` with `aria-expanded="true"` while the menu is open).
- Never touch Stripe objects or the TEST key; nothing here needs a migration (if one seems to, it is a question).

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
