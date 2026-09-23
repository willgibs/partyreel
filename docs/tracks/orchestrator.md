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
| `delete-final` | a guest's own delete is final and says so ("deleted from the event right away and can't be recovered"); no host surface shows it; the host's Recently deleted figure counts only what the host can restore | building (agent a202582d56c89a266) | Opus, :3132 | apply `20260923160000_withdrawn_out_of_standby.sql` at the merge |

## Next, in order

The plan: `~/.claude/plans/great-work-however-1-dapper-twilight.md`, its top section (Will's message of 2026-09-23).
Done: the four lanes merged (gates 134 to 137), alias build 3 (`a760b998`) red-teamed, milestone 27 (`546e2489`,
tagged, both projects READY, the partyreel.com pass green).

1. **Integrate `upload-owner`** when it hands off; alias build 4 (`[preview]`); red-team its Look at first on ONE
   browser (A uploads to a names-mode event, signs out; B signs in and uploads: B's own row; B signs out; a signed-out
   upload meets the door, never A's or B's name).
2. **Milestone 28, on Will's word** (it changes partyreel.com): `upload-owner` fixes a live misattribution.
3. **Done 2026-09-23 (Will's approval):** the identity contract applied (after-md5s equal the file's bodies, advisors
   15 / 5 / 32 unchanged, the foot's rolled-back check held, nothing persisted, `types.ts` four lines shorter); the
   Stripe TEST walk passed on partyreel.com (Checkout to Pro 100 GB, Change plan to 500 GB, the $10.00 proration).
4. **Next, on Will's note of 2026-09-23:** a guest's own delete is final and says so ("deleted immediately from the
   event and cannot be recovered"; no host surface shows or restores it; the host's Deleted bytes exclude it), and
   the 1,000-row audit (every read PostgREST's `max_rows` could clip: lists, counts, pagination, `.in()` lists,
   filters over a capped read). Both merge before milestone 28, which he approved "once you're fully ready".
5. **The purge cron's first scheduled run on the new code** (04:00 UTC, only production runs crons): read back its
   heartbeat from the jobs console the morning after milestone 27.
6. **The reel round's wiring**, after his desk review of the six reel boards: the plan's reel section (A to G; the
   expand migration first, the drop migration and the R2 sweep of stored reel files after the red-team).

## Waiting on Will

- Milestone 28 is approved ("once you're fully ready"): after `upload-owner`, the delete finality and the 1,000-row audit merge and are red-teamed.
- **His desk review** on the alias (`/design/lab?key=`, the value in `.env.local`): 26 boards, the six reel boards
  first, the harnesses `/design/lab/tools/reel-live` and `/design/lab/tools/reel-video`, and the new `event-safety`.
