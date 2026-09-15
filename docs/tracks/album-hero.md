---
track: album-hero
status: handed-off
cut: "c473707"
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
  column rule (the field replaces `ArrivalsHero`'s `ArrivalsStage`; the album visual goes under it).
- App overhaul: the guest album's column rule, `columns-2` -> `columns-2 md:columns-3 xl:columns-4`
  in `src/components/guest/guest-masonry.tsx`, if the board's candidate is ruled in.

## Handoff (round 1)

- Head `6fca2d8` plus this manifest commit, pushed. The preview at `partyreel-git-lp-album-hero-partyreel.vercel.app` was NOT
  waited on and the Vercel API was not called (the deployment cap). **Everything below was verified on
  a LOCAL PRODUCTION BUILD** (`pnpm build && pnpm start -p 3011`, my own worktree's server, never the
  root checkout's on 3000) in a FOREGROUND browser tab at 1440 and at 375.
- Synced with `launch-prep` at `6484558` (it had moved two doc commits since the cut; merged clean).
- Gates on the synced tree: typecheck ok, lint ok (0 errors; the 6 warnings are all pre-existing files
  outside this lane), test ok (1804 in 199 files), build ok (114 routes, 248 static pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/album-hero/`
  (board.tsx, board.css, burst.tsx, burst.css, album.tsx, album.css) + this file. No exceptions.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.

### What the board is now

Three readings of the top of `/features/album`, every page-wide switch in `BoardDock` (canvas,
headline step, the album's column rule, Replay), every stage at 1:1:

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
3. **The page.** Hero, album, then the real `GettingInSection` and `EverywhereSection`, so the
   hand-off from feeling to product to chapters is judged whole. The album and page stages MEASURE
   their own content (`MeasuredStage`), so no section is ever clipped in half.

### What was measured (local production build, foreground tab, 1440 and 375)

- **The quiet zone holds at every combination.** A running-field probe sampled the four
  canvas-and-step combinations and tested every visible card's bounding box against the five ink
  boxes of the lockup: 1450 card-instants, **zero overlaps**, worst overlap 0 px2. The probe uses the
  card's AABB, which is larger than the rotated card, so the test is stricter than the guarantee.
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
  or `.mkt-line` on it (bible 13), and 104 cards with their rest-state transforms, so a crawler and a
  reader with JavaScript off get the settled album. Zero em-dashes in the rendered page.
- **The production components work in the board**: a tile opens the real lightbox and Escape closes
  it; the column switch flips the shipped `columns-2` to 4 and back.
- **The lab's screenshot blind-spot bit twice** and neither was a product bug
  (`docs/systems/testing-verification.md`): a capture past about 1000 px of scroll comes back black
  even though the DOM is correct, and a long async probe in a tab that is not fronted throttles rAF
  so the field reads as empty. Both were closed by DOM measurement and by fronting the tab; the
  visual checks were taken with the other stages hidden so the one being judged sat at scroll 0.

### Shell changes asked for (the Orchestrator lands them)

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
- "Rule on, the album's column rule, and it is an APP-UI change, not a marketing one. Shipped is columns-2 at every width, which is right for the phone it was designed for; the candidate is two on a phone and four on a laptop (columns-2 md:columns-3 xl:columns-4 in guest-masonry.tsx). WHAT IT BUYS: a host opening their own album on a laptop sees twelve photographs where they now see four, and the marketing page can show the album wide at all. WHAT IT COSTS: a smaller tile, so a face at 1440 goes from about 700 px to about 280 px, and the masonry's natural-ratio signature reads quieter the more columns it has."
- "Rule on, the album's life: the pulse alone, or an arrival. It ships with one live signal, a 6 px green dot pulsing every 2 s, and nothing else; the product's real behaviour is a new tile landing at the head of the album every few seconds with its green check. The second is the truer demonstration of live and is the thing most likely to fight the hero, which is why it is an ask and not a default."
- "Rule on, the copy: the page's own lines stand (bible 21 leaves them open). The hero renders /features/album's shipped eyebrow, h1 and subhead verbatim from feature-pages.ts. The brand-voice board's proposal would rewrite the subhead here; this board proposes nothing of its own, because the field is the argument and the sentence is the page's."

### Look at first

`/design/c/album-hero?key=` at 1440. Reading 1 for thirty seconds with nothing else on screen: the
album should never stop arriving, and no word should ever sit on a photograph. Then reading 3, which
is the only place both animations run at once and therefore the only place Will's worry about them
fighting can be answered. Then flip **Headline lg / xl** from the dock at any scroll position, which
is the ask that changes the composition rather than the styling.

### Findings against a rule (a finding, not a wall)

- **Bible 10 (the hero is unlit)**: the frames carry the light spec's LIFT shadow at four times the
  offsets, inherited from the burst and re-flagged here. It is a shadow and never a lamp; without an
  edge the depth axis collapses into a flat scatter.
- **Bible 13, decorative layer only**: the field's pre-bloom state lives inside the reduced-motion
  block, so a reader with JavaScript off who has NOT asked for less motion sees the album resting
  around the vent rather than blooming out of it. Nothing that carries meaning is gated.
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
of the page do not fight. A third reading stacks hero, album and the page's first two chapters on a
stage that measures its own content. The quiet zone was re-proved on the running field at all four
canvas-and-step combinations: 1450 card-instants, no word ever under a photograph; and the settled
composition, which is what reduced motion and a crawler get, was found hanging 3 px past the rim and
guarded. The board asks Will for the headline step, the guest album's column rule (an app-UI
candidate, argued from outside the shipped component), whether the album should breathe, and three
short clips.
