---
track: how-it-works
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board how-it-works` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The decisions, one line each: `<id>: the question; the options; the recommendation`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
