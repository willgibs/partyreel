---
track: floating-surfaces
status: handed-off
cut: "1b11ab9a"          # Round 4 of the revamp: the six paper boards rebuilt as catalogs (2026-09-16)
board: floating-surfaces
owns:
  - src/app/(dev)/design/sandbox/floating-surfaces/
  - docs/specs/floating-surfaces.md
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
  - src/components/ui/
  - src/components/app/
---

# lp/floating-surfaces

**Goal.** Rebuild the floating-surfaces board as a catalog: the items are the directions (Today, Card,
Glass, Command, and any other the board carries that is still a real direction), each a card showing
the event menu at 328 wide on the production ground with one line and four facts (the radius, the
entrance, the light, the shadow model); the compare section puts the host's desk (the real dashboard in
a `Frame` at 1:1) under two directions at once; Pick is the existing `direction` control made clearable
with `none` as its default; the real pages wear the pick below. The asks that survive are the submenu,
the radius, the entrance and the light, each still with its context and options in words; the outliers
and the anatomy ladders fold under the evidence or go. The sweep found (2026-09-16) that a board's own
sheet must never pull a row past the content column at 1:1 (the shell clips a bleed at the window edge
now). The board today weighs 5,040 words outside its folds; it must come in under the budget.

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

**Questions.** Three, each answered with the recommendation the round then carried out.

1. **How many items should the catalog carry?** The goal named four (Today, Card, Glass, Command).
   *Recommended, and built: seven.* Four cards with the floor among them is three real choices, and
   the standing ruling asks for "a few, or many, variations". The three new ones are not filler: each
   answers a cost one of the first four pays, so the catalog now has a thesis (how much object should
   a floating surface be?). Compact answers Card's furniture, Paper answers the shadow, Lift answers
   the edge. If seven is too many, Paper and Lift are the cheapest to drop: they are material-only and
   share Today's anatomy.
2. **The reading budget.** The goal says the board must come in under 1,200 words outside its folds.
   *Recommended, and done: cut to 2,317 from 5,040, and declare 2,400 with the reason.* 1,200 is not
   reachable while four asks and seven cards stand, because about 1,300 of it is the template's own
   chrome before the board says anything (below, under Deferred). Every word this board owns was cut
   or shortened; what is left is four ledes, seven card lines, seven fact strips and nineteen frame
   labels.
3. **Which ground should the seven cards open on?** *Recommended, and built: the app's own dark, over
   the album's photographs* (a host's event page, which is where these menus actually open), with the
   Ground switch moving all seven at once. That switch is also why round five's whole "where glass
   stops paying for itself" section could go: one press onto the plain app screen shows it.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none

## Deferred (ROADMAP one-liners, bucket named)

**Now, "The lab and the kit":**
- The template's own chrome is about 1,300 words for a board with four asks and seven cards (the Answer prints every ask's context, look and because, the index repeats the ledes, the Rule-on panel repeats the asks, and `BoardMeta` prints every rationale and departure un-folded), so `LIMITS.readingWords` at 1,200 is unreachable for any board with four asks: fold `BoardMeta`, or stop the Answer repeating what the Rule-on panel already asks.
- A `Frame` seeds its state from the parent's FIRST render, which is before `useBoardState` reads the URL, and the parent's correcting `lab:set` is dispatched at the iframe's load event, before the frame has hydrated: every board's frames open on the DEFAULT when a shared link names a non-default control. `floating-surfaces`' scene now reads the board's own URL while seeding (same-origin) as a local fix; the kit could carry it for everyone.
- `pnpm lab:smoke`'s one standing route failure: `/design/lab/proposals/rounding` answers 404 because `docs/specs/rounding.md` does not exist while something still links it.

**Now (the product, not the lab):**
- `ui/dropdown-menu.tsx` renders `SubContent` with no `Portal` while `Content` carries `overflow-y-auto`, so every nested submenu in the product paints nothing: the account menu's theme picker is the one call site, on every host page and every guest page. One wrapper fixes it, or it goes with the floating-surfaces submenu ruling.

## Handoff (replaces the chat report)

- Head `HEAD_SHA`, pushed; synced with `launch-prep` at `62fe4eac` (it had moved 23 commits: the
  brand-voice, type-scale and docs-systems-strip tracks landed). The merge was clean.
- **Gates on the synced tree:** typecheck ok, lint ok (0 errors, 6 pre-existing warnings, none in this
  lane), test ok (2,141 in 226 files), build ok (257 pages). `pnpm lab:smoke --base
  http://localhost:3107` green for this board on both halves: every route 200, and the reading at
  **2,317 words** against a declared 2,400 (it was 5,040). The smoke's only route failure is the
  standing `/design/lab/proposals/rounding` 404, which is not this lane.
- **Lane check.** `git diff --name-only origin/launch-prep...HEAD` = the twelve files under
  `src/app/(dev)/design/sandbox/floating-surfaces/`, `docs/specs/floating-surfaces.md`, and this file.
  No exceptions.
- **The items, one line each** (the builder's verdict; none is in the Library yet, so a kept one is the
  wiring round's brief):
  - `today: kill`. The floor every other card is judged against; a ruling for it changes no line.
  - `card: ship` (the board's own pick). A menu as a made object; kept, it lands as the Library's
    `dropdown-menu` entry rebuilt with a header row, group labels, a 20px icon rail, a trailing state
    column and a footer rail.
  - `glass: refine`. One translucent pane of the room; kept, it lands as a MATERIAL on the existing
    entry rather than a new component, and it needs the dark master below before its worst case is
    honest.
  - `command: kill`. A field instead of a list; the wrong product for it, but its one idea (no menu
    opens a second menu) is the submenu ask and belongs in whichever card wins.
  - `compact: refine`. The same menu at 26px rows with a group's name riding its rule; kept, it is the
    same `dropdown-menu` entry with a `density` variant rather than a second component.
  - `paper: refine`. No shadow anywhere, a real border, the squarest corner; kept, it is a token block
    and no component change at all, and it rules the shadow call by itself.
  - `lift: refine`. No edge, a doubled shadow in both modes; kept, it is a token block plus a ruling
    against the shipped elevation contract, which is the light board's line as much as this one's.
- **The asks that survive, and why each is not one item:**
  - `submenu` (keep / delete): a question about the MODEL and about a shipped bug, and every card
    except Command answers it the same way, so no card decides it.
  - `radius` (squarer / today's panel corrected / rounder): every card brings its own corner, so the
    ask is what the PRIMITIVE's corner becomes if no card wins; it is also bible 9 missed inside the
    shipped contract, which is true whatever is picked.
  - `entrance` (one speed / faster where you open often): two ratified rules disagree as they are
    written (15 against 12). That is a bible wording change, not a look.
  - `light` (no shadow in dark / a soft shadow): the light board is proposing the same line, so it is
    ruled once on that board and inherited here; three cards cast and three do not, so a card can
    settle it but the line still has to exist.
- **Assets requested from Will:** one.
  - A dark, low-key event photograph for the menu ground · one of the media-kit track's 36 masters at
    1600px long edge, landscape, one grade, a dance floor lit by a single lamp (a line on that shot
    list rather than a second delivery) · replaces the nine mid-key marketing photographs the catalog's
    ground uses, which are all bright enough to flatter a translucent pane.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Two frame bugs found and fixed inside this lane**, both worth the Orchestrator's eye because the
  second is the kit's (they are the Deferred lines above): a frame seeded its ground from the parent's
  first render, so a board opened at `?ground=cinema` painted every card on the app's dark for ever;
  and the nested branch could not ride the push at all, so it now rides that one frame's src.
- **Look at first:** the catalog at `/design/lab/floating-surfaces`, then press Ground to "The room"
  and watch Glass turn on and Lift's shadow find something to separate. Then the first row of the four
  calls: open the avatar in the left frame, hover Theme, and watch a submenu paint nothing. That one is
  the product as it ships, not a candidate.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). The floating-surfaces board became a catalog of
seven finished floating layers, each a card carrying the real event menu at 328 on a production ground
with one line, the builder's verdict and four facts; three of the seven were new, and each answered a
cost one of the original four paid. Twelve sections became four (the catalog, any two on the host's
desk, the four calls that are not a card, the real routes wearing the pick), the desk became the
production dashboard rather than a drawing of one, and the nested-menu call showed the real account
menu with its shipped bug in it. The outlier rows, the glass-cost section, the anatomy ladders and the
palette's dark ramps left with the paper. Two frame bugs were found and fixed: a frame seeded its
ground before the board had read its own URL, and the nested branch could not travel by event at all.
The board read 2,317 words outside its folds, down from 5,040, and declared 2,400 with the reason.
