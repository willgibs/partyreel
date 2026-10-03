---
track: backup-prune
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "98fd4780"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - workers/backup/
  - docs/systems/durability-backups.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/admin-observability.md
  - docs/systems/lifecycle-recovery.md
  - docs/PRICING.md
---

# lp/backup-prune (round two: the live switch's preconditions)

**Goal.** The Advisor's Q20 on the merged prune (`17e5faba`, deployed dry as `c5ba544c`): two changes that must land
before `PRUNE_MODE=live`. A hold never releases itself: it stays until an operator presses Release the hold on the
`backup_prune` card, a one-shot stamp the job heartbeat's start answer carries beside `paused`, honoured by the Worker
only when newer than the hold. And a tripped hold raises a Sentry warning and the ops mail where the Worker reports it
(`/api/internal/job-run`), as the dead letters do. Plus the doc's one overstatement (a failed HEAD keeps its item; the
run still deletes the rest).

## The brief

The Orchestrator's relay of Q20 (2026-10-03): drop `decideHold`'s `release` verdict (`nextHold` keeps a hold); an
`/admin/jobs` control "Release the hold", a stamp the start answer carries (`{ ok, paused, runId, startedAtMs }`
today); the Worker hands it to `decideHold`, honoured only when newer than `hold.sinceMs`; the pause switch stays the
brake, the release is the positive act (Will's rule: every operator fix is an `/admin` control); dry runs never set a
hold. The alert: a Sentry warning and the ops mail when the Worker reports `breaker_tripped` on `backup_prune`.
Accepted exceptions outside `owns`: `src/app/admin/jobs/` and `src/app/api/internal/job-run/`. A migration only if the
stamp needs a home the job tables lack, under `supabase/migrations/20261003213000_`. Red first for each; the gate on
the synced tree; the exact redeploy line in the Handoff.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- pending
