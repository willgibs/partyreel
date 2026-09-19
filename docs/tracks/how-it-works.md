---
track: how-it-works
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "449d9b52"          # the launch-prep SHA the branch was cut from
board: how-it-works     # round one: the page that tells the loop, beside the article that tells it too
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/how-it-works/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/marketing-content.md
  - src/app/(marketing)/(cinema)/how-it-works/page.tsx
  - src/components/marketing/sections/how-it-works/spine.tsx
  - src/components/marketing/sections/how-it-works/step-frames.tsx
  - src/components/marketing/sections/how-it-works/reel-payoff.tsx
  - src/components/marketing/sections/how-it-works/pricing-pointer.tsx
  - src/components/marketing/sections/how-it-works/side-chip.tsx
  - src/components/marketing/sections/home/film-strip.tsx
  - src/components/marketing/sections/shared/inline-reel-player.tsx
  - src/components/marketing/system/page-hero.tsx
  - src/components/marketing/system/paper-chapter.tsx
  - src/components/marketing/system/cta-band.tsx
  - src/components/marketing/system/section-shell.tsx
  - src/components/marketing/system/reveal.tsx
  - src/components/marketing/frames/index.ts
  - src/components/marketing/chrome/mega-panel.tsx
  - src/components/marketing/chrome/marketing-nav.tsx
  - src/components/marketing/mock-parity.test.ts
  - src/lib/constants/how-it-works.ts
  - src/lib/constants/marketing-nav.ts
  - src/lib/constants/marketing-media.ts
  - content/help/how-partyreel-works.mdx
  - src/components/app/create-event-wizard.tsx
  - src/app/(dev)/design/sandbox/demo-event/spec.ts
  - src/app/(dev)/design/sandbox/voice/spec.ts
---

# lp/how-it-works

**Goal.** Round one of `how-it-works`: THE PAGE THAT TELLS THE LOOP (a host makes an event, shares a code, guests scan
and add with no app and no account, the link is the album, the reel comes back), reconceived from the ground up beside
the help article that tells it too. Will (2026-09-19, `docs/design/rulings.md`, "the overnight round"): explore every
surface, everything unprotected, "at worst, net neutral and fully deleted". Six to eight decisions with
`defineExploration`, each drawn on the REAL page pieces (`PageHero`, `Spine`, the step frames, `ReelPayoff`,
`PricingPointer`, `CtaBand`) with fixture props at 1440 and 375, a recommendation each, every number measured (the
page's height in windows per option, the first product picture's distance from the top). **Not in this round:** any
production byte; the h1 and the hero sub as lines (`voice`, on the desk, if it ratified them: check its spec first); what
the demo door promises (`demo-event`); `/pricing` (`pricing-page`); the home's film strip (the home's own round).

**What is measured (the tree at the cut).** The arc is three chunks, not the home's cinema: `PageHero` (`entrance="cut"`,
h1 "From QR to reel, start to finish."), ONE `PaperChapter` holding only the `Spine`, then `ReelPayoff` on dark, a
`PricingPointer` strip quoting the Free plan, and `CtaBand`; no stat band, no FAQ, no `MediaSplit`, `Conveyor`,
`TiltCard` or `DemoTicket`. The spine is six two-sided steps (Create the event, host; Scan and you're in, guest; The album
fills live, both; Shape it, host; Browse, save, download, everyone; The reel, the payoff), about 3,000 px of the page's
roughly 6 to 6.5 windows at 1440 by 900 (an estimate from the padding tokens; the board measures it). Pictures: step
three and the payoff use real photographs and a real rendered MP4 in a `BrowserFrame` and `InlineReelPlayer`; the other
five are bespoke `FrameCard` quotes that never wear the site's own `PhoneFrame`, `QrFrame`, `AlbumFrame` or `ReelFrame`,
and the reel's "phone" is a `max-w-[19rem]` div. The loop is told four ways with three counts: six steps here, five
`<Step>` blocks in `content/help/how-partyreel-works.mdx`, "four steps" in the mega panel's Resources card, three on the
home's film strip; `src/lib/constants/how-it-works.ts` calls itself the single source and only the welcome flow reads it.
The same link text "How Partyreel works" goes to the ARTICLE from the spine and the mega panel and to this PAGE from the
help hub. Step one says the event "is live the moment you create it" while the wizard creates the row once, at the end of
the design step. `marketing-content.md`'s page catalogue has no entry for this page. The pins: `page-hero-contract.test.ts`
(the real h1, never reveal-gated, the trim math); `mock-parity.test.ts` pins one literal ("Email me a code") between the
step frames and the sign-in form; nothing pins the spine, the payoff, the pointer or a step count; there is no HowTo
structured data.

**The decisions (suggested; yours to recut, never forced apart).** THE PAIR (the page beside the article: today's split,
the same words linking two places; one page, the article folded into it as the page's own text; both kept, each with
its own name); WHO (who the page greets first: an undecided host, as every CTA assumes today; a guest who just scanned
and wants to know what happens to their photographs; a planner sizing it for a client); THE STEPS (six two-sided, as
today; five, matching the article; three, matching the home; every option with step one's sentence made true); THE
PICTURES (bespoke quotes and one real browser, as today; the site's own frames for every step, phone, code, album, reel;
the product itself moving: the real wizard card, the real code, the album filling in a frame); THE SHAPE (one scroll, as
today; a numbered stepper; a two-column ledger, the host's side and the guest's side reading down together); THE PROOF
(the reel alone, as today; a stat band; the demo door in the arc, its promise being `demo-event`'s); THE PHONE (staged
after THE PICTURES: the payoff's phone as a div, as today; the real `PhoneFrame`; the phone as the page's spine at 375,
one step a screen). Optional if it fits the budget: THE CLOSE (the CTA band as today; the pricing pointer folded into
it; the close as the demo). The step-count trap, the label collision, the unread single source and the catalogue gap go
under Deferred as ROADMAP lines whichever option wins.

**Binds.** The bible; `PageHero`'s contract and the h1 policy (the h1 never moves; reuse the component, never edit it);
`Reveal`'s attributes hold sections invisible until seen, so a preview forces them true; `PaperChapter` redeclares its
tokens, so a spine drawn outside it must sit inside one or wear the wrong ground; `mock-parity.test.ts`'s literal stays;
the chapter-transition ruling (full-image sections are chapter transitions, never at every cut); the copy is open (bible
21), no em-dashes; reduced motion honoured. Real photographs and the rendered MP4 are heavy: draw them once per option,
never four times side by side. Mobbin is encouraged, never required: "how it works" pages, product tours, step pages
with real UI.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3136`,
  `pnpm lab:demo --board how-it-works` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 1440 and 375 on the real pieces with fixture props; a capture of every option beside its words, the
  picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- The manifest marked THE CLOSE optional ("if it fits the budget"): asked anyway, since the board reads at 615 of
  1,200 words with all eight in. Recommended: keep it as the eighth decision (done).

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none: a lab-only round ships no production byte, so no `docs/systems/` fact about a shipped surface changed.

## Deferred (ROADMAP one-liners, bucket named)

- Now: the step-count trap — six here, five in `content/help/how-partyreel-works.mdx`, four in the mega panel's
  Resources card, three on the home's film strip — persists in production until the WINNING count from THE STEPS
  is wired everywhere the loop is told, not only on this page.
- Now: the label collision — `spine.tsx`'s GoDeeper link and `mega-panel.tsx`'s Resources card both say "How
  Partyreel works" pointing at the help article, and the help hub links back to this page with the same three
  words — stays live until THE PAIR's answer is wired.
- Now: `src/lib/constants/how-it-works.ts` calls itself the single source for the loop's three-step story, but
  only the welcome flow reads it; `spine.tsx` hand-rolls its own six steps with no shared source. Worth folding
  into one source once THE STEPS' count is wired.
- Now: `docs/systems/marketing-content.md`'s page catalogue has no entry for `/how-it-works`; add one once this
  round wires (or add now regardless, since the gap is a docs fact rather than a code one).
- Now: `pnpm lab:demo`'s discovery step (scraping `/design/lab`'s own rendered anchors for `session=` links) finds
  zero open steps for EVERY board right now, not only `how-it-works`: reproduced identically with `--board
  contact-page` (an already-integrated, presumably-healthy board) and with no `--board` filter at all across the
  whole desk. `pnpm lab:smoke` independently discovers and 200s every one of this board's eight `?session=`
  URLs directly, so the board itself is sound; the discovery mechanism (or the boards' `round: null`
  never-reviewed ledger state it may depend on) looks like the actual fault. Worth its own investigation,
  unrelated to this lane, since it may be silently blocking the demo-gate for every currently open board.

## Handoff (replaces the chat report)

- Head `ae7d3a11`, pushed; synced with launch-prep at `5da28d35` (it had moved: export-flow, admin-triage,
  media-viewer, emails and reel-studio landed after this branch's cut; merged, resolved the registration
  conflicts per PROGRAM.md's splice, regenerated `docs/design/library.md`, re-ran the full gate on the synced
  tree).
- Gates on the synced tree: `pnpm design:rules` ok; `pnpm typecheck` ok; `pnpm lint` ok (8 known warnings, 0
  errors); `pnpm test` ok (2,545 passed, 241 files); `pnpm build` ok (~150 routes); `pnpm lab:smoke --base
  http://localhost:3136` ok (441 checks, 0 failing; this board reads 615 of 1,200 words); `pnpm lab:demo --board
  how-it-works` reports "0 steps, 0 failing" (see Deferred: a pre-existing, board-agnostic discovery issue,
  confirmed against `contact-page` and against the whole desk with no `--board` filter; this board's own eight
  session URLs each independently 200 under `lab:smoke`).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/design/library.md` (generated),
  `src/app/(dev)/design/(shell)/lab/boards.ts`, `src/app/(dev)/design/sandbox/registry.ts`,
  `src/app/(dev)/design/touchpoints.ts` (the three registration exceptions) + every file under
  `src/app/(dev)/design/sandbox/how-it-works/` (owned) + this manifest. No exceptions.
- The decisions, one line each:
  - `pair`: should the page and the help article stay two names for one loop, or merge?; two pages same name
    (today) / one page folded in / both kept, each its own name; recommended both kept, each its own name.
  - `who`: who should the page greet first?; the undecided host (today) / a guest who just scanned / a planner
    sizing it for a client; recommended the undecided host, as today.
  - `steps`: how many steps, and should step one stop overstating itself?; six two-sided (today, corrected) /
    five matching the article / three matching the home; recommended six, two-sided, as today.
  - `pictures`: bespoke vocabulary or the site's real frames?; bespoke quotes (today) / the site's own frames /
    the product actually moving; recommended the site's own frames.
  - `shape`: one scroll, a stepper, or two columns?; one scroll (today) / a numbered stepper / two columns, host
    and guest; recommended two columns, host and guest (a ledger).
  - `proof`: what should the payoff prove?; the reel alone (today) / a band of real facts / a door to the live
    demo; recommended a door to the live demo.
  - `phone` (staged after `pictures`): what changes in a guest's hand?; the payoff's phone stays a div (today) /
    the real PhoneFrame / one step, one screen; recommended the real PhoneFrame.
  - `close`: how should the page end?; pointer then band (today) / one closing section / the close offers the
    demo; recommended one closing section.
- Assets requested from Will: none (every picture reuses the site's existing 12-image manifest, its two reel
  renders and its real QR/frame components).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `shape` (the ledger is the biggest structural swing: a real two-column host/guest read, with a
  found-and-fixed mobile stacking fix already applied) and `pictures` (site frames vs. the product actually
  moving: the cost/reward tradeoff of the bolder option).

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). Round one of `how-it-works` returned eight decisions with
`defineExploration` on the real page pieces (`PageHero`, `PaperChapter`, the spine's own layout, `ReelPayoff`,
`PricingPointer`, `CtaBand`): the pair against the help article, who the page greets, the step count with step
one's truth corrected, the frame vocabulary, the spine's shape (a host/guest ledger among the options), the
payoff's proof, the phone, and the close. `THE STEPS` and `THE PICTURES` read each other's live pick with no
`after` between them; `THE PHONE` is staged behind `THE PICTURES`. Every option measured in the frame at 1440
and 375 (height in 900 px windows, the first product picture's depth); reading a 375 capture against its own
words caught the ledger's three-column squeeze and fixed it with a stacked-below-`sm` layout before handoff.
Four pre-existing cross-surface facts (the step-count disagreement, the label collision, an unread single
source, a docs catalogue gap) carry to ROADMAP regardless of which option wins, since this round ships no
production byte.
