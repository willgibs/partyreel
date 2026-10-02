---
track: lab-sitting
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "bcea213e"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/(shell)/lab/_desk/
  - src/components/lab/frame.tsx
  - src/components/lab/dock.tsx
  - src/components/lab/board-state.tsx
  - src/components/lab/board-page.tsx
  - src/components/lab/step.tsx
  - src/app/(dev)/design/(shell)/_shell/copy.tsx
  - src/app/(dev)/design/design.css
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/PROGRAM.md
  - docs/systems/design-system.md
---

# lp/lab-sitting

**Goal.** A faster, truer sitting: the queue pictures first with every option in a phone's row, a copied link that carries a board's own state, a note for the whole program, answered asks reachable by link, a select for long controls, a frame that is its own world (links, radix layers, lazy images, the theme), the shell's restyle scoped, and the dock's dead exports gone; no board's asks or words moved.

## The brief

Will's sittings at the desk (`/design/lab`) are the program's scarcest hour: every second they save, and every board that draws production truer, compounds across rounds. Eight lines from the ROADMAP's "The lab and the kit" bear on that; each is its line there (find it by the words quoted), fixed at its root with a test that fails on today's code where a test can hold it:

- **The queue, pictures first:** "the desk (`/design/lab`) pictures first too, each open step's stage as a thumbnail in the queue, so a sitting's options are seen before any is opened; and at a phone, number-only tabs beside the shown one's name, so a four-option ask shows every option in one row (today the row scrolls, its cut edge faded)".
- **A copied link carries the board's own state:** "`CopyLink` builds from the six lab params, so a board's own switches (`?welcome=gate&was=dom`) never ride the copied link, against `board-state.tsx`'s \"the URL is the share format\"".
- **A note for the whole program:** "the desk's end-of-walk message has no place for a note about the whole program (it reaches the Orchestrator only through chat); a \"for the whole program\" note composing `note: \"...\"` would give the transcript's bare note a producer (`_desk/review-message.ts`, `review-session.tsx`)". `pnpm lab:review` already reads a bare note; prove the round trip.
- **An answered ask stays reachable:** "a fully answered ask is unreachable by `?session=<board>.<ask>` even by a direct link (`_desk/queue.ts`'s `boardWork` walks only asks with no ledger answer), against `lab-demo.mjs`'s claim that an answered step stays measurable".
- **A long control:** "the dock draws every control as a pill row; above about eight options a select gives the dock back a screen (`ControlKnobs`, `board-state.tsx`)".
- **A frame of its own:** "a portalled frame is not its own world: a production `<Link>` pressed in it navigates the lab (boards carry `stopLinks` or `Inert`), radix layers portal to the lab's document, and a `loading=\"lazy\"` image never loads; `Frame` swallowing links and handing radix a frame-scoped portal container would let a board draw production whole", and with it "a portalled `Frame` copies the lab's `<html>` theme class once per load (`frame.tsx`'s `themeClass` never re-subscribes), so the lab's theme toggle leaves every open frame in the old theme until a reload".
- **The shell's restyle:** "the lab shell's `:has()` rule invalidates the whole page subtree on any DOM insertion (about 7,800 elements restyled per album arrival inside a board, masonry and rows alike); scope it" (`design.css`, `.lab-shell-body:has([data-lab-wide])`). Measure before and after.
- **Dead dock exports:** "`src/components/lab/dock.tsx` exports `AppliedBadge`, `ReplayButton` and `MotionToggle`, imported nowhere".

**Will's desk is up with six boards and he may sit at any time.** Change no board's folder, ask, option or words: this lane changes the desk and the kit around them. A kit change that alters how a board draws (the frame's own world above all) is proved on every standing board, `pnpm lab:smoke --all` and `pnpm lab:demo --all` pressing every step, at 1440 and at `--width 375`, against today's captures (`usher/kit/capture.sh`); a board whose frames now draw differently is named in your Handoff with before and after, never silently changed. His in-progress answers live in `localStorage` (`partyreel.lab.review.v2`, `review-store.ts`): never change that key or the shape it holds without reading the old one.

**Verify:**
- the gate, its lab steps over the whole lab;
- each item's test red on today's code where a test can hold it;
- the desk walked as a sitting at 1440 and 375: thumbnails, tabs, a copied link reopened, an answered step reached by its link, the whole-program note through `pnpm lab:review --dry`.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. The usher kit (`usher/kit/`) is the Orchestrator's: a script change there goes under Questions. Two lanes run beside you on production code (`export-ends`, the album download; `crumbs-44`, a person's page) and touch nothing of the lab.

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
