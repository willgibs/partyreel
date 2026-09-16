---
track: rounding
status: handed-off
cut: "1b11ab9a"          # Round 4 of the revamp: the six paper boards rebuilt as catalogs (2026-09-16)
board: rounding
owns:
  - src/app/(dev)/design/sandbox/rounding/
  - docs/specs/rounding.md
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
  - src/components/dev/motion-tuner.tsx
  - src/components/dev/motion-tuner-config.ts
---

# lp/rounding

**Goal.** Rebuild the rounding board as a catalog: the items are the four families (A, B, C, D), each a
card showing the card, the menu, the photograph and the button at true size plus a 375 frame, with one
line and four facts (the surface radius, the action radius, the tile and float tokens); the compare
section puts two families on the same real page at once, scroll-locked (`CompareTwo` over a `Frame`
pair); Pick is the existing `surface` control made clearable with `none` as its default, and the real
pages wear the pick below. The asks that survive are the actions, the ladder, the dead rungs and the gap,
each still with its context and options in words. Two findings from the sweep (2026-09-16) are yours:
at 375 the Tuner panel opens over the whole board, so the first screen is the panel and not the board
(the panel starts collapsed on a phone, or sits below the question); and `.rnd-wide`'s `--rnd-grow-left`
pull widens a row inside the already-padded column, which the shell now clips (a board never pulls its
own rows past the column; the kit's 1:1 bleed is the mechanism). The board today weighs 4,859 words
outside its folds; it must come in under the budget.

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

**Questions.** Four, each answered with the recommendation the round then carried.

1. **The goal names four families; the board ships six. Right call?** The catalog doctrine and the
   brand-voice track's own round say three or four columns is not a catalog, and the four had a real
   gap between them: nothing in A to D moves the PHOTOGRAPH away from the surface, and nothing
   offers the cheapest visible change. **Recommended, and carried: six.** E, print (soft chrome,
   square photographs) and F, half a step (a 6px card with the photograph left alone) are written
   from the ground up; A to D keep their letters because three rounds of review have referred to
   them that way. Kill both new ones on sight and the board is the goal's four.
2. **Does a family name the button too, or only the surfaces?** Reading the corners apart is what
   made round five a machine. **Recommended, and carried: a family names the surface, the floating
   layer, the photograph and the gap it pins; the button RUNG and the derived LADDER stay asks**,
   because both are true whichever family wins. The card's fourth fact states bible 8's claim as a
   ratio against the shipped rung, which is where D gives itself away: the card out-rounds the button.
3. **The board mounted the tuner panel. Keep it?** At 375 it opened OPEN over the whole board, which
   is one of the two sweep findings. **Recommended, and carried: drop the mount.** The radius knobs
   already ride every real marketing page and the app (`marketing-motion-tuner.tsx`,
   `app-design-island.tsx`), which is where dragging a radius is worth anything, and the catalog's
   Pick is the picker now. Nothing was deleted from the tuner itself.
4. **1,200 words, or a declared budget?** The board reads 2,564 outside its folds, against 4,859.
   About a thousand of those are the template's own (the answer, the index reprinting five ledes,
   the meta panel, the review panel), and the four asks cost another 570 BECAUSE each carries its
   context, which is Will's own ruling. **Recommended, and carried: `reading: { words: 2800 }` with
   the reason in the spec**, which is the band the other three rebuilt boards landed in (light
   2,884, brand-voice 2,542, floating-surfaces 2,318).

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none

## Deferred (ROADMAP one-liners, bucket named)

- none: everything this board found is either an ask on its face or a departure in its meta panel.

## Findings for another lane (not mine to change)

- **`design.css`'s clip comment names a rule that no longer exists.** It cites "rounding's
  `.rnd-wide` widens by `--rnd-grow-left`" as the reason for `overflow-x: clip`; `.rnd-wide` is
  deleted. The clip is still right, because any board could pull; the example wants rewording.
- **`ControlKnobs` passes `wrap={c.options.length > 5}`, so a FIVE-option control never wraps.** The
  `Toggle` wraps by default precisely because a nowrap segmented control at 375 scrolls the whole
  document, and five medium labels is already about 350px inside a 343px dock. This board's `Page`
  control is five short words on purpose, which is a guard rather than a fix.
- **A trap worth writing into `traps.ts`:** an element whose only changing prop is read AFTER
  hydration (next-themes' `resolvedTheme`: undefined, then the real mode) can keep the SERVER's
  attributes when it is built inside a board's evidence value and handed through the template's
  callbacks. Measured here twice: a ground box stayed `dark` in a light lab while the frame inside
  it had already switched to the light screen, and an approach flag held in the board never reached
  the row it gated. Both fixes are one rule, both in this board's comments: read a value in the
  component that renders the thing it drives, and key an element on the value that changes its
  identity.

## Handoff (replaces the chat report)

- Head `316f6e1d` plus this manifest's own commit, pushed on `lp/rounding`; synced with
  `launch-prep` at `71b7349a` (it had moved 27 commits, including the meta panel's fold, which every
  reading number below is measured against). The work is two commits: `9811ab78` (the board) and
  `e7fe0f6c` (the proposal doc and the spec list).
- Gates on the synced tree: typecheck ok, lint ok (0 errors), test ok (2,143 in 227 files), build ok
  (256 pages). `pnpm lab:smoke --base http://localhost:3109` green for this board: 0 route failures,
  **2,564 reading words against a declared 2,800** (4,859 before). `pnpm lab:review --dry 'review
  rounding r6: item:c=keep; item:e=refine; item:d=kill; actions=today; ladder=quarters;
  dead-rungs=drop; gap=pinned'` accepts all seven.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` is `docs/specs/rounding.md` plus the
  six files under `src/app/(dev)/design/sandbox/rounding/`, **plus one exception**:
  `src/app/(dev)/design/_data/docs.test.ts`, which pins the spec-doc list by name and is wrong the
  moment a seventh file exists. Two lines, corrected rather than handed back.
- The items, one line each (the builder's verdict; a kept family lands as the rounding block in the
  Library's foundations, because a family is a token set rather than a component):
  - `a` **A, today** (2 / 8 / 3) - kill. The one to come back to; a ruling of A changes no line.
  - `b` **B, square** (0 / 6 / 0) - refine. The honest version of the claim A only asserts:
    deliberate on a dark chapter, unfinished on paper.
  - `c` **C, soft** (8 / 12 / 4) - ship, and the board's pick. A corner you can see, with the button
    still twice as round as the surface.
  - `d` **D, one family** (14 / 14 / 6) - kill. At 14 the card out-rounds the button, which is bible
    8 upside down, and a 6px corner eats a photograph at 375.
  - `e` **E, print** (10 / 14 / 0) - refine. NEW. The only family that moves the photograph away
    from the surface, and it closes the album's gap by deletion.
  - `f` **F, half a step** (6 / 10 / 3) - refine. NEW. The cheapest change that is visible at all,
    and the only one besides A that costs no sweep of the 52 literal corners.
- The asks that survive, and why each is not one item:
  - `actions` (today / a full pill / quiet) - the button rung is true whichever family wins, and it
    owns a surface that is not a button: the guest entry sheet, at 1.4x its token.
  - `ladder` (today's steps / even quarters) - the seven derived steps sit ABOVE the card's corner,
    so they are the same question under every family and only bite once the base is round.
  - `dead-rungs` (keep seven / drop the top two) - a subtraction from the ladder rather than a
    value: three uses in the product between them, one of which is the Badge faking a pill.
  - `gap` (pin it / leave the 3px) - a bug, not a preference. Three files write the album's gap as a
    literal while their photographs ride the token, and a yes is also a yes to scheduling that sweep
    in another lane.
- Assets requested from Will: **a worst-case tile set for the gallery gap** · four photographs with
  near-white, bright edges (a tablecloth, an overexposed sky, a white dress), 1200px long edge, JPG
  · replaces the wedding-golden / party-dj / festival-lights set every grid on the board borrows,
  which are all mid-key and hide a corner hole.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. Lab only; no production byte
  changed.
- Look at first: **the catalog at 375.** Six cards, each one piece of the app at a phone's own width
  with a real 375 viewport under it wearing the same block. Then press A on `a` and B on `e` and
  read the home page twice, scroll-locked. Then set the winner to `d` and open the calls: the
  album's gap opens a hole at every junction, which is the round's worst finding, drawn rather than
  argued.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). The rounding board was rebuilt as a catalog: a
FAMILY became a whole answer (the surface, the floating layer, the photograph and the gap it pins)
rather than one coordinate of a three-axis machine, and six were named, four the standing A to D and
two written from the ground up where the four had a gap. Each card is one piece of the app at a
phone's own width at 1:1 over a real 375 viewport wearing the same paste; Pick is page wide and the
real pages below wear it, while A and B put any two on one real page, scroll-locked. Four asks
survived, each true whichever family wins. Seven parts became five, the argument went under the
evidence, and the board came from 4,859 words outside its folds to 2,564 against a declared 2,800.
Both sweep findings were fixed by subtraction: the tuner panel is no longer mounted, and the board
no longer measures the page to pull its rows past a column the shell now clips.
