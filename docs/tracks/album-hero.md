---
track: album-hero
status: open
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

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (round 1)

- Head <sha>, pushed; preview partyreel-git-lp-album-hero-partyreel.vercel.app (may not build while Vercel is capped: say how the board was verified locally)
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Shell changes asked for (the Orchestrator lands them): none, or one bullet each
- Assets requested from Will: none, or one bullet per asset: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will): ...
- Look at first: ...

## Record (round 1; the CHANGELOG paragraph for round 1, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
