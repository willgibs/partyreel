---
track: lab-focus
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "bfbec3da"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/lab/
  - src/app/(dev)/design/(shell)/lab/[board]/
  - src/app/(dev)/design/(shell)/lab/kit/
  - scripts/lab-demo.mjs
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/PROGRAM.md
  - docs/systems/design-system.md
---

# lp/lab-focus

**Goal.** The lab's question view rebuilt pictures first: where the question lives in one line, the question, the options with their knobs, and the stage whole on the first screen at a desk and a phone; everything else a board knows one click away in one place.

## The brief

**Will, 2026-09-29, on build 26's door family step at a desk:** opening a question, he is excited to see the drawn options (at least one is almost always an improvement on what ships), but before he can pick or leave a note he meets "an absolutely overwhelming smorgasbord of UI", "a Jackson Pollock painting of text". His screenshots (1440 wide) show why. Above the frames sit, in order:
- the board's About panel (Already settled, What you picked and said before, The words here);
- a breadcrumb, a context sentence, a two-line question and a description, then a second The words here;
- a right-hand column (It decides, Why it matters, The board says);
- the option's name, four knob groups and two layout buttons;
- the option's sentence with its Gains and Costs, then a stage caption;
- per frame, a title and a Measured line.

The frames start below the fold, and the dock cuts them.

This is the other half of his earlier note (2026-09-29: never dropped in the middle of nowhere, which gave asks their `where`, `when` and `matters`). The context layer grew block by block into a wall. Both notes hold: he can always place a question, and the pictures are what he sees.

**Build the view pictures first**, for every step kind (an ask, a gallery, items) on every standing board, at 1440x900 and at 375:
- **Always visible, compact:**
  - where the question lives, its breadcrumb and `when` together in one line;
  - the question, sized to read, not to shout;
  - the options as the tabs he picks between;
  - the knobs as one quiet row on the stage;
  - the stage whole: every frame of the shown option in the first screen above the dock, scaled to fit, with no scroll to reach it;
  - the shown option's sentence, gain and cost in a line, where it reads with its picture.
- **One click away, in one place:**
  - the board's opening (what it is about, what is settled, what he picked and said before);
  - its terms (also as a light hint on a term where it appears);
  - what the question decides and why it matters;
  - the recommendation's reason, if it does not sit beside its tab.
  - Whatever he opens stays open for him, as a per-viewer convenience.
- **Out of his view:** what a lane measures to prove a frame (the "Measured: 26 words..." lines). Keep them wherever `lab:demo` and the lanes read them.

Draw the layout from the brand kit and the Library's own pieces. Its measure is his minute: read the question, see every option whole, pick, note, next.

**Render, don't reshape.** Every board's spec stays as written, so its fields move, fold or hide, but none is removed or renamed. A board lane (`privacy-hero-r4`) is drawing under today's schema right now, and `registry.test.ts`'s required fields may stay required.

**Hold it with a gate.** `lab:demo` measures, on every standing board at 1440x900 and at 375 (the reach lines three lanes filed, ROADMAP's phone-fold line), where each step's stage starts and whether the shown option's frames fit above the dock. Make that a failing check, so no future field grows the wall back.

**Verify:**
- before and after screenshots of each standing board's first open step at 1440x900 and at 375 in your scratch folder: locked-door, disposable-mode, event-ready, demo-framing, about-press, privacy-hero;
- the gate;
- `pnpm lab:demo --all`.

**Docs:**
- PROGRAM.md's "Context comes before the options" paragraph and its context-layer bullet say how a question reads now, as guidance with its reason. They are mine, so give their new words in your Handoff.
- The kit's page (`/design/lab/kit`) is yours.
- ROADMAP's phone-fold line retires with this: name it.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception. Never a board's folder.

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
