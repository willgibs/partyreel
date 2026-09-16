---
track: brand-voice
status: handed-off
cut: "1b11ab9a"          # Round 4 of the revamp: the six paper boards rebuilt as catalogs (2026-09-16)
board: brand-voice
owns:
  - src/app/(dev)/design/sandbox/brand-voice/
  - docs/specs/brand-voice.md
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
  - src/lib/constants/marketing-voice.ts
  - src/components/marketing/
  - src/components/app/
  - src/components/guest/
---

# lp/brand-voice

**Goal.** Rebuild the brand-voice board as the comparison Will described (2026-09-16, verbatim: he
wanted "a couple dozen spot examples across the marketing site and app" where he can "compare 2 brand
voices in usage side by side" with "a config to choose which 2, then select my winner"). The board's
items are the voices themselves (Today, and the candidate voices the board already carries, each a card
with one line and four facts); the board's main surface is a SPOT LIST of about two dozen real places
across the marketing site AND the app (a hero, a feature section's headline and body, a pricing card,
the footer, a help article's opening, the sign-in door, the guest door, the upload sheet's copy, an
empty state, a dashboard header, a toast, an email's first line: real components and sections, not
mock-ups), each spot shown twice under the two voices the dock's A and B pick (`SpotCompare`), with a
scroll or a dropdown to jump to a spot; one winner pick at the top (the clearable pick control) that the
whole page and the real pages below wear; asks only for what a voice does not decide (the noun for the
product, the unfurl line). The voice's rules are written AFTER the pick, as the proposal in
`docs/specs/brand-voice.md` (today 522 lines of tuning explanations and ledgers: it becomes the standing
proposal alone). The board today weighs 13,024 words outside its folds; it must come in under the budget.

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

## Questions (answered with the recommendation, and carried on)

**1. Six voices rather than the three the board carried?** The goal says "the candidate voices the
board already carries", which is three (Today, A, B). Three is not a catalog and a two-way config
over three is not a config: one of the three pairs is always Today against itself. **Recommended and
built: six.** Today and the two, renamed for what they DO (Keepsake, Live) rather than by a letter,
plus three written from the ground up (bible 22): Plain (short declaratives, no scene), Everyone
(the room's point of view rather than the host's), Aside (a claim, then the chore it spares you).
Every one of the 85 lines is written six times. If six is three too many, kill three cards on the
board and the rest still stands.

**2. Does the winner bind the app and a guest's phone, or only the marketing site?** The board
assumes ONE voice at three volumes and judges it on all three surfaces, because the volumes were
measured not to fork with the voice (round one on four surfaces, round four on sixteen).
**Recommended: one voice everywhere, three volumes.** The alternative is a marketing voice and a
separate product voice, which is two guides and two sweeps.

**3. The board declares a reading budget of 2,700 words against the 1,200 default.** Round five
weighed 13,024; this one weighs 2,642, and about 900 of those are the template's own (the answer,
the asks, the meta panel's six ideas and its rules-broken, the review panel) which no board can
fold. The rest is arithmetic: two dozen places cost a name, the kit's own "under A and under B" line
and two captions each, before the board says anything of its own. **Recommended: accept the
declaration.** Cutting to twelve places would land near 1,900 and would answer half the brief.

**4. Aside is on the board to test bible 20's edge, on purpose.** The rule says name what we are,
never what we are not. Aside never names a competitor, but every line is shaped by a chore the
reader recognises ("Nobody is installing an app", "The group chat has done enough").
**Recommended: read the card and say whether the rule means the naming or the shape.** If it means
the shape, Aside is a kill on sight and the finding is worth having in writing.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none

## Deferred (ROADMAP one-liners, bucket named)

- **Now, the lab and the kit:** `SpotCompare` writes its own "What differs" line per spot with no way to shorten or suppress it, which costs a two-dozen-spot board about 250 words of its reading budget; take an optional `differs` (or `differs={false}`) the way `CompareTwo` already does.
- **Now, the lab and the kit:** the standing line "Lift `height=\"measured\"` on `Frame` and `useAnchorAfterSettle` out of `sandbox/brand-voice/frames.tsx` into the kit" is still owed; this round kept both and shrank the file around them.

## Handoff (replaces the chat report)

- Head `7994b5a9`, pushed; synced with `launch-prep` at `86ccf239` (it had moved 11 commits; merged, gate re-run on the merged tree).
- Gates on the synced tree: typecheck ok, lint ok (0 errors, 6 pre-existing warnings), test ok (2221), build ok (256 pages). `pnpm lab:smoke --base http://localhost:3105` green for this board on both halves: all 8 `brand-voice` routes 200, **2,642 reading words against the 2,700 the spec declares** (round five weighed 13,024). The one smoke failure on the tree is `/design/lab/proposals/rounding` (404, pre-existing, another lane).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/specs/brand-voice.md` + the five files under `src/app/(dev)/design/sandbox/brand-voice/` (`board.tsx`, `frames.tsx`, `spec.ts`, `voices.ts`, new `voices.test.ts`) + this file. No exceptions.
- **The items, one line each** (the builder's verdict; a kept one lands as the voice `docs/specs/brand-voice.md` is promoted to `docs/systems/brand-voice.md` in, and the `voice-infusion` round sweeps):
  - `today` **kill**: the shipped strings, verbatim, as the control. Rewrites 0 of 85.
  - `keepsake` **refine**: warm and plain, about what the host ends up holding. The register the ratified lines already speak. Rewrites 31 of 85, so it is the cheap adoption and the small lift.
  - `live` **ship** (the board's own pick): present tense, verb in front, the album filling while the party is on. Rewrites 58 of 85 and costs a row on the h1 at 375.
  - `plain` **refine**: short declaratives, no scene. The only voice that never has to be turned down for the app, and the only one that never sells.
  - `everyone` **refine**: the room's point of view. The only card that says the product's asset is forty phones, and the only one that rarely says "you" to the buyer.
  - `aside` **refine**: a claim, then the chore it spares you. The only one anybody would quote, and the one testing bible 20's edge.
- **The asks that survive, and why each is not one item:** the NOUN a guest's phone uses (album on the site and the app, gallery on the shipped guest pages: a component name, not a sentence shape); the LINE a group chat draws on an email-gated event (one string whichever card wins, parked since before this track); the PAIR OF COUNTS the home page quotes (312/48 in the hero against 214/23 in the band below: one source, not a voice).
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. No production byte changes.
- **Look at first:** the six cards (section 1), then Today against Live from the top of the spot list, then the same list at 375 with A on Keepsake and B on Aside, where the headline rows are read rather than asserted. Then press Pick on one card and scroll section 4: the home page has to land in the voice it opened in.
- One fix outside the copy, worth the Orchestrator's eye: `CardGround` no longer writes `data-mkt-skin`. It renders on the BOARD's page rather than inside a frame, and `body:has([data-mkt-skin="cinema"])` in marketing.css was painting the lab itself room-dark and forcing `color-scheme` on it. Verified in both themes: body light in light mode, the cinema strips still 0.11.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). The brand-voice board was rebuilt to Will's brief:
six voices as catalog cards, each writing the same two screens at a phone's own 343px column, and a
spot list of twenty-four real places across the marketing site, the host's app and a guest's phone,
every one drawn twice in a real 1440 or 375 document on the component that ships it. Three columns
became six (Plain, Everyone and Aside written from the ground up); eighty-five lines were written six
times, sixty of them differing and the other twenty-five each saying why they cannot. Thirteen
sections became five, seven asks became three (the noun, the unfurl, the counts: the calls a voice
does not decide), and the reading went from 13,024 words to 2,642 against a declared 2,700. The
research prose left `docs/specs/brand-voice.md`, which shrank from 522 lines of tuning ledgers to a
185-line standing proposal. `CardGround` stopped writing `data-mkt-skin`, which had been flipping the
lab page's own body through marketing.css.
