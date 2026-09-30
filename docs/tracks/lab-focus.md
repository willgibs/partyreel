---
track: lab-focus
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "bfbec3da"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/lab/
  - src/app/(dev)/design/(shell)/lab/[board]/
  - src/app/(dev)/design/(shell)/lab/kit/
  - scripts/lab-demo.mjs
  - src/app/(dev)/design/design.css
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

Each is built as recommended and is Will's to overrule; none is a one-way door.

- Does a step open whole or at 1:1? **Whole** (every frame of the shown option scaled into the room above the dock, all options at one scale), 1:1 one press away (`f`, or the scale on the stage's row), and whichever he last chose holds for him. Overrule: 1:1 by default, whole on a press.
- May the whole stage rearrange a board's frames? **Yes, a stack or a row of frames only** (a `flex-col` whose children are frames and whole lines, or a flex row of frames alone, wraps there, and the width search keeps the arrangement that draws them largest: locked-door's four phones at 375 drew 43 by 93 px stacked, `_scratch/lab-focus/wip1/geo.json`, and draw 93 by 201 px two by two, `after/geo.json`; privacy-hero's laptop and phone stand side by side at 58% at a desk, `after/`); 1:1 draws every board exactly as written. Overrule: keep every board's own arrangement whole, at smaller frames.
- Where does everything else a board knows live? **One About panel** (what the question decides, why it matters, the board's reason, what the previews draw, what to look at; the board's opening; the words it uses), beside the step at a desk (a 21rem column, the stage narrows) and a drawer under the question below 1024 (at most 45% of the screen, scrolling on its own); once opened it stays open for him (`i` toggles). Overrule: a popover that never stays.
- Does a board's opening open itself where his sitting enters the board? **No: About carries a dot there** until he opens it, so the wall never comes back on its own. Overrule: open About on each board's first step.
- How does the shown option's line hold its sentence, gain and cost? **One line split 2:1:1**, each part cut where it runs out (whole on a hover, and "more" reads all of it, stacked, a choice that holds); below 768 the line is the sentence alone until "more". Overrule: two lines at a desk.
- Where do the options sit? **As tabs over the stage**, with the number (the key), the name, "the board says" on the recommendation (its reason on a hover and in About) and a tick on his pick; the dock keeps the note, Not clear, Back, Pick and Next, one row at a phone with Back and Next as arrows.
- Do frames keep their names on a step? **Yes, one line, set at a reading size whatever the scale**; the measured caption hides on a step and stays in the page (the whole board prints it, `lab:demo --verbose` lists it).
- Where does the gate draw the line? **The stage starts within half the first screen at 1440x900 and 375x812** (today 0.26 to 0.43 on every step), **and every frame of every option ends above the dock** (18 px of room at the least). Overrule: a tighter `--reach-limit`.
- Does a step whose options are words keep its `look` in view? **Yes**: with no picture it is the only instruction the step has, so it stands over the cards (and in About); a drawn step keeps it in About.

## System-doc edits (in place, owned facts only)

- None. The two landmines the whole stage paid for are the kit's and live in `src/components/lab/traps.ts`, drawn on `/design/lab/kit` (reduced motion makes every style write a transition; a zoom on a box holding a frame lands a frame or two late). `docs/systems/design-system.md` is this lane's read; the production-wide half of the first is the Deferred line below.

## Deferred (ROADMAP one-liners, bucket named)

- Design: globals.css's reduced-motion guard (`transition-duration: 0.01ms !important` on every element, with `transition-property` left at `all`) makes every script-written style a transition, so under reduced motion a size read in the same task as its write is the old one; the lab's whole stage exempts its own boxes (design.css), and a production measurer that writes then reads (the masonry, the lightbox's settle) may read stale sizes, or the guard could name its properties (from `lab-focus`).

## Handoff (replaces the chat report)

- **Commits, pushed** on `lp/lab-focus`: `44090e6e` (owns gains `design.css`), `8cc8b555` (the view, pictures first), `a4933a0d` (the gate, the kit page), `82240e15` (sync: `origin/launch-prep` at `4f945068`, for privacy-hero's round four and design-system.md, my read), `c7c35d0d` (a redrawn box stands as drawn again); the handoff commit is this file alone.
- **Gates on the synced tree, all at `c7c35d0d`**, each on its own exit code (logs in `/Users/gibby/local/ai/partyreel-wt/_scratch/lab-focus/`): `pnpm typecheck` 0 (`gate-typecheck.log`), `pnpm lint` 0 (`gate-lint.log`), `pnpm test` 0, 644 files, 7,639 tests (`gate-test.log`), `zsh scripts/build-lock.sh pnpm build` 0 (`gate-build.log`; the compiled chunk keeps the stage's `@supports (overflow:clip)` rule and the reduced-motion exemption inside `@layer base`), `pnpm lab:smoke --base http://localhost:3131` 176 checks, 0 failing (`gate-smoke.log`), `pnpm lab:demo --base http://localhost:3131 --all` 23 steps, 0 failing (`gate-demo-all.log`).
- **The gate bites**: `lab:demo --only locked-door.lost --reach-limit 0.2` exits 1 with `FOLD at 1440` and `FOLD at 375` (`demo-bite.log`); the view before this lane had its stage at 1026 px (1.14 of a screen) at 1440 and 2,064 px (2.54) at 375 with frames ending at 1,964 px under a dock at 843 (`before/geo.json`), so it would fold and cut on both screens.
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` = owned paths (`src/components/lab/`, `src/app/(dev)/design/(shell)/lab/[board]/page.tsx`, `src/app/(dev)/design/(shell)/lab/kit/`, `scripts/lab-demo.mjs`, `src/app/(dev)/design/design.css`, added to owns in `44090e6e` before its first edit) + this file; no exceptions.
- **Before and after** at 1440x900 and 375x812, first screen and full page, in `_scratch/lab-focus/before/` and `after/` (About open in `after-about/`): locked-door.family, disposable-mode.camera, event-ready.list, demo-framing.slug, about-press.kit, privacy-hero. privacy-hero had no open step at the cut (its `before` is the empty session page); its round four merged mid-lane (`53cd18f7`) and its `after` is the new `veil` step, synced in and gated.
- The step reads pictures first (`step.tsx`, `design.css`): the spine; where it happens in one line (`where` and `when`, cut with "more", About at its end); the question at a reading size; the options as tabs; the shown option's line; the knobs in one quiet row (the scale rides the option's line when nothing else sets the stage); the stage whole above the dock; the dock. It fills the window on a board's review (`[board]/page.tsx` renders the session with no header and no foot padding).
- The whole stage (`whole.ts`, `whole.test.tsx`): tries the drawing's widths from its narrowest natural layout to its widest, keeps the one that draws every option largest at one scale, pulls a width-bound drawing in to its edge, reflows a stack or row of frames, sets the frames' names at a reading size, and writes nothing on a re-fit that finds the same answer; `FitPin` (`lab-prefs.ts`) draws a `Fit` or a `Stage` 1:1 inside it and lets a `Fit`'s canvas take the stage's width.
- About (`about.tsx`) holds everything else, in the spec's own words, none removed or renamed; `lab-prefs.ts` keeps `stage`, `about` and `lines` per viewer; `i` and `f` join the step's keys.
- A coined term is marked where the question, the where line or the option's line says it, its meaning in the production Tooltip on a hover or a tap (`gloss.tsx`, `splitTerms` in `terms.ts`, tested in `terms.test.ts`).
- A frame's measured caption is out of his view on a step and in the page (`frame.tsx` marks it `data-lab-caption`; `design.css` hides it on a stage); the whole board prints it; `lab:demo --verbose` lists every frame's name and caption.
- `lab:demo` presses the tabs, measures every step at 1440x900 and 375x812 with every option shown (FOLD, CUT, CLIPPED, UNLABELLED, NO DOCK), says each screen's reach on its row, and clips its captures in page coordinates.
- `step.test.tsx` reshaped on purpose: the context layer's cases now pin that where and when precede the options, that what it decides, why it matters, the reason, the opening and the terms are in About, that About holds open and `i` closes it, and that a board's first step marks About; the old reason (all of it printed before the options) expired with Will's note. `look` keeps its case on a words step.
- The kit page (`/design/lab/kit`) says how a step reads and what `lab:demo` refuses; its notes and two new traps say how `Fit` and `Measured` behave on a whole stage. `LAB_CSS_GENERATION` 6 to 7 with `design.css`.
- **ROADMAP lines this retires**: the phone-fold line ("on a phone a board reads its context before its stage", from `lab-revamp`, `demo-framing-r2` and `about-press`); `lab:demo`'s capture line ("hands `Page.captureScreenshot` an in-window frame box in viewport coordinates", from `desk-tune`: the clip adds the scroll); the kit page's line ("says `lab:demo` refuses two options that draw the same picture", from `window-notes`: the page now says what it does). The every-state line's second half narrows to the pictures: the reach runs at 375 on every step now.
- **PROGRAM.md's new words** (yours to land). The paragraph: "**The pictures come first, and he can always place them.** He decides across every open board at once, and the drawn options are what he opens a question for, so a step reads, on the first screen at a desk and at a phone: where it happens in one line (the surface and the moment, and the state that brings someone there), the question sized to read, the options as tabs, the shown option's sentence with its gain and its cost in a line, its knobs in one quiet row, and every frame of it whole above the dock. Everything else a board knows (what it is about and what is settled, his earlier picks and notes, what the question decides and why it matters, the recommendation's reason, the words it coins) is one press away in the step's About, which stays open once he opens it, and a coined word is marked where it appears. So an author still writes all of it, a line each: it is what lets him place any question the moment he wants to. He should never have to click through the options to learn what he is being asked, nor read a screen of words to reach them." The bullet's second sentence: "Its context layer is an ask's `where` (a breadcrumb), `when` and `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line, and the board's `opening` (`about`, `settled`, `earlier`) and `terms`: the step prints the first two in its one line of where, the option's in its line over the stage, and the rest in About; `registry.test.ts` refuses an open ask without them, and `lab:demo` fails a step whose stage starts past half the first screen or whose frames end under the dock."
- Assets requested from Will: none.
- Board ideas: the desk (`/design/lab`) pictures first too, each open step's stage as a thumbnail in the queue, so a sitting's options are seen before any is opened; number-only tabs beside the shown one's name at a phone, so a four-option ask shows every option in one row (today the row scrolls, its cut edge faded).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the nine under Questions.
- Verified locally only: a lane push deploys nothing, so the live pass is the alias build after the merge (`/design/lab/<board>?session=...&key=`).
- Look at first: `/design/lab/locked-door?session=locked-door.family&key=fiesta` at 1440 and at 375 (the door family step his screenshots were of), then About (`i`) and 1:1 (`f`); `after/` beside `before/` in the scratch folder shows the six boards.
