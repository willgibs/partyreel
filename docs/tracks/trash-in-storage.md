---
track: trash-in-storage
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "4c25f9af"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/lifecycle/
  - src/components/app/storage/
  - src/lib/db/queries/storage
  - src/app/(app)/dashboard/storage-actions
  - src/app/api/stripe/change-plan/
  - supabase/migrations/20261003220000_
  - docs/systems/billing-caps.md
  - docs/systems/lifecycle-recovery.md
  - docs/PRD.md
  - docs/PRICING.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/host-app.md
  - docs/systems/admin-observability.md
  - src/lib/constants/tiers.ts
---

# lp/trash-in-storage

**Goal.** Deleted counts in storage (Will, 2026-10-03): a plan's cap holds everything a host keeps, her albums and her Deleted together, so deleting no longer frees room until an item leaves Deleted for good (by her, by the 30-day purge, or, with her account setting on, the oldest first when a new upload needs room). The storage chart shows used and deleted apart; the standby budget and every guard it needed retire.

## The brief

**Will's words (2026-10-03), in full:** "Let's include trash in storage. I know that's a huge change in our structure, but a much more elegant way to handle everything. One of those simpler solutions that prevents more edge cases to deal with, like the deletion timer. Storage visual chart can show used vs delete separately, and maybe an account setting toggle to auto-delete trash if needed by FIFO if active space needs more storage, else 30 day permanent delete from trash. think that's a very clear mental model for users, and they only ones who would be frustrated by not being able to use more that your full active storage space would be those looking to abuse anyway. if you'd rather not have to delete permanently from your trash to free space, upgrade your plan. seems like a Rising Tides miss up until now. Also prevents us from paying for any overage beyond backup cost at full 1:1 (i think), which is awesome."

**Why.** Today (PRD "Data retention and lifecycle"): a host's delete frees her room at once, and her Deleted bin holds up to one more storage cap, oldest evicted first (the standby budget, `lifecycle/sweeps/standby-budget.ts`). That doubled what a plan can store, and needed a re-delete guard to stop a restore-and-delete cycle hoarding (PRICING.md's preconditions). Will's model replaces both: one number, everything kept, under the cap.

**Build:**
1. **The cap counts Deleted.** Everything a host's account stores, active and in Deleted, is what her plan's cap holds. Name it once in SQL as the one read every cap check uses: `create_media*`'s refusal at the cap plus its 10%, the presign's `meter_upload` room check, a plan change's "you're storing" check (`/api/stripe/change-plan`), and the over-capacity grace. A guest's own withdrawal still purges that night (it never sits in her Deleted).
2. **Deleting frees nothing until an item leaves Deleted for good:** her own "delete forever" (and an "Empty Deleted"), the 30-day purge, or the account setting below. Restore always fits, since it is already counted.
3. **The account setting**, in Will's words "auto-delete trash if needed by FIFO if active space needs more storage": when a new upload needs room and the setting is on, the oldest items in Deleted leave for good first, as many as it takes. Otherwise the upload is refused with the room it needs and what is in Deleted. It works for the host's own uploads and her guests' alike, at the moment the room is needed (presign or complete: your design), and the bytes stop counting at once even while R2's deletes follow through the existing purge.
   - **Question, with your recommendation:** its default. My lean is on, because a full Deleted must never refuse a guest's photo at a party (PRICING's own rule: blocking a real event by mistake is the failure worth engineering against), and the setting says plainly what it does.
4. **The storage chart** (`src/components/app/storage/`): used and deleted shown apart against the cap, with words a host reads at a glance, and the setting beside it.
5. **Retire what the old model needed:** the standby budget's eviction (its sweep and its job, the job catalog's entry retired the way a job retires), the re-delete first-date idea (PRICING's precondition list), and every line that said "its room frees at once". The 30-day purge stays.
6. **System removals** (over-capacity, Free's inactivity) land in Deleted as today and count like any other. Say what that means for an over-cap account's grace, as a Question with your recommendation.
7. **The docs, in place:**
   - PRD's retention section;
   - `billing-caps.md`;
   - `lifecycle-recovery.md`;
   - PRICING.md's Model, its Deleted lines and the preconditions (the worst month drops the bin's doubling).
   - The help articles that promise "its room frees at once" are listed in your Handoff for a follow-up lane, never edited here.

One migration under your reserved prefix, written for the Orchestrator: the Advisor reads it, then it is applied by protocol. `create_media*` change, so restate their holders exactly, and include a rolled-back check, red then green, at its foot. Nothing live holds real data (Stripe is in TEST, zero real users), but partyreel.com shares the database: say what milestone 34 sees between the apply and the next milestone, or make it an expand.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree, each step on its own exit code; `pnpm lab:smoke --base http://localhost:3131`; red first for the cap counting Deleted, a delete freeing nothing, restore always fitting, the setting on and off (her upload and a guest's), the over-cap path and the retired eviction; the migration's rolled-back check red then green; captures of the storage chart at 375 and 1440 (empty, half used with some deleted, full with the setting on and off).

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
