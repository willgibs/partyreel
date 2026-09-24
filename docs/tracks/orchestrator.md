---
track: orchestrator
status: open
cut: "1076d3d7"          # the launch-prep SHA this state was written at
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

## Next, in order

Milestone 28 is live (`1076d3d7`, 2026-09-24): the 1,000-row round (stage 1 `rowcap-kit`, `rowcap-sql` with three row-cap
migrations applied; stage 2 `rowcap-guest`, `rowcap-host`, `rowcap-cron`, `rowcap-album`; gates 140 to 146),
`upload-owner` and `delete-final`, alias build 4 red-teamed in Will's Chrome, the partyreel.com pass green. The plan file
(`~/.claude/plans/great-work-however-1-dapper-twilight.md`) keeps only the reel section live.

**Will's standing approvals:** pushes to `launch-prep` and anything around branching; he tests by click whenever asked. A
milestone and a destructive migration each still need his yes.

1. **The purge cron's 04:00 UTC run on 2026-09-24**, the FIRST on milestone 28's sweeps (only production runs crons):
   read `job_runs` after 04:05 (every sweep `ok`, `stopped_early` false, the standby budget listing willg97 at its
   restorable bytes with the withdrawals out, no held event).
2. **The scale probe stays** as a standing large-album fixture (event "Scale probe" `14bb4318-80cd-4eed-b219-92c097ee16c7`,
   qr `d02631f1bfb3455188d224e41bf9510f`; 1,145 approved, 20 pending, 30 host-removed, 5 withdrawn; Review ON since the
   red-team). Its removed rows purge on 2026-10-23.
3. **The reel round's wiring**, after his desk review of the six reel boards: the plan's reel section (A to G).
4. **The event-safety wiring**, after his review of that board (his three answers; ROADMAP's event-safety line).

## Waiting on Will

- **His desk review** on the alias (`/design/lab?key=`, the value in `.env.local`): 26 boards, the six reel boards
  first, the harnesses `/design/lab/tools/reel-live` and `/design/lab/tools/reel-video`, and the new `event-safety`.
- **A look at the admin portal** (TOTP): `/admin`, `/admin/metrics`, `/admin/jobs`, the probe's `/admin/albums` drill-in.
