---
track: hero-gathering
status: integrated
cut: "f28d521"          # the launch-prep SHA the branch was cut from
merged: "8f1432c"      # the branch head merged into launch-prep
preview: true           # Will's review surface: every push builds partyreel-git-lp-hero-gathering
owns:
  - src/app/(dev)/design/sandbox/home-hero/gathering.tsx
  - src/app/(dev)/design/sandbox/home-hero/gathering.css
reads:
  - src/app/(dev)/design/sandbox/home-hero/shared.tsx
  - src/app/(dev)/design/sandbox/home-hero/board.tsx
  - src/app/(dev)/design/rules/bible.ts
  - src/lib/constants/marketing-media.ts
  - src/components/marketing/sections/reel/ambient-reel-video.tsx
  - src/lib/shared/use-ambient-pause.ts
---

# lp/hero-gathering

**Goal.** The gathering, concept of the home-hero board's second round (Will, 2026-09-14: round one's four
grids were "very bland and generic", not "the one QR/link -> full event album concept"; everything is
open, the hero's UI, its copy, the eyebrow, and the design system around it under rising tides).
Centred type on the cinema ground with a bespoke arrangement of photographs and short vertical clips around it: cards of unequal size and slight rotation on an irregular field, never a grid, some cards video (the portrait stand-in reel via `reelById(REELS.portrait)`, cut into 3 to 5 s ranges by `currentTime`, on the house video pattern), the whole field breathing with a slow parallax on scroll and a gentle idle sway. Above the h1, the eyebrow IS the demo QR, small and real (`DemoQr` at about 72 px) with a caption in the Caption atom; the composition argues that the album is made of many hands. The type at the ladder's `xl` step resolved per canvas from LADDER. Phone: the field collapses to two staggered columns behind the type with fewer, larger cards. Media at 100 percent, no darkening layer anywhere; the type wins by placement (air around it, cards kept off the type's box), never by a scrim. Every loop inside the reduced-motion block with the settled field as the rest state; mark loops with `data-hh-loop`.

**The contract.** Your file exports one `Concept` (see `shared.tsx`, which is the whole doctrine:
read it first and hold every line of it). The board renders `concept.render(props)` inside a stage
that already lays out at a real viewport's pixels (1440 x 930 or 375 x 760, fitted with `zoom`) and
carries the cinema skin, `data-mkt` and `data-paused` on a hidden tab. Your `Concept` also carries
what the board lists beside the stage: `eyebrow` (yours: the QR, small and real, above the h1, with a caption), `proposed` copy (the stub's lines are
a starting point; improve them, they are proposals), `departures` (flag: none expected; light only as a flagged departure) and `assets` (name
exactly what replaces your stand-ins: 36 event photographs, mixed orientation, a third portrait, one grade, 1600 px long edge; and 8 vertical clips of 3 to 5 s at 1080 x 1920 with posters). Replace the stub's `Placeholder` render; keep the export
name and the id. Keyframes live in your own sheet with your prefix. You own two files and nothing
else; if the shell lacks something you need, say so in Handoff rather than editing it.

**Rulings in force.** The bible on `/design/rules` (22 rules, Will's), above all 1 (media is the
color: no darkening layer over a photograph), 13 (the h1 at paint, never gated; `marketing-h1-policy`
scans the lab), 14 (every animation inside the reduced-motion block, a designed rest state), 21 (the
thesis renders verbatim under the ruled toggle; your proposal renders under the proposed toggle), and
the standing ruling that the hero is cinema and unlit (light only as a flagged departure). The media
manifest is the only source of paths. Take the big swing: a totally different, better hero beats a
safe increment, and the reference's mechanic is a starting point, not a ceiling.

**Verify on.** partyreel-git-lp-hero-gathering-partyreel.vercel.app, `/design/c/home-hero?key=` (the key is
`DESIGN_PREVIEW_KEY` in `.env.local`): your concept at Desktop and Phone 375, ruled and proposed copy,
Replay, reduced motion (the rest state), the h1 present at opacity 1 off the DOM. Light QA by the
exploration-round principle: nothing more.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none: no production byte moved. Two lab files, both owned.

## Deferred (ROADMAP one-liners, bucket named)

- Marketing overhaul: if the gathering is the pick, the wiring round lifts `.hhg-card`'s clearing
  profile and its parallax hook into the shipped hero and retires the four stacked darkenings the
  current `cinema-hero.tsx` puts over its wall.

## Handoff (replaces the chat report)

- Head: the tip of `lp/hero-gathering`, pushed. The last commit touching the concept is `0ff8ef6`;
  everything after it is this manifest. Preview partyreel-git-lp-hero-gathering-partyreel.vercel.app,
  `/design/c/home-hero?key=<DESIGN_PREVIEW_KEY>` (verified at `5f873e5`, which carries the same two files).
- Synced with launch-prep: it had not moved (`git rev-list --count HEAD..origin/launch-prep` = 0, cut from `f28d521`)
- Gates on the tree: typecheck ok, lint ok (0 errors; the 6 warnings are pre-existing, none in my files), test ok (1636 in 190 files), build ok (246 static pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/hero-gathering.md`,
  `src/app/(dev)/design/sandbox/home-hero/gathering.tsx`, `src/app/(dev)/design/sandbox/home-hero/gathering.css`. No exceptions.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- **The shell, two notes** (I edited nothing in it):
  1. `useTabHidden` lives in `board.tsx` and is not exported, so every concept that drives a video
     re-implements it. `lp/hero-reel` reports the same duplication independently, which makes three
     copies across the board. It belongs in `shared.tsx` (or in `src/lib/shared/`, beside
     `use-ambient-pause`, which is the production swap).
  2. A clarification worth folding into `shared.tsx`'s doctrine: "geometry comes from CANVAS, never
     getBoundingClientRect" is about POSITION, and a zoom-invariant RATIO off a rect is safe,
     because the zoom factor cancels in `top / height`. The parallax reads scroll progress that way
     and is exact at any stage scale; nothing here is ever positioned from a rect.
- Two of the shell's rules earned their keep: `sizes` canvas-relative (a vw picks the wrong
  candidate under the stage's `zoom`), and Replay as a remount (the entrance is CSS with `both`, so
  the field re-gathers for free).

- **Assets requested from Will** (the ask also renders on the board):
  1. **36 event photographs**, one grade, 1600px long edge, a third of them portrait. The field
     places 12 at once on desktop and 5 on phone, in 3:2, 16:9, 1:1, 4:3, 4:5, 3:4 and 2:3 boxes, so
     a frame that exists only at 3:2 crops hard in the tall slots. Replaces all twelve stand-ins by
     id: `wedding-golden`, `party-dj`, `reception-table`, `festival-lights`, `wedding-petals`,
     `concert-confetti`, `wedding-toast`, `festival-crowd`, `wedding-rings`, `reception-hall`,
     `party-balloons`, `wedding-arch`.
  2. **8 vertical clips**, 3 to 5s, 1080 x 1920, silent, **each with its own poster** at 1080 x 1920
     (the clip's first frame). Three run at once on desktop and two on phone. They replace the three
     `currentTime` ranges this cuts out of `hero-candidate-01`, which shares ONE poster between all
     three today, so a card's poster currently shows a different moment than its clip.
  3. **3 of the 36 showing a guest holding a phone up at the event.** The many-hands argument is
     carried by the arrangement; it lands harder if one or two frames say it literally.

- **Look at first**, in this order:
  1. **Desktop, ruled copy, on load.** The type is there at paint and the album gathers around it.
     Fifteen frames land in a burst, then two stragglers arrive a beat later (1.5s and 2.4s), which
     is the whole argument: an album keeps filling while you read.
  2. **The clearing.** No scrim anywhere, no darkening layer, no dimming: the type wins purely by
     placement, against a clearing that is the lockup's real profile band by band (measured off the
     rendered lockup at both canvases, not guessed). Zero card boxes intersect a band at either
     canvas.
  3. **The three clips.** Each holds a 4.2 to 4.5s range cut at the reel's OWN shot boundaries, so a
     range never opens mid-shot; verified they never overrun the end and snap forward from below it.
  4. **Scroll the board past the stage.** Near frames lead the page and far ones lag it, around a
     neutral depth, so the field separates in both directions rather than sliding as one plate. That
     hook is the production one, not a lab stand-in.
  5. **Phone 375.** Seven larger cards in staggered pairs, not two columns: at 375 the lockup is
     sixty percent of the height and the h1 alone is the full column, so two full-height columns
     beside the type exists only with a scrim. The pair flanking the QR at half off each edge is
     what keeps the album around the type there. **This is the one place the brief's phrasing and
     the build differ, and it is a ruling for Will**: accept the staggered pairs, or spend a phone
     scrim, or drop the phone h1 a step off the ladder.
  6. **The two copy proposals and the eyebrow caption**, beside the ruled line on the board.
  7. Hover a frame: it lifts 1.8% and its edge warms, and nothing else moves. No isolate dim, on
     purpose (bible 1 reads better without thirteen photographs stepping back for a cursor).

- **Verified on the preview at `5f873e5`** (partyreel-git-lp-hero-gathering, 1500px and Phone 375):
  15 cards and 3 clips in the desktop stage and 7 on phone, the h1 at `opacity: 1` with
  `animation-name: none`, every one of the 15 images loaded, and the QR encoding the real demo
  event. The three clips read `paused, readyState 0` there because the MCP tab is a HIDDEN tab and
  the stage sets `data-paused`: the tooling, not a bug, and incidentally an end-to-end proof of the
  pause contract. They were sampled playing in range on localhost. The entrance still completes in
  a hidden tab (only `data-hh-loop` is paused), so the rest state is always reached.

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). The home-hero board's third concept, the
gathering, replaced its placeholder: centred type on the cinema ground inside a CLEARING that is the
lockup's real profile band by band, with fifteen photographs and vertical clips hand placed around
it in five overlapping clusters, unevenly weighted, bleeding off all four edges. The lockup carries
no entrance at all, so the h1 is at paint by construction (bible 13) and the album gathers around
type that was already there; two frames land late, a beat after the burst. Depth buys the parallax
rate, the sway amplitude and the stacking order and never a dimming, so the media stays at 100% with
no scrim anywhere (bible 1). Three cards are vertical clips cut out of the portrait stand-in reel at
its own shot boundaries by a rAF range keeper, on the house poster-first pattern with one
refinement: the cross-fade waits until playback is inside the range. Phone is seven larger cards in
staggered pairs, since two full columns beside a 48px h1 at 375 exists only with a scrim. Every
animation sits inside the reduced-motion block and every loop is marked `data-hh-loop`; the rest
state is the settled field.
