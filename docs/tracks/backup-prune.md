---
track: backup-prune
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Each built as recommended; each Will's to overrule. None is a one-way door: the prune still runs dry.

1. **Where does the release stamp live?** Built: an `ops_flags` row, `backup_prune_hold_released`, its `updated_at`
   the stamp (`enabled` carries nothing; no catalog switch reads the key, and `/api/internal/job-run` refuses it as a
   job). No migration, so it works the moment it merges. The other option: a `released_at` column on the prune's own
   switch row (a migration under `20261003213000_` and a typed seam until the types regenerate). Recommended: the row.
2. **The answer's field name?** Built: `releasedAtMs` (epoch ms, beside `startedAtMs`), not `released_at`: the start
   answer is camelCase already. Recommended: as built.
3. **When does the card offer the release?** Built: whenever the prune's last real run (ok or error) reports a
   standing hold: the Worker now puts it on every report while it stands (`held_since`, exact; `held_media`), so a
   paused or aborted run after a hold never hides the button, and the card judges a press exactly as the Worker does
   (after the hold began). The confirm is red without typing: a deleted backup copy is what nothing brings back, and
   there is no wrong hold to pick. Recommended: as built.
4. **How often does a standing hold mail?** Built: once a held run (weekly while it stands; kind `prune_breaker`,
   deduplicated on the run's day), with a Sentry warning (`backup_prune_held`) every held run. Recommended: as built.

## System-doc edits (in place, owned facts only)

- `docs/systems/durability-backups.md` (owned): the hold (its alert; it never releases itself; Release the hold, the
  stamp and its exact comparison; the standing hold on every report), and the HEAD line (a failed HEAD keeps its item,
  the run deletes the rest and closes as an error).
- `docs/systems/admin-observability.md` (a `reads` doc, two sentences of the job-run route's, which this round
  changed): a held prune raises at its source beside the dead letters, and the start answer's one other answer is the
  prune's release stamp.

## Deferred (ROADMAP one-liners, bucket named)

- QA hardening: `src/components/app/storage/storage-list.test.tsx` ("opens on every event's items, largest first")
  failed once under the full suite with the body still scroll-locked from a dialog, and passed alone three times and on
  the re-run: a flake to pin (`_scratch/backup-prune/gate-q20/test-run1-flake.log`).

## Handoff (replaces the chat report)

- **Commits** (pushed to `origin/lp/backup-prune`): `7f5e5ef6` (round two's manifest, after a fast-forward to
  `98fd4780`), `e85e6081` (the work), then this manifest. No sync commit: `launch-prep` has not moved since.
- **Gates on `e85e6081`**, each on its own exit code (logs `../partyreel-wt/_scratch/backup-prune/gate-q20/`):
  typecheck 0, lint 0, test 0 on the second full run (871 files, 10,374 tests; the first exited 1 on the storage-list
  flake above, untouched by this lane), `build-lock` build 0, `lab:smoke --base http://localhost:3132` 0 (138 checks, 0
  failing; no board); the Worker's own: `npm run typecheck` 0, `npm test` 0 (6 files, 93 tests), `npm run dry-run` 0.
- **Red first**: `_scratch/backup-prune/red-q20-worker.log` (9 fail on the merged Worker: the self-release, the stamp,
  the heartbeat's parse) and `red-q20-app.log` (11 fail and 2 files cannot load on `launch-prep`: the start answer,
  the alert, the action, the card, the mail).
- **Probes** (this lane's dev server): `/api/internal/job-run` answers 401 to a forged bearer, 400 to a start that
  names the release key as a job, 400 to a finish with no run; `/admin/jobs` is a 404 off the admin host. The release
  row reads as none on the real table (no row yet). Not driven: the card at AAL2 (the TOTP is Will's), and a held run
  cannot be staged while the prune is dry, so a walk on the alias sees no control, which is production's state.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): owned `workers/backup/` (8 files) and
  `docs/systems/durability-backups.md`, this manifest; `docs/systems/admin-observability.md` under System-doc edits.
  The accepted exceptions: `src/app/admin/jobs/` (`actions.ts` and its test, `job-controls.tsx`, `page.tsx`, and new:
  `prune-hold.ts`, `prune-hold-view.ts` and its test, `prune-hold-control.test.tsx`) and `src/app/api/internal/job-run/`
  (`route.ts`, new `route.test.ts`). One more, which item 2 needs: `src/lib/email/templates.ts` and its test (the
  hold's mail, `pruneHoldEmail`: every mail is one shell there, `composeMail` is not exported, and the test holds each
  operator mail to the tag and its text twin).
- **The items:**
  - A hold never releases itself: `decideHold` lost its six-day release; it goes ahead only on an operator's stamp
    newer than the hold (verdict `released`), so a press before a hold, or before any, never passes a later one.
  - Release the hold, on the backup prune's card (`PruneHoldControl`, `releasePruneHoldAction` behind admin + AAL2):
    a stamp; it starts nothing and changes no switch, the pause stays the brake.
  - The start answer carries `releasedAtMs` for the prune alone (null for none; an unreadable stamp reads as none
    and raises `prune_hold_release_unreadable`, so the hold stands); the Worker's `jobStart` reads it, a stamp that
    is not a time as none.
  - Every Worker report while a hold stands carries `held_since` (exact) and `held_media`; the card offers the
    release from it and says "Hold released ...: the next run deletes what it held" once pressed after the hold.
  - A held run raises `backup_prune_held` (Sentry) and the ops mail (`pruneHoldEmail`) in `/api/internal/job-run`;
    a failed mail never costs the run its row.
  - The held run's note: "Held since <day>: N items gone against a usual U (it holds past T), deleted nothing. It
    waits for Release the hold here; pause the prune if the backlog looks wrong."
- **Assets requested from Will:** none.
- **Board ideas:** none new.
- **Proposed Worker change** (the Orchestrator's, after the merge; no secret, no Vercel env, no migration):
  `cd workers/backup && npm ci && npm run typecheck && npm test && npx wrangler whoami && npx wrangler deploy`. Expect
  the same bindings as `c5ba544c` (`env.PRUNE_STATE (PruneState) Durable Object`, the two buckets, the two queues,
  `PRUNE_MODE` still `dryrun`), no migration to apply (`v1` already did), the triggers `0 5 * * *` and `0 6 * * 1`.
  Either deploy may land first while the prune is dry (a dry run sets no hold, so neither a stamp nor an alert can
  matter yet); both must be live before `PRUNE_MODE=live`.
- **Calls his to overrule:** the four Questions.
- **Look at first:** `workers/backup/src/prune-ledger.ts` (`decideHold`) with its test, then
  `src/app/admin/jobs/prune-hold.ts` and `prune-hold-view.ts`, then `alertOnHold` in
  `src/app/api/internal/job-run/route.ts`.
