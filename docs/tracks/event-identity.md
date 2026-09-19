---
track: event-identity
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "22438704"          # the launch-prep SHA the branch was cut from
board: event-identity   # round one: the event pages' visual identity, from the ground up
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-identity/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/reviews/event-type-pages.json
  - docs/systems/marketing-content.md
  - docs/systems/design-system.md
  - src/app/(marketing)/(cinema)/events/page.tsx
  - src/app/(marketing)/(cinema)/events/[slug]/page.tsx
  - src/lib/constants/events.ts
  - src/components/marketing/sections/events/event-hero-media.tsx
  - src/components/marketing/sections/events/event-artifacts.tsx
  - src/components/marketing/sections/events/type-directory.tsx
  - src/components/marketing/sections/events/reel-angle-band.tsx
  - src/components/marketing/built-for.tsx
  - src/components/marketing/system/tilt-card.tsx
  - src/components/marketing/system/page-hero.tsx
  - src/components/marketing/system/section-shell.tsx
  - src/components/marketing/system/paper-chapter.tsx
  - src/components/marketing/system/section-light.tsx
  - src/components/marketing/system/cta-band.tsx
  - src/components/marketing/sections/home/event-type-card.tsx
  - src/components/marketing/sections/home/cinema-hero.tsx
  - src/components/marketing/sections/home/no-app.tsx
  - src/components/marketing/sections/home/full-quality.tsx
  - src/app/(marketing)/(cinema)/features/album/page.tsx
  - src/components/marketing/sections/features/album/arrivals-hero.tsx
  - src/components/shared/album-stream/
  - src/components/shared/river/
  - src/components/shared/backdrop/photo-section.tsx
  - src/components/shared/trail/
  - src/app/theme.css
  - src/lib/type-ladder-policy.test.ts
  - src/lib/constants/marketing-media.ts
  - src/app/(dev)/design/sandbox/event-type-pages/spec.ts
  - src/app/(dev)/design/sandbox/demo-event/spec.ts
---

# lp/event-identity

**Goal.** Round one of `event-identity`: THE EVENT PAGES' VISUAL IDENTITY from the ground up, the hub and the four type
pages on one template, so that "we can get all four beautiful quickly". Will (2026-09-19, batch three, verbatim in
`docs/design/rulings.md`): the pages "were thrown up as a quick V1 and are nowhere near production grade... could use a
total visual identity redesign now that other areas like the homepage are progressing beyond them under Rising Tides";
they "should feel very polished, beautiful, and constantly incentivize further exploration"; each hero "media and motion
forward, but feel custom and themed for its own page" while "our heroes and headers should share similar design patterns
(H1 size, H1 and subhead spacing, button groups etc)"; "the type scale system established in our library should be
carried across all marketing"; the second section beneath the hero ("A wedding is the most photographed day of your life,
and almost none of those photos ever reach you..." with its tag list) "is doing horribly"; the proof section "needs a
total redesign"; the 2x2 event cards "could use a total redesign". His answer in plan mode: "A ground-up identity round
first". Six to eight decisions with `defineExploration`, each drawn as CONCEPTS on the REAL pages in their one template
with fixture copy and the site's pictures, at 1440 and 375, a recommendation each, every number measured. **Not in this
round:** any production byte; the direct picks already ruled (one template, four types, the host alone greeted, the 2x2
directory kept, every type page on `PageHero`, the phone's FAQ-to-close gap halved), which wire AFTER this round with its
winners; a fifth type (never schools: his note, drawn nowhere and said nowhere); a planner line (a partners page comes
before launch); the demo's own open decisions (`demo-event`, on the desk: reuse its recommended promise wording).

**What is measured (the tree at the cut).** The hub is `PageHero` (cut), the `TypeDirectory` of 2x2 tilt cards, a
`HelpPane` of benefits, the `ReelAngleBand`, a FAQ of five, `CtaBand`. A type page hand-rolls its hero (a breadcrumb, an
h1 at `text-title`, the subhead, the CTA pair and the demo link, then `EventHeroMedia`'s per-slug switch: a static
eight-tile album grid for weddings, three rotated prints for parties, the `BadgeFan` and `SharedRoll` artifacts for
conferences and trips, no motion beyond the tilt and one pulse ring), then `PaperChapter` with the intro paragraph and
the theme chips and `BuiltFor`, the reel band on one real render, a FAQ of four, `CtaBand`; about 300 to 370 words of
copy per type from `events.ts`. The reference for what "progressing beyond them" means: the home (the hero stream, the
Aurora light, the cursor-backdrop photograph section, the film strip) and the album feature page (the live album under
the host's header, the halo, the floor, the photograph section as a chapter transition). Engines free to reuse:
`shared/album-stream/`, `shared/river/` (the feature doors only today), `shared/backdrop/photo-section.tsx`,
`shared/trail/` (the root 404 only today), `system/section-light.tsx`. The ladder: ten steps in `theme.css`; the event
headings are on it, the body and labels in the directory, the artifacts and the template's intro are off it
(`text-xs`, `text-[7-11px]`, `text-lg`). The pins: `events.test.ts`, `marketing-h1-policy`, `page-hero-contract`,
`marketing-nav` (the Events panels pinned to the four slugs), `content-policy`, `keyframe-uniqueness`, the glow
placement test (no lamp inside a tilt card), the no-em-dash policy.

**The decisions (suggested; yours to recut, never forced apart).** THE HERO'S THEME (how a type's hero feels custom inside
the shared pattern: the type's media as the hero's GROUND, a full-bleed photograph section per type on the backdrop
engine; the media as a MOVING OBJECT beside the lockup, the album stream, the river or the trail themed per type; a
THEMED LOCKUP, the type's own material and colour varying inside the system; today's static compositions as the fourth,
measured); THE SECOND SECTION (staged after the theme: what catches attention beneath the hero in place of the paragraph
and the chips: one photograph and one line; a three-beat proof, a stat, a story, a picture; the product itself in that
party, a live album frame themed); THE CARDS (the 2x2 directory kept: the tilt card as today; the home's full-bleed photo
card with the copy scrim; a card that moves, a small stream per type); THE PROOF (the demo-door section redesigned as three
concepts, the promise in `demo-event`'s words); THE ARC (a type page's rhythm: today's six sections; a cinema arc with a
chapter transition, the photograph section before paper; a shorter arc, the hub carrying the FAQ); THE LADDER (the
off-ladder body and label sizes carried onto the steps: as today, measured; every size on a step); THE PHONE (the arc at
375 per concept, one screen a beat). Optional if it fits the budget: THE HUB (the hub's own identity against the type
pages: the same theme; a directory first; the four heroes as a strip). Draw weddings as the worked type and one other
where a concept differs by type; the four pages share one template by his ruling.

**Binds.** The bible; `PageHero`'s contract and the h1 policy (the concepts are drawn on `PageHero`, where the type
pages land in the wiring); the cinema rhythm and the chapter-transition ruling (full-image sections are chapter
transitions, never at every cut); the rights rule (an image we use is one we hold the rights to: new photography per type
is asked by SLOT in the Handoff, never by picture; the twelve stills and the two reels are the fixtures); his note that
kids are never a target user (drawn nowhere, said nowhere); the ladder; the 1,200-word budget; `events.ts` read, never
edited (the concepts carry fixture copy); one live engine at most per option, the rest stills; reduced motion honoured;
no em-dashes; the copy is open (bible 21). Mobbin is encouraged, never required: vertical landing pages, "for weddings"
pages, use-case directories, themed heroes on one system.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8 known
  warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3133`,
  `pnpm lab:demo --board event-identity --base http://localhost:3133` (0 failing); `DESIGN_PREVIEW_KEY` in the environment.
- Every option at 1440 and 375 on the real pages with fixture copy; a measured caption each (height in windows, the first
  picture's depth, the motion's cost under a 4x throttle); captures read against their words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board event-identity` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The decisions, one line each: `<id>: the question; the options; the recommendation`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
