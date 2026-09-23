---
track: orchestrator
status: open
cut: "546e2489"          # the launch-prep SHA this state was written at
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
  - "lab-scene-kit merged at bff618d4 (2026-09-23): `Fit` and `Measured` live in `@/components/lab` (`scene.tsx`); `kit-discipline.test.ts` refuses a registered board that declares either. `event-safety` syncs past it and imports the two."
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
| `upload-owner` | a claimed guest row uploads only for its signed-in owner (the alias red-team's finding: a kept ticket credited partyr33l's photo to hi@willgibs); sign-out clears the device's tickets | building (agent a51450b994653b8eb) | Opus, :3131 | lands after milestone 27, in milestone 28 |

## Next, in order

The plan: `~/.claude/plans/great-work-however-1-dapper-twilight.md`, its top section (Will's message of 2026-09-23).
Done: the four lanes merged (gates 134 to 137), alias build 3 (`a760b998`) red-teamed, milestone 27 (`546e2489`,
tagged, both projects READY, the partyreel.com pass green).

1. **Integrate `upload-owner`** when it hands off; alias build 4 (`[preview]`); red-team its Look at first on ONE
   browser (A uploads to a names-mode event, signs out; B signs in and uploads: B's own row; B signs out; a signed-out
   upload meets the door, never A's or B's name).
2. **Milestone 28, on Will's word** (it changes partyreel.com): `upload-owner` fixes a live misattribution.
3. **The identity contract** (`20260923150000_identity_contract.sql`): the drift check passed (all four live bodies
   match their files) and the live search found nothing else naming the column; the auto-mode classifier refused the
   destructive apply, so it waits on Will's approval. After it: `get_advisors` (no delta expected), `types.ts`
   regenerated, the foot's rolled-back check, a smoke on partyreel.com and the alias (a disposable event created and a
   setting saved, a name-only join, a require-upload door, a password event signed out, `/u/<handle>` both ways).
4. **Stripe with Will** (the plan's section 6), when he says he is at the keyboard: the reads are done (no passes, the
   customer free, the price ids equal across environments, the prod webhook answering without a redirect); stage
   willg97 to Free and relink `cus_Ubm3ANAZmqMfDB`, open the plan sheet's Pro 100 GB in his Chrome; his card and
   Subscribe; read back; Change plan to Pro 500 GB; his Back and Confirm; read back.
5. **The purge cron's first scheduled run on the new code** (04:00 UTC, only production runs crons): read back its
   heartbeat from the jobs console the morning after milestone 27.
6. **The reel round's wiring**, after his desk review of the six reel boards: the plan's reel section (A to G; the
   expand migration first, the drop migration and the R2 sweep of stored reel files after the red-team).

## Waiting on Will

- **The Stripe clicks** once he is at the keyboard (a test card and Subscribe; then Back and Confirm).
- **The identity contract's apply** (approve the destructive migration, or leave the unused column).
- **Pushes to `launch-prep`** after milestone 27: the auto-mode classifier refused one ([Modify Shared Resources]); the
  record commits sit local until he allows it.
- **Milestone 28** once `upload-owner` is red-teamed.
- **His desk review** on the alias (`/design/lab?key=`, the value in `.env.local`): 26 boards, the six reel boards
  first, the harnesses `/design/lab/tools/reel-live` and `/design/lab/tools/reel-video`, and the new `event-safety`.
