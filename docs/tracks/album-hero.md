---
track: album-hero
status: integrated
cut: "c473707"
merged: "bd5f63b5"      # the branch head merged into launch-prep
preview: true           # Will reviews this board on its preview as it builds (once Vercel's window frees)
owns:
  - src/app/(dev)/design/sandbox/album-hero/
reads:
  - src/app/(dev)/design/sandbox/home-hero/shared.tsx
  - src/app/(dev)/design/sandbox/home-hero/source.tsx
  - src/components/dev/board/stage.tsx
  - src/components/dev/board/dock.tsx
  - src/components/dev/board/board-meta.tsx
  - src/app/(marketing)/(cinema)/features/album/page.tsx
  - src/lib/constants/feature-pages.ts
  - src/lib/constants/marketing-media.ts
  - src/components/guest/guest-masonry.tsx
  - src/components/guest/live-gallery.tsx
  - src/components/guest/event-experience.tsx
  - src/lib/shared/use-ambient-pause.ts
  - src/app/(dev)/design/rules/bible.ts
  - docs/ASSETS.md
  - docs/tracks/hero-burst.md
  - docs/specs/brand-voice.md
---

# lp/album-hero

## Round 1 (Will's ruling, 2026-09-15)

**The global notes, which bind every board this round** (Will, 2026-09-15, after a scroll through every
board on launch-prep): (a) **Page-wide controls always on screen.** "For any pagewide configs, the GUI
control should be fixed so that variants can be toggled on different previews anywhere on the page for
better back-and-forth comparisons. Having to scroll back to the top makes it very hard to review
differences." The shell now ships `BoardDock` (`src/components/dev/board/dock.tsx`, exported from
`@/components/dev/board`; the floating board's sticky bar, generalised: it sticks from `sm` up, writes its
height to `scroll-padding-top` so anchors land under it, and carries the shell's Fit/1:1, Sidebar and Desk
controls). Put every switch that changes the whole page in it (the candidate, the ground, the canvas, the
ramp, Replay, Apply to the site); a control that changes one specimen stays beside that specimen. (b)
**Pixel-perfect previews.** "The iFrame previews throw off anything related to size, making those reviews
particularly difficult. This needs to be fixed for pixel-perfect lab demos/previews." Every `Stage` now
renders at 1:1 by default (the lab preference in `lab-prefs.ts`; the board page lifts its max-width and
tucks the sidebar away so a 1440 canvas has its room; "Fit" keeps the old zoom for a glance at the whole).
Never zoom, scale or transform a specimen whose size is being judged; anything you render inside an iframe
renders at true pixels; if a 1440 canvas needs sideways scroll on a narrower window, that is correct. (c)
**More real UI.** Will wants live production components and whole real pages as the preview surfaces
("I'd love to see more UI examples for comparison, especially if they can be live production components";
"more UI to preview the variations on"), not a screen of specimens. (d) **The app's UI is open.** "The app
is functionally great, but UI design lags far behind the design work we've been doing for the marketing
site... any UI that touches App in an active lab track may be worked on before the dedicated app agents get
to it later." So where your board shows an app surface, you may redesign it (rising tides, bible 22), in
the lab, as a candidate. (e) **Vercel is capped** (the free plan's 100 deployments per trailing day, hit at
23:31 on the 14th; the window frees through the afternoon of the 15th): push, but verify on a local
production build or dev server at 1440 and 375 in a foreground tab, and say so in the Handoff. (f) The
record: "Handoff (round 4)" and "Record (round 4)" below; the Record is the paragraph the CHANGELOG carries
for round 4, so write it as what the board became and why.

**Will's ruling, verbatim.** "3 can be killed as the home hero, but the background (images emanating) would
be beautiful for the /features/album hero for the live album. Use that for the hero animation looped to add
the 'live' feel of an album full of images, then keep an album page visual wide below as the actual live
album product, with less animation so the hero images and album animation don't conflict and get too
overwhelming. It doesn't need the QR code for the new version."

**Goal.** The `/features/album` hero, rebuilt from the burst's field. Your lane is seeded with the burst as
it left the home hero board (`burst.tsx`, `burst.css`, moved here whole; read `docs/tracks/hero-burst.md`
for its three rounds of notes): the field where every frame is born at a point and radiates around the
compass and forward out of the screen, with the acceptance walk, the ease-out flights in world units and
the lockup's quiet zone. (1) **The hero.** The field becomes the album page's hero: no code at the centre
(the origin is the album itself, or the page's headline, or nothing visible), looped forever so the album
reads as alive and full, the headline and subhead of the album page over it in the quiet zone (today's
copy from `src/app/(marketing)/(cinema)/features/album/` and `feature-pages.ts`; the voice board's
proposal may be read), at 1440 and 375, reduced motion as the settled field, JavaScript off as the first
paint. (2) **The album below.** Under the hero, the live album product as a wide visual: the real guest
album's grid (compose on the production components: the gallery, the media tiles, the lightbox trigger)
filled with the stand-in frames, with less animation than the hero (a calm entrance, a slow drift at
most), so the two do not fight; the hero is the feeling and the album is the product. (3) **The page.**
Show the two together as the top of the real page on the cinema ground, then the rest of the page's
sections as they ship, so the hand-off from hero to album to chapters is judged whole. (4) The board
composes the shell (`Stage` at 1:1, `Toggle`, `BoardDock` for the canvas and Replay, `BoardMeta` with the
asks); it is registered on the desk as `album-hero`; keyframes and classes keep the `hhb-` prefix or move
to `alb-` (say which). (5) The assets: the same 24 squares (row 2) and the portraits (row 9) serve; say so.
The asks: the departures Will rules on, no more.

**The contract.** Your board is `sandbox/album-hero/board.tsx`, exporting `AlbumHeroBoard` and importing
`./board.css`; it is registered on the desk as `album-hero` (`touchpoints.ts`, the Orchestrator's; its
placeholder variants are renamed at integration from your Handoff). Compose the shell from
`@/components/dev/board`: `Stage` (a real viewport at 1:1 on the cinema ground; pass `bodySkin` on a
cinema-only board), `Toggle`, `BoardDock` for the page-wide switches, `BoardMeta` for the question, the
candidates, the asks, the departures and the assets; `setCandidateCss` if the board hands the site a paste.
The seed in your lane (`burst.tsx`, `burst.css`) is the burst as it left the home-hero board, imports fixed
to `../home-hero/shared`; keep it, cut it or rewrite it, it is yours. Keyframes and classes under `hhb-`
or `alb-` (say which). Production components are composed, never edited (`src/components/guest/`,
`src/components/marketing/`): a redesign of one is a candidate in your lane.

**Rulings in force.** The bible on `/design/rules` (second edition): 1 (media is the color), 4 (a guest
surface is the host's, so the album visual carries the host's event, not Partyreel's chrome), 13, 14, 17
(chapters open strong), 21 (copy is open), 22 (rising tides). The media manifest is the only source of
paths (bible 18).

**Verify on.** `/design/c/album-hero?key=` on a local production build at 1440 and 375, reduced motion, the
gate; the preview alias once Vercel's window frees.

### The rules of this wave (every track)

- **The shell is shared and registered.** Never edit `src/components/dev/` (the board shell: `Stage`,
  `Toggle`, `BoardDock`, `BoardMeta`, the tuner, the candidate block), `touchpoints.ts`, `rules/bible.ts`,
  another track's files, or CHANGELOG, STATUS, ROADMAP, PROGRAM, CLAUDE, AGENTS, `docs/ASSETS.md`; a
  shell change you need is asked for in the Handoff and the Orchestrator lands it (announced in
  `docs/tracks/orchestrator.md`).
- **Sheets.** Keyframes under your prefix only (`keyframe-uniqueness.test.ts` reads every sheet under the
  lab); a board sheet never imports tailwindcss; `glow-contract.test.ts` pins the BorderBeam and
  GlowFilter counts across `src`, so compose `<Glow>` only. No em-dashes anywhere a person reads. No
  `font-mono`, no `MonoCaption` (`two-faces-policy.test.ts`).
- **Light QA** (Will, 2026-09-14): the board at 1440 and 375, reduced motion honoured, the gate green on
  the synced tree; Vercel is capped, so verify on a local production build or dev server in a FOREGROUND
  tab (a hidden tab pauses the loops and lays the lab out in the sidebar cell:
  `docs/systems/testing-verification.md`) and say so in the Handoff.
- **Commits** on `lp/<track>` only, staged explicitly, never `--no-verify`, never force; every commit ends
  with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. The board is lab-only and ships no production byte; the wiring round owns
  `docs/systems/design-system.md` when Will rules this in.

## Deferred (ROADMAP one-liners, bucket named)

- Marketing overhaul: wire the album hero onto `/features/album` once Will rules the step and the
  album's width rule (the field replaces `ArrivalsHero`'s `ArrivalsStage`; the album visual goes
  under it).
- App overhaul: the guest album's WIDTH rule, and it is two declarations, not one:
  `columns-2` -> `columns-2 md:columns-3 xl:columns-4` in `src/components/guest/guest-masonry.tsx`
  AND a wider laptop cap than `max-w-2xl` in `src/components/guest/event-experience.tsx` (which holds
  the whole guest column at 632 px of content at every viewport, so the column rule on its own would
  ship 156 px tiles), if the board's candidate is ruled in.

## Handoff (round 1)

- Head `0edcacd` plus this manifest commit, pushed. Round one's first hand-off was `13d6eb9`; a
  first read-back found four defects (closed at `fe41436` + `01bf584`, listed under "What the first
  read-back changed"), and a second read-back found one more, closed in this pass and listed under
  "What the second read-back changed". The preview at
  `partyreel-git-lp-album-hero-partyreel.vercel.app` was NOT waited on and the Vercel API was not
  called (Vercel is at its daily deployment cap, so no preview will build for this head either).
  **Everything below was verified on a LOCAL PRODUCTION BUILD** (`pnpm build && pnpm start`, my own
  worktree's server, never the root checkout's on 3000) at 1440 and at 375, this pass included. The
  port moved from 3011 to 3047 for this pass, because another track's server had taken 3011; check
  the port before trusting a localhost read, since a stale server on a sibling worktree serves a
  different board at a 200.
- **Say the tab honestly.** The first hand-off walked a fronted tab. This pass could not hold one:
  seven tracks are driving the same Chrome window tonight and each new lab tab steals the foreground,
  so this tab read `document.visibilityState === "hidden"` throughout and an occluded window suspends
  rAF completely (0 frames; `docs/systems/testing-verification.md`). Rather than call that a walk, the
  loop was driven by hand: `requestAnimationFrame` was replaced with a queue a stepper drains at a
  synthetic 16.7 ms, which is the doc's own "freeze the loop at a chosen elapsed" and what
  `burst.tsx`'s loop was written to allow. Every number below is a DOM measurement at a stepped
  instant, and every screenshot was cross-checked against the DOM (the capture paints the region a
  beat late, and the arrival reveals need their `data-inview` forced because IntersectionObserver
  never delivers in a hidden tab, both known blind-spots, neither a product fault). **What a human
  eye still owes this board: thirty seconds of reading 1 at real speed.** Nothing measurable is left.
- Synced with `launch-prep` at `6484558` (it had moved two doc commits since the cut; merged clean).
- Gates, re-run on this pass's tree: typecheck ok, lint ok (0 errors; the 6 warnings are all
  pre-existing files outside this lane), test ok (1804 in 199 files), build ok (114 routes). The
  board was re-walked on the fresh production build at 1440 and 375 after the change (reading 2 under
  both switch positions, reading 3's cut), since this pass touched a caption the board renders.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/album-hero/`
  (board.tsx, board.css, burst.tsx, burst.css, album.tsx, album.css) + this file. No exceptions.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.

### What the second read-back changed (this pass)

- **The one production change on the board is now argued from the APP's canvas, not the BOARD's.**
  The ask, the matching departure, the ROADMAP one-liner and the two WHY-comments (`album.tsx`'s
  header and `album.css`'s) all said "two columns of a 1440 canvas are 700 px tiles" and priced the
  candidate at "about 700 px to about 280 px". Those are the BOARD's frame (1154 px) and not even
  that: the shipped guest album is 632 px wide at every viewport, because `event-experience.tsx:165`
  caps the whole guest column at `max-w-2xl` with `px-5`. So the shipped tile is about 314 px, and
  `columns-2 md:columns-3 xl:columns-4` ON ITS OWN would have shipped **156 px** tiles into the real
  album, which is worse than what ships. The ask now names TWO declarations (the column rule plus a
  wider laptop cap), carries the arithmetic for each, prices the cost honestly (about 314 px to about
  276 px, and a cap that widens the event header, the reel card and the action row with the grid),
  and says in the stage caption that the 1154 px frame is the end state rather than today's page. The
  full arithmetic is under "What was measured". Nothing shipped changed: this lane is lab-only and
  the correction is text, in `board.tsx`, `album.tsx`, `album.css` and this file.
- `src/components/guest/event-experience.tsx` was added to this manifest's `reads`, since the ask now
  cites it.

### What the first read-back changed

- **Reading 3 is the whole route now.** It stopped at `GettingInSection` and `EverywhereSection`,
  which quietly left off the hand-off most at risk from a full-bleed hero that never resolves: the
  cinema-to-paper cut. It now runs `QualitySection`, the six-section `PaperChapter`,
  `RelatedFeatures`, the FAQ with `GoDeeper` and the `CtaBand`, in the shipped order, mirrored by
  hand from `page.tsx` with a comment that says so and says what is left out (the BreadcrumbJsonLd,
  invisible; the overlay `MarketingHeader`, whose sticky position would resolve against the lab page
  and ride down the board instead of sitting over the hero).
- **The candidate's density figure is the field's.** BoardMeta said "forty frames at 1440 and
  thirty-six at 375" against `GEO` at 52 and 44. Will rules the headline step against that number, so
  it now reads fifty-two and forty-four, with the steady-state count beside it.
- **The no-script paint is described the right way round**, in all three places a person reads it (the
  board's departure, this Handoff, the Record) and in the three code comments that carried the same
  sentence (`burst.css`'s header, two in `burst.tsx`). See the bullet under "What was measured".
- **The desk entry now has names to land**: the three readings and the two candidates are listed
  under "Shell changes asked for", with a replacement `note`, because the contract says the
  Orchestrator renames the placeholder from this Handoff and the first pass forgot to supply it.

### What the board is now

Three readings of the top of `/features/album`, every page-wide switch in `BoardDock` (canvas,
headline step, the album's column count, Replay), every stage at 1:1:

1. **The hero.** The burst's field with its centre taken out. The origin is nothing visible: a vent
   the album emanates from. Because the QR plate used to be what hid a birth, the birth had to become
   a POINT (`s0` 0.24 -> 0.035, so a new frame is about 13 px at 1440 and 8 px at 375 and grows out of
   nothing), and `geo.vent` is what `geo.qr` was, at 116 against 140. The lockup is
   `/features/album`'s SHIPPED lockup, measured off the real page rather than restyled: PageHero's
   `max-w-3xl` measure, the lg ramp's `text-7xl` at `leading-[1.0]` (two lines, 732 px of ink), the
   `text-lg` subhead at `max-w-xl`, the two shipped buttons untinted, the real eyebrow. It loops for
   ever with no resolution, which is the "live" Will asked for.
2. **The live album, wide.** The shipped guest album COMPOSED, not drawn: `GuestMasonry`, `MediaTile`,
   the lightbox trigger, the host's own event chrome in the shape the guest page ships (name, byline,
   stats), inside the marketing `BrowserFrame`. Its only motion is the product's own entrance
   (globals.css's `[data-media-tile]` fade-rise, 45 ms stagger capped at 540) plus one 6 px green
   status dot, so it never competes with the hero.
3. **The page, whole.** Hero, album, then every section `/features/album` ships, in its shipped
   order, down to the closing band: the first chapter's `GettingInSection`, `EverywhereSection` and
   `QualitySection` on cinema, the paper chapter's six desk sections, then the close (the doors, the
   FAQ and the CtaBand) back on cinema. 13,796 px of stage at 1440 and 15,064 at
   375, measured by the stage itself (`MeasuredStage`), so no section is ever clipped in half. The
   cut from cinema to paper is the thing to look at: it is the hand-off a hero that never stops
   moving is most likely to disturb, and it is a chapter and a half below the field.

### What was measured (local production build, 1440 and 375; this pass re-measured everything)

- **The quiet zone holds at every combination, re-proved on this tree.** A running-field probe
  stepped the loop and tested every visible card's bounding box against the lockup's INK at each
  instant: 908 card-instants at desktop lg, 671 at desktop xl, 520 at phone xl and 866 at phone lg,
  **2965 in all, zero overlaps, worst overlap 0 px2**. Two notes for whoever runs it next. The probe
  uses the card's AABB, which is larger than the rotated card, so the test is stricter than the
  guarantee. And the ink is NOT the five `[data-alb-block]` element rects: `under` and `actions` are
  `absolute inset-x-0`, so their rects span the canvas and a card out at x=540 "overlaps" a box whose
  ink is 160 px wide in the middle. Measure the ink (a `Range` over each text block, plus the two
  action anchors' own rects, which is what `KEEP`'s hand-measured half-extents model); an element-rect
  probe reports dozens of overlaps that are not there.
- **The settled composition is whole.** With the loop suppressed (the reduced-motion state), every
  card at desktop lg, phone lg and phone xl is entirely inside the canvas. It was not, before: one
  card of 52 hung 3 px past the left rim, because `extents()` models the 2D rotation only and the
  per-card 3D tilt goes through a `perspective(760px)`. `RIM_GUARD` (6 px) closes it; worst margin is
  now 4 px INSIDE at 1440 and 7 px at 375.
- **Density.** 52 frames at 1440 and 44 at 375 over a 9.6 s flight; steady state 19 to 27 on screen
  at 1440 and 13 to 22 at 375. The pool fills at every combination (52/52 and 44/44), which means the
  acceptance walk still found that many watchable directions against a lockup this large.
- **Density costs nothing on the wire.** 52 frames are **12 image requests, 536 KB, 45 KB average**,
  because the browser dedupes the shared sources. 120 fps with two fields running (104 cards), 34 MB
  heap.
- **The server's own HTML** carries the h1 at full opacity with no `data-mkt-cut`, `data-mkt-reveal`
  or `.mkt-line` on it (bible 13), and 104 cards each with its `--alb-rest` rest-state transform
  (52 per field, two fields at 1440). Zero em-dashes in the rendered page.
- **What a reader with JavaScript off actually gets, which round one stated backwards.** The rest
  state is in the markup, but `burst.css` collapses `.alb-card` to `scale(0)` at `opacity: 0` inside
  `@media (prefers-reduced-motion: no-preference)`, and no-preference is the DEFAULT match, so it
  overrides the rest rule for everyone who has not asked for less motion. Measured rather than
  reasoned: with `matchMedia("(prefers-reduced-motion: no-preference)").matches === true`, a card
  carrying no inline style computes to `matrix(0, 0, 0, 0, 0, 0)` at opacity 0. So a crawler and a
  JavaScript-off reader get **the lockup alone on the cinema ground, no photographs**; a
  REDUCED-MOTION reader is the one who gets the settled album, whole and still. Nothing that carries
  meaning is gated (the type is plain markup at full opacity, the field is `aria-hidden`), and the
  swap would be worse to look at, not better: paint the album settled for everyone and the loop has
  to snap it back to the vent on every load. It stands as a departure, stated as what it is, and Will
  can rule the no-script frame the other way in one line of CSS.
- **The phone reading of the page tail is approximate, and the reason is the shell.** A Tailwind
  breakpoint prefix inside a `Stage` reads the REAL browser viewport, not the canvas (`stage.tsx`
  says so; the brand-voice board found it), so inside the 375 canvas on a 1600 window the shipped
  sections resolve their `md:`/`lg:` rules as DESKTOP and only their widths are truly 375. The cut,
  the order and the type sizes read correctly; the per-section vertical rhythm at 375 does not. It is
  not worth a change in this lane, and it is why the phone judgement here is the hero and the cut
  rather than the tail's spacing.
- **The production components work in the board**: a tile opens the real lightbox and Escape closes
  it; the column switch flips the shipped `columns-2` to 4 and back.
- **The album's real geometry, which the width ask is now argued from** (the second read-back's
  finding). Every number below is arithmetic off the shipped classes AND was measured in the live
  DOM on this pass, by building a probe with the shipped container's exact classes inside a 1440 px
  box. `GuestMasonry` is rendered in exactly ONE place in the product, `live-gallery.tsx` inside
  `event-experience.tsx:165`, whose container is `mx-auto w-full max-w-2xl flex-1 px-5 py-8`: 42rem
  less 2 x 20 px = **632 px of content at every viewport, 1440 included** (measured 632). With
  `columns-2 gap-[3px]` that is a tile of **(632 - 3) / 2 = about 314 px** (measured 314.5), three
  columns would be about 209 px (208.66), and the responsive rule ON ITS OWN would give **(632 - 9)
  / 4 = about 156 px** at `xl` (measured 155.75). A laptop cap of `max-w-6xl` gives 1112 px of
  content and about 276 px at four columns (measured 1112 and 275.75), which is the figure the ask
  quotes. This board's own frame is a different width again: 1440 less `px-16` is 1312, capped by
  `max-w-[1180px]`, less `BrowserFrame`'s `p-3` and its 1 px border each side = **1154 px**
  (measured 1154), so its two-column tile is about 576 px (575.5) and its four-column tile about
  286 px (286). The board's stage is therefore a picture of the END STATE (both declarations), not
  of the column rule alone, and the ask, the departure, the ROADMAP one-liner and the two code
  comments all say so now.
- **The lab's blind-spots bit four times across the two passes** and none was a product bug
  (`docs/systems/testing-verification.md`): a capture past about 1000 px of scroll comes back black
  though the DOM is correct; a capture taken straight after a scroll paints the region a beat late
  (the album's twelve tiles read as grey boxes while the DOM had all twelve images `complete` at
  `naturalWidth` 900 and every tile at opacity 1); an occluded tab suspends rAF outright, so the
  field reads as empty until the loop is stepped by hand; and an occluded tab never delivers the
  first IntersectionObserver callback, so 49 arrival reveals sat un-shown until `data-inview` was
  forced. Every one was settled by measuring the DOM, and an `await` on a `setTimeout` in a
  background tab is its own trap (Chrome's intensive throttling made a 900 ms wait outlast a 45 s CDP
  timeout; wait across tool calls, not inside one).

### Shell changes asked for (the Orchestrator lands them)

- **The desk entry's placeholder variants, which the contract says you rename from this Handoff**
  (`touchpoints.ts`, the `album-hero` entry; it still reads `variants: ["The seed (the burst)"]`, the
  seed this board replaced). The board has three readings and two candidates; the readings are what a
  reader sees down the page, so land them as the variants:
  `["The hero", "The live album, wide", "The page, whole"]`. And the `note` on that entry still
  describes the seed; the board it now points at is: "The burst's field with its centre taken out as
  the album page's hero, looped for ever with the page's own shipped lockup in a quiet zone no frame
  enters, the real guest album composed and calm below it, and the whole shipped route under the two
  so the cinema-to-paper cut is judged with the hero running". Nothing in this lane touches that file.
- **Rename `sandbox/album-hero/burst.tsx` and `burst.css` to `field.tsx` / `field.css`** when
  `lp/hero-source` closes. The file is no longer the home hero's burst and the name says the wrong
  thing, but `docs/tracks/hero-source.md` declares that exact path in its `reads`, so renaming it now
  turns a LIVE track's lane guard red (`track-manifests.test.ts` caught it). The rename is one
  `git mv` plus the two import lines in `board.tsx` and the sheet import in the file itself.
- Nothing else. `src/components/dev/`, `touchpoints.ts` and `bible.ts` were not touched.

### Assets requested from Will

- 24 event photographs as 512 x 512 squares · one grade, 6 to 35 KB webp each, across weddings,
  birthdays, corporate and festivals, framed tight enough to read at 90 px (a face, two hands, a
  glass, a sparkler, a first dance), never a wide room shot · replaces the 12 landscape stand-ins the
  field cycles (`FRAMES` in the home hero's `shared.tsx`). Already `docs/ASSETS.md` row 2; the same
  24 serve BOTH the hero field and the wide album grid.
- 11 more of the same as 4:5 portraits · 512 x 640, same grade, recrops of the 24 are fine · one for
  every 4:5 slot the field lays out. Already ASSETS row 9. Guests shoot vertical: eleven of the twelve
  stand-ins are landscape, which is why the wide album grid reads flatter than a real album does.
- 2 short clips as album tiles · 6 to 10 s, 4:5 or 9:16, muted, under 2 MB each, poster frame
  included · so the album grid can show a real video tile with the corner play badge the guest album
  ships. Every tile is a photograph today because `MediaTile` renders a real `<video>` and pointing
  one at a jpg shows an empty box. NEW: not on ASSETS yet.
- Nothing else. No plate art, no lamp, no QR: the code left the composition with Will's ruling.

### The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will)

- "Rule on, the headline step: lg or xl. It is the one choice that changes the composition rather than the styling, because the field is re-solved against the lockup the step draws. lg (text-7xl at 1440, text-4xl at 375) leaves the album the canvas and keeps the corridor beside the vent wide enough to be born in; xl (text-8xl, text-5xl) is the louder promise and takes about 80 px of quiet zone in every direction, which at 375 drops a further slice of the compass out of the pool."
- "Rule on, the album's width, and it is an APP-UI change, not a marketing one, and it is TWO declarations rather than one. What decides the tile is the CONTAINER before the column count: the shipped guest page caps its whole column at max-w-2xl with px-5 (event-experience.tsx), so the album is 632 px wide at EVERY viewport, 1440 included, and columns-2 makes that two tiles of about 314 px. Raising the column count alone (columns-2 md:columns-3 xl:columns-4 in guest-masonry.tsx) would cut the same 632 px into four tiles of about 156 px, which is worse than what ships. So the candidate is that rule AND a wider laptop cap, for instance max-w-2xl lg:max-w-6xl, which is 1112 px of content at 1440 and four tiles of about 276 px. WHAT IT BUYS: the album stops being a 632 px strip down the middle of a laptop and becomes the page, at roughly twice the photographs in a screenful, and the marketing page can show the album wide at all. WHAT IT COSTS: the cap carries the WHOLE guest page, so the event header, the reel card and the action row widen with the grid; the tile goes from about 314 px to about 276 px; and the masonry's natural-ratio signature reads quieter the more columns it has. NOTE the stage above is the board's own frame at 1154 px, which is about what the widened cap would give (about 576 px at two columns, about 286 px at four), not the 632 px that ships today."
- "Rule on, the album's life: the pulse alone, or an arrival. It ships with one live signal, a 6 px green dot pulsing every 2 s, and nothing else; the product's real behaviour is a new tile landing at the head of the album every few seconds with its green check. The second is the truer demonstration of live and is the thing most likely to fight the hero, which is why it is an ask and not a default."
- "Rule on, the copy: the page's own lines stand (bible 21 leaves them open). The hero renders /features/album's shipped eyebrow, h1 and subhead verbatim from feature-pages.ts. The brand-voice board's proposal would rewrite the subhead here; this board proposes nothing of its own, because the field is the argument and the sentence is the page's."

### Look at first

`/design/c/album-hero?key=` at 1440. Reading 1 for thirty seconds with nothing else on screen: the
album should never stop arriving, and no word should ever sit on a photograph. (Those thirty seconds
are also the one check no tool could run tonight, for the reason in the second bullet at the top of
the Handoff.) Then reading 3, which is now the whole route: the only place both animations run at
once, and the only place to see what a hero that never resolves does to the CINEMA-TO-PAPER CUT a
chapter and a half below it, the hand-off most likely to be disturbed and the one missing from the
first hand-off. Then flip **Headline lg / xl** from the dock at any scroll position, which is the ask
that changes the composition rather than the styling.

### Findings against a rule (a finding, not a wall)

- **Bible 10 (the hero is unlit)**: the frames carry the light spec's LIFT shadow at four times the
  offsets, inherited from the burst and re-flagged here. It is a shadow and never a lamp; without an
  edge the depth axis collapses into a flat scatter.
- **Bible 13, decorative layer only**: the field's first frame lives inside the
  `prefers-reduced-motion: no-preference` block, which is the DEFAULT match, so a reader with
  JavaScript off who has not asked for less motion gets the lockup alone on the cinema ground and no
  photographs; the reduced-motion reader is the one who gets the album settled and whole. Nothing
  that carries meaning is gated, and the trade is on the board as a departure for Will to rule.
- **No rule blocked the work.** The one thing that blocked a change was another track's lane claim
  (the rename above), which is the guard doing its job.

## Record (round 1; the CHANGELOG paragraph for round 1, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). The burst, killed as the home hero, became the
live album's. Its centre came out: with no QR plate to hide a birth behind, the birth became a point
(a frame is born at 13 px at 1440 and 8 px at 375 and grows out of nothing) and the plate's radius
became a vent the album emanates from. The lockup over it is `/features/album`'s SHIPPED lockup,
measured off the real page rather than restyled, and the field is denser and slower than the home
hero's so the album reads full and never resolves: 52 frames at 1440 and 44 at 375 over a 9.6 s
flight, 19 to 27 on screen, and 12 image requests for all of them. Under the hero the board put the
shipped guest album itself, composed and not drawn (GuestMasonry, MediaTile, the lightbox, the
host's own chrome), calm by design: the product's own entrance and one status dot, so the two halves
of the page do not fight. A third reading stacks the hero, the album and then the whole shipped
route beneath them, every section in its shipped order on a stage that measures its own content, so
the cut from cinema to paper is judged with the hero still running rather than imagined. The quiet
zone was re-proved on the running field at all four canvas-and-step combinations: 2965 card-instants
against the lockup's ink, no word ever under a photograph; the settled composition, which is what a
reduced-motion reader gets, was found hanging 3 px past the rim and guarded; and the no-script frame
turned out to be the lockup alone, because the collapsed first frame sits in the no-preference query
that matches by default. The board asks Will for the headline step, the guest album's width rule (an
app-UI candidate of two declarations, argued from outside the shipped component), whether the album
should breathe,
whether a reader with JavaScript off should get the settled album instead, and three short clips.
