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
| `guest-by-upload` | save dies; one definition of a guest; the profile line follows the album; own deletes close the door | running | Opus, :3132 | apply the expand file at the merge; the contract file only after alias build 2's red-team, then `types.ts`; the Privacy version line in `legal.ts`; the `app-door` ruled row in `touchpoints.ts` |
| `storage-guard` | no plan change leaves a host over the new cap; Pro changes through the change-plan route on `bpc_1UIhooPtjqmVkBwkcLe9YgYN` | running | Opus, :3133 | its component-notes line; after alias build 2, remove `subscription_update` from the general portal configuration; the ROADMAP launch portal lines |
| `host-storage` | NEW board: where hosts see sizes, freeing space, the plan sheet's refusal and a Pro host's prices | running | Sonnet, :3134 | desk after `host-curation` |
| `voice-guest` | NEW board: seven real lines of the guest journey, the capture's words among them | running | Opus, :3135 | syncs after `recheck-by-upload`; desk after `guest-capture` |

## Next, in order

1. **Will's answers of 2026-09-22 (evening)**, the plan at `~/.claude/plans/great-work-however-1-dapper-twilight.md`
   (its top section): save dies (a guest exists only by uploading; a guest's own deletes close a require-upload album
   again), no plan change leaves a host storing more than the new cap, the voice's first board. Done before the cut:
   the preview key (`.env.local` and the Preview rows; the auto-mode guard refused deleting the two Production rows,
   which keep the old long value, and recreating the admin project's unscoped Preview row), and the change-plan portal
   configuration in Stripe TEST (`bpc_1UIhooPtjqmVkBwkcLe9YgYN`, metadata `partyreel_purpose=change_plan`, found by
   that tag, no env value). Five lanes: `recheck-by-upload` merges first with `[preview]` (alias build 1, the desk
   current); `guest-by-upload`'s expand file at its merge; the last record `[preview]` (alias build 2); then the
   general portal configuration loses `subscription_update`, the red-team, and `guest-by-upload`'s contract file with
   `types.ts` regenerated.
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
