---
track: hero-reel
status: handed-off      # open -> handed-off -> integrated (deleted at the milestone that ships it)
cut: "f28d521"        # the launch-prep SHA the branch was cut from (round two board shell)
preview: true           # Will's review surface: every push builds partyreel-git-lp-hero-reel
owns:
  - src/app/(dev)/design/sandbox/home-hero/reel.tsx
  - src/app/(dev)/design/sandbox/home-hero/reel.css
reads:
  - src/app/(dev)/design/sandbox/home-hero/shared.tsx
  - src/app/(dev)/design/sandbox/home-hero/board.tsx
  - src/app/(dev)/design/rules/bible.ts
  - src/lib/constants/marketing-media.ts
  - src/components/marketing/sections/reel/ambient-reel-video.tsx
  - src/lib/shared/use-ambient-pause.ts
---

# lp/hero-reel

**Goal.** The reel, concept of the home-hero board's second round (Will, 2026-09-14: round one's four
grids were "very bland and generic", not "the one QR/link -> full event album concept"; everything is
open, the hero's UI, its copy, the eyebrow, and the design system around it under rising tides).
An encapsulated hero. A rounded container inset to the page column (`Container`'s rhythm: 112 px at 1440, 16 px at 375; full-bleed and square-cornered on the phone canvas), sized by the canvas height, filled with a fast-cut highlight reel of real party moments, muted, looping, on the house video pattern (no `autoplay` attribute, imperative `play().catch`, the poster as a separate next/image beneath, cross-faded on `onPlaying`; the stand-in is the landscape manifest reel via `reelById(REELS.landscape)`). The display type set large over it (the ladder's `xl` step resolved per canvas from LADDER), the subhead and two pill CTAs beneath the type. Bottom-left, a pinned card in the announcement idiom carries the live demo QR at 96 px (`DemoQr`) with one line, absolute inside the hero and fixed from lg so it stays with the visitor down the page. No scrim by default: the footage is graded dark (an asset request). When the board's `scrim` prop is true, render one radial scrim on the TEXT layer only (an ellipse about 70 by 58 percent, 0.58 to 0 alpha), sized to the type block, never over the whole video, so Will rules it against bible 1. Reduced motion: the poster, still. Flag on the board as departures: the container's radius (the house surface is 2 px; argue the one corner you take), any uppercase display register you propose, and the scrim toggle itself.

**The contract.** Your file exports one `Concept` (see `shared.tsx`, which is the whole doctrine:
read it first and hold every line of it). The board renders `concept.render(props)` inside a stage
that already lays out at a real viewport's pixels (1440 x 930 or 375 x 760, fitted with `zoom`) and
carries the cinema skin, `data-mkt` and `data-paused` on a hidden tab. Your `Concept` also carries
what the board lists beside the stage: `eyebrow` (yours: an announcement pill with a live dot: Live demo, scan to try), `proposed` copy (the stub's lines are
a starting point; improve them, they are proposals), `departures` (flag: the container radius; an uppercase display register if proposed; the type scrim toggle) and `assets` (name
exactly what replaces your stand-ins: a 15 to 20 s highlight reel, fast cuts of real-feeling event moments (a toast, confetti, the dance floor, sparklers, a cake, hands in the air), 1920 x 1080 plus a 1080 x 1920 crop, muted, graded dark and warm so white type needs no scrim, H.264 mp4 under 1.5 MB plus a VP9 webm and a poster frame). Replace the stub's `Placeholder` render; keep the export
name and the id. Keyframes live in your own sheet with your prefix. You own two files and nothing
else; if the shell lacks something you need, say so in Handoff rather than editing it.

**Rulings in force.** The bible on `/design/rules` (22 rules, Will's), above all 1 (media is the
color: no darkening layer over a photograph), 13 (the h1 at paint, never gated; `marketing-h1-policy`
scans the lab), 14 (every animation inside the reduced-motion block, a designed rest state), 21 (the
thesis renders verbatim under the ruled toggle; your proposal renders under the proposed toggle), and
the standing ruling that the hero is cinema and unlit (light only as a flagged departure). The media
manifest is the only source of paths. Take the big swing: a totally different, better hero beats a
safe increment, and the reference's mechanic is a starting point, not a ceiling.

**Verify on.** partyreel-git-lp-hero-reel-partyreel.vercel.app, `/design/c/home-hero?key=` (the key is
`DESIGN_PREVIEW_KEY` in `.env.local`): your concept at Desktop and Phone 375, ruled and proposed copy,
Replay, reduced motion (the rest state), the h1 present at opacity 1 off the DOM. Light QA by the
exploration-round principle: nothing more.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none expected: no production byte moves.

## Deferred (ROADMAP one-liners, bucket named)

- Design system bucket, and only if the reel is ruled in: the rounding system gains a
  `--radius-screen` step (the corner a media object takes once it is big enough to read as a
  screen), so the hero's 24px stops being a literal in one lab file.

## Handoff (replaces the chat report)

- Last code SHA `c09258b`, pushed; preview
  partyreel-git-lp-hero-reel-partyreel.vercel.app (Vercel READY at that SHA, confirmed before the
  walk). The branch head is this docs commit on top of it, which changes no code.
- `launch-prep` had not moved (`git rev-list --count HEAD..origin/launch-prep` = 0, tip `f28d521`,
  the SHA this branch was cut from). No sync merge.
- Gates on the tree: typecheck ok, lint ok (0 errors, the same 6 pre-existing warnings, none in the
  two owned files), test ok (1636 tests in 190 files), build ok (246 static pages, exit 0).
- Lane check, `git diff --name-only origin/launch-prep...HEAD`:
  `docs/tracks/hero-reel.md`, `src/app/(dev)/design/sandbox/home-hero/reel.css`,
  `src/app/(dev)/design/sandbox/home-hero/reel.tsx`. No exceptions. Nothing in `shared.tsx`,
  `board.tsx`, the bible, the media manifest or any production path.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. No production byte moves.

### Verified on the preview at `c09258b` (light QA, the exploration-round bar)

- Desktop 1440 and Phone 375, both compositions correct: the frame inset to the page column at
  1440, full bleed with a square top and a sealed rounded bottom at 375.
- Ruled copy and proposed copy, both. Scrim off and on: the radial is measurably there
  (837 x 343 over the type block at 1440) and visibly changes the read, without touching the film.
- Replay: the stage remounts (a new `.hhr-settle` node) and the settle animation re-runs.
- The h1 off the DOM: `opacity: 1`, `animation-name: none`, and its only attribute is `class`. No
  `data-mkt-cut`, no `data-mkt-reveal`, no `.mkt-line`. Bible 13 held.
- Reduced motion: exactly ONE element in the stage has a computed animation (`.hhr-settle`), zero
  `[data-hh-loop]`, and both `animation:` declarations in `reel.css` sit inside the
  `prefers-reduced-motion: no-preference` block (grepped). With the `<video>` removed, the poster
  composition stands unchanged, which is the reduced-motion rest state.
- Rule 9 arithmetic, read off the live DOM: the card computes `border-radius: 15px` =
  `--radius-tile` (3px) + its 12px padding. The spill computes `blur(60px)` at `0.42`.
- THE FILM, reported honestly: a driven browser tab reports `document.visibilityState: "hidden"`,
  so the concept's own pause contract pauses the film there and the poster is what a screenshot
  catches. In a foreground tab during the local pass the film played and visibly cut between shots
  (green wash to amber), and the poster-to-video cross-fade landed. The live dot's cut ping could
  NOT be observed in a driven tab for the same reason twice over: `requestAnimationFrame` is
  throttled to nothing in a hidden tab, so the cut watcher never ticks. What IS verified: the ring
  element renders under `live && !reduced`, its rule resolves (`hhr-ping`, 900ms), and it is keyed
  on the shot index so a change remounts it and restarts the animation. Worth ten seconds of a
  human's eye on a foreground tab before the wiring round.

### Assets requested from Will

1. THE FILM, replacing the stand-in `hero-candidate-02` (8.25s, four shots): 15 to 20 seconds of
   real event moments, fast cuts on the beat, roughly 12 to 18 shots. The shot list that reads best
   over type: a toast, confetti, the dance floor from above, sparklers, hands in the air, the cake,
   a phone held up filming, a first dance. Nothing that needs a face in focus to work, because the
   type sits over the left half.
2. THE GRADE, the load-bearing one: cut dark and warm, with the left 55 percent of frame kept in
   the lower third of the range in every shot. That is what buys a hero with no scrim over the
   media, which is rule 1 held rather than argued. Highlights are welcome on the right, where the
   frame is empty.
3. THE MASTERS: 1920 x 1080, and a 1080 x 1920 crop of the same edit for the phone frame (the
   composition runs full bleed at 375, so it cannot letterbox). Muted, no audio track at all.
4. THE FILES: H.264 mp4 under 1.5 MB at 1080, a VP9 webm beside it, and a poster frame exported
   from the FIRST frame of the graded edit at both aspects, under 120 KB each. The poster is the
   hero's LCP layer and the frame's light, so it has to carry the grade on its own.
5. THE CUT LIST: the shot boundary times in seconds, from the edit, for the manifest entry's
   `shotBoundaries`. The live dot beats on them and the shipped hero already derives its active
   shot from the same numbers, so an edit without them silently loses both.

### Two notes for the shell, reported rather than edited

- `useTabHidden` now exists twice, in `board.tsx` and in `reel.tsx`. The concept needs it because
  `useAmbientPause` cannot be used in the lab (its IntersectionObserver never fires in a background
  tab, so a board verified through a driven browser would report a hero that never plays). If a
  second concept needs it, it belongs in `shared.tsx`.
- A trap worth a line in `shared.tsx`'s doctrine: tailwind-merge DROPS a `leading-*` that precedes
  a `text-{size}` in the same `cn()` (a font-size utility may carry a line-height). Every concept
  passes `LADDER.xl[mode]`, which is a size class, so `cn("... leading-[1.02]", LADDER.xl[mode])`
  silently loses its leading. It bit this file twice, on the h1 and the subhead, and the fix is to
  put the leading AFTER the ladder class.

### Look at first

The frame itself at Desktop, then the same at Phone 375 to see the escape hatch. Then the scrim
toggle, which is the one ruling this concept asks for: the board shows the trade both ways over a
bright stand-in, and the argument is that neither is needed once the film is graded (ask 2). The
departures list under the stage names the other four.

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). The home-hero board's second concept, the reel,
landed in the lab. It answers the round's question by making the hero an OBJECT rather than a
backdrop: one film in one rounded frame inset to the page column and sized by the canvas height,
the display type over it, and the real demo QR pinned inside the frame at the bottom left as the
announcement (absolute on the board, `lg:fixed` in production, so the code that starts an album
travels down the page with the visitor). The film rides the house video pattern exactly, and the
composition carries NO darkening layer over the media: the type is separated by a shadow on the
glyphs themselves, and the board's scrim toggle renders one radial sized to the type block so Will
can rule that trade rather than inherit it. Five departures are flagged on the board, including the
frame's 24px corner (proposed as a `--radius-screen` step) and one named spill under the frame,
which is the depth cue rule 10 asks for once shadows are forbidden. Motion is a 1200ms settle on
the film and a ping on the live dot keyed to the reel's real shot boundaries, both inside the
reduced-motion block; under reduced motion no `<video>` mounts and the poster is the rest state.
No production byte moved.
