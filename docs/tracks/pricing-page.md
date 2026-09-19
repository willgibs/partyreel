---
track: pricing-page
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board pricing-page` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The decisions, one line each: `<id>: the question; the options; the recommendation`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
