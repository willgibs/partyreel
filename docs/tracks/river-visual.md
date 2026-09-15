---
track: river-visual
status: open
cut: "<filled at boot: the origin/launch-prep SHA you branched from>"
preview: true           # Will reviews this board on its preview as it builds (once Vercel's window frees)
owns:
  - src/app/(dev)/design/sandbox/river-visual/
reads:
  - src/app/(dev)/design/sandbox/home-hero/shared.tsx
  - src/app/(dev)/design/sandbox/home-hero/source.tsx
  - src/components/dev/board/stage.tsx
  - src/components/dev/board/dock.tsx
  - src/components/dev/board/board-meta.tsx
  - src/components/marketing/system/section-shell.tsx
  - src/lib/constants/feature-pages.ts
  - src/lib/constants/marketing-media.ts
  - src/lib/shared/use-ambient-pause.ts
  - src/app/(dev)/design/rules/bible.ts
  - docs/ASSETS.md
  - docs/tracks/hero-river.md
---

# lp/river-visual

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

**Will's ruling, verbatim.** "4 can be killed as a hero, but the river animation could be streamlined to
drop down in one flow rather than two, and saved to our lab design bank to hopefully use another time as a
feature visual rather than hero. This would be a cool, smaller alternative presentation of the images
emanating from the QR code versus the 1 or 2."

**Goal.** The river as a feature visual, kept in the lab's bank. Your lane is seeded with the river as it
left the home hero board (`river.tsx`, `river.css`, moved here whole; read `docs/tracks/hero-river.md` for
its three rounds of notes): the album pouring down out of the code, the fan over the first third of the
fall, the banks opening around the lockup's ink. (1) **One flow.** Streamline it to a single stream
dropping down out of the code (no two banks, no clearing profile for a headline), the frames straightening
as they land, the cadence dividing the flight, the loop cut by a frame's top edge. (2) **A feature visual,
not a hero.** Size it as a section-scale component: a card or a column a feature page could place beside
copy (a "how it works" step, a feature card's media slot, the guest page's empty state), shown at three
sizes (a 560 px column, a 400 px card, a 240 px thumbnail) on cinema and paper, at 1440 and 375, reduced
motion as the settled stream, the code optional (a prop: the real demo code, or a plain origin plate). (3)
**Bank it.** The board presents it as a saved visual: what it is, where it could be used (three real
placements on real pages, composed on the production section shells), its props and its cost (frame time,
layer count, measured), and the paste to mount it. (4) The board composes the shell (`Stage` at 1:1,
`Toggle`, `BoardDock` for the size, the ground, the canvas and Replay, `BoardMeta` with the asks); it is
registered on the desk as `river-visual`; keyframes and classes keep the `hhv-` prefix or move to `rvr-`
(say which). The asks: where Will would place it first, and the code in or out.

**The contract.** Your board is `sandbox/river-visual/board.tsx`, exporting `RiverVisualBoard` and importing
`./board.css`; it is registered on the desk as `river-visual` (`touchpoints.ts`, the Orchestrator's; its
placeholder variants are renamed at integration from your Handoff). Compose the shell from
`@/components/dev/board`: `Stage` at 1:1 on cinema and paper, `Toggle`, `BoardDock` for the page-wide
switches, `BoardMeta` for the question, the candidates, the asks, the departures and the assets. The seed
in your lane (`river.tsx`, `river.css`) is the river as it left the home-hero board, imports fixed to
`../home-hero/shared`; keep it, cut it or rewrite it, it is yours. Keyframes and classes under `hhv-` or
`rvr-` (say which). Production section shells are composed, never edited.

**Rulings in force.** The bible on `/design/rules` (second edition): 1, 12 (animate by frequency: a feature
visual is occasional, not a hero), 13, 14, 21, 22. The media manifest is the only source of paths (18).

**Verify on.** `/design/c/river-visual?key=` on a local production build at 1440 and 375, reduced motion,
the gate; the preview alias once Vercel's window frees.

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

- Head <sha>, pushed; preview partyreel-git-lp-river-visual-partyreel.vercel.app (may not build while Vercel is capped: say how the board was verified locally)
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
