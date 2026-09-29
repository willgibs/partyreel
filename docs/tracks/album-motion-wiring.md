---
track: album-motion-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e2557874"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/album-stream/
  - src/components/marketing/sections/features/album/arrivals-hero.tsx
  - src/components/marketing/sections/features/album/live-album-stage.tsx
  - src/components/marketing/sections/features/album/live-album.css
  - src/app/(dev)/design/sandbox/album-motion/
  - docs/systems/marketing-content.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/album-motion.json
  - docs/systems/design-system.md
---

# lp/album-motion-wiring

**Goal.** Wire album-motion r1: the album page's hero keeps its two symmetrical streams, each photograph drawn in and dissolving at the album's edge and then pushed into the album from the left as a real upload arrives.

## The brief

**His r1 answer** (`docs/reviews/album-motion.json`, 2026-09-29): `fall=push`, with his note: keep the stream coming in from both sides so the hero stays symmetrical and balanced; new items still push in from the left, the album's entry point; both streams are drawn in and dissolved, and then their item is pushed in as an upload. His note overrules the board's carried `side` call (the head's side only): photographs fall from both sides of the words, each drawn in and dissolving at the album's edge, and each one's photograph then arrives in the album the way a real upload has since milestone 29 (its row opens from the left edge, clipped and never scaled, its neighbours gliding aside, only a glow fading). The carried `rows` call stands: the stage's album is the guest album's rows, laid plain.

**Where:** `/features/album`'s hero (`arrivals-hero.tsx` over `live-album-stage.tsx`), its stream from `src/components/shared/album-stream/` (`stream-engine.ts` already holds the push recipe and its arrival hook). The board drew the push in its own `push-engine.ts` and `push-stream.tsx`: lift what serves, never import from the board. Find every other user of the stream engine first (the Library's gallery demos draw it): each one's motion stays exactly as it is unless the pick is about it, and you say how you checked.

**The motion rule** (`docs/systems/marketing-content.md`): calm and fluid, never still long enough to miss a step, the home hero's pace kept; reduced motion gets a still, whole frame.

**Retire the board in-lane** once the pick is built: `src/app/(dev)/design/sandbox/album-motion/` is yours (`git rm -r` in a commit of its own); its ledger stays for the Orchestrator's record.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

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
