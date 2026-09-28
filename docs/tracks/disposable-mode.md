---
track: disposable-mode
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "69afdbc5"            # the launch-prep SHA the branch was cut from
board: disposable-mode
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/disposable-mode/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/billing-caps.md
  - docs/PRD.md
---

# lp/disposable-mode

**Goal.** Draw a new board, `disposable-mode` r1: a disposable-camera way of running an event inside Partyreel (guests shoot in-app only, a shot limit, photos that develop later), so Partyreel covers POV's whole audience without being built around it.

## The brief

**His words** (export-flow's `means`, `git show 69afdbc5:docs/reviews/export-flow.json`):
- "some of our main competitors are built around a 'disposables' idea (check out https://pov.camera/), and if we simply restricted both a guest's ability to add with only taking live photos in-app (no library uploads) plus an upload count limit, that's effectively a disposables mode we could market as well, but simply within our product rather than being built around it. Swallow all of https://pov.camera/ future potential users."
- "Remember, we're building a platform that is meant to feel limitless but effortless, so hosts shouldn't have to feel they're having to study docs or fight UI to set up an event how they'd like."

**What POV does** (research it yourself too): a host sets shots per guest, a reveal time, a guest count and a style. Guests join by QR with no app (an App Clip or the web) and shoot with an in-app camera (filters, a timestamp). Photos stay hidden until the reveal. It is free under about 10 guests, and sells photobooks.

**The Orchestrator's first ideas, to weigh against the best you find:**
- **One choice at creation**, "How do guests add photos? Anything / Disposable camera". Disposable sets defaults (24 shots each, developing at 9 am the next day), each changeable later.
- **The guest's camera:** the album's own web camera, no app, like the door. A big shutter, "18 shots left", no retakes, no library, an optional film look (grain, a date stamp).
- **The reveal:** shots develop at the host's time, or on the host's Develop. Until then guests see "142 shots developing", and the reveal opens with the live reel.
- **Where Partyreel wins:** the live reel and wall, the album link after, curation.

**Be honest about the limits in the drawings:** camera-only is a rule of the page (the file picker offers only the camera); the server can enforce the shot count per guest; a photo's capture time can flag an old library shot, but nothing proves a shot was taken live.

**Weigh the pricing:** Will's new Free is 100 MB (about 30 photos at iPhone defaults; `pricing-wiring` is building it), and a 24-shot, 10-guest disposable event is about 700 MB. So where the mode sits between Free, Event Pass and Pro is a real question (POV's lever is guest count).

**Shape, a few decisions, each drawn whole on the real surfaces:**
- how a host picks it (the create wizard, `src/components/app/create-event-wizard.tsx`, and settings);
- the guest's camera, at 375;
- the reveal;
- the shot count and its price lever.

Stage later questions behind earlier ones where one depends on another.

**Registration:** register directly after `contact-page` in `registry.ts`, `boards.ts` and `touchpoints.ts` (named exceptions). Author with `defineExploration`; ask nothing another standing board asks.

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
