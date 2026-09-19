---
track: pricing-page
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "1928c3c4"         # the launch-prep SHA the branch was cut from
board: pricing-page     # round one: the marketing pricing page, every part its own decision
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/pricing-page/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/PRICING.md
  - docs/systems/marketing-content.md
  - docs/systems/billing-caps.md
  - src/lib/constants/tiers.ts
  - src/lib/constants/marketing-voice.ts
  - src/app/(marketing)/(cinema)/pricing/page.tsx
  - src/components/marketing/sections/pricing/
  - src/components/marketing/sections/home/faq-accordion.tsx
  - src/components/marketing/system/page-hero.tsx
  - src/components/marketing/system/paper-chapter.tsx
  - src/components/marketing/system/section-shell.tsx
  - src/components/marketing/system/cta-band.tsx
  - src/components/app/checkout-button.tsx
  - src/app/(dev)/design/sandbox/loose-ends/spec.ts
  - src/app/(dev)/design/sandbox/app-pricing/spec.ts
---

# lp/pricing-page

**Goal.** Round one of `pricing-page`: the MARKETING PRICING PAGE, every part of it its own decision. Will
(2026-09-19, `docs/design/rulings.md`, "the pricing page beyond the in-app surface", verbatim): "a more granular
exploration than simply comparing new page versions themselves at such a high level. Again, everything is
unprotected and may be reconceived from scratch or relitigate absolutely anything." Six to eight decisions with
`defineExploration`, each on ONE part of the real page (the opening, the plan pair, choosing a size, the pass,
the calculator, the table, the questions and the close, the phone), every option drawn with the real pieces and
the numbers read from `tiers.ts`, at 1440 and 375, a recommendation each, every number measured. Never a
whole-page version to rule on. **Not in this round:** any production byte; the prices, caps and plans (locked in
`PRICING.md`; the board reads them, never argues them); Checkout and the portal; the in-app pricing surface
(`app-pricing`, building in parallel: this page is its "learn more" second layer, and the two boards are
independent, so neither assumes the other's answer); the FAQ accordion's look (`loose-ends`, on the desk).

**What is measured (the tree at the cut).** A dark `PageHero` with one of the golden lines, then a paper chapter
with the `PlanPair` (Free and Pro, ruled 2026-08-27 as "stacked photos: two grayscale on Free, four vivid on ink
for Pro, hover spreads; money set in the display face"; Pro's three sizes on a selector and its two cadences on a
toggle inside the card) beside the `PassCard` (the Event Pass, once), then the `UnlockGrid` (what Pro unlocks), the
`Calculator` (ruled 2026-08-27 as "album fill: the wall fills as you slide, on the real gallery grammar; the receipt
line stays the accessible summary"; a storage slider, video on or off, once or hosting again, `recommendPlan()`
answering a plan, a reason and an alternative), a second paper chapter with the `ComparisonTable` (five groups,
about twenty rows), the `SharedBand` (seven things every plan shares), the FAQ (eight questions with JSON-LD; the
four that settle money: pass-to-Pro conversion, stacking, the cap's consequence, cancellation) and the `CtaBand`.
The page is static and tier-blind (it cannot tell a signed-in Pro they already subscribe; `checkout-button.tsx`
says so); every "Upgrade" in the app lands here today. The tiers: Free ($0, 2 GB, one event, no card, no trial);
Pro at 100 GB $9 or $90, 500 GB $19 or $190, 2 TB $39 or $390 (annual exactly ten months, ruled); the Event Pass
$24 once, 75 GB, one event, about a year, renews at $15, stacks, converts unused time to credit toward Pro; "never
priced per guest". The behaviour pins: `tiers.test.ts` (PLANS' integrity, the annual times ten, marketed numbers
only move up), `tier-limits-parity.test.ts`, `recommend.test.ts` (the calculator's answers), `page-hero-contract`,
`marketing-h1-policy`, `type-ladder-policy` (headings on a step), the JSON-LD tests, the no-em-dash policy; they
guard function, the look is open, and the two rulings of 2026-08-27 are precedent the goal reopens by name.

**The decisions (suggested; yours to recut, never forced apart).** THE OPENING (what the page opens on: the dark
hero and its line, as today; the plans as the hero, a price the first thing seen; the question first, "one event
or hosting again?", the page arranged by the answer); THE PAIR (how Free and Pro stand: two cards with stacked
photographs; Free as one line beneath Pro, the page about Pro; Pro's three sizes as three cards with Free at the
foot); CHOOSING A SIZE (100 GB, 500 GB, 2 TB and the cadence: a selector and a toggle inside the card; a slider
that sets the size with the price following; the calculator as the only picker, the card reading its answer);
THE PASS (the Event Pass beside Pro: a card beside, as today; first, for the one-event host most visitors are,
Pro second; a switch, once or again, that changes what the page shows); THE CALCULATOR (as today; cut, its
guidance written into the cards; merged into the pair as its size's source); THE TABLE (five groups; the unlock
grid alone, no table; the table behind a disclosure, "compare everything"); THE QUESTIONS AND THE CLOSE (eight
questions and a band; the four money questions inline beside the cards, the rest to help; no questions, one
line under each card that settles its own); THE PHONE (the page at 375: everything stacked; the pair as a swipe;
Pro and the pass as two tabs). Optional if it fits the budget: THE RHYTHM (dark, paper, paper: where the page's
chapters cut). The `loose-ends` board is the worked example for a board on marketing pieces; `app-shape` and
`guest-shape` for fixtures and measured captions; copy their approach, import nothing from another board's
directory.

**Binds.** The bible; `tiers.ts` is the single source of every number and name (the board reads `PLANS`, never a
literal; the parity test stays green); the annual ruling (exactly ten months, two months free); the tiers locked
2026-05-29 in `PRICING.md`; the two rulings of 2026-08-27 as precedent; cost frugality; the JSON-LD stays true to
the page; no em-dashes; the copy is open (bible 21). Mobbin is encouraged, never required: pricing pages, plan
pickers, storage sliders, one-time versus subscription framings.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3134`,
  `pnpm lab:demo --board pricing-page` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 1440 and 375 on the real pieces, no request to Stripe from a preview; a capture of every option
  beside its words, the picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **The pair's third option was recut, and the goal's own suggestion was dropped.** The goal offered "Pro's three
  sizes as three cards with Free at the foot"; drawn that way it ANSWERS `size` before `size` is asked, which is
  forcing two decisions into one. The third option became "both on paper, Pro badged", which reopens the ink
  inversion the 2026-08-27 ruling gave Pro. **Recommended:** keep the recut; if the three-size-cards layout is
  what he wants to see, it is one more option on `size` in round two, drawn in whatever pair he picks here.
- **If the fork opening wins, both sides must stay in the DOM.** `opening=fork` shows only the plans on the side
  you press, and unmounting the other half would take half the page's copy, half its plan markup and half the
  ground its FAQ JSON-LD stands on out of the served HTML. **Recommended:** render both sides always and hide the
  unpicked one, so /pricing keeps one h1, all its copy and a true graph; the wiring lane owns the detail.
- **If `close=four` wins, the page's FaqPage graph shrinks from eight questions to four.** The four that leave go
  to /help, and structured data has to match what a reader sees. **Recommended:** accept the shrink and add the
  four to /help's own FAQ in the same change, so nothing is lost and nothing is claimed twice.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none: this round ships no production byte and owns no fact in `docs/systems/`.

## Deferred (ROADMAP one-liners, bucket named)

- **Now:** the lab kit's `Frame` portals a scene into `about:blank`, which has no doctype, so the frame's document
  is quirks mode and a `<table>` inside it does not inherit `color`; this board carries a one-line `table{color:
  inherit}` in its own scene, and `frame.tsx` should carry it for every board that ever portals a table.

## Handoff (replaces the chat report)

- Head: the tip of `origin/lp/pricing-page` (this manifest commit); the code and both merges are at
  `6542afe4`, which is the SHA the gate below was run on. Pushed; synced with `origin/launch-prep` twice (`074a39ab`, then `03f47443` after the
  Orchestrator's note); the `reads` line for the deleted `docs/tracks/app-pricing.md` kept origin's version.
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` ok, the specimen collector ok,
  `pnpm typecheck` ok, `pnpm lint` ok (0 errors, the 8 known warnings, none in this lane), `pnpm test` ok
  (2,521 in 241 files), `pnpm build` ok (254 pages); `pnpm lab:smoke --base http://localhost:3134` ok (332 checks,
  0 failing; the board reads 660 words of 1,200); `pnpm lab:demo --board pricing-page` ok (8 steps, 0 failing,
  every step draws its options, tallest 6.4 screens on `sheet`).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the nine files of
  `src/app/(dev)/design/sandbox/pricing-page/`, the three registration lines (`sandbox/registry.ts`,
  `(shell)/lab/boards.ts`, `touchpoints.ts`: one import and one list line each, plus the RULINGS row after
  `river-visual`'s and both unions), and `docs/design/library.md` as `pnpm design:rules` wrote it. No exceptions.
- The decisions, one line each:
  - `opening`: what the page opens on; today's dark hero and ruled line · the plans as the opening on paper · the
    question first, two priced doors, the plans below showing the side you press. **The fork**, on the measurement:
    the first price lands 426 px down against today's 735, and it is the range rather than one card.
  - `pair`: how Free and Pro stand; today's two cards with Pro in ink · Pro across the row with Free one line
    beneath · both on paper with Pro badged. **Pro takes the row**: Free is the way in, not a plan anyone compares,
    and the seat it frees is what the pass needs. At 375 it is 1,689 px of plans against 2,175.
  - `size` (after `pair`): how Pro's size and cadence are picked; today's three-way switch · three rows with all
    three prices at once and the cadence in the card head · one slider the price follows. **The rows**: a switch
    hides two of the three prices, and the rows cost the card about 50 px.
  - `pass` (after `pair`): where the Event Pass stands; today's wide ticket under the plans · in the row as an
    equal card · first, before the subscription, carrying the badge. **In the row**: the comparison table already
    calls these three equal plans and the cards say two-plus-an-afterthought.
  - `fit`: what Find your size is; today's slider over the filling album wall · cut, one line of capacity per plan ·
    two questions and a receipt. **Today's wall**: it is the one place the page shows rather than tells, and it
    costs 1,056 px against the flat lines' 537.
  - `sheet`: how much of the full sheet the page shows; today's tiles, table and band · the table alone with the
    shared floor closing its chapter · the tiles with the matrix behind one line. **The table alone**: the tiles are
    four of its own rows written twice, and the page goes from 2,676 px to 2,053.
  - `close`: how the page ends; today's eight folded questions then the band · four open in two columns, the rest to
    Help · no questions, the band alone. **The four, open** (bible 21: copy is open), 1,021 px against 1,152.
  - `phone` (after `pair`): what the plans do at 375; today's stack · a snapping row one card at a time · two tabs,
    one event and hosting again. **The swipe row**: 1,250 px of plans against stacking's 1,850.
- Assets requested from Will: none. Every photograph on the board is an existing `marketing-media.ts` id.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. No preview can reach Stripe: the plan cards
  are a lab copy whose buy control has no handler, and the shipped table and band sit in a zone whose clicks are
  stopped in the capture phase (`scene.tsx`).
- Mobbin citations: none. It was consulted for nothing; the three worked examples on the desk were enough shape.
- Captures: read live in the browser pane against each frame's own measured caption rather than saved as files;
  the numbers every recommendation quotes are those captions, and three defects came out of that pass (below).
- Look at first: **`opening`**, because the fork is the round's one real swing and its measurement is what moved
  the recommendation off the safer answer. Then **`pair`**, because three other decisions are drawn in its world.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). Round one of the marketing pricing page came back as eight
decisions rather than page versions: the opening, how Free and Pro stand, choosing a size, where the pass stands,
the fit block, the grid-table-band stretch, the close and the phone, with size, pass and phone staged behind the
plan row so each was asked in the world the pair answer creates. Every option drew the real components at 1440
and 375 on the ground that part stands on, every price came out of `tiers.ts`, and every frame carried a measured
caption: how tall the part ran and how far down its first price landed. Reading those captions against their own
words caught three defects, all fixed before handoff: an inline grid that drew two plan cards side by side in a
phone, a portalled frame in quirks mode whose comparison table lost its colour inheritance, and an argument about
the fold that the frame said was 735 px rather than a screen, which moved the opening's recommendation to the fork.
