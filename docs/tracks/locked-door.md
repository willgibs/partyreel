---
track: locked-door
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "69afdbc5"            # the launch-prep SHA the branch was cut from
board: locked-door
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/locked-door/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/design-system.md
---

# lp/locked-door

**Goal.** Draw a new board, `locked-door` r1: the one lock screen a guest meets when she can't get in (the host made the album private, the album is closed to newcomers, or she was blocked, which must look identical), polished because it is high-traffic, with a line for previous guests asked as a question.

## The brief

**His words** (event-safety r1, `git show 69afdbc5:docs/reviews/event-safety.json`):
- On `door=private`: "Nice use reusing an existing lock screen to lock out blocked users, without the 'blocked' experience feeling distinct so guests won't be able to immediately discern they were blocked. Sneaky block, I like it."
- On `newcomer=same`: "when a host closes an album, there are no cases where that closure should be differentiated by new guests that can't access beyond 'Closed'? Maybe a private version so previous guests of an event can see the host made it private versus a closed album (gated access) ... Feel like the design could be polished though, if this'll be a high-traffic screen."

**The screen today:** the private branch of the guest album page, `src/app/(guest)/e/[token]/page.tsx` ("This event is private" / "The host has this event set to private. Check back later, or ask them to make it public."). `safety-wiring` is sending a blocked person to it now, and the join modes (`event-settings`) will send a newcomer to it when an album is closed.

**The questions:**
1. **The screen itself, polished.** The widest good set, in the door's family (the lit look: `DoorLamp`, `DoorHeading`, the lamp from the album's own previews when it may show any; production's door parts under `src/components/guest/door/`). Each option must stay truthful for all three causes at once, so a block is never distinguishable: words, a way on (the host's name, a way back later, nothing), what of the event it shows (its name, its cover, nothing). Graded against today's screen.
2. **A previous guest's line** (his "maybe a private version"). Should someone who was already in see that the host made it private, while a newcomer sees it closed? The trap to draw honestly: a blocked previous guest must read exactly what every other previous guest reads when the host makes it private. So a line that tells previous guests apart can only speak of the album's state, never of her. Draw options that keep that true, including "one screen for everyone".

**Frames:** 375 first (a guest off a code), and 1440; light and dark; reduced motion.

**Registration:** register directly after `emails` in `registry.ts`, `boards.ts` and `touchpoints.ts` (named exceptions). Author with `defineExploration`; ask nothing another standing board asks (`node usher/kit/board-card.mjs --desk`).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

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
