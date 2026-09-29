---
track: locked-door
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "18491027"            # the launch-prep SHA the branch was cut from
board: locked-door
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/locked-door/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/locked-door.json
  - docs/reviews/event-settings.json
  - src/components/guest/
  - docs/systems/guest-flow.md
  - docs/systems/design-system.md
---

# lp/locked-door

**Goal.** Draw `locked-door` r2, widened into the door family: the welcome that opens, the waiting door while the host decides, the one shut door for every newcomer turned away, and the previous guest's line, designed together as one family, shared or bespoke per screen.

## The brief

**His r1 answers** (`docs/reviews/locked-door.json`, 2026-09-29):
- `lock=host`, not a direct selection: "I'd like to see more polished/creative explorations off of this and option 2 (today's lit), as well as maybe one fresh one. Today's closed screen falls short, but I'm still not in love with our door design either. Curious if we can unlock something perfect for everything, whether shared or bespoke to each screen."
- `previous=private`: "if I knew I was previously a guest at an event and hit a screen that felt like I was blocked as a newcomer, I'd get frustrated and try to find the \"right\" way in. Differentiating these lets me know that it was changed to private." Settled: `settings-wiring` builds this line now on today's screen; draw it inside every option, never ask it again.
- From `event-settings` r1, `waiting=held` ("The lit door waits, and opens itself"): "This could definitely be redesigned to be a more engaging waiting experience."

**This round widens the board into the door family.** "Our door design" is the door every guest meets (`src/components/guest/door/`: the lit door, the welcome's hero, the lamp; the chooser, the name and email steps). Draw every state of it as one family, so the door is judged whole rather than one screen at a time:
- the welcome that opens (a Public album, or a gate's first step);
- the waiting door while the host decides (approve newcomers), which opens itself the moment she is let in;
- the shut door, one screen for every newcomer turned away: an Only me album, a closed door, a decline, an address not on the invite list, a block (event-safety's `newcomer=same`: none may be told apart, so the words stay true of all five);
- the previous guest's line on the shut door, shown only to someone who was in (her cookie or account), which a blocked former guest reads too.

**The vocabulary is `settings-wiring`'s, built beside you:** what the link opens is Public, Private (a gate: a password, the host lets each person in, an invite list, or only people already in) or Only me; a gate stops newcomers, and only Only me and a block shut out someone already in.

**The questions** (the widest good set each, every option on the real surfaces at 1440 and 375, graded against today's):
1. The family's direction: the host's door (r1's option 4, the welcome's hero closed with the album's name and the host's face) pushed further, today's lit column (r1's option 2) pushed further, and one fresh direction, each drawn across all four states.
2. Whether the states share one design or each gets its own, drawn both ways.
3. The waiting door as a wait worth holding (his note), inside the family.
4. Whether the 404 (today's lock shares the not-found family, `src/components/shared/not-found-screen.tsx`) follows the shut door or keeps its own.

**Ask nothing `disposable-mode` r2 asks:** its waiting room is the camera's, inside the album after the door; a sibling in mood, not in job. The board's `touchpoints.ts` rows are yours (nothing else in that file); the round bumps in place, r1's ledger stays, and r2's asks replace r1's in `asks`. `node usher/kit/board-card.mjs --desk` lists every open ask.

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
