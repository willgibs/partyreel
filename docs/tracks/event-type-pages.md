---
track: event-type-pages
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "1cf54457"          # the launch-prep SHA the branch was cut from
board: event-type-pages # round one: the event-type landing pages, the hub and the four types
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-type-pages/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/marketing-content.md
  - src/app/(marketing)/(cinema)/events/page.tsx
  - src/app/(marketing)/(cinema)/events/[slug]/page.tsx
  - src/lib/constants/events.ts
  - src/lib/constants/events.test.ts
  - src/components/marketing/sections/events/event-hero-media.tsx
  - src/components/marketing/sections/events/type-directory.tsx
  - src/components/marketing/sections/events/reel-angle-band.tsx
  - src/components/marketing/sections/events/event-artifacts.tsx
  - src/components/marketing/sections/events/scan-pulse-ring.tsx
  - src/components/marketing/built-for.tsx
  - src/components/marketing/sections/home/event-type-card.tsx
  - src/components/marketing/sections/home/events-teaser.tsx
  - src/components/marketing/faq-accordion.tsx
  - src/components/marketing/jsonld.tsx
  - src/components/marketing/system/page-hero.tsx
  - src/components/marketing/system/section-shell.tsx
  - src/components/marketing/system/paper-chapter.tsx
  - src/components/marketing/system/cta-band.tsx
  - src/components/marketing/system/stat-band.tsx
  - src/components/marketing/system/tilt-card.tsx
  - src/components/marketing/frames/index.ts
  - src/lib/constants/marketing-nav.ts
  - src/lib/constants/marketing-media.ts
  - src/lib/content/blog-tags.ts
  - content/blog/family-reunion-photo-sharing.mdx
  - src/app/(dev)/design/sandbox/loose-ends/spec.ts
  - src/app/(dev)/design/sandbox/demo-event/spec.ts
---

# lp/event-type-pages

**Goal.** Round one of `event-type-pages`: THE EVENT-TYPE LANDING PAGES, `/events` and the four type pages (weddings,
parties, conferences, trips), the site's doors for a host who arrives knowing what they are planning, reconceived from
the ground up. Will (2026-09-19, `docs/design/rulings.md`, "the overnight round"): explore every surface, everything
unprotected, "at worst, net neutral and fully deleted". Six to eight decisions with `defineExploration`, each drawn on
the REAL pieces (`TypeDirectory`, `EventHeroMedia` for all four slugs, `BuiltFor` and `HelpPane`, `ReelAngleBand`,
`FaqAccordion`, `CtaBand`, `PageHero`) with fixture `EventType` objects (the static array admits invented types) at 1440
and 375, a recommendation each, every number measured (a page's height in windows per option, where the first product
picture lands). **Not in this round:** any production byte; the mega panel's and the footer's Events entries
(`site-chrome`, a sibling lane, owns `marketing-nav.ts`); the FAQ's look and source (`loose-ends`); what the demo door
promises (`demo-event`); `/pricing` (`pricing-page`); the copy register (`body-type`, `voice`); the home's event-type
cards beyond one drawn reference.

**What is measured (the tree at the cut).** Four types, one `[slug]` template over `EVENT_TYPES` (bespoke only in
`EventHeroMedia`'s per-slug switch and the copy): the hub is `PageHero` (cut), the `TypeDirectory`, a `HelpPane` of
benefits, `ReelAngleBand`, a FAQ of five, `CtaBand`, six sections; a type page hand-rolls its own hero with its own cut
marker (duplicating `PageHero`'s entrance), then `PaperChapter` (the intro, theme chips, `BuiltFor`), `ReelAngleBand`, a
FAQ of four, `CtaBand`, five sections, the same shape four times. The h1s: "Every photo from your wedding, from everyone
there"; "The whole party's camera roll, in one place"; "Your whole event, captured by everyone there"; "One shared album
for the whole trip"; the hub "Every event, every photo, in one shared album". Weddings and parties lead with real
photographs; conferences and trips lead with bespoke artifacts (`BadgeFan`, `SharedRoll`) because the twelve-still
manifest has no honest picture for them; the framing is inconsistent by design (a `BrowserFrame` for two, loose cards
for one, a card shape for one, never `PhoneFrame`, never a laptop shell). About 300 to 370 words of body per type, ad
density, not long-form. Every hero and band carries the same three doors (the CTA, "See pricing", the demo). `MediaSplit`,
`Conveyor`, `StatBand` and `DemoTicket` are never used here. No planner, school, memorial or nonprofit page; "family
reunions" is a trips theme while the reunion blog post links parties, and the blog's audience tags have no "trips";
three posts carry an audience tag with no link into a type page; the mega panel and the footer hand-write a third
description per type; `events.ts` sits outside the content policy's claim scan; the home's teaser still calls the
conference and trip stills a "KNOWN MANIFEST GAP" the artifacts already solved; `/events` has no OpenGraph image;
`marketing-content.md` describes three deleted files as the architecture. The pins: `events.test.ts` (completeness,
slug uniqueness, no em-dashes), the h1 policy and `PageHero` contract (the hand-rolled hero is scanned too),
`marketing-nav.test.ts` (the Events hrefs, not the labels); nothing pins any section's look.

**The decisions (suggested; yours to recut, never forced apart).** ONE PAGE OR FOUR (one template with the noun swapped,
as today; a bespoke page per type; a shared shell with one swappable proof section per type); THE HERO'S PICTURE (the
split, as today: photographs for two, artifacts for two; artifacts for all four, honest without the manifest; a
photograph for all four, the two missing ones as Higgsfield asks; the product in a phone for all four); ONE HERO (staged
after THE HERO'S PICTURE: the hub on `PageHero` and the types hand-rolled, as today; every page on `PageHero`; the types'
hero promoted and the hub on it); WHO IS GREETED (the host alone, as today; one line for the guest who scanned at this
kind of party; the planner, with a line for the client); THE PROOF (the reel band, as today; a stat band before it; a
story, one real party told in three frames; the demo door in the arc, its promise `demo-event`'s); HOW MANY (four, as
today; five with schools or communities, drawn with an invented type; three, trips folded into parties); THE DIRECTORY
(staged after THE HERO'S PICTURE: the hub's two-up tilt cards, as today; four across, thinner; a list with one line each);
THE PHONE (the arc at 375 as today, measured; the FAQ-to-close tightened; one type a screen). Optional if it fits the
budget: THE CLOSE (three doors on every band, as today; one door, the CTA; the CTA and the demo). The reunion link, the
missing tag, the three unlinked posts, the hand-written nav descriptions, the policy gap, the teaser's stale comment,
the missing OpenGraph image and the stale doc lines go under Deferred as ROADMAP lines whichever option wins.

**Binds.** The bible; `PageHero`'s contract and the h1 policy (the h1 is a real h1, never reveal-gated; the rule scans
the hand-rolled hero by regex too); `Reveal`'s attributes hold sections invisible until seen (force them in a preview);
`ReelAngleBand` throws when its reel id is not in `MARKETING_REELS` (keep it valid or stub it); the chapter-transition
ruling; the no-image-rights rule (an image we use is one we hold the rights to; ask for a slot, never track a picture);
the copy is open (bible 21), no em-dashes; reduced motion honoured; real photographs and the reel drawn once per option.
Mobbin is encouraged, never required: vertical landing pages, "for weddings" pages, use-case directories.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3131`,
  `pnpm lab:demo --board event-type-pages` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 1440 and 375 on the real pieces with fixture types; a capture of every option beside its words, the
  picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board event-type-pages` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The decisions, one line each: `<id>: the question; the options; the recommendation`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
