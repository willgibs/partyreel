---
track: hero-scan
status: open
cut: "<filled at boot: the origin/launch-prep SHA you branched from>"
preview: true           # Will reviews this concept on its preview as it builds
owns:
  - src/app/(dev)/design/sandbox/home-hero/scan.tsx
  - src/app/(dev)/design/sandbox/home-hero/scan.css
reads:
  - src/app/(dev)/design/sandbox/home-hero/shared.tsx
  - src/app/(dev)/design/sandbox/home-hero/board.tsx
  - src/app/(dev)/design/sandbox/home-hero/board.css
  - src/app/(dev)/design/sandbox/home-hero/source.tsx
  - src/app/(dev)/design/sandbox/home-hero/source.css
  - src/components/dev/board/stage.tsx
  - src/app/(dev)/design/rules/bible.ts
  - src/lib/constants/marketing-media.ts
  - src/lib/shared/use-ambient-pause.ts
  - docs/ASSETS.md
  - docs/tracks/hero-source.md
---

# lp/hero-scan

**Goal.** The scan, variation 2 of the home-hero board's third round (Will, 2026-09-14: three more variations off the source). Your axis: THE CAUSE MADE LITERAL. The source shows the code and the album streaming out of it; a stranger infers the scan. This variation puts the act of scanning in the frame so the causality is seen, not inferred: the album is born from a scan. Two candidate mechanics to judge and pick one (or find a better one): (a) a guest's phone raised at the code, the camera view on its screen framing the QR (a phone frame from `src/components/marketing/frames/phone-frame.tsx` or your own; it shows the CAMERA, never an app: the product needs no app, bible 4 and the whole pitch), and the frames pour out of the phone's screen and the code together into the corridor; (b) the code's own scan beat: the house pulse ring on the demo QR (`DemoQr`) beats, and each beat births a frame, so the code visibly emits the album on a heartbeat. Supporting elements clarify from there: one Caption line under the code that names the act ("Point your camera at it" / "Every guest scans the same one"), a count that reads like a live album ("312 photos from 48 guests", proposed, not measured), the CTAs. Phone 375: the composition must still read as cause and effect (the code at scanning size, the birth visible). Media at 100 percent, no darkening layer anywhere.

**Will's ruling on round two (2026-09-14), verbatim in substance.** The source "is definitely my
favorite direction. It best encapsulates the concept of our platform, where if you had no idea what
Partyreel was and landed on our site you immediately gain an idea of 'I bet if I scan this QR I get
all of these images', which is a much better starting point we can clarify from with supporting hero
elements/copy rather than a more generic 'album' concept that doesn't feel distinct as a
platform/feature. Let's continue iterating on this version." The reel: "featuring a background video
that prominently in a hero card makes it feel like the video is the product of the platform. Does
not build any real idea of what Partyreel is" (redesigned, it could be a "Watch your event
highlights" video card linking to `/reel` from another page). The gathering: "the QR doesn't feel
connected to the surrounding images and doesn't build the full concept of Partyreel. It more
appears as an album platform with a QR in the hero I can scan to learn more about the product,
rather than the QR being the basis of a major feature itself." The test for every variation: a
stranger's first read is "if I scan this, I get all of these", and the supporting elements and copy
clarify from there; the QR is the basis of the feature, connected to the images, never a
learn-more object beside an album.

**The contract.** Your file exports one `Concept` (see `shared.tsx`, which is the whole doctrine:
read it first and hold every line of it). The board renders `concept.render(props)` inside a stage
that already lays out at a real viewport's pixels (1440 x 930 or 375 x 760, fitted with `zoom`) and
carries the cinema ground, `data-mkt` and `data-paused` on a hidden tab; the source (`source.tsx`,
`source.css`) is the ruled direction, first on the board as the reference: read it whole, reuse its
mechanics where they serve (its corridor is one rAF loop as a pure function of elapsed time, its
frames are `Photo` over `FRAMES`, its QR is `DemoQr` at scanning size), and vary what your axis
varies. Your `Concept` also carries what the board lists beside the stage: `eyebrow`, `proposed` copy
(the stub's lines are a starting point; improve them, they are proposals and all copy is open),
`departures` (flag every departure from the bible or a standing ruling on the board, never in a
footnote) and `assets` (name exactly what replaces your stand-ins, in the fixed shape `what · spec ·
replaces <id>`; the 24 squares are already asked for in `docs/ASSETS.md` row 2 and the three
phone-up frames in row 3). Replace the stub's `Placeholder` render; keep the export name and the id.
Keyframes live in your own sheet with your prefix. No `font-mono`, no `MonoCaption` (bible 7 is
retiring). You own two files and nothing else; if the shell lacks something you need, say so in
Handoff rather than editing it. A JS loop reads `data-paused` off the closest `[data-paused]`
ancestor and stops under reduced motion, where the rest state is the composition fully deployed;
geometry comes from `CANVAS`, never from `getBoundingClientRect` (the stage is zoomed); `sizes` on
`next/image` is canvas-relative; Replay is a remount.

**Rulings in force.** The bible on `/design/rules` (second edition), above all 1 (media is the color:
no darkening layer over a photograph), 13 (the h1 at paint, never gated; `marketing-h1-policy` scans
the lab), 14 (every animation inside the reduced-motion block, a designed rest state), 21 (copy is
open: the ruled thesis renders under the ruled toggle, your proposal under the proposed toggle), 22
(rising tides: judge the source from the ground up along your axis; elevate what points there,
rework what does not), and the standing ruling that the hero is cinema and unlit (light only as a
flagged departure). The media manifest is the only source of paths (bible 18). Light QA (Will,
2026-09-14): the board on your preview at 1440 and 375, ruled and proposed copy, Replay, reduced
motion, the h1 at opacity 1 off the DOM; nothing more; the red-team is the wiring round's. Read
`docs/systems/testing-verification.md` before verifying motion: a hidden or driven tab suspends rAF
and pauses the stage, so verify in a foreground tab or freeze the loop at a chosen elapsed and shoot
the still (the source's own lesson).

**Verify on.** partyreel-git-lp-hero-scan-partyreel.vercel.app, `/design/c/home-hero?key=` (the key is
`DESIGN_PREVIEW_KEY` in `.env.local`): your concept at Desktop and Phone 375, ruled and proposed
copy, Replay, reduced motion (the rest state), the h1 present at opacity 1 off the DOM.

### What your variation shows

The source's corridor with the cause in the frame. Desktop: the QR at scanning size at the
centre (or where the phone's camera frames it), the birth of each frame visible AT the code or the
screen (fading in at the origin, never popping), the two arms streaming outward as the source does;
the type above and below the corridor, the Caption line under the code naming the act. Phone: the
strip between headline and subhead, the code still at scanning size. Reduced motion: the composition
fully deployed with the phone (or the beat) at rest. Departures to flag: a phone in the hero (the
first thing Will may overrule, because a phone can read as an app), a lamp if you light the code's
beat, a centred lockup (the source's own flagged departure, kept unless you have a reason). The asks
(in `assets`): the three phone-up frames from `docs/ASSETS.md` row 3 if you use a photograph of a
guest scanning; a hand-and-phone cutout (PNG with alpha, 1200 px, the phone's screen transparent so
the live camera view composes under it) if you use a cutout; nothing else new.

### The rules of this wave (every track)

- **The shell is shared and registered.** Never edit `board.tsx`, `shared.tsx`, `board.css`,
  `source.tsx`, `touchpoints.ts` or `rules/bible.ts`; never CHANGELOG, STATUS, ROADMAP, PROGRAM,
  CLAUDE, AGENTS, `docs/ASSETS.md`; ask in Handoff.
- **Sheets.** Keyframes under your prefix `hhc-` only (`keyframe-uniqueness.test.ts` reads every
  sheet under the lab; `hhs-` is the source's, `hh-` the board's); a sheet never imports tailwindcss;
  `glow-contract.test.ts` pins the BorderBeam and GlowFilter counts across `src`, so compose `<Glow>`
  only if you light anything (and flag it). No em-dashes anywhere.
- **Sync** `origin/launch-prep` only per PROGRAM.md (before handoff if it moved; mid-round only when
  `docs/tracks/orchestrator.md` announces a landed change to one of your `reads`).
- **Handoff:** fill Handoff and Record below, `status: handed-off`, push; the chat report is one
  line, "handed off at <sha>".

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; preview partyreel-git-lp-hero-scan-partyreel.vercel.app
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will: none, or one bullet per asset: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- The departures, verbatim from the concept (the Orchestrator quotes them under Waiting on Will): ...
- Look at first: ...

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
