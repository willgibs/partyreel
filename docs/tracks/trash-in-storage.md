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

Each is built as recommended and listed under "Calls his to overrule".

- **Q1. The setting's default: ON** (the brief's lean, kept). A full Deleted must never refuse a guest's photo at a
  party, and the switch says what it does: "Make room from Deleted: when an upload needs room, the oldest items in
  Deleted are deleted for good first." `profiles.make_room_from_deleted`, default true, hers to write.
- **Q2. Where room is made: at the complete, never the presign.** The complete holds the host's profiles lock and
  judges the R2 HEAD's real size; a presign's size is the client's word, so a phantom presign (never sent) would
  otherwise empty a host's Deleted for nothing. The presign's meter refuses only what no eviction could fit (its line
  is active bytes with the setting on, everything stored with it off), so a guest is never sent to upload a file the
  complete will refuse. The guest presign's advisories (`get_upload_context`, `get_upload_gate`, the host's
  `get_host_upload_context`) read the same line, so Require an upload to view still fails open at a truly full album.
- **Q3. What leaves first:** items, oldest first by when each entered Deleted (a deleted event's photos at the event's
  deletion, largest first among them so the fewest go), never more than the upload needs; an event the eviction empties
  leaves Deleted with its last item. Held or reported items leave her count like any permanent delete, their bytes
  waiting on the keeper (`purge_asked_at`, as `purge_media_now` already does).
- **Q4. The over-cap grace (the brief's item 6): it reads what she keeps by choice,** everything stored but the
  system's own removals waiting in Deleted. At the deadline, what she already deleted leaves for good first (oldest
  first, whatever her setting: nothing she kept is touched while her own Deleted can cover it), then her largest files
  move to Deleted as today, recoverable for 30 days. Those count like anything in Deleted, so until they purge her
  uploads are refused (or, with the setting on, take room from them, oldest first); restoring one comes back only while
  it fits beside what she keeps (today's gate, kept for system removals alone), so a restore-and-reduce cycle cannot
  keep an over-cap account over for good. Her own deletions always restore. The grace mails say "free up space" for
  "remove some media", and the reduce mail says what left Deleted.
- **Q5. A guest's own withdrawal purges that night, every album** (the brief's sentence; today only a camera shot's
  does, and the rest waited 30 days counted nowhere: storage nobody's plan pays for). A hold or an open report still
  keeps it, as it keeps any row.
- **Q6. The size list frees room with Delete for good.** Remove to Deleted frees nothing now, so the list's act on a
  selection is Delete for good (behind a confirm: there is no Undo), Deleted heads the list with Empty Deleted, and the
  goal strip counts what those free; Download stays.
- **Q7. Restore always fits** for her own deletions (already counted); an item or event past its 30 days is no longer
  restorable even before the night's purge takes it, so what she can restore is exactly what she is counted for.
- **Q8. Empty Deleted lives beside the chart** (account-wide, behind a confirm), marking every item to leave for good
  at once (its bytes stop counting; R2 follows in the night's purge, as the eviction does). A Delete forever on a
  deleted event's own card is Deferred.
- **Q9. Milestone 34 between the apply and the next milestone:** an expand (see the migration's head): it keeps
  `standby_hosts` and `host_storage_summary`'s two columns, so its meter, guard and nightly sweeps keep working; what it
  meets is the new cap on uploads (Deleted counts; with the setting on, the oldest of Deleted makes room), restore
  without a gate, and a guest withdrawal purging that night.

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

## Where I am

- Booted at `e9b006e4`; the plan is the Questions above.
- The migration `supabase/migrations/20261003220000_deleted_counts.sql` is written and proved on the live schema,
  rolled back: RED 13/15 failing on what each lacks, GREEN 15/15 (its foot). Next: the lifecycle and storage code
  (the summary's figures, the over-capacity grace, the standby sweep retired), the chart and its setting, the size
  list, the routes, the docs.
