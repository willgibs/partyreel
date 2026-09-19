---
track: event-type-pages
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- Every one of the eight decisions below already carries its own recommendation, reasoned from the shipped code (never
  a guess), and this lane carried on each one rather than blocking: see the Handoff's one-liners. Two calls worth Will's
  own eye when he reviews the board, flagged here rather than silently decided: (1) HOW MANY recommends holding at four
  — trips' nested themes barely overlap parties' and folding it away trades real SEO surface for a savings nobody has
  asked for, and a fifth umbrella (Schools) is a product-shaping call outside this lane's research; (2) WHO IS GREETED
  recommends one quiet guest line, never the planner line, because a planner audience is unresearched (the same
  product-defining-features steer) — the option is drawn and ready if Will wants to test it.
- `scripts/lab-smoke.mjs`'s `MAX_PAGES` cap was hit mid-round (verified by A/B: 23 boards on the desk crawled clean at
  412 checks / 0 failing, adding this board's 24th crossed it to 414 checks / 1 failing, "stopped at 400 pages") and
  is not this lane's file to fix; `origin/launch-prep` already carried the bump to 800 by the time this lane synced, so
  no action needed here — noting it only so the finding is not lost.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none: an exploration round ships no production byte, so no shipped fact changed under this lane's owned paths.

## Deferred (ROADMAP one-liners, bucket named)

- Now: the reunion post (`content/blog/family-reunion-photo-sharing.mdx`) carries the `parties` audience tag while its
  whole subject is a trip; `blog-tags.ts` has no `trips` audience tag at all. Add one (or re-tag the post) so the tag
  matches the content, whichever of HOW MANY's options wins.
- Now: three blog posts carry an audience tag with no link into a matching type page (a one-way cross-link gap; verify
  which three against `blog-tags.ts` and `EVENT_TYPES` before wiring).
- Now: the mega panel and the footer each hand-write a third description per event type, beside `EVENT_TYPES.teaser`
  and the hub's own copy — three homes for what should be one. Consolidate once `site-chrome` (owns `marketing-nav.ts`)
  and this round's ONE PAGE OR FOUR answer have both landed.
- Now: `src/lib/constants/events.ts` sits outside the marketing content policy's claim scan (verified: the policy test
  suite's file list does not name it). Bring it under the same scan every other marketing copy source obeys.
- Now: the home's `events-teaser.tsx` code comment still calls the conference and trip stills a "KNOWN MANIFEST GAP"
  the `event-artifacts.tsx` artifacts (`BadgeFan`, `SharedRoll`) already solved for the type pages themselves; the home
  teaser's own cards still use the borrowed photo stand-ins. Either give the teaser cards the same artifacts or update
  the stale comment to say why the home keeps photos where the type pages do not.
- Now: `/events` (the hub) has no `opengraph-image.tsx`; every `/events/[slug]` already has one (verified: `find` on
  the route directory). Add the hub's own, mirroring the per-type one's shape.
- Now: `docs/systems/marketing-content.md`'s `/events` architecture line still names `EVENT_PRESENTATION`
  (`events-layout.ts`), `eventFrame()` (`event-frame.tsx`) and `event-frame-cards.tsx` — verified deleted from the
  tree (none of the three files exist; `EventHeroMedia`'s per-slug switch and `BuiltFor`/`HelpPane` are the real
  architecture today). Correct the doc's own lines to match.

## Handoff (replaces the chat report)

- Head `81a0b2af`, pushed; synced with `launch-prep` at `1a8f962a` (five tracks had integrated since the cut:
  `how-it-works`, `site-chrome`, `profile-page`, `export-flow`, `admin-triage`; merged, registration conflicts spliced
  keeping both sides, `docs/design/library.md` regenerated fresh rather than hand-merged)
- Gates on the synced tree: typecheck ok · lint ok (0 errors, the 8 known warnings, unchanged) · test ok (2,545) ·
  build ok (254 pages) · `pnpm lab:smoke --base http://localhost:3131` ok (468 checks, 0 failing; this board reads
  422/1200 words; the crawl-cap finding under Questions was hit pre-sync and is already fixed on `launch-prep`) ·
  `pnpm lab:demo --board event-type-pages` ok (8 steps, 0 failing, every option's stage measured and re-measured
  against the real rendered frame, never guessed)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/design/library.md` (generated) +
  `src/app/(dev)/design/(shell)/lab/boards.ts` + `src/app/(dev)/design/sandbox/registry.ts` +
  `src/app/(dev)/design/touchpoints.ts` (registration exception, this lane's added lines only) +
  `src/app/(dev)/design/sandbox/event-type-pages/*` (owned) + this manifest. Clean.
- The decisions, one line each:
  - `one-page-or-four`: keep four pages on one template, split into four bespoke builds, or thin to one shell where
    only the hero swaps?; recommended **one template, as today** (real per-type SEO surface at the lowest upkeep)
  - `hero-picture`: every hero a photograph, an artifact, a phone mock, or today's split?; recommended **the split,
    as today** (the shipped code's own MANIFEST NOTE already rules artifacts stay primary once real photos exist)
  - `one-hero` (staged after `hero-picture`): keep two hero implementations, or one shared `PageHero`?; recommended
    **every page on `PageHero`** (the hand-rolled hero already renders the same lockup, one pixel off — gap-5 against
    PageHero's own gap-6 — so this is a pure DRY win, not a visual change)
  - `who-greeted`: host alone, one guest line, or one planner line?; recommended **one quiet guest line** (real,
    plausible search traffic this page gives nothing to today; the planner audience is unresearched)
  - `the-proof`: reel alone, a stat band, a real story, or a demo door in the arc?; recommended **a demo door in the
    arc**, reusing `demo-event`'s own recommended promise wording so the two boards never invent two voices for one
    door
  - `how-many`: four, five (with an invented Schools type), or three (trips folded into parties)?; recommended
    **four, unchanged** (trips' SEO surface is real and barely overlaps parties'; a fifth type is unresearched)
  - `directory` (staged after `hero-picture`): two-up tilt cards, four across, or a list?; recommended **two-up, as
    today** (the directory's whole job is being richer than the home's teaser row; density it does not need yet)
  - `the-phone`: the arc as today, the FAQ-to-close gap halved, or one type on one screen?; recommended **halve the
    FAQ-to-close gap** (183px of measured dead space between the FAQ's last row and the CTA heading, live against
    `/events/weddings` at 375; a small stylesheet change, no content lost)
- Assets requested from Will: none. THE HERO'S PICTURE's recommendation keeps today's split rather than asking for the
  two missing photo sets (conferences, trips); if that recommendation is ever overruled toward "a photograph for all
  four," a conference photo set and a trip photo set (4-6 stills each, landscape, real-photography grade) would
  replace the `AlbumFrame` placeholder stand-ins that option draws today.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: `one-page-or-four` then `hero-picture` (two more decisions stage behind its answer); `the-phone`'s
  tightened option is a small CSS fix ready to land verbatim if picked.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). Round one of `event-type-pages` returned eight decisions on the
real `/events` hub and `[slug]` pieces, authored with `defineExploration` on `PageHero`, `EventHeroMedia`,
`TypeDirectory`'s grammar, `BuiltFor`/`HelpPane`, `ReelAngleBand` and the kit's own `Cell`, at 1440 and 375: one page
or four (recommended: today's template), the hero's picture (recommended: the split, as today, per the shipped
code's own MANIFEST NOTE), one hero (recommended: every page on `PageHero`, closing a gap-5/gap-6 drift the
hand-rolled type hero carried), who is greeted (recommended: one quiet guest line), the mid-page proof (recommended:
a demo door reusing `demo-event`'s own promise wording), how many types (recommended: four, unchanged), the hub's
directory (recommended: two-up, unchanged), and the phone (recommended: the measured 183px FAQ-to-close gap halved).
One hero and the directory stage behind the hero's picture so their previews wear whatever answer it carries. Seven
ROADMAP lines deferred (a stale blog tag, three unlinked posts, triplicated nav copy, a content-policy gap, a stale
code comment, a missing hub OG image, a stale doc line); no assets asked; no production byte shipped.
