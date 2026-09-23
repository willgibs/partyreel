---
track: orchestrator
status: open
cut: "dea771f0"          # the launch-prep SHA this state was written at
owns:                    # the standing claims no lane touches (a new board adds only its own lines to the two board lists)
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/rules/bible.test.ts
  - src/app/globals.css
  - src/app/theme.css
  - src/app/(marketing)/marketing.css
  - src/lib/design-gate/
  - src/app/api/design-gate/
  - scripts/vercel-ignore-build.mjs
  - .github/workflows/ci.yml
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
reads:
  - CLAUDE.md
  - docs/PROGRAM.md
announces:
  - "The reshape (Will, 2026-09-22): the docs carry rules, never history. `docs/CHANGELOG.md` is gone (the merge commit carries a lane's summary), `usher/kit/cut-lane.py` cuts manifests from a spec, and four lanes run on disjoint files: `docs-rules` retires `docs/design/rulings.md` and the Library's rulings page, `systems-trim` trims `docs/systems/`, `roadmap-lean` rewrites `docs/ROADMAP.md` and `docs/ASSETS.md`, `pointer-sweep` rewrites code comments that point at the retired docs. None changes behavior."
---

# The Orchestrator's state

The pickup: read this first at every session start, compaction or restart, then `docs/STATUS.md`. It holds only what
is true now: what runs, what comes next, what waits on Will. How to cut, integrate, deploy and recover is the runbook,
[`usher/kit/README.md`](../../usher/kit/README.md). Rewritten in place, never a log. The Orchestrator is whichever
model Will seats (Fable or Opus); nothing here depends on which.

## In flight

| lane | what | state | model, port | at its handoff |
| --- | --- | --- | --- | --- |

## Next, in order

The plan: `~/.claude/plans/great-work-however-1-dapper-twilight.md`, its top section (Will's message of 2026-09-23).

1. **Integrate the four lanes** as they hand off (`lab-scene-kit` first, announced here so `event-safety` imports `Fit`
   and `Measured`; gates 134 on). `guest-followons`' contract file (`20260923150000_identity_contract.sql`) merges
   UNAPPLIED; after its merge, run `seed-demo-event.mjs`'s guest mode once on the demo event. The last production
   merge's record carries `[preview]`: alias build 3, then the red-team in Will's Chrome (the plan's section 3).
2. **Milestone 27** (Will's yes, 2026-09-23): the full gate, `merge --no-ff` into `main`, the tag, production READY on
   both projects, the pass on partyreel.com (section 4), `launch-prep` fast-forwarded to `main`.
3. **The identity contract**, right after the green pass: the live search for anything else naming
   `allow_anonymous_uploads` first (`DROP COLUMN` never checks a function body), then the protocol and the smoke
   (section 5). From then on partyreel.com rolls back only to a milestone-27 build.
4. **Stripe with Will** (section 6): the reads first, willg97 staged to Free only when he is ready to click, his card
   and Subscribe on Checkout, then Back and Confirm on the change-plan confirm page; the read-backs.
5. **The record and the report**: STATUS, this pickup, the ROADMAP retirements (20-30, 32, 33, 35, 42, 57, 159, 178;
   28 narrowed), the calls his to overrule, the `event-safety` board's link.
6. **The reel round's wiring**, after his desk review of the six reel boards: the plan's reel section (A to G; the
   expand migration first, the drop migration and the R2 sweep of stored reel files after the red-team).

## Waiting on Will

- **His desk review** on the alias (`/design/lab?key=`, the value in `.env.local`; Start the review): the six reel
  boards first; the harnesses `/design/lab/tools/reel-live` and `/design/lab/tools/reel-video`.
- **The Stripe clicks** once milestone 27 is live (a test card and Subscribe; then Back and Confirm).
