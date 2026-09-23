---
track: orchestrator
status: open
cut: "6fd4bbbd"          # the launch-prep SHA this state was written at
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

1. **Will's answers of 2026-09-22 (evening)**: all five lanes merged (`recheck-by-upload` `0d6eb748`, `host-storage`
   `602b915e`, `storage-guard` `66cd79f8`, `voice-guest` `4bd4ffa5`, `guest-by-upload` `09375611`, gates 129 to 133);
   `20260923120000_guest_by_upload` applied (drift clean, after-md5s equal the file, advisors 15 / 5 / 34 unchanged,
   the rolled-back check held, nothing persisted). Next: alias build 2 (this record); then the general portal
   configuration's one Stripe call (`features[subscription_update][enabled]=false` on `bpc_1TcTxWPtjqmVkBwkcAldFEZA`);
   the red-team (the save lane's five "look at first" walks, Will's Chrome, the account chooser); then
   `20260923130000_drop_saves` by the protocol (advisors 0029 34 to 32), `types.ts` regenerated, STATUS naming what
   partyreel.com loses until a milestone. A change-plan session's live look needs a real TEST subscription (Will's
   hands: a TEST checkout as willg97, card 4242, on Stripe's page).
2. **The reel round's wiring**, after his desk review of the six reel boards: the plan's reel section (A to G; the
   expand migration first, the drop migration and the R2 sweep of stored reel files after the red-team). The sweep
   lane also takes the reel's lines in `PRD.md`, `PRICING.md` and the two content authoring guides.

## Waiting on Will

- **His desk review** on the alias (`/design/lab?key=`, the value in `.env.local`; Start the review): every standing
  board is current (`recheck-by-upload` merged at `0d6eb748`); the six reel boards first; the harnesses
  `/design/lab/tools/reel-live` and `/design/lab/tools/reel-video`.
- **A milestone, on his word** (it changes the public site): `launch-prep` is more than 1,100 commits past
  `milestone-26`; once the save tables drop, partyreel.com's older build errors on its dashboard until it ships.
- **The Guests room's addresses** (a ROADMAP call: his reason for the credit's address reaches it).
