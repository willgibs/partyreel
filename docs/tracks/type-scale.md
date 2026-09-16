---
track: type-scale
status: handed-off
cut: "1b11ab9a"          # Round 4 of the revamp: the six paper boards rebuilt as catalogs (2026-09-16)
board: type-scale
owns:
  - src/app/(dev)/design/sandbox/type-scale/
  - docs/specs/type-scale.md
reads:
  - src/components/lab/
  - src/app/(dev)/design/sandbox/palette/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/(shell)/lab/_desk/
  - scripts/lab-smoke.mjs
  - scripts/lab-review.mjs
  - docs/reviews/README.md
  - docs/reviews/_window.json
  - docs/design/README.md
  - docs/design/rulings.md
  - src/app/theme.css
  - src/app/globals.css
---

# lp/type-scale

**Goal.** Rebuild the type-scale board as Will described (2026-09-16: "a few different scales side by
side" on real UI, "UI demos comparing two at once", no variable lists). The items are the ladders (the
five the board carries; each a card showing its rungs as the real word set at true size, one line, four
facts such as the heading sizes at 1440 and 375, the body size and the leading); the first section puts
the ladders side by side in one row at both widths; the second puts any two ladders on the same real UI
at once (`CompareTwo` over the real home, the pricing page and the dashboard as frames at 1:1,
scroll-locked); the third is the real pages wearing the pick. The token lists and the descriptions go;
the asks that survive are tracking and the not-found page's scale, each still with its context and its
options in words. `docs/specs/type-scale.md` (220 lines) shrinks to the proposal. The board today weighs
4,220 words outside its folds; it must come in under the budget.

**Binds.** The bible, the contracts of every component under a path you own, and the policies;
everything else is precedent (`docs/design/README.md#what-binds-you`). Will's rulings in
`docs/design/rulings.md`: 2026-09-15 (a question carries its context; an exploration is a catalog) and
2026-09-16 (a track returns a catalog to rule on item by item; the Library owns every design fact). His
round-four notes on every board (`docs/reviews/_window.json`): page-wide controls always on screen (the
dock); pixel-perfect previews (never zoom, scale or transform a specimen whose size is being judged: the
kit's `Frame` and a 1:1 `Stage`); more real UI (live production components and whole real pages as the
comparison surfaces, not a screen of specimens); the app's UI is open to this track. No em-dashes in any
copy. No mono.

**The shape every catalog takes** (the palette board is the model: read `sandbox/palette/spec.ts` and
`board.tsx`, then `/design/lab/kit`, the toolbox, before writing a line). `spec.ts` writes the items out
as `const ITEMS` (each: `id` one lower-case token, `name`, `one` at most `LIMITS.candidateOne` characters,
the builder's `verdict` (`ship | refine | kill`), `facts` as four `[label, value]` pairs, the rationale
folded under it), `candidates: ITEMS`, `catalog: { section, control, compare: ["compare-a", "compare-b"] }`,
a clearable pick control whose default is `none` ("Nothing picked") and two compare controls mapped over
the items (every control id a lower-case data-attribute name; `registry.test.ts` refuses the rest). Three
sections: the catalog (the kit's `Catalog`, one card per item with its live preview on a production
ground, Pick, A, B and the reviewer's `ItemVerdictRow`); any two side by side on real pages
(`CompareTwo`, or `SpotCompare` where one thing is applied to many real places); the real pages wearing
the pick (`FrameRow` and `Frame` at 1:1). Asks only for what is not one item, each still carrying its
context, look and options in words. The argument collapsed under the evidence: the board must pass
`pnpm lab:smoke`'s reading budget (`LIMITS.readingWords`, 1,200 words outside every closed fold,
specimen and paste); a board that truly needs more declares `reading: { words, why }` in its spec and
says why in Handoff. The research prose leaves the board, and `docs/specs/<board>.md` shrinks to the
standing proposal (what is ruled, what is open), never a ledger or a history.

**Verify on.** A local `pnpm dev` (`rm -rf .next/dev` first; the chrome's alert strip means a stale
sheet) at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>`
green for this board on both halves (the routes and the reading budget); every item's verdict and note
reaching the desk (`/design/lab`, Start the review) and the composed line at the foot of the board;
`pnpm lab:review --dry 'review <board> r<n>: item:<id>=keep'` accepting it; `registry.test.ts`,
`lab-review.test.ts` and the board's own tests green; the four gates.

**Discipline on this machine.** Four agents at once is the ceiling (36 GB; eleven crashed it): one
process at a time; stop your dev server before `pnpm build` or `pnpm test`; start it on a port of your
own and kill it by PORT (`lsof -tiTCP:<port> -sTCP:LISTEN | xargs kill`), never an unscoped `pkill`;
close browser tabs you are not using; kill your server before handing off; never `[preview]` or `[ci]`
in a commit message; stage files explicitly; the `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
trailer on every commit. The dev server on :3000 is Will's.

**Questions.** Each carries its context, the recommendation the round was built on, and what it would
cost to answer the other way.

1. **Round five let the two registers be picked separately (a Marketing switch and an App switch, so a
   ruling could be "marketing B, app C"). The catalog gives one pick per card, so each card is now a
   whole-site answer.** Recommended, and built: ONE pick. Two switches is the machine the revamp is
   cutting, and a reviewer who wants marketing from one card and the app from another says so in the
   note under the card; the wiring round still lands it as one `@theme` block, because the nine names
   are one set and each half simply stands on its own rungs. The cost of the other answer is a second
   page-wide switch and a pick that is no longer the whole ruling. `composePair()` and its tests were
   deleted with the second switch; git holds them, and they are five lines to write again.
2. **The `law` card is on the catalog AND letter spacing is still an ask.** Recommended, and built:
   both. Ruling `item:law=keep` says "ship today's sizes under the law now"; answering `tracking=adopt`
   says "whichever card wins carries the law", which is the larger, cheaper ruling. They are different
   questions and the ledger keeps them apart.
3. **Two 1440 frames do not fit a 1440 window, so the compared pair scrolls sideways.** Recommended,
   and built: side by side at 1:1, with the walk opening that section at 375 where both halves stand on
   screen at once. The alternative is the kit's `wipe` (one frame's width, a seam dragged across the
   same headline), which fits a 1440 window but shows half of each page. Say the word and it is a
   one-line change (`Compare mode="wipe"`).

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none

## Deferred (ROADMAP one-liners, bucket named)

- Design-system overhaul: `CompareTwo`'s grid squeezes a fixed-width child, so a pair of `Frame`s laid
  out through it overlaps (measured: 712px columns under 1440px frames); the kit either documents that
  a frame belongs in a `FrameRow` or gives `Compare` a `max-content` column mode.
- Design-system overhaul: `Frame`'s `onApproach` cannot fire for a frame clipped out of a horizontal
  scroll row (an IntersectionObserver reports it as not intersecting whatever the root margin says), so
  a row of frames has to take the approach on the ROW; the kit could carry that rather than each board.

## Handoff (replaces the chat report)

- Head: this handoff commit, on `61c3a572`, pushed; synced with `launch-prep` at `86ccf239` (it had moved 11 commits: docs, plus
  `rules.generated.json` and `touchpoints.ts`, none of which this board renders).
- Gates on the synced tree: typecheck ok, lint ok (0 errors, 6 pre-existing warnings, none in this
  lane), test ok (2137), build ok (257 static pages). `pnpm lab:smoke --base http://localhost:3106`:
  every type-scale route 200 (the board, its proposal, its track page, its three review sessions) and
  the reading **1,155 words against the 1,200 budget**, down from 4,220. No `reading:` override
  declared. The board's own scene route answers 200 too, and the smoke does not crawl it: its `SCENES`
  list is hardcoded and lives outside this lane.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/specs/type-scale.md`,
  `docs/tracks/type-scale.md` and eight files under `src/app/(dev)/design/sandbox/type-scale/`
  (`board.css`, `board.tsx`, `catalog.tsx`, `ladders.ts`, `ladders.test.ts`, `spec.ts`, `screens.tsx`,
  `screen/page.tsx`; `pages.tsx` deleted). No exceptions.
- The items, one line each (the builder's verdict; a kept one is not a component, it is the token set a
  wiring round bakes into `theme.css` as one `@theme` block, so the Library entry it lands as is a
  foundations entry, "the type scale", beside the palette's):
  - `b` (B, rungs): **ship**, and the board's own pick. One rung set 12 to 160, marketing travelling
    four rungs between the widths and the app one; the app gains its missing middle.
  - `c` (C, registers): **refine**. The only card that changes how the front of the site feels (200
    over 120); its app half drops the page title below today's, which is the half to rule on.
  - `a` (A, tuned): **refine**. Today's desktop sizes kept exactly, the phone end unpacked; the app is
    untouched, which is its cost.
  - `law` (the spacing law alone): **refine**. Moves no size at all, so it can be taken now.
  - `today`: **kill**. The control, and a ruling of it is a ruling to change no line.
- The asks that survive, and why neither is one item:
  - `tracking`: letter spacing as a function of size rides with WHICHEVER card wins, so it is a
    property of the ruling rather than one of the things being ruled on.
  - `not-found`: the dead-link heading is one screen that every card's paste changes the same way, so
    it is a yes or no about that screen, not a choice between cards.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. Lab only; no production byte
  changed (the board reads `NEXT_PUBLIC_DEMO_QR_TOKEN`, which already existed).
- Look at first: section 01 at 1440, then flip Canvas to 375 and read the same five. The stair of cap
  heights is the whole comparison and it is at true pixels; the hairline before "Dashboard" is where
  the app's register starts, and the struck-through "none" in A, the law and Today is the app's missing
  middle drawn rather than argued. Then section 02 at 375, where both halves of a pair stand on screen
  at once: Today against B on the real home page, scrolled together.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). **The type scale, as a catalog of five ladders.**
The board stopped describing sizes and started showing them: each ladder is a card drawn as a type
specimen at the pixels it declares for the canvas, in the real heading face at the rung's own leading
and tracking, clipped rather than scaled, with a missing app step drawn as a hole and a hairline where
the second register starts. Eight sections became three (the five side by side, any two on the same
real page at once and scrolled together, the pick worn by five real routes), four asks became two, and
the glance tables, the token table, the step descriptions and the two register switches went with them;
no size, leading or tracking moved. The dashboard became a lab screen route rather than a composed
stage, so the app is judged at a real viewport by the same block a ruling would land, and that found a
fourth heading outside every register (the event name inside the production `EventCard`). The board
weighs 1,155 words outside its folds against 4,220 before, and `docs/specs/type-scale.md` is 64 lines
against 220. Lab only; no production byte changed.
