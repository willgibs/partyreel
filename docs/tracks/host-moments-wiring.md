---
track: host-moments-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e094108"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-settings/door-page
  - src/app/(app)/dashboard/[eventId]/guests/
  - src/components/app/event-blocks/
  - src/lib/events/event-blocks
  - src/lib/db/mutations/event-blocks
  - src/components/app/dashboard/grace-banner
  - src/app/(app)/dashboard/page.tsx
  - src/components/app/storage/
  - supabase/migrations/20261007020000_let_in.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/host-moments.json
  - src/app/(dev)/design/sandbox/host-moments/spec.ts
  - docs/systems/host-app.md
  - docs/systems/billing-caps.md
  - docs/systems/database-security.md
---

# lp/host-moments-wiring

**Goal.** Four of a host's party moments as Will picked at host-moments r1: a password's two groups said at the field, Let in that lets a declined newcomer in where he waits, the over-plan banner's number and one key, and her plan's line drawn on the size list.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3132 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-06; `docs/reviews/host-moments.json` round 1):** password = both, let-back = straight, banner = number, goal = line, decline = block (as built: nothing to do). The board (`src/app/(dev)/design/sandbox/host-moments/`) draws each pick on production's own page (its `scene.tsx` grafts the option's piece in place): that drawing is your spec. Its other two picks (tell, fresh-roll) are camera-wiring's.

- **password = both:** when she picks A password with anyone in or waiting, two lines where she types it, read before she types: the guests in stay in, on every phone ("31 are in and stay in"); the people at the door stop waiting on her and get in with it ("3 at the door"). They replace today's field line and the under-the-gates note (`door-page.tsx`); with no one in or waiting, nothing extra.
- **let-back = straight:** for a declined newcomer the act on the Blocked row is Let in: one press, and the album opens for him where he waits. Today `let_back_in` deletes the block and leaves him `waiting` at a gated door ("They'll be back at the door...", `src/lib/events/event-blocks.ts`). The change is in SQL (below): an expand, so milestone 38's build (which still says "back at the door") keeps its behaviour, while the new build admits. Write a Question with your recommendation for one who was IN when blocked (Ray): straight back in too, his uploads still hidden unless she turns them on ("Let back in never brings anyone's uploads back unless she turns it on" is settled). The Undo on Decline's toast and Blocked's confirm say what will happen in the same words. Will's note on this pick: "The UI design of how we present this (and guest card items in general) could definitely be polished": a guests-room board redraws the rows after you, so build the behaviour cleanly in today's rows and propose nothing more.
- **banner = number:** the dashboard's over-plan banner says the number and the date ("5.3 GB over Pro 100 GB; free it by November 5"), one key "Free 5.3 GB" opening the size list counting down that same number, See plans beside it (`grace-banner.tsx`: `storageUsed - storageCap` and `deadline` are already its props).
- **goal = line:** the size list's goal strip draws what she stores as a bar with her plan's line across it; the part past the line shrinks as she picks, ending "Fits once these go" (`goal-strip.tsx`, `storage-list-rules.ts`'s `count`); the switch goal keeps its words.

**The migration, `supabase/migrations/20261007020000_let_in.sql`:** start from `public.let_back_in` (newest in `20261003220000_deleted_counts.sql`)'s newest definition in `supabase/migrations/` (never from memory) and follow `docs/systems/database-security.md`'s Workflow and checklist (grants revoked from public before they are granted exactly; the migration guards; its pre-flight on a throwaway local cluster). Prove it on the live schema inside `begin; ... rollback;` in one `execute_sql` call (that doc's recipe: the proof commented at the file's foot, RED then GREEN), and never apply it: the Orchestrator applies it through the Advisor and the protocol after your handoff, so your Handoff names the file's md5 and every caller. Milestone 38's live build shares this database, so the change must leave that build working (an expand where a signature or behaviour changes; the header names what that build sees meanwhile: PROGRAM's "Before launch there are no real users"). ★ Lock order: upload-sums' trigger opened one deadlock against a Restore or Let back in, and the storage-sums-signal lane this wave changes `remove_my_upload`'s already-removed arm to take her profiles row first; keep `let_back_in`'s lock order compatible and say so in the Handoff.

**Nearby lanes this wave (never edit their paths):** the hub's cards (event-header-wiring-2), the camera and Settings' How guests add (camera-wiring), `GuestPeek` and `guest-list.tsx` (account-moments-wiring), the storage sums' job (storage-sums-signal).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`; a local red-team of every surface you change, antagonistic (the error cases, the cross-tenant and abuse paths, malformed input, a throttled network, reduced motion, Tab with the halo, a screen reader's names), at 375 and 1440, in the room and on paper where both exist; the walks you could not drive listed for the desk. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, each naming its bucket and area)

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
