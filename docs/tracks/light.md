---
track: light
status: handed-off
cut: "1b11ab9a"          # Round 4 of the revamp: the six paper boards rebuilt as catalogs (2026-09-16)
board: light
owns:
  - src/app/(dev)/design/sandbox/light/
  - docs/specs/light.md
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
  - docs/reviews/light.json
  - src/components/dev/candidate-style.tsx
  - src/components/dev/tuner-store.ts
---

# lp/light

**Goal.** Rebuild the light board as a catalog, on Will's round-five answers (`docs/reviews/light.json`:
the kit lands as written (`kit=land`), the infusion begins at phase 1 (`infusion=phase-1`), the aurora's
register is Accent (`register=accent`: "Identity feels way too weak"), and two asks he marked not clear
even in plain words, the aurora's first landing (`aurora`) and the depth cues in dark (`depth`): those two
become things he can SEE and rule on as items or as a two-way compare, never a question with token
options again). The items are the twelve treatments the board carries, each a card that is the real
section wearing the treatment at true size with its own Replay and four facts (where it lands, what it
costs in frame time, its register, its rest state); the compare section puts one real section under two
treatments at once; Pick applies the treatment's block to the site (the existing apply path) and the real
pages wear it below. The asks that survive: the infusion order, the lamp's clock, the paper lamp set, the
publish flourish's colour; each still with its context and options in words. The board today weighs
10,164 words outside its folds, the heaviest but one; it must come in under the budget.

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

**Questions.** Five, each carried out with the recommendation rather than parked.

1. **The two asks Will could not answer: items, or a compare?** The goal offered both.
   *Answered: items where the thing is already a card, a compare where it is not.* The depth cues ARE
   two of the twelve (lift, float), so "the shadow family", "the lift only" and "no shadow in dark" are
   just two verdicts, and the ask is gone. The lit-face ask went the same way (adopt, adapt, drop are
   keep, refine, kill on the `face` card). The aurora's landing is neither: it is one treatment in four
   places, so it became a page-wide `Landing` switch with a two-way compare of one real chapter under
   it, and the aurora card carries the ruling. Nine asks became four, and neither of his two is a
   question any more.

2. **The reading budget: 1,200 words, or the catalog the goal asks for?** The two are in direct
   tension. A twelve-card catalog with four facts each, plus four asks, has a floor above 1,200 that
   the board does not choose: measured on the rendered page, the index reprints every lede (134), the
   meta panel prints all twelve rationales unfolded plus the departures and the assets (535), and the
   review panel prints every ask and every card name a third time (232). That is about 990 words of
   template. *Answered: cut everything the board DOES choose, then declare the rest.* Round five
   weighed 10,164; this weighs 2,889, the lightest catalog in the lab (palette 3,982, type-scale 4,220,
   floating-surfaces 5,040), and `reading: { words: 2950, why }` says the arithmetic out loud. **The
   finding, for the kit lane:** fold the meta panel's Ideas rows the way the card already folds them,
   and the same twelve cards drop by about 260 words with nothing lost. `src/components/lab/answer.tsx`
   is not this track's to edit.

3. **What is a card's preview when the treatment is a whole chapter?** A 1440 section cannot sit
   unscaled in a 520px card, and scaling it is the one thing Will ruled out. *Answered: a CROP, not a
   scale.* The section is laid out at the canvas width and the card is a window onto it, opened on the
   middle rather than the left gutter (the first build showed 440 pixels of empty margin), with the
   rest one sideways scroll away. Every pixel is the pixel the page ships. The aurora's card is the
   exception that proves it: its bands are 42 percent of the SECTION's height at its own boundaries, so
   that card is all 510 pixels of the real closer rather than a window onto part of it.

4. **Does a card that already ships get an Apply button?** *Answered: no.* Six of the twelve either
   already run in production or are a mount rather than a token, and a button that claims to apply
   something and changes nothing is worse than no button. `blocks.ts` returns the block where one
   exists and the dock prints why where it does not.

5. **The register control, now that Accent is ruled.** *Answered: keep it, default Accent.* It is no
   longer an ask. Identity stays reachable because if Accent ever reads as too strong on a real page,
   that is the number to come back to rather than a new design, and the board says so in a note.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none

## Deferred (ROADMAP one-liners, bucket named)

- The lab: fold the board template's meta panel (`answer.tsx` BoardMeta) so a catalog's twelve
  rationales, departures and assets sit behind a disclosure like the card's own; about 990 of the light
  board's 2,889 counted words are template reprints. (Bucket: the design lab / Library x Lab.)
- The lab: `/design/lab/proposals/rounding` answers 404 and `pnpm lab:smoke` wants 200. Pre-existing on
  `launch-prep`, outside this lane, and the only route failure in the smoke. (Bucket: the design lab.)

## Handoff (replaces the chat report)

- Head `6b174623`, pushed. Synced: `origin/launch-prep` had moved 21 commits (Round 4's three
  catalogs), merged in at `1b566aa0` before the gate.
- Gates on the synced tree: typecheck ok, lint ok (0 errors, 6 pre-existing warnings, none in this
  lane), test ok (2,139), build ok (257 static pages). `pnpm lab:smoke --base http://localhost:3108`:
  all six light routes 200 (the board and its five review sessions), reading **2,889** against the
  board's declared 2,950, down from 10,164. The one route failure in the whole smoke is
  `/design/lab/proposals/rounding`, pre-existing and not this lane's.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/specs/light.md` plus the fifteen
  files under `src/app/(dev)/design/sandbox/light/`, which is `owns` exactly, plus this file. No
  exceptions.
- **The items** (the builder's verdict; a kept one lands as the Library entry named):
  - `step`: ship; lands as the elevation contract's first technique, written down as it already is.
  - `ring`: ship; lands as the fourth depth technique, named for the first time (77 uses, no document).
  - `lift`: ship, and the board's own pick; lands as `--shadow-lift` with its per-ground alpha ramp.
  - `float`: ship; lands as `--shadow-layer` on the floating primitives and the toast.
  - `face`: refine; lands as `[data-lgt-cue="lit"]` fenced to frames, screens and plates.
  - `seam`: ship; already ships (footer-glow, film-strip-glow, screen-lamp), named as the model.
  - `throw`: refine; a mount, so it lands as a call site rather than a token.
  - `aurora`: refine; lands as `<SectionLight>` plus `--aurora-cadence`, at the ruled Landing.
  - `sweep`: refine; the half of the engine's recipe that has never shipped.
  - `bloom`: refine; lands as the publish keyframe at 305 with a resting base.
  - `halo`: kill; it cannot light a white primary and its own fence is argue it every time.
  - `beam`: ship; already ships (pro-card-beam), counted rather than re-argued.
- **The asks that survive**, and why none is one item: `infusion` is an ORDER over phases, not an
  object; `cadence` is one token every lamp on the site shares; `paper` is five values re-declared on
  one ground; `publish` is a ratified colour being moved five degrees, which is asked rather than taken.
- Assets requested from Will (both already on the board's own list):
  - A grain tile, so the aurora stops banding · seamless monochrome noise, 256x256 PNG-8, one-pixel
    grain, neutral, mean 50 percent grey, used at 5 percent and laid out at 128 CSS px on a 2x screen ·
    replaces the inline feTurbulence stand-in in `board.css` (`[data-lgt-grain]`).
  - A worst-case pair of overlapping photographs · two images whose touching edges are both dark and
    low contrast (a night reception, a dim dance floor), 1200px long edge, JPG · replaces the
    reception-hall and wedding-toast pair on the lift card.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. This round ships no production
  byte: every file is under the lab's sandbox.
- **Look at first:** the catalog on App dark, where Lift and Float sit side by side as Without and With
  it. That is the question Will could not see last round, and it is now two verdicts rather than three
  tokens. Then the aurora card, and flip Landing in the dock: the footer keeps its own seam under every
  option, which is the confusion the switch exists to end.
- Verified live on a local `pnpm dev` at 1440 and inside a 375 viewport: no horizontal page overflow at
  either (`scrollWidth === clientWidth`), the catalog grid collapses to one column, every crop opens on
  the middle of its canvas, Motion Rest freezes all eight bands and both edges to `animation-name:
  none`, the aurora's two bands run at 33s (three laps of the lamp's 11s, so the round-four frozen-token
  landmine has not returned), and picking Lift writes the shadow-family block into the real `/` frame's
  adopted stylesheet (`--shadow-lift: ... 0.45`). Console clean. The browser window could not be
  resized by the test tooling, so the 375 pass ran in a same-origin iframe at 375 wide, which gives the
  real media queries.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). Round six rebuilt the light board as a catalog on
Will's round-five answers: the kit landed, phase 1 first, Accent as the global register. The two asks he
refused stopped being questions, because both were arguments where he was owed a picture: the depth cues
are now the lift and float cards (two keeps is the family, one is the lift only, two kills holds the
contract), and the aurora's landing is a page-wide switch with a two-way compare of one real chapter
under it. Twelve treatments became twelve cards, each the real production surface wearing it at true
size with four facts and its own Replay; Pick hands the site that treatment's block and the real routes
below wear it at 1:1. Four asks survive, none of them one object. The board fell from 10,164 words
outside its folds to 2,889, the lightest catalog in the lab, and five files left with the round.
