---
track: door-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "a5c42530"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/door/
  - src/components/guest/door.css
  - src/components/guest/entry-modal
  - src/components/guest/entry-shell
  - src/components/guest/entry-step-transition
  - src/components/guest/password-gate
  - src/components/guest/door-settles.test.tsx
  - src/components/guest/event-experience.tsx
  - src/lib/guest/use-upload-queue
  - src/app/(guest)/e/[token]/
  - src/components/marketing/help/step-screens/door-screens.tsx
  - docs/systems/guest-flow.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/locked-door.json
  - src/app/(dev)/design/sandbox/locked-door/
  - src/lib/events/visibility-labels.ts
  - src/lib/event/door/words.ts
  - docs/systems/database-security.md
  - supabase/migrations/20261001233000_guest_event_cap.sql
  - src/app/not-found.lazy.tsx
  - src/components/shared/not-found-screen.tsx
---

# lp/door-wiring

**Goal.** Wire Will's locked-door picks into production: the doorway family as one shared design whose words and light change by state, a cleaner photo chooser on the waiting door, and the shut door, empty, for a broken link; round 2's door swing as the working reveal; the album read's redaction held.

## The brief

**Why.** Will answered `locked-door` r2 on 2026-10-02 (`docs/reviews/locked-door.json`). Every pick was the board's recommendation:
- `family=doorway`: "A drawn door whose leaf is the state (open, ajar, shut)."
- `shape=shared`: one design for every door state; only the words and the light change.
- `wait=pick`: while she waits at a held door she can choose photos; the queue sends them the moment she's let in.
- `lost=follows`: a broken guest link meets the shut door, empty.

His notes, verbatim:
- on `family`: "This is absolutely gorgeous, big win for our design assets and really sets a good new standard on experiential design. Two additional notes. First, the album behind the door opening doesn't feel very polished, kind of makes the door hard to see. I love the door (and light leak in the other versions), just want to nail this state too. Second, even the wait/shut states should have some sort of minimal, calmer, looped animation to keep the page a little interesting. Maybe a slight glow to the light or something?"
- on `wait`: "The \"while you wait\" upload UI should definitely be designed cleaner within this, but adds a lot of value to the waiting door."

His two `family` notes (the album behind the opening, the idle loops) are a round-3 board cut from the production you leave. Ship round 2's door swing as the working reveal, and build no idle loop. His `wait` note is yours: design the chooser clean.

**What to build.** Port the board's doorway into `src/components/guest/door/`: `sandbox/locked-door/doorway.tsx`, the `furniture.tsx` pieces it uses, and `locked-door.css`, plus whatever they import. Read the board's frames as the target at 1440 and 375, with reduced motion. One shared design across every door state:
- the welcome or ask;
- waiting (`waiting-step.tsx`), with the chooser;
- shut (`shut-door.tsx`);
- the broken link (`e/[token]/not-found.screen.tsx`).

The words stay production's, from `lib/event/door/words.ts` and `visibility-labels.ts`, which you read and do not edit tonight.

**Rules and boundaries:**
- ★ **Privacy, Will's answer of 2026-10-02.** The door shows only what `get_event_by_qr_token` already gives: a gated door names the album and never the host; private, Only me and blocked doors name nothing (the sneaky block reads as private). No RPC change. The board's carried call `shows` (the doorway naming the host) is overruled. Test the redaction on each kind of door.
- **States the board never drew:** production's "Ask to join" step, and the welcome at an approve-each or invite door. Draw them in the shared grammar.
- **The chooser:** the queue (`use-upload-queue.ts`, `takeJoin` and the `doorOpen` effect) already holds her files and sends them on the soft refresh that lets her in. They live only in the open tab: the door says so, quietly. IndexedDB is a Deferred line.
- **The 404:** it stays behind `src/app/not-found.lazy.tsx` (`not-found.test.ts` enforces it). `shared/not-found-screen.tsx` stays for every other 404.
- `door/lit.tsx` and `lit.css` stay: other screens use them. Keep exporting `DoorLamp` and `DoorPool`, which the demo hero imports.
- `entry-modal.tsx` is 1,418 lines; export what you need from it. The help center's `door-screens.tsx` draws copies of the door: redraw them as the doorway.
- Don't edit the board folder: round 3 reworks it from your production.

**Record.** In `guest-flow.md`, the door family as built. ROADMAP lines go in your Deferred section (the chooser's storage, anything else).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3131`; `pnpm lab:demo --board locked-door --base http://localhost:3131` (the board still renders over your production); every door state read in a headless Chrome of your own at 1440 and 375 with reduced motion, signed out on localhost (sign-in and upload cannot run there: name those steps for build 40's red-team in your Handoff); the redaction's cases by test.

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
