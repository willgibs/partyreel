---
track: lab-sweep
status: handed-off
cut: "5cdebfe0"          # Round 1 of the revamp: the foundation commit on launch-prep (2026-09-16)
preview: false          # no branch preview; the round reviews on a local pnpm dev after integration
owns:
  - src/app/(dev)/design/(shell)/_shell/
  - src/app/(dev)/design/(shell)/layout.tsx
  - src/app/(dev)/design/(shell)/library/
  - src/app/(dev)/design/_data/catalog.ts
  - src/app/(dev)/design/_data/nav.ts
  - src/app/(dev)/design/_data/search.ts
  - src/app/(dev)/design/_data/state.ts
  - src/app/(dev)/design/_data/glossary.ts
  - src/app/(dev)/design/design.css
reads:
  - src/components/lab/
  - src/app/(dev)/design/(shell)/lab/
  - src/app/(dev)/design/layout.tsx
  - src/app/css-source-policy.test.ts
  - docs/design/README.md
  - docs/design/rulings.md
  - docs/systems/testing-verification.md
---

# lp/lab-sweep

**Goal.** Walk every page of the lab as a stranger and fix what is rough in the shell, so Will's next
review is spent on the work and not on the tool. His words (2026-09-16): "The lab UI is super broken,
at least on localhost. This in no way reflects the full list of errors. It's just what I could spot
during a quick look. If you find more while addressing these, please attempt to fix as well." The
five he named (the sidebar as a full-width block at the top and not collapsible; "On this page" as a
weird section at the top; 1:1 previews with left padding overflowing to the right; page-wide controls
not sticky; a pick that cannot be unpicked) were a stale stylesheet in his browser plus two real gaps,
and the foundation at `5cdebfe0` closes them (the guard in `src/components/lab/lab-chrome.tsx`, the
toggle rule in `_desk/review-store.ts`, `data-lab-bleed` at 1:1). Start from a hard-reloaded dev
server (`rm -rf .next/dev` before you start it; the chrome's alert strip means the sheet is stale) and
walk at 1440 and 375, light and dark, reduced motion, keyboard only: the desk, every board (the twelve
standing boards and the tools), the kit page, the proposals and tracks pages, every Library page
(rules, policies, guidance, rulings, doctrine, the record, the glossary, the five family galleries and
a few permalinks). Fix what you find in your lane; what you find in the kit, the desk or a board is a
one-line finding under Handoff for the `lab-catalog` track or the Orchestrator, with the page, the
width and what a stranger sees.

**What to look at, in order.** Navigation: the sidebar toggle on wide and narrow pages (the dock's
Sidebar button and the top bar's), the sheet below 1024 (its button is the UX gap: a phone has no way
to open the sidebar that reads as one), prev and next, breadcrumbs, ⌘K, the TOC rail from 1280 and the
compact disclosure below it (never a section at the top of the page). The dock: sticky under the top
bar from `sm`, collapse, knobs wrapping at 375 with no sideways scroll of the document, the Sections
menu. Stages and frames: edge to edge at 1:1, sideways scroll only past the window, never the
document; the blocked banner. The board template's density: nothing above the fold but the question,
the answer, the pills and the first block. The desk and the review card at both widths. The Library
pages: the family galleries at 375, a permalink's tabs, the rules page. Plain-English labels across
the lab, ids untouched: "asks" read as questions, "candidates" as ideas, "departures" as rules this
breaks, "Binds" as what applies here, "lede" as the one line, "the record" as the ruling so far; the
glossary (`_data/glossary.ts`) follows the labels. Every fix is judged from the ground up (bible 22):
what the perfect version of this control would be if it did not exist yet.

**Binds.** The bible, the contracts of every component under a path you own, and the policies;
everything else is precedent (`docs/design/README.md#what-binds-you`). Rulings: 2026-09-15 and
2026-09-16 in `docs/design/rulings.md`. The shell's layout rules are PLAIN unlayered CSS in
`design.css` (a lab-only utility in the `utilities.lab` sub-layer loses to production's), pinned by
`src/app/css-source-policy.test.ts`; when a shell rule changes, bump `--lab-css-generation` in
`design.css` AND `LAB_CSS_GENERATION` in `src/components/lab/lab-css-generation.ts` (a test keeps
them equal; the number is what tells a browser its copy is old). The `.lab-catalog` grid rule at the
end of the unlayered block is the catalog track's: leave it. No em-dashes in any copy. No mono.

**Verify on.** The walk itself, repeated after the fixes on a hard-reloaded dev server at 1440 and 375
with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` green; the four gates.

**Discipline on this machine.** Four agents at once is the ceiling (36 GB; eleven crashed it): run one
process at a time, stop your dev server before `pnpm build` or `pnpm test`, kill it by PORT
(`lsof -tiTCP:<port> -sTCP:LISTEN | xargs kill`), never an unscoped `pkill`; close browser tabs you
are not using; never `[preview]` or `[ci]` in a commit message. Stage files explicitly; the
`Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer on every commit. The `lab-catalog`
track runs beside you on `src/components/lab/`, the desk and the palette: read those, never edit them.

**Questions.** Anything that would branch the work goes here as a numbered question with your
recommended answer; the Orchestrator relays it to Will and quotes the answer back.

1. **The plain-English relabel spans two lanes.** The words the goal names ("asks", "candidates",
   "departures") are rendered by `src/components/lab/answer.tsx`, `concept-card.tsx` and the desk,
   which are `lab-catalog`'s files this round, not mine. **Recommendation, carried on:** I changed
   the words in my own files and made the glossary teach BOTH, leading with the stranger's word and
   naming the code's after it, so the ids in `board-spec.ts` never move and the two vocabularies
   reconcile whichever way the kit lands. The exact strings for the kit are under "Found, not mine".
2. **How far "Binds" should go.** "Binds" is the rule set's own vocabulary: the bible page's title is
   literally "What binds you" and `docs/design/README.md` is its home, so replacing it everywhere
   would desync the UI from the doc and make the vocabulary LESS consistent, not plainer.
   **Recommendation, carried on:** change the standalone verdict beside a level badge (a bare
   "Binds" in a column is jargon, and it now says whether a level always applies, applies in scope
   or only informs) and leave the prose, which reads plainly already.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none

## Deferred (ROADMAP one-liners, bucket named)

- **Now:** move Next's dev indicator off the lab's bottom-left corner:
  `devIndicators: { position: "bottom-right" }` in `next.config.ts` (it sits on the sidebar's
  editor-root control at every width, and localhost is this round's review surface).

## Handoff (replaces the chat report)

- Head `054e5d7a`, pushed; no preview (the round reviews on a local `pnpm dev` after integration)
- Synced with `launch-prep` at `e8ce341e` (it had moved nine commits; merged, gate re-run on the
  merged tree)
- Gates on the synced tree: typecheck ok, lint ok (0 errors, 6 pre-existing warnings), test ok
  (2155 in 223 files), build ok (257 static pages); `pnpm lab:smoke --base http://localhost:3102`
  ok, 299 checks 0 failing
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =

  ```
  src/app/(dev)/design/(shell)/_shell/page-header.tsx
  src/app/(dev)/design/(shell)/_shell/palette.tsx
  src/app/(dev)/design/(shell)/_shell/shell.tsx
  src/app/(dev)/design/(shell)/_shell/sidebar.tsx
  src/app/(dev)/design/(shell)/_shell/toc.tsx
  src/app/(dev)/design/(shell)/_shell/top-bar.tsx
  src/app/(dev)/design/(shell)/library/page.tsx
  src/app/(dev)/design/(shell)/library/record/page.tsx
  src/app/(dev)/design/(shell)/library/rules/level-badge.tsx
  src/app/(dev)/design/_data/glossary.ts
  src/app/(dev)/design/_data/nav.ts
  src/app/(dev)/design/design.css
  src/components/lab/lab-css-generation.ts
  ```

  All owned except the last: `src/components/lab/lab-css-generation.ts` is `lab-catalog`'s prefix and
  is the one-number bump this track's init instructs (`--lab-css-generation` 3 -> 4, kept equal by
  `lab-css-generation.test.ts`). This file is not edited: the manifest itself carries no code.

### Found and fixed

- **Every page below 1280**: "On this page" was the FIRST thing on the page, above the breadcrumbs
  and the title (Will's "a weird section at the top"): the shell mounted the compact disclosure at
  the head of the content column. It now closes the PAGE HEADER, under the title and the one line.
  On a board it does not render at all: the dock's Sections menu is already that control.
- **Every page from `lg`**: the top bar's sidebar button did nothing anywhere but a board. It wrote
  `data-lab-sidebar` at every width and `design.css` honoured the preference only on a wide page, so
  a stranger on a library page clicked the one visible control and the page did not move. The
  sidebar collapses on any page now; the table-of-contents rail stays at `xl`, because the measure is
  the point of collapsing. Its label said "The sidebar on a board page"; it says what it does.
- **Every page, keyboard**: thirty tab stops through the nav before the content of the page you had
  just chosen. "Skip to the page" is first in the tab order, and `<main>` takes the focus. Plain CSS,
  not `sr-only` + `focus-visible:not-sr-only`: `not-sr-only` is used nowhere in production, so it
  compiles into `utilities.lab` and loses to production's `sr-only`, and the link would never appear.
- **The phone sheet, below 1024**: a one-way door. The close button was turned off (the kit's own
  sits top-right, on the filter field), so the only exits were Escape and a 50px strip of dimmed
  page; and it showed the current area alone while the control that switches Library and Lab sat
  behind the overlay it had just opened. The sheet has its own header now: both areas as pills, and
  a close beside them.
- **The rounding board at 375**: the whole DOCUMENT scrolled 4px sideways, which is the one sideways
  scroll a board must never cause: the shell's 1:1 bleed (`-1rem`) stacked on the board's own
  `--rnd-grow-left` pull. The content column clips at 1:1 now, so a bleed reaches the window edge and
  stops there whatever a board does, and the dock's sticky still works (a clip container is not a
  scroll container).
- **★ A bare `overflow-x: clip` is DROPPED by the build's CSS pipeline** (Lightning CSS cannot
  downlevel the value for the configured targets, so it deletes the declaration and then the empty
  rule; the same rule with `hidden` survives). Inside `@supports (overflow: clip)` the block is
  passed through untouched. The `@supports` in `design.css` is load-bearing, not a capability check.
  Read the compiled chunk, not the source, before believing any lone modern value in that sheet.
- **Every board's round badge**: `_data/nav.ts` counted a track manifest's `merged_round_N` keys,
  and since `44090827` a manifest is deleted at the merge that integrates it, so every standing
  board's badge would have gone blank as its track retired. It reads `boardSpec(id).round.n` now
  (`new` and `updated` untouched). Verified after merging `launch-prep`, which deleted eleven
  manifests: the badges are still there.
- **Doctrine pages at 375**: the three-level breadcrumb wraps and `justify-between` left "Copy page"
  at the LEFT margin on its own line, a stray button above the title. `ml-auto`.
- **The record's table**: "Lives" was a verb with no subject and "Ruled" a repeat of the section;
  "Where it lives now" and "When".
- **A level badge's standalone verdict**: "Binds" / "Binds in scope" in a column is the rule set's
  word, not a stranger's: "Always applies", "Applies in scope", "Informs only". The prose keeps the
  vocabulary.
- **The glossary**: leads with the word a stranger would use and names the code's after it ("Idea,
  question, departure, asset"), so `candidates` / `asks` / `departures` stay what they are in
  `board-spec.ts` and a reader who meets either word finds the other.
- **The library's front door**: the one library page with no prev and next, though `[` and `]`
  worked on it.
- **The sidebar's editor-root row**: `pl-12 lg:pl-3`, added to dodge Next's dev indicator, was dead
  code for the same sub-layer reason as `not-sr-only`. Removed with the reason written down.
- **The ⌘K palette**: the field keeps the focus and the arrows move a cursor in the list, so a
  screen reader heard nothing and the whole palette read as an empty text box. It is a combobox with
  `aria-activedescendant` now.

### Found, not mine

- `next.config.ts` (no track owns it): Next's dev indicator is fixed at the bottom LEFT (x 22..54,
  32px) and sits on the sidebar's editor-root control at every width. One line:
  `devIndicators: { position: "bottom-right" }`. Localhost is this round's review surface, so Will
  will see it.
- `src/app/(dev)/design/sandbox/rounding/board.tsx`: at 375 the Tuner panel opens over the whole
  board, so the first screen is the panel and the board is not visible until it is collapsed.
- `src/app/(dev)/design/sandbox/rounding/board.css`: `.rnd-wide` widens a row by `--rnd-grow-left`
  inside the already-padded column; that pull is what the shell now has to clip at 1:1.
- `src/components/lab/dock.tsx` + `board-page.tsx` (lab-catalog): at 375 a board opens with about
  500px of dock before the question, so the template's "nothing above the fold but the question, the
  answer, the pills and the first block" is not met on a phone. It is met at 1440.
- `src/app/(dev)/design/(shell)/lab/page.tsx` (lab-catalog): at 375 a "Waiting on you" row puts the
  board name, the question and the answer pill on one line and they collide.
- `src/components/lab/answer.tsx` and `concept-card.tsx` (lab-catalog): the board kit's visible words
  are still the code's. In plain words: **"Departures" -> "Rules this breaks"**, **"Candidates" ->
  "Ideas"**, and on the desk **"ask" -> "question"**. The ids stay; the glossary already teaches
  both.
- `src/app/(dev)/design/rules/component-notes.ts` (lab-catalog): a component permalink's lede starts
  lowercase ("every action in the product: ..."), so the title reads into a sentence fragment.

### The walk

Every lab page as a stranger, on a dev server started from `rm -rf .next/dev`, at 1440 and 375, dark
and light, keyboard only: the desk, the boards (palette, rounding, type-scale), the kit, the tools,
the proposals and tracks pages, the library home, the glossary, the bible and a rule permalink, the
policies, the guidance, the rulings, a doctrine page, the record, the five family galleries and a
component permalink. `pnpm lab:smoke` covers that all 299 routes and redirects still answer. Reduced
motion is honoured by reading rather than by emulation (this round's browser cannot emulate it):
nothing added here moves, and the existing guards are untouched (`.lab-disclosure`, `.lab-chevron`,
`[data-dir-enter]` and `[data-dir-stagger]` in `design.css`, `motion-reduce:transition-none` on the
pager's arrow).

- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will: none
- Look at first: any library page below 1280 (the title comes before "On this page" now), then the
  top bar's sidebar button on that same page (it collapses the nav at last), then the navigation
  sheet on a phone width (it has a close and both areas).

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). The lab was walked page by page as a stranger, at
1440 and 375, dark and light, keyboard only, and the shell's rough edges were fixed. "On this page"
no longer opens every page above its own title: it closes the page header, and a board drops it
entirely for the dock's Sections menu. The top bar's sidebar button worked on boards only, writing a
preference the grid ignored everywhere else; it collapses the sidebar on any page now. A skip link
is first in the tab order, where thirty nav stops used to stand. The phone navigation sheet gained a
close and the two area pills, having had neither. At 1:1 a bleed now stops at the window edge, so a
board that pulls its own rows left cannot scroll the document sideways. A board's round badge reads
its own spec instead of a track manifest, which is deleted at integration and would have blanked
every badge. The words a stranger reads were plainened where they were the code's: the glossary
leads with the human word, a level's verdict says whether it applies, and the record's table says
where a ruling lives. ★ A bare `overflow-x: clip` is dropped by the CSS pipeline and survives only
inside `@supports`.
