---
track: camera-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e094108"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/camera/
  - src/lib/guest/camera/
  - src/lib/disposable/roll
  - src/lib/disposable/shot
  - src/components/app/event-settings/camera-settings
  - supabase/migrations/20261007021000_reshoots.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/host-moments.json
  - docs/reviews/guest-moments.json
  - src/app/(dev)/design/sandbox/host-moments/spec.ts
  - src/app/(dev)/design/sandbox/guest-moments/spec.ts
  - docs/systems/disposable-mode.md
  - docs/systems/database-security.md
---

# lp/camera-wiring

**Goal.** The album camera's roll as Will picked across two boards: a develop time added mid-party says its fresh rolls first, a guest meets her fresh roll once, a flat 3 re-shoots counted where she takes one back, and the reel's newest frame offering Take it back.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3133 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-06):** host-moments r1's tell = line and fresh-roll = panel (`docs/reviews/host-moments.json`); guest-moments r1's limit = three and where = reel (`docs/reviews/guest-moments.json`). Each board draws its picks on production's own camera and Settings (`src/app/(dev)/design/sandbox/host-moments/`, `.../guest-moments/`): those drawings are your spec. The camera and Settings' camera page are yours alone this wave.

- **tell = line (the host):** when Maya adds a develop time to a camera that shows every shot at once, Settings says the consequence before it saves, in the pattern Settings already uses for a change that reaches people: every roll starts again at its size, developing at the time she chose; Start fresh rolls, or keep it as it is. (A develop time mid-party starts a new period: `events.sealed_from`, stamped by `events_reveal_stamp()`, and every count keys on it.)
- **fresh-roll = panel (her guests):** once, the first time a guest opens the camera on a fresh roll, a panel over the finder in the roll-done panel's shape (`camera-panels.tsx`): a fresh roll, why (the host set a develop time), when it develops, and Start shooting. Decide how "the first time" is known (her period against the one she last saw: a device's memory is enough, since a second sight costs nothing) and say it in a Question.
- **limit = three:** a flat 3 re-shoots at any roll size (Will's word since customize r1): a roll of 24 takes at most 27 shots in all. Today `ROLL_RETAKES = 3` means three rolls' worth (72), enforced in SQL by `public.create_media` (`c_roll_retakes`, `v_taken >= roll_size * c_roll_retakes`), advised by `get_upload_context` and `get_upload_gate` (taken and ceiling), said only in Settings' camera line ("up to 72 shots in all", pinned in `camera-settings.test.tsx`) and met unsaid. Now: the server's ceiling is the roll plus 3; the camera counts where she takes one back ("2 re-shoots left"), and the roll's end says when they are spent; Settings' line says it plainly. `roll.ts`'s parity test with the SQL stays the guard.
- **where = reel:** a press on the reel's newest frame opens that shot with Take it back and Keep it (a two-key sheet, since a mis-press there must not delete: the board's carried call BM1); Your shots keeps its X with no question. Will's note: "Both are probably the best option. That way, if they naturally go to remove an image from their uploads, it inherently frees up a slot for them as well": both doors take a shot back, free its frame and spend one of her 3.

**The migration, `supabase/migrations/20261007021000_reshoots.sql`:** start from `public.create_media` (newest in `20261005200000_capture_time.sql`), and `get_upload_context` and `get_upload_gate` where they advise the ceiling (newest in `20261005181000_billing_integrity.sql`)'s newest definition in `supabase/migrations/` (never from memory) and follow `docs/systems/database-security.md`'s Workflow and checklist (grants revoked from public before they are granted exactly; the migration guards; its pre-flight on a throwaway local cluster). Prove it on the live schema inside `begin; ... rollback;` in one `execute_sql` call (that doc's recipe: the proof commented at the file's foot, RED then GREEN), and never apply it: the Orchestrator applies it through the Advisor and the protocol after your handoff, so your Handoff names the file's md5 and every caller. Milestone 38's live build shares this database, so the change must leave that build working (an expand where a signature or behaviour changes; the header names what that build sees meanwhile: PROGRAM's "Before launch there are no real users"). Milestone 38's camera reads the ceiling from the server where it can (`roll-view.ts`), so name what its Settings line says meanwhile.

**Nearby lanes this wave (never edit their paths):** the album and its arrivals, the upload stack and the reel's curtain (album-moments-wiring, which owns `event-experience.tsx`: a line you need there is an exception listed with why in your Handoff), Settings' door page (host-moments-wiring), Create's Disposable card (create-wizard-wiring).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`; a local red-team of every surface you change, antagonistic (the error cases, the cross-tenant and abuse paths, malformed input, a throttled network, reduced motion, Tab with the halo, a screen reader's names), at 375 and 1440, in the room and on paper where both exist; the walks you could not drive listed for the desk. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired.

**The walk for this lane:** a Disposable on your port: a guest's camera shooting, taking one back from the reel and from Your shots, the count, the roll's end at 27 of 24; the host adding a develop time mid-party (the line, both answers), then the guest's fresh-roll panel once and never twice; a refused shot past the ceiling with the server's words.

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
