---
track: media-kit
status: handed-off
cut: "1b11ab9a"          # Round 4 of the revamp: the six paper boards rebuilt as catalogs (2026-09-16)
board: media-kit
owns:
  - src/app/(dev)/design/sandbox/media-kit/
  - docs/specs/media-kit.md
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
  - public/design/media-kit/
---

# lp/media-kit

**Goal.** Rebuild the media-kit board as a catalog: the items are the ranked sources of photographs
the board carries, each a card with its contact sheet (the real frames at the real card size on the
production ground), one line and four facts (the price, the quoted licence clause, the release fact for
faces, the count), the builder's verdict ship above the line and kill below; the compare section puts two
sources' frames side by side at the real card size (`CompareTwo`); Pick is the source the bridge fills
from, clearable with `none` as its default, and the real pages (the home's event cards, a feature page's
stills) wear the pick below. The asks that survive are the sourcing rule, the spend, the crowd rule and
the shoot, each still with its context and options in words (they are already plain; keep them). The
plan tables, the licence quotations and the call sheet fold under the evidence or leave for
`docs/specs/media-kit.md`, which itself (835 lines today) shrinks to the standing proposal. The board
today weighs 15,004 words outside its folds, the heaviest of all; it must come in under the budget.

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

**Questions.** What the goal leaves open goes here, numbered, with your recommended answer; carry on
with the recommendation. Never guess at a product decision without writing the question down.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none

## Deferred (ROADMAP one-liners, bucket named)

- Now: the lab dock renders every declared control as a pill row, so a catalog of thirteen costs
  thirty nine pills across Pick, A and B; a select above about eight options gives the dock back a
  screen (`src/components/lab/board-state.tsx`, `ControlKnobs`).
- Now: `useMountOnApproach` frames never mount under the Browser-pane preview, because that surface
  delivers no IntersectionObserver callbacks at all (measured directly: an observer on a plainly
  intersecting element never fired). Every board with `onApproach` frames is unverifiable by that
  tool, palette included; a line in `docs/systems/testing-verification.md` would save the next agent
  the hour it cost this one.
- Now: `touchpoints.ts`'s media-kit entry still describes round four ("a plan that totals $56",
  variants "The sheet / The plan / Mix / Ours"). Mix and Ours no longer exist. One line, outside this
  lane.

## Handoff (replaces the chat report)

- Head `c74224ff` plus this commit, pushed; synced with `origin/launch-prep` at `71b7349a` (it moved
  four times during the round: type-scale, floating-surfaces and light integrated, then the meta
  panel's rationale fold).
- Gates on the synced tree: typecheck ok, lint ok (0 errors, 6 pre-existing warnings), test ok
  (2,103), build ok (257 pages). `pnpm lab:smoke --base http://localhost:3110` green for this board
  on both halves: every media-kit route 200, **2,686 reading words** against a declared 2,750.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `sandbox/media-kit/**` and
  `docs/specs/media-kit.md` only, plus this manifest. No exceptions.
- **The reading, declared.** 15,004 words became 2,686, and the remaining floor is structural rather
  than prose: thirteen cards cost their name, line, four facts and verdict row (about 950), the meta
  panel prints all thirteen again, the dock carries thirty nine pills because a pick and two compares
  over thirteen places is thirty nine, and four questions carry the context Will ruled they must. The
  argument is folded and the frames are the evidence. The cheap way under 1,200 is to drop the facts,
  which is the one thing a reviewer compares thirteen places on. `reading: { words: 2750, why }` in
  the spec says so, and the smoke prints the reason.

**The items, one line each.** A kept card is not a component, so none lands as a Library entry: it
lands as a purchase, a `MARKETING_IMAGES` entry and a line in section 2 of the spec doc.

- `unsplash-plus`: **ship** (the board's own pick); kept, it is the $20 month the bridge is bought in.
- `istock`: **ship**; kept, it is the three conference frames at $12 nothing else covers.
- `stocksy`: refine; kept, it is the one or two frames that carry a page, at $35 each.
- `adobe-stock`: refine; kept, it is a credit pack for hard frames, never the way to buy thirty six.
- `artgrid`: refine; kept, it is the films at $299 a year, and it is the line the shoot deletes.
- `websummit-flickr`: refine; kept **only if question 3 answers "only the subject"**, and then it is
  87,066 conference photographs for the events nothing paid is deep in.
- `flickr-cc`: refine; the same ruling moves it, for the four kinds Web Summit does not cover.
- `envato-elements`: kill; a lease priced as a purchase.
- `nappy`: kill; the best free library at what the corpus is worst at, and still no released face.
- `mixkit`: kill; revocable.
- `coverr`: kill; two catalogues in one grid, so it would have to be audited per item.
- `death-to-stock`: kill; the nicest pictures, rented.
- `creative-market`: kill; the cheap tier forbids an advert, and the frames are unseen.

**The asks that survive, and why none is one item.** Each is a decision ABOUT the thirteen rather
than a choice among them, which is why it is a question and not a card.

- `rule` (the six facts on every entry): it is what ranks the catalog, so it cannot be one card in it.
- `spend` ($56 now, or wait): a sum across two cards plus a date, not a preference between them.
- `crowds` (every face, or only the subject): one ruling that moves two cards across the line at
  once. Its evidence is now the compare, opening on Web Summit beside Unsplash+, because the answer
  is reached by looking at a released room beside a real one nobody in it signed for.
- `shoot` (the thirty six, in one night): about a night we host, which no catalogue on the board is.

**Questions** (answered with the recommendation and carried on).

1. **Where is the line drawn, by the rule or by the board?** Drawn by the BOARD's verdict, so Web
   Summit and Flickr sit above it although the rule bars them today: one answer to question 3 makes
   them sources, and burying them under six killed places would hide what that ruling is worth.
   `barred` in `sources.ts` still holds the rule's own line. **Recommend: keep it as built.**
2. **Which geometry is the card's specimen?** The blog card, 320x400 at 1440 and 343x429 at 375,
   measured against the real page rather than guessed, on PAPER, which round four had wrong (it
   judged every frame on cinema). The share card at 1200x630 is in the compare. The footer strip and
   the nav panel are only in the real-page frames. **Recommend: keep; the blog is where a wrong
   frame shows first.**
3. **What happens to the staged batch?** The 22 CC0 files under `public/design/media-kit/` are no
   longer rendered anywhere (the bridge left with round five), but `provenance.test.ts` still pins
   them both ways, because ask 1 claims the rule is a passing suite rather than a proposal.
   **Recommend: keep until ask 1 is ruled, then delete the directory with the board.**
4. **Is one name enough?** Each card carries one short name used on the card, in the dock and in the
   compare labels ("Web Summit", not "Web Summit's Flickr archive"): thirty nine pills at the full
   names was six wrapped rows of dock before the reader saw anything. **Recommend: keep.**
5. **Should the conference frames be judged on the conference post?** The strip shows one real post
   per kind of event, so setting Kind of event to conferences puts the real conference headline over
   a real conference room. **Recommend: keep.**

**Assets requested from Will**

- One month of Unsplash+ ($20) and 3 iStock Essentials frames ($36), $56 in total · a card, not a
  camera · replaces nothing; it is the bridge the shoot then replaces.
- 36 event photographs, six per kind of event · 1600 px long edge, a third portrait, one dark warm
  grade, call sheet `docs/specs/media-kit.md` codes W1 to T6, four of them the palette board's hard
  cases · replaces all 12 stand-ins by id (ASSETS row 7).
- 8 vertical clips with posters · 3 to 5 s, 1080x1920, silent, filmed at the same events · replaces
  the currentTime ranges cut out of hero-candidate-01 (ASSETS row 4).

**Proposed migrations / Worker / Vercel / Stripe / env changes:** none. No production byte changed.

**Look at first**

1. `/design/lab/media-kit` at 1440: the thirteen cards, each with real photographs at 320x400 on
   paper. Then set Kind of event to `Corporate and conferences` and watch which cards flag "nothing
   for corporate and conferences": that flag is the gap the $56 exists to close.
2. `/design/lab/media-kit?compare-a=websummit-flickr&compare-b=unsplash-plus&vertical=corporate`:
   question 3, as a picture. Free conference rooms nobody signed for, beside released ones at $20.
3. Press **Pick** on Unsplash+, then **Apply to the site**, then open `/blog`. Every marketing still
   on the page is replaced from Unsplash+'s own CDN. With nothing picked, Apply offers the exposure
   instead: every frame we cannot name, outlined and drained.
4. **The one thing I could not see myself:** the two 1:1 frames in section 3 never mounted under the
   Browser pane, because that surface fires no IntersectionObserver callbacks at all (`onApproach`).
   The swap they wear was verified another way, on the real `/blog` with the real `PostCard`: all 17
   `mkt-` images swapped. Please scroll to section 3 once in a real Chrome and confirm the right-hand
   frame is wearing the pick.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). Round six rebuilt the media-kit board as a
catalog: thirteen real places to get photographs, each a card carrying its own frames as the card the
blog really renders (320x400 on paper at 1440, 343x429 at 375, never scaled), one line, four facts
(price, the licence clause quoted, whether the people signed, the catalogue) and the board's own call,
two ship and five refine above a line the board draws, six kills below it. Any two side by side reads
the same frames at both sizes the site cuts; the pick is worn by the real routes in 1:1 frames and by
the running site through Apply, which offers the exposure while nothing is picked. Eleven sections
became three, `docs/specs/media-kit.md` shrank from 835 lines to the standing proposal, and the
reading went from 15,004 words to 2,686 against a declared 2,750. `catalog.test.ts` pins the cards to
`sources.ts` id for id and every quoted clause to its source's verbatim text, and caught a misquote on
its first run.
