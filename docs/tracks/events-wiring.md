---
track: events-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "b30445d9"          # the launch-prep SHA the branch was cut from
board: none             # a wiring round, design-led: the hub and the four type pages to production; event-identity and event-type-pages retire with it
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(marketing)/(cinema)/events/
  - src/components/marketing/sections/events/
  - src/components/marketing/sections/home/events-teaser.tsx
  - src/components/marketing/sections/home/event-type-card.tsx
  - src/lib/constants/events.ts
  - src/lib/constants/events.test.ts
  - src/components/marketing/system/page-hero.tsx
  - src/components/marketing/system/page-hero-contract.test.ts
  - src/app/theme.css
  - src/lib/utils.ts
  - src/app/(dev)/design/sandbox/event-identity/
  - src/app/(dev)/design/sandbox/event-type-pages/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/reviews/event-identity.json
  - docs/reviews/event-type-pages.json
  - docs/systems/marketing-content.md
  - src/components/marketing/sections/how-it-works/demo-door.tsx
  - src/components/shared/river/river.tsx
  - src/components/shared/river/qr-door-frames.ts
  - src/components/shared/river/river-engine.test.ts
  - src/components/marketing/chrome/footer-qr.tsx
  - src/components/marketing/system/demo-ticket.tsx
  - src/components/marketing/system/demo-cta-link.tsx
  - src/components/marketing/system/section-shell.tsx
  - src/components/marketing/system/paper-chapter.tsx
  - src/components/marketing/system/cta-band.tsx
  - src/components/marketing/system/tilt-card.tsx
  - src/components/marketing/system/section-light.tsx
  - src/components/marketing/built-for.tsx
  - src/components/marketing/sections/features/shared/feature-door.tsx
  - src/components/shared/backdrop/photo-section.tsx
  - src/lib/demo.ts
  - src/lib/constants/marketing-media.ts
  - src/lib/constants/marketing-nav.ts
  - src/lib/type-ladder-policy.test.ts
  - src/app/(marketing)/marketing-h1-policy.test.ts
  - src/lib/content-policy.test.ts
  - src/components/marketing/sections/home/home-sections.test.ts
  - src/app/sitemap.ts
  - src/lib/content/llms.ts
  - src/app/(dev)/design/sandbox/demo-event/spec.ts
---

# lp/events-wiring

**Goal.** Build the events hub and the four type pages (`/events`, `/events/weddings|parties|conferences|trips`) to
production grade on Will's picks, design-led, judged on the alias. The seven directions of `event-identity` r1 (his
notes verbatim in `docs/design/rulings.md`, the fourth batch): `hero-theme=object` ("conveys more about how we actually
help that event (such as incorporating the QR)"), `second-section=statement` ("the UI could be improved a lot"),
`the-arc=chapter` ("paper chapter with photo transition"), `the-cards=frame` ("all events should have a photograph...
rather than an artifact... These cards could use a ton of design polish, only approving the photograph as full bg
component here"), `the-proof=door` ("The left side is beautiful with the river, but the real car on the right could use
a redesign. Good layout, though. I like the asymmetrical two-column, with demo a bit wider"), `the-ladder=reading` with
his sizes ("On desktop, hero sub maybe 20-22 and opening stays 18. On mobile, hero sub at 20 and opening at 18... not a
strict hard ruling - should likely check again with preview"), `the-phone=words` toward half-and-half ("the visual may
cross above/below the fold as a teaser... The copy on this one is too bulky now"). Plus the direct picks of
`event-type-pages` r1 (batch three): one template, four types, the host alone greeted, every type page on `PageHero`,
the 2x2 directory kept with `TiltCard`, the phone's FAQ-to-close gap halved, the demo door in the promise wording. His
bar, verbatim: the seven drawings "are not nearly good enough for an event page this is the proposed final page
design"; the pages "should feel very polished, beautiful, and constantly incentivize further exploration". His answer in
plan mode: "Wire now, design-led, judged on the alias". Both boards retire in this lane. Not in this lane: a fifth type,
a planner line, the mega panel's and footer's per-type copy (`marketing-nav.ts` is read only), the chrome.

**The template** (`(cinema)/events/[slug]/page.tsx`; the sections under `sections/events/`), the `chapter` arc in order:
`PageHero` (the eyebrow a `Link` back to `/events` as the board's `pieces.tsx` `Lockup` does, `entrance="cut"`, the object
in `children`; the hand-rolled hero and its own `cut()` go) → the statement section, still dark → the transition band
(that type's room photograph full width, a centred scrim, one line on the section step) → ONE `PaperChapter` holding the
planning content alone (`BuiltFor`/`HelpPane`) → the door proof, dark → the FAQ → `CtaBand` with its demo line. The hub
keeps the all-dark arc (round one's carried call) with its directory, wears the object theme over a cross-event ground
(which object is your call, stated), and gains `opengraph-image.tsx` (the one cinema landing without one).

**The object hero.** One still life per type in one pool of light (the board's `hero.tsx` `ObjectHero`: `SectionLight
placement="room"`, the shared lockup unchanged), the object bespoke: weddings the album open with the table card (the
board's `WeddingSpread`, its decorative lucide QR replaced by a REAL code), conferences the badge stack (`BadgeStack` on
`AttendeeBadge`'s cells), parties and trips NEW (the board drew two objects, never these: design both from real pieces,
e.g. the prints on the table with the code card, the shared roll with the code on its sleeve). "Incorporating the QR":
every object carries the demo's real code, server-rendered the way `chrome/footer-qr.tsx` does, so the object is a door
(`DEMO_EVENT_URL`; with no demo set the object stands with no code and no dead link: the `DemoCtaLink` contract). Ask for
the objects' media slots by SLOT in the Handoff (he expects generated imagery to theme them later; never a picture, never
provenance).

**The statement section** (the board's `second.tsx` `StatementSecond` is the base): one claim on the chapter step, one
visual that need not be a photograph (for conferences and trips the product itself can be the visual), the long-tail
terms kept as one running line for search, the quiet line at 18 (his "opening stays 18"); per-type copy written here in
the `fixtures.ts` `statement` shape, `content-policy` clean, no em-dashes.

**The cards** (the board's `cards.tsx` `frame` is the base): the photograph IS the card for all four types (`aspect-4/5`,
the ruled double scrim with `CARD_COPY_SCRIM`, the name on the section step, the teaser, the long-tail as one line, a
link per card). Conferences and trips get a photograph too: ASSETS rows 24 and 25 are the swap; until they land use the
closest manifest still and name it as a stand-in in the Handoff, never an artifact inside the card. The hub's directory
card and the home's `event-type-card.tsx` become one anatomy at two sizes; `TiltCard` stays on the hub. The tucked
artifact at 375 is banked on the ROADMAP, not shipped.

**The door proof** (the board's `proof.tsx` `DoorProof` is the base): the asymmetric grid kept (the door `lg:col-span-7`),
the river door as drawn (`River` on `QR_DOOR_FRAMES`, the promise, one `size="cta"` button), the right half redesigned
(the reel demoted to one poster with its own label, never a bordered card around a 150 px player). The promise is the
shipped sentence from `sections/how-it-works/demo-door.tsx` ("A real Partyreel album, curated by the host who ran it, open
with no sign-up"), without counts: the fixtures' "128 photos from 31 guests" never ship (the demo is one album, not one
per type). `ReelAngleBand` retires from both pages.

**The ladder, his sizes.** `PageHero`'s subhead slot (`text-lg` today) moves onto the subhead step, and the step's ceiling
drops from 24 to 22: `--text-subhead` in `src/app/theme.css` becomes `clamp(1.25rem, ..., 1.375rem)` with the middle term
recomputed for 375 to 1440, and `TYPE_STEPS` in `src/lib/utils.ts` matches (both files are released to you for this one
change and nothing else; `type-ladder-policy.test.ts` stays green, including the paper stack `title > prose > subhead` at
both ends). The fifteen existing `text-subhead` readers move by about 2 px at 1440; that is the design. The statement's
quiet line and every opening stays at 18 (`text-lg`). `SectionShell`'s subhead carries no size class today (16 px
inherited): put it on a step only if it reads as the same slot, else one line under Deferred. All of it is his to check
on the alias.

**The phone** (his blend, drawn by neither option): the lockup trimmed at 375 (the subhead to its first sentence as the
board's `ShortLockup` does), the object reaching up into the first screen and crossing the fold as a teaser, the primary
button on the first screen; the FAQ-to-close gap halved through `className` on the two sections' `py` below `sm`, never
a `!important` sheet.

**`events.ts`** gains per-type media and object ids so no component hard-codes a still per type (five do today);
`EVENT_TYPES`' other fields stay (`marketing-nav.test.ts` mirrors `EVENT_TYPE_SLUGS`; `llms.test.ts` and `sitemap.ts` read
the slugs); `events.test.ts` extended; `events-teaser.tsx`'s stale "KNOWN MANIFEST GAP" comment goes.

**Retire both boards**: delete `sandbox/event-identity/` and `sandbox/event-type-pages/`; remove their imports and entries
in `src/app/(dev)/design/sandbox/registry.ts` and `src/app/(dev)/design/(shell)/lab/boards.ts` and their members of the
`SandboxId` union in `src/app/(dev)/design/touchpoints.ts` (the ids stay in `RulingId`); rewrite both RULINGS rows as
shipped exactly as `git show 73451c79 -- "src/app/(dev)/design/touchpoints.ts"` did for `image-trail` (`ruled` and
`shipped` filled, the `board:` block deleted, `lives` real on disk); promote `BadgeWall` to `sections/events/` only if a
winning drawing keeps it; `for:` lines in `src/app/(dev)/design/rules/component-notes.ts` for the new files;
`pnpm design:rules` (commit `docs/design/library.md` as the generator writes it). These registration edits are the
announced exception; nothing else in those files.

**Binds.** The bible; `PageHero`'s contract (one h1, the stage in `children`, no `text-[`, no breakpoint ramps) and the h1
policy (no cut, rise or mark on the h1); every heading on the ladder with NO new `type-ladder-policy` exception; the
cinema rhythm and the chapter-transition ruling; the rights rule (an image we use is one we hold the rights to: ask by
slot, never by picture, never provenance or credits); kids are never a target user (drawn nowhere, said nowhere); the
voice rulings for every new line; `content-policy` (no unearned claims), `no-em-dash-policy`, `keyframe-uniqueness`;
`Reveal`'s attributes; `home-sections.test.ts` (the teaser's slot and ground); `marketing-nav.test.ts`, `llms.test.ts`;
`river-engine.test.ts` (the door never changes the engine); `component-notes.ts` `for:` lines. Calls that stay Will's,
stated in the Handoff: the subhead ceiling at 22 site-wide; the parties and trips objects; the real code inside the
objects; the stand-in stills for conferences and trips; the door's promise without counts; the hub's own object over a
cross-event ground; the phone's trim; `SectionShell`'s subhead step.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`,
  `pnpm typecheck`, `pnpm lint` (the 8 known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base
  http://localhost:3131` (both retired boards gone from its table); `DESIGN_PREVIEW_KEY` in the environment, never on
  a command line.
- Tests, function never look (`sections/events/` has none today): `// @contract-for:` tests for the object hero (a real
  code renders when the demo is set and none otherwise; one h1 through `PageHero`), the card (a link per type with the
  photograph as its ground), the door (the river `aria-hidden`; its button the only control); `page-hero-contract.test.ts`
  extended for the subhead step.
- Locally at 1440 and 375: `/events`, `/events/weddings`, `/events/conferences` fully and the other two quickly: the
  object's code encodes `/demo` (read the SVG's data), the statement, the turn, the paper chapter, the door with the river
  moving and reduced motion honoured, the FAQ gap, the close; the hub's directory (four photographs, the tilt on mouse, a
  link per card) and the home's teaser in the same anatomy; the hero subhead measured at 1440 and 375 (22 and 20) on an
  event page AND a feature page; `/events/opengraph-image`; captures read against the pick each lands. The Orchestrator
  repeats the list on the alias.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/marketing-content.md`: the `/events` catalogue lines (they name three deleted files today: `EVENT_PRESENTATION`, `eventFrame()`, `event-frame-cards.tsx`) rewritten to the shipped architecture; list the lines here.

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: design:rules ok, specimens ok, typecheck ok, lint ok (8 known), test ok (N), build ok (M pages); `pnpm lab:smoke` ok (both boards gone)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + the registration lines + `docs/design/library.md` + `component-notes.ts` (exceptions and why)
- The picks landed, one line each (the seven directions and the seven direct picks), and the calls his to overrule
- Assets requested from Will: one per line, by slot: the four objects' media slots · spec (size, aspect, the crops it survives, where type lands) · replaces <stand-in id>; the stand-ins used for the conference and trip photographs, by id
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
