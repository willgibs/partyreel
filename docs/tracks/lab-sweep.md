---
track: lab-sweep
status: open
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

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; no preview (the round reviews on a local pnpm dev after integration)
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Found and fixed: one line each (page, width, what a stranger saw, what it is now)
- Found, not mine: one line each, for lab-catalog or the Orchestrator
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will: none
- Look at first: ...

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
