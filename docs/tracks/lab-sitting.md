---
track: lab-sitting
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2aabbacb"            # the launch-prep SHA the branch was cut from
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
  # added by the lane (each named under its item in the Handoff)
  - src/app/(dev)/design/(shell)/lab/page.tsx
  - src/app/(dev)/design/(shell)/lab/[board]/page.tsx
  - src/app/(dev)/design/(shell)/lab/kit/notes.ts
  - src/app/(dev)/design/(shell)/_shell/copy.test.tsx
  - src/app/(dev)/design/_data/state.ts
  - src/app/(dev)/design/design-css.test.ts
  - src/components/lab/board-page-context.tsx
  - src/components/lab/board-state.test.tsx
  - src/components/lab/dead-components.test.ts
  - src/components/lab/frame.test.tsx
  - src/components/lab/step.test.tsx
  - src/components/lab/step-thumb.tsx
  - src/components/lab/step-thumb.test.tsx
  - src/components/lab/walk.tsx
  - src/components/ui/portal-container.tsx
  - src/components/ui/portal-container.test.ts
  - src/components/ui/command-palette.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/dropdown-menu.tsx
  - src/components/ui/popover.tsx
  - src/components/ui/responsive-menu.tsx
  - src/components/ui/select.tsx
  - src/components/ui/sheet.tsx
  - src/components/ui/tooltip.tsx
  - src/components/shared/tooltip-slide.tsx
  - src/components/app/share/code-card.tsx
  - src/components/marketing/help/help-palette.tsx
  - src/components/reel/clip-creator.tsx
  - src/components/marketing/sections/features/album/everywhere-peek.tsx
  - scripts/lab-demo.mjs
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

- **A thumbnail shows one option, the one the step lands on** (his held answer, else the board's recommendation), not
  every option: the 15 open steps' landing options are 44 frames on the desk, every option would be about 160
  (measured, `_scratch/lab-sitting/probe-steps.mjs`). Recommended and built: one; the tabs are a press away on the step.
- **The radix seam is production code**: `ui/portal-container.tsx` (a context nothing in the product provides, so every
  layer still lands on `document.body`) and `container={usePortalContainer()}` on all 18 radix portals in 15 files,
  held by `portal-container.test.ts`. Recommended and built: without it a board cannot draw production's layers in a
  frame. Two of the files are other lanes' (named under the lane check).
- **`scripts/lab-demo.mjs` changed** (not the usher kit, but a gate step): it reads the open steps off the desk's served
  HTML, the queue's rows alone, instead of drawing the desk (which now draws 44 frames, and a page left mid-load is
  how the dev image optimizer wedged in crumbs-16), and it fails a step whose options' tabs run past the row at 375
  (`TABS`). Recommended and built.
- **The lazy image half of the frame's line did not reproduce**: a `loading="lazy"` image in a portalled frame loads
  once it is in the frame's own view (event-ready.needs 14 of 14 in view, demo-framing.slug 232 of 232; the ones that
  wait sit below their frame's own fold, as on any page; `_scratch/lab-sitting/probe-lazy*.mjs`). event-ready's
  "never loads" is most likely crumbs-16's first-document cancellation, fixed the same day. Recommended: retire that
  clause; no code changed for it, and the fact is a line in design-system.md's lab section.
- **Copy link copies every param in the bar**, not only the lab's and the board's (a `card`, anything else a page
  writes). Recommended and built: the URL is the share format, whatever wrote it.

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`, the floating-layer contract: every layer portals into the container its page
  provides (`usePortalContainer`), the lab's `Frame` the one provider.
- `docs/systems/design-system.md`, the lab: ★ a lab rule's `:has()` styles only its own element (the measured
  whole-subtree restyle beside production's `group-has-*` utilities, `design-css.test.ts`); a portalled `Frame` is its
  own world (links, forms, layers, the theme; lazy images load in its own view).
- `docs/reviews/README.md` (the grammar's one home, one sentence refined): the bare note's producer is the end of the
  walk's "For the whole program" field, and Copy so far carries it once.

## Deferred (ROADMAP one-liners, bucket named)

- The lab and the kit: a production hook that reads the window (`useMediaQuery`, `matchMedia`) inside a portalled
  frame reads the LAB's window, so a frame at 375 draws a component's desk branch (event-ready quoted Settings for it);
  a frame-scoped window the product's media hooks read, as its portals read `usePortalContainer`, would close it
  (from `lab-sitting`).
- The lab and the kit: the boards' own `stopLinks` (about-press, demo-framing) and `Inert` (event-ready) are redundant
  now a portalled `Frame` swallows a link and a form itself; each board's next round can drop them (from
  `lab-sitting`).
- The lab: on the desk at a phone a staged row's "after ..." tag runs past the row and is cut at the queue's edge
  (`_shell/tag.tsx` is `whitespace-nowrap`) (from `lab-sitting`).
- The lab and the kit: a radix layer open inside a portalled frame still locks the LAB's page scroll and puts its two
  focus guards in the lab's body (radix's RemoveScroll and focus guards read the lab's `document`; measured: the
  lab's body `overflow: hidden` while a frame's menu or dialog is open, released on close) (from `lab-sitting`).

## Handoff (replaces the chat report)

- **Commits**: the work at `f467dfaf` and `90a2a957` (the frame's theme written before it paints, a link to no
  question marked as its own, the whole-program note's line on where it goes), pushed; this manifest is the head.
  launch-prep moved since the cut (crumbs-45's merge, app components, and records; none in my owns or reads,
  `git merge-tree` clean), so no sync commit.
- **Gates on `90a2a957`**, each on its own exit code (logs in `_scratch/lab-sitting/gate-*.log`): `pnpm typecheck` 0;
  `pnpm lint` 0 (no warnings); `pnpm test` 701 files, 8,375 tests; `zsh scripts/build-lock.sh pnpm build` 0;
  `pnpm lab:smoke --all` 176 checks, 0 failing; `pnpm lab:demo --all` 23 steps, 0 failing, at 1440 and at
  `--width 375` (TABS included).
- **Red on today's code**: every new test, run against `origin/launch-prep` in a scratch worktree (since removed):
  25 failing and `step-thumb.test.tsx` unable to load (`_scratch/lab-sitting/red-on-base.txt`); the live checks below
  ran against today's code the same way.
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` is the owns and this file, with four exceptions:
  `src/components/ui/popup.tsx` (crumbs-42's) and `src/components/guest/reel/live-reel-view.tsx` (crumbs-43's
  `guest/`), each two lines (the import and `container={usePortalContainer()}`), since every radix portal must take
  it (`portal-container.test.ts`); `docs/systems/design-system.md` and `docs/reviews/README.md`, the edits listed
  above. Neither lane's branch touches those lines.
- **The queue, pictures first**: each open, drawable step's stage as the step lands on it, by the board's own
  evidence (`StepThumb`, `DeskThumb`, `pictured` on the desk), two at a time as the reader reaches them, beside the
  words at a desk and above them at a phone; all 15 drawn, 44 frames, no console message
  (`_scratch/lab-sitting/desk-1440-tall.png`, `desk-375.png`). The rows stay one link (the picture takes no
  pointer). The desk's HTML is 410 KB in dev with them (each board's steps sent once).
- **Every option in a phone's row**: below 640 an unshown tab is its number, the shown one its number and name
  (design.css, `data-lab-tab-name`); `lab:demo` now fails a TABS row at 375, red on today's code (locked-door.family
  313 px past its edge, disposable-mode.camera 646, privacy-hero.veil 215), 0 after (`step-375.png`).
- **A copied link carries the board's state**: `viewLink` copies the bar's own query, the page's key, the lab's
  params first (`copy.test.tsx`). Live: on locked-door with A password gate and Dom, blocked pressed, today's code
  copied `?key=` alone and reopened on the defaults; now `?key=&welcome=gate&was=dom`, reopened with both pressed.
- **A note for the whole program**: `program` in the review store (a v2 payload without it loads whole, the key
  unchanged), `composeProgramLine`, the end of the walk's "For the whole program" field (adopting text typed before
  hydration), Copy so far carries it once under `note:*`; the round trip through `lab-review.mjs` is a test. Live:
  typed at `?session=end` at 1440 and 375, the message `note: "..."` through `pnpm lab:review --dry`: "no board,
  note, not recorded" with its advice line (`end-375.png`).
- **An answered ask stays reachable**: `boardWork(rows, reach)` brings the ask a link names, the step carries
  `recorded`, the spine says "answered on record: <answer>, out of the walk" and lands on it; a link to no question
  says so (it drew a blank page); the desk's answered pills open their step; `lab:demo` reads the queue's rows off
  the served desk (`data-lab-queue`), so an answered step is still never pressed unless `--only` names it. Live: a
  temporary local answer (`lab-review.mjs` into my worktree, deleted, never committed) opened about-press.kit on
  record at 1440 and 375 (`onrecord-1440.png`).
- **A long control is a select** above eight options (`LONG_CONTROL`, `ControlKnobs`); no standing board has one
  (the largest has four), so nothing a board draws moved.
- **A frame of its own**: a portalled `Frame` swallows links and form submits, follows the lab's theme class (a
  MutationObserver, written before paint), and provides its body to `usePortalContainer`, which all 18 radix portals
  in the product now read (nothing else provides it, so production is radix's default). Live, on a temporary route
  (removed, never committed): today's code navigated the lab to /terms and opened the menu and the dialog in the
  lab's document; now the lab stays put and both open inside the frame at its coordinates, Escape closing each. The
  lab's Light button flipped four open frames from dark to light (today's stayed dark). Lazy images: under Questions.
- **The shell's restyle**: one classed insertion on a fresh load, each page padded with 6,000 divs, restyled
  6,364 of 6,722 elements on a board, 6,364 of 6,600 on a step, 6,390 of 6,774 on the desk and 9,223 of 9,702 on the
  Library's components; now 5 on each (a text change 4 to 90). The culprit, by rewriting each sheet on a fresh load,
  was the TOC rule's non-subject `:has()` beside production's `group-has-*` utilities; its answer now rides an
  inherited property from a subject `:has()` (`design-css.test.ts`), and the grid and the TOC read as before at 1440
  and 1100 (`after-grid.txt`).
- **The kit's dead components**: `AppliedBadge`, `ReplayButton`, `MotionToggle` and, found by the same test,
  `WalkPages` deleted (`dead-components.test.ts`); `labUrl` in `_data/state.ts` went with CopyLink's change.
- **No board draws differently**: every option's frames of every open step, before and after, at 1440 and 375
  (216 each): 163 and 198 byte-identical, the rest sparse (at most 0.26% of a frame's pixels at 1440, one at 1.02%
  at 375), and a second capture of the same tree repeats each (demo-framing.slug 1.018%, event-ready.needs 0.219%):
  the stream and the cycling stills, never a layout (`compare-1440.txt`, `compare-375.txt`, the frames under
  `before-*`, `after-*`, `again-*`).
- **ROADMAP lines this closes** (origin/launch-prep at `fb621526`): 50, 63, 64, 65, 68 (its lazy-image clause per
  the Question), 129, 142, 180, 183.
- **Assets requested from Will**: none.
- **Board ideas**: the desk's picture cycling a row's options while the reader hovers or focuses it, the other
  options mounted for that row alone, so a sitting's options are seen as well as its questions.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule**: the thumbnail is the landing option, 11.5rem at 16:10 beside the words at a desk and
  the row's width above them at a phone, none on a staged row; below 640 an unshown tab is its number; a select above
  eight options; the "For the whole program" field under the boards' notes at the end of the walk; a step on record
  reads "answered on record: <answer>, out of the walk", lands on that answer and takes a new pick as a replacement;
  a link to no question says so with the whole board one press away.
- **Look at first**: `/design/lab?key=` at 1440 and at 375 (the queue's pictures), then
  `/design/lab/locked-door?key=&session=locked-door.family` at 375 (four options in one row), then
  `/design/lab?key=&session=end` (the whole-program field). Verified locally only: a lane push deploys nothing, and
  the build waits for his sitting.
