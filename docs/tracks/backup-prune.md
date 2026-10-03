---
track: backup-prune
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "ada60bba"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - workers/backup/
  - src/lib/lifecycle/sweeps/orphans
  - docs/systems/durability-backups.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/PRICING.md
  - docs/systems/lifecycle-recovery.md
  - docs/systems/admin-observability.md
  - docs/systems/uploads-and-r2.md
---

# lp/backup-prune

**Goal.** The backup keeps up with deletions: the prune walks the backup with a cursor and caps sized to what hosts delete, so the backup holds the live set and its recent window, never every byte ever uploaded; and the orphan sweep reaches past its first 20,000 keys. Still dry-run until the launch switch.

## The brief

**Why.** Will's pricing rethink (2026-10-03): "Ideally, no pro user can ever exceed our costs to support them." PRICING.md's "What it costs us" (cost-atlas, merged at `ec3ee1ae`) proves that promise per plan, but only under its preconditions ("The levers", "The preconditions"): rule 2 holds only once they ship, whichever ladder Will picks, so they are launch blockers. Read that section first, and the Advisor's Q16 review in its record (the pickup's cost-atlas row).

**What breaks today** (PRICING.md, "The backup" and "An upload never completed", at file:line):
- The backup copies every object a PUT creates into Infrequent Access under a 35-day lock, and is accrue-only. The prune runs dry (`workers/backup/wrangler.jsonc:55`) and, even live, deletes at most 500 media a week after scanning 5,000 objects from the head of the listing (`prune-strategy.ts:20,27`), so a deleted byte stays backed up for good. A 100 GB plan re-filled 3× a month carries ≈$50 a month of backup a year in.
- The orphan sweep reclaims abandoned uploads at most 20 pages a night from the head of the listing (`lifecycle/sweeps/orphans.ts:11-13,44`), so past the first 20,000 keys never.

**Build:**
1. **A prune that keeps up.** A durable cursor through the backup's listing (resuming where the last run stopped, never rescanning from the head) and caps sized to the deletions (a run's budget follows its backlog, inside the Worker's own limits).
   - It deletes only what the primary no longer holds past the 35-day lock and the recovery window: every safety rule in `durability-backups.md` holds.
   - It fails CLOSED: a doubt deletes nothing.
   - It stays dry-run until the launch switch (`PRUNE_MODE=live` is the Orchestrator's, on Will's yes).
   - Its job card reads its backlog (`stopped_early` with a counted `remaining`, admin-observability.md).
2. **The orphan sweep's cursor,** the same way, so an abandoned upload past the first 20,000 keys is reclaimed.
3. **Dry-run evidence:** run the new prune against the real backup in dry-run and log what it would delete, against an independent count from a listing you read.
4. **Facts in `durability-backups.md`,** in place.

No migration unless the cursor needs a home the job tables lack; if so, write it for the Orchestrator (the Advisor reads it, then it is applied by protocol) under `supabase/migrations/20261003210000_`. The Worker deploy is the Orchestrator's after the merge: write the exact `wrangler deploy` and the version to expect in your Handoff.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree, each step on its own exit code (the Worker's own tests included); red first for the cursor's resume, the caps, every safety rule and the fail-closed doubt; the dry-run log against a real listing; no live delete ever.

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
