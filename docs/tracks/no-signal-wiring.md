---
track: no-signal-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c04da309"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/guest/use-upload-queue.ts
  - src/lib/guest/use-upload-queue.test.tsx
  - src/lib/guest/use-upload-queue.heal.ts
  - src/lib/guest/use-upload-queue.heal.test.tsx
  - src/lib/guest/use-upload-queue.stop.test.tsx
  - src/lib/guest/unsent/
  - src/components/guest/upload/
  - src/components/guest/door/wait-picks-store.ts
  - src/components/guest/door/wait-picks-store.test.ts
  - src/components/guest/guest-upload.tsx
  - src/components/guest/guest-upload.test.tsx
  - src/components/guest/guest-upload.turn-card.test.tsx
  - src/components/guest/upload-step.tsx
  - src/components/guest/upload-step.test.tsx
  - src/components/guest/upload-tracker.tsx
  - src/components/guest/upload-tracker.test.tsx
  - src/components/guest/gallery-rows.tsx
  - src/components/guest/gallery-rows.test.tsx
  - src/lib/guest/camera/shots.ts
  - src/lib/guest/camera/shots.test.ts
  - src/lib/guest/camera/roll-view.ts
  - src/lib/guest/camera/roll-view.test.ts
  - src/lib/guest/camera/reel.ts
  - src/lib/guest/camera/reel.test.ts
  - src/lib/guest/camera/words.ts
  - src/lib/guest/camera/words.test.ts
  - src/lib/guest/camera/own-shots.ts
  - src/lib/guest/camera/own-shots.test.ts
  - src/components/guest/camera/album-camera.tsx
  - src/components/guest/camera/album-camera.test.tsx
  - src/components/guest/camera/album-camera.film.test.tsx
  - src/components/guest/camera/camera-reel.tsx
  - src/components/guest/camera/your-shots.tsx
  - src/components/guest/camera/remove-shot.ts
  - src/components/guest/camera/camera-roll.css
  - src/lib/upload/server-pipeline.ts
  - public/line.txt
  - supabase/migrations/20261008010000_roll_taken.sql
  - src/app/(dev)/design/sandbox/no-signal/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/no-signal.json
  - docs/systems/uploads-and-r2.md
  - docs/systems/guest-flow.md
  - docs/systems/disposable-mode.md
  - src/components/guest/camera/camera-screen.tsx
---

# lp/no-signal-wiring

**Goal.** A party with no signal as Will picked at no-signal r1: her unsent photos carried on her phone until each lands, a dropped line said where the send stands, and a Disposable's frame spent when she takes it.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3133 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-07; `docs/reviews/no-signal.json` round 1; the board's spec holds the platform facts, doc-checked):**
- **`carry=phone`:** a copy of each unsent file waits in this browser for this album (IndexedDB, as the held door keeps her picks: `door/wait-picks-store.ts`), whole, while the phone has room (a file it can't hold waits in the page, as today), and goes when the line is back or at her next open, by itself; the stack's x still stops one before it lands. "Back" is a request that answers, never `navigator.onLine` alone (it says online on venue Wi-Fi with no internet): a tiny static file (`public/line.txt`, no function runs) asked on `online`, on return to the page and every 20 s while one waits. Doc-check Safari's eviction and its seven-day cap before you promise anything in words: a promise says only what the keep holds.
- **`drop=standby`:** the moment the line drops mid-send, the stack keeps her photo, its bar giving way to a half-lit point and "No connection", its promise under it; the stand-in says it too; nothing opens. A file refused for a reason of its own (too large, a type) still ends in the failure sheet's Retry. On an album that waits (her host's yes, a develop), a waiting photo stands in her uploads, half-lit, "Waiting for your connection" (the carried `waits`).
- **`roll=taken`, Will's one-way door, answered:** on a Disposable, every press spends a frame at once, sent or not: the count steps down, the roll ends at 0 with its waiting shots on the reel, half-lit, and all of them land; no shot this phone took is refused for the roll. Keep CC4 (a host's removal spends a guest's shots) and the three re-shoots (camera-wiring's flat 3). Today a failed shot leaves the count (`shots.ts`'s `pendingSince`) and the server refuses shots past the roll on landing: decide what the server needs so a shot taken within the roll always lands (two phones of one guest may still overrun: say what happens then, plainly). Only if the roll's count needs SQL: **The migration, `supabase/migrations/20261008010000_roll_taken.sql`:** start from `create_media`'s newest definition in `supabase/migrations/` (never from memory) and follow `docs/systems/database-security.md`'s Workflow and checklist (grants revoked from public before they are granted exactly; the migration guards; its pre-flight on a throwaway local cluster). Prove it on the live schema inside `begin; ... rollback;` in one `execute_sql` call (that doc's recipe: the proof commented at the file's foot, RED then GREEN), and never apply it: the Orchestrator applies it through the Advisor and the protocol after your handoff, so your Handoff names the file's md5 and every caller. partyreel.com's live build (milestone 39) shares this database, so the change must leave that build working (an expand where a signature or behaviour changes; the header names what that build sees meanwhile: PROGRAM's "Before launch there are no real users").

**The board's carried calls, as taken:** every file kept whole while there is room; the next open sends by itself; the line check as above; no Android background send yet (a service worker for Android alone; iPhones have none); the Add's ring held still at what landed, with its count (its waiting look is the event-page board's, so change only its state, never its look: `shutter.tsx` and the dock are not yours).

**ROADMAP lines you meet (fold each your change reaches; quoted by their opening words):** "Lab exploration: a party with no signal" (now built: say so for its retirement); the two duplicate roll-of-1 lines ("You've taken all 1 shots"); "Clips: a guest's Add to event reads Added"; "Uploads: the same photo sent twice lands twice" (only if it falls out of your keep); "Guests: the held door keeps a choice on the device but never the camera's shots"; "what happened to my photos", after no-signal's carry; Immediate's "Code hygiene: five stale comments" for `server-pipeline.ts:544` alone.

**Keep stable:** the queue's `RunProgress` shape and its "active means queued or uploading" rule (the dock reads it), `use-upload-queue.heal.ts`'s interface (the host's `host-upload.tsx` shares it), and `camera-screen.tsx`'s props (its `recent` type comes from `reel.ts`); your camera states go in a new `camera-roll.css`, never `camera.css`.

**Retire the no-signal board:** delete `src/app/(dev)/design/sandbox/no-signal/` in your branch; the Orchestrator deletes its ledger at your record.

**Lanes running beside you (never edit their paths; a line you need there is an exception in your Handoff, with why):** brand-marks-wiring (`globals.css`, `theme.css`, the marks, `badge.tsx`), create-wizard-wiring-2 (Create, readiness, the checklist, `settings-rows.tsx`, the hub's `page.tsx`, the guest header and name menu), no-signal-wiring (the upload queue, `components/guest/upload/`, the roll's counting files), guests-room-wiring (`dashboard/[eventId]/guests/`, `guest-peek.tsx`), account-moments-wiring-2 (FollowButton, RelationToggle, Connections, `/me`, `u/[slug]/`), crumbs-91 (the album's order, the guest page, `event-experience.tsx`, `as-guest*`, Immediate's lines), and the boards event-page-r1 and brand-marks-r2 (their folders).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

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
- Calls for Will: only a decision built in that he cannot see by using the product (plans, billing and renewals; lifecycle and timing; deletion, retention and privacy; safety and moderation; what the product does on its own), one line each, or none. A design, wording or flow choice is never one: production and the lab show it
- Look at first: ...
