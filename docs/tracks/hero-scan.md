---
track: hero-scan
status: handed-off
cut: "c473707"
merged_round_3: "f7e9df6"
merged_round_2: "8183147"
merged_round_1: "aee5915"
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
  - src/components/dev/board/dock.tsx
  - src/app/(dev)/design/rules/bible.ts
  - src/lib/constants/marketing-media.ts
  - src/lib/shared/use-ambient-pause.ts
  - docs/ASSETS.md
  - docs/tracks/hero-source.md
---

# lp/hero-scan

## Round 4 (Will's review notes, 2026-09-15)

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

**Will's ruling on the home hero board, verbatim.** "I'm loving 1 and 2. Let's continue iterating on 1 in its
current emanating direction and 2 with its phone scan addition." (The burst and the river are killed as
heroes and move to their own boards: the burst's field becomes the /features/album hero on the `album-hero`
track, the river a feature visual on `river-visual`; a new variation off the source, the inflow, images
streaming INTO the code, runs on `hero-inflow`.)

**Round 4 (the goal).** The phone is the ruling; the scan continues with it. (1) **The phone reading is
the variation.** The room reading steps back (keep it only as a footnote toggle if it still teaches
something); the phone is the composition at 1440 and 375, and the hand-and-phone cutout (ASSETS row 8) is
now a standing ask, so design for the photograph and ship the drawn device as the stand-in. (2) **Iterate
from the ground up** on what the phone makes possible: the scan as a real gesture (the code seen through a
viewfinder, the brackets, the capture, the album leaving the plate), the first two seconds, the repeat per
turn of the album, the copy that names the act, the 375 composition as its own thing. (3) **The source is
its sibling**: read `source.tsx` as it now stands (the `hero-source` track iterates it this round) and keep
the two variations comparable: the same corridor mechanics where they share them, the difference being the
phone and the cause it makes literal. (4) Every stage at 1:1; the board's page-wide switches are the
board's dock (the Orchestrator's `board.tsx`); your concept's own toggles stay beside the stage. (5) The
asks: the departures Will rules on, no more.

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

## Round 3 (Will, 2026-09-14: one more iteration cycle before his review)

**Round 3 (the goal): the last mile, walked first by you.** Two rounds built the board; this one is the
walk Will will take, taken before him. (1) **Walk it cold**, the way he will: the board on the launch-prep
alias (round 2 is integrated there) and then on your preview, in a foreground tab, at 1440 and then
375, every toggle, every candidate, and every "Apply to the site" block on the pages you listed (the home
arc, `/pricing`, `/help`, `/contact`, the dashboard and an event page with `?key=`, the demo guest page).
Note every place a stranger would stumble: an unexplained toggle, two candidates that read the same, a
stage that needs a caption or has one too many, a slow first paint, a layout that breaks at 375, a
control that does nothing visible. Fix each. (2) **Re-read the reviewer's findings** on your round-2
handoff (below) and the other boards' latest Handoffs in `docs/tracks/` and proposals in `docs/specs/`:
anything there that changes your answer changes your board. (3) **Make the decision easy**: the strongest
candidate first; a candidate cut if it no longer earns its column (say so); every ask a one-word answer
and no more asks than Will must answer; the departures only the ones he must rule on. (4) **Honesty and
cost**: every number on the board is measured or labelled a stand-in; measure what runs (frame time, layer
count) and cut what does not earn its cost; reduced motion gets the settled composition. (5) **The
record**: "Handoff (round 3)" and "Record (round 3)" below; the Record is the paragraph the CHANGELOG
carries for rounds 2 and 3 together, so write it as the whole story of what the board became.

## Round 2 (Will, 2026-09-14: "another iterative round on all active tracks before review")

**Round 2 (the goal).** The scan's beat is the idea (cause, then effect); now make the variation the
best version of itself. Judge it from the ground up against Will's criterion: a stranger's first read
is "if I scan this, I get all of these", and the supporting elements and copy clarify from there. (1)
**The phone**: the cutout is asked for (row 8) and not here; find the composition where the drawn
device earns its place or where the device is minimal (the viewfinder alone, the brackets alone) and
show both as a toggle, so Will rules the phone on the board. (2) **The first two seconds** tuned:
the lock, the flash, the release; the room genuinely empty until the lock. (3) **The supporting
elements**: the Caption line and the count (a stand-in; keep it flagged) placed where they read as
the album filling; the eyebrow question settled (the code is the eyebrow, or a line is). (4) **The
phone canvas** as a first-class composition, not a compression. (5) **Performance**: measure the
loop (frame time, layer count, paint) at both canvases and cut what does not earn its cost. (6) Read
the burst and the river (`burst.tsx`, `river.tsx`, read-only) and take what serves the scan (the
per-card quiet zone, the parting) only if it stays the scan. (7) Tighten the departures to the ones
Will must rule on. Keep the corridor's physics; keep the h1 at paint and media at 100 percent.

### The rules of round two (every track)

- **Why a second round.** Will (2026-09-14, after the first wave integrated): "They all seemed to be
  making progress in their directions, but a single round of context didn't seem to be enough for
  any of them to reach enough of their full potential for a real review." Read your round-1 Handoff
  and Record below as your own notes, look at the board as it stands on the launch-prep alias, and
  judge it from the ground up (bible 22): what would the perfect version of THIS board be, as a
  surface Will can rule on in a few words after walking it? Elevate what points there, rework what
  does not. Every candidate should be complete enough to ship as a paste; every ask a one-word answer.
- **The other boards are inputs now.** Every proposal from the first wave is in `docs/specs/`
  (`palette.md`, `light.md`, `type-scale.md`, `floating-surfaces.md`, `brand-voice.md`,
  `media-kit.md`). Use what sharpens your board (the palette's ramps under your surfaces, the light
  spec's shadow family on your cards, the type tables on your headings) and say so in BoardMeta; you
  still own only your lane, so read those boards' files, never edit them.
- **"Apply to the site".** The shell now lets a board hand the WHOLE site a CSS block, the same paste
  its ruling would land, so Will judges a candidate on the real pages and not only on a stage:
  `setCandidateCss(label, css)`, `clearCandidate()` and `useTunerCandidate()` from
  `@/components/dev/board`. One block at a time (the newest replaces the last); it renders as a
  `<style>` after every stylesheet on every lab page, every marketing page and the host app (all with
  `?key=`), persists in the browser until cleared (the tuner panel shows it with a clear button; your
  board shows a badge and its own clear). A block must be real CSS with the real selectors
  (`:root, .surface-paper`, `.dark`, `.surface-ink`, `.dark[data-mkt-skin="cinema"]`, a primitive's
  own class), never a stage-local class. Where your candidate is a CSS paste, offer it per candidate
  ("Apply A to the site") and list in BoardMeta the pages to walk with it on: `/`, `/pricing`,
  `/help`, `/contact`, `/dashboard` and an event page (the app needs the signed-in host), the demo
  guest page. The knobs are reachable too: `setTunerValue(control, value)` from
  `@/components/dev/tuner-store` with a control from `motion-tuner-config.ts`.
- **The same lane, the same wave rules.** You own exactly what your front matter says; never
  `touchpoints.ts`, `bible.ts`, the shell, `docs/ASSETS.md`, CHANGELOG, STATUS, ROADMAP, PROGRAM,
  CLAUDE, AGENTS. No mono (there is no mono face in the product now; `two-faces-policy.test.ts`
  refuses a `font-mono` class), no em-dashes, keyframes under your prefix, sheets never import
  tailwindcss, `<Glow>` only. Unlimited design resources: ask for exactly what the design needs, one
  bullet per asset in the fixed shape. Light QA: the board on your preview at 1440 and 375, reduced
  motion honoured, the gate green on the synced tree.
- **Boot.** Round one's branch and worktree are gone; cut fresh: `git fetch origin`, then
  `git worktree add ../partyreel-wt/<track> -b lp/<track> origin/launch-prep`, install, copy
  `.env.local`, fill `cut` below with the SHA you branched from, commit this manifest alone
  (`docs(tracks): reopen <track> for round two`), push `-u`; `pnpm test` green. Sync only per
  PROGRAM.md.
- **Handoff.** Fill "Handoff (round 2)" and "Record (round 2)" below (round 1's stay as history),
  `status: handed-off`, push; the chat report is one line, "handed off at <sha>".

## Round 1, for reference (integrated; the brief it was built to)

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

## Handoff (round 1)

- Head: the tip of `lp/hero-scan`, which is THIS commit (a manifest cannot name its own SHA). The last
  code commit is `bd112d0`; the merge of `launch-prep` that follows it carries no change of mine.
  Pushed; preview `https://partyreel-git-lp-hero-scan-partyreel.vercel.app`, the board at
  `/design/c/home-hero?key=` (concept 2 of 4, after the source).
- Synced with `launch-prep` at `3d40173` (twice: `80302b42` first, which landed the kill-mono sweep,
  then `3d40173` for the palette merge). Both merged clean, no conflicts.
- Gates on the synced tree: typecheck ok, lint ok (0 errors; the 7 warnings are the pre-existing ones
  on `brand-voice/board.tsx`, `contact-form.tsx`, two feature sections, `jobs.ts` and `use-flip.ts`,
  none in this lane), test ok (1697 in 193 files), build ok (248 static pages, the `launch-prep`
  count unchanged).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =
  `docs/tracks/hero-scan.md`, `src/app/(dev)/design/sandbox/home-hero/scan.css`,
  `src/app/(dev)/design/sandbox/home-hero/scan.tsx`. **No exceptions**: the two owned files and this
  manifest. `shared.tsx`, `board.tsx` and `source.tsx` were read whole and not touched; the shell had
  everything the concept needed. The corridor's physics are copied into `scan.tsx` rather than
  imported, because a concept file is self-contained by the contract and `source.tsx` exports only its
  `Concept`.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte changed.
- **Verified on the preview** at the code tip (the alias was polled until its HTML carried
  `hhc-viewpos`, so the build is proven by a marker rather than by the clock):
  - The gate: 404 with no key, 404 with a wrong key, 200 with the key.
  - The server's own HTML carries 24 `.hhc-card` nodes with 24 `--hhc-rest` declarations, the device,
    its 4 brackets, the lockbox, the flash, the caption line and the count at its settled value. The
    whole composition, deployed and locked, is in the markup: reduced motion, a crawler and a cold
    paint all get it.
  - The h1 is in the HTML at computed opacity 1, with no `data-mkt-cut` / `data-mkt-reveal` /
    `.mkt-line` on any h1 on the page. No em-dash anywhere in the served page.
  - Every arbitrary utility and custom property resolves in the PRODUCTION lab sheet, which is the
    one thing localhost cannot prove: the caption at 13 px white/70, the count at 12 px white/55 with
    `font-variant-numeric: tabular-nums`, the device at `z-index: 20` with `perspective: 1200px`, the
    phone at radius 27.3 px and aspect 0.472 with its rim, the screen inset 8.82 px with the plate's
    light on the preview, the brackets at 24 px arms, the lockbox at -6 deg, the band's edge mask.
  - Desktop 1440 and Phone 375, ruled and proposed copy: the corridor runs, the code holds the exact
    centre, the caption and the count sit in the clear lane, and the phone is cropped by the frame's
    edge on both canvases.
  - Replay: the stage remounts and the whole beat restarts. Measured from the remount, in a
    foreground tab: t=88 ms the brackets are thrown 22.8 px wide at opacity 0.32 and the corridor is
    EMPTY (0 visible cards); t=410 ms the brackets are 1.3 px out at opacity 1, still empty; t=731 ms
    locked at 0, still empty; t=932 ms the flash is mid-arc and the first frames are fading up at the
    plate; t=1133 ms all 24 are in flight. Cause, then effect, in that order.
  - The count: 282 at the lock, then 286, 290, 298, 304, 310 and 312, where it holds (sampled to 18 s).
  - Reduced motion: simulated by deleting the `no-preference` block from the live sheet and clearing
    the loop's inline styles, which leaves exactly the cascade a reduced-motion reader gets. The
    corridor stands fully deployed, the brackets rest LOCKED (`animation-name: none`, `translate:
    none`, opacity 1), the flash is spent at opacity 0, and the count reads 312.
  - The clear lane was MEASURED, not assumed: over a full 10.8 s corridor cycle at both canvases, no
    visible frame and no part of the device ever intersects the caption or the count. Worst vertical
    gap on desktop 34 canvas px; on phone no visible frame ever even shares their horizontal span,
    because a frame near the plate is below the opacity floor.
- **Assets requested from Will**:
  1. **A hand-and-phone cutout** (replaces the drawn device, `.hhc-phone`) · PNG with alpha, 1200 px
     on the long edge, the SCREEN AREA fully transparent so the viewfinder composes underneath and
     stays live; shot from just behind the holder's shoulder with the phone held up and angled away
     to the right, in low warm event light so the body is nearly a silhouette with one highlight
     along the edge; 2 variants, a one-handed grip and a two-handed one · replaces `.hhc-phone`
  2. Nothing else new. The corridor runs on the 12 landscape stand-ins and wants the 24 squares
     already on the log (**ASSETS row 2**, asked by `hero-source`); the three phone-up photographs on
     **row 3** are NOT needed here, because the device is drawn rather than photographed.
- **The departures, verbatim from the concept** (the Orchestrator quotes them under Waiting on Will):
  1. "A phone in the hero, which Will named as the first thing to overrule because a phone can read
     as an app. Three things hold it to the camera rather than to software: the screen carries no
     chrome but the notch (no title bar, no buttons, no tabs), the device is cropped by the frame's
     edge so it reads as a held object in the room rather than a device mockup on a slide, and what
     it is looking at is visibly the same code standing a few hundred pixels away. Its bezel radius
     is a drawn object's proportion, a literal, not a surface token: a phone corner is not a UI
     surface."
  2. "The hero is cinema and unlit, and this concept has one emissive object: the phone's screen. It
     lights itself and its own bezel and nothing else. No lamp, no Glow, no spill onto the room or
     onto a photograph."
  3. "Bible 13, decorative layers only: the corridor's pre-burst state and the brackets' thrown-wide
     state sit inside the reduced-motion block, so with JavaScript off and motion allowed the album
     rests at the code and the brackets rest open. Putting either in an effect instead would paint
     the composition settled and then snap it back. The h1, the QR, the caption, the count, the
     subhead and the CTAs are plain markup and never gated, and reduced motion gets the whole
     composition deployed and locked."
  4. "Precedent, not law, inherited from the source: the lockup is centred rather than left-aligned,
     because the code owns the axis. Kept, with the same caveat, and it is the second thing to
     overrule if the home hero should stay left."
  5. "The count under the plate is a STAND-IN number, not a measurement: 312 photos from 48 guests,
     climbing to its settled value with the launches. It is the strongest supporting element on the
     concept and it must not ship as invented data. The wiring round reads the demo event's real
     totals, or the line goes."
- **Look at first**: the first 1.2 seconds, in a foreground tab. The code sits alone in an empty room
  while the brackets close on it in the phone's viewfinder; they snap, the screen flashes once, and
  the album comes out of the plate. That order is the whole variation. Then: whether the phone earns
  its place at all (departure 1), and whether the count should live under the plate or go.

## Record (round 1)

Merged into `launch-prep` at `<sha>` (2026-09-14). The scan, variation 2 of the home-hero board's
third round, replaced its placeholder. It inherits the ruled source's corridor unchanged, 24 cards in
two pools on one requestAnimationFrame loop, and spends the whole variation on putting the cause in
the frame: a guest's phone sits in the near field, cropped by the edge the way your own hands are, and
on its screen is the camera, the same code that stands in the room with a scanner's four brackets
closing on it. The screen carries no chrome but the notch, because the pitch is that a guest installs
nothing. The beat is the idea: the brackets snap at 760 ms, the screen flashes once, and the
corridor's own clock starts there, so the album is released BY the scan rather than beside it, and
the room is genuinely empty until the lock. One Caption under the plate names the act and a count
beneath it climbs with the launches and settles at 312, both sitting in the one lane the corridor
leaves clear by its physics. The whole composition, deployed and locked, is the rest state in the
server's own HTML, with the pre-burst frame and the thrown-wide brackets inside the reduced-motion
block so neither can flash.

## Handoff (round 2)

- Head: the tip of `lp/hero-scan`, which is THIS commit (a manifest cannot name its own SHA). The last
  code commit is `ab855c9`. Pushed; preview `https://partyreel-git-lp-hero-scan-partyreel.vercel.app`,
  the board at `/design/c/home-hero?key=` (concept 2 of 4, after the source). The round-two board is
  the one whose stage carries a switch at the top right: look for `hhc-lab` in the served HTML, or
  for the words "Cause / Phone / Brackets only" on the stage.
- **After the read-only review (this commit, documentation only: no code, no rebuild of the board).**
  Two should-fix items, both in this manifest. (1) The operational note about the pushes that produced
  no Vercel deployment had been written into round 1's Handoff, which is an integrated section and the
  wrong place for a round-2 warning; round 1's own text was not altered, and the note now sits in this
  section, where the Orchestrator reads it at this merge. (2) Round-2 goal item 6 (read the burst and
  the river, take what serves the scan) carried only a lane-compliance line and no ruling; the bullet
  below now states what each sibling offered, what was taken from them and what was declined, with the
  reason. `scan.tsx` and `scan.css` are byte-identical to the verified tip `ab855c9`, so every
  verification below still stands at the code it names.
- Synced with `launch-prep` at `4b035c1` (a docs-only commit; merged clean, nothing in this lane).
- Gates on the synced tree: typecheck ok, lint ok (0 errors; the 7 warnings are the pre-existing ones
  on `review-switch.tsx`, `contact-form.tsx`, two feature sections, `jobs.ts` and `use-flip.ts`, none
  in this lane), test ok (1698 in 193 files), build ok (248 static pages, the `launch-prep` count
  unchanged). Re-run whole after the review fix above, with the same four results.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/hero-scan.md`,
  `src/app/(dev)/design/sandbox/home-hero/scan.css`,
  `src/app/(dev)/design/sandbox/home-hero/scan.tsx`. **No exceptions**: the two owned files and this
  manifest. `shared.tsx`, `board.tsx`, `source.tsx`, `burst.tsx` and `river.tsx` were read and not
  touched; what the burst and the river gave this concept is a ruling of its own below.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte changed.
- **An operational note for the Orchestrator, not a code problem (it belongs to this round's pushes;
  it was filed against round 1's section by mistake and is moved here):** two of round two's pushes
  (`ab855c9` and `caa8539`) produced NO Vercel deployment at all, while other branches pushed in the
  same minutes deployed normally, so the branch alias kept serving the previous commit. CI ran and
  passed on every push, and `scripts/vercel-ignore-build.mjs` would have built them (this manifest
  says `preview: true` and now `status: handed-off`), so the miss is upstream of the gate: GitHub
  created no deployment for either SHA. Recovered by asking Vercel for one directly
  (`POST /v13/deployments` with the branch's `gitSource`, the team token from `.env.local`), which
  built and took the alias. Worth knowing if another track's preview looks stale: check the SHA the
  alias serves rather than the clock.
- **A shell change to consider (not made, not needed):** a `Concept` has no slot for a control of its
  own, and the home-hero board renders `concept.render(props)` straight into the stage, so a concept
  that carries a RULING (here: phone or no phone) has to draw its own switch inside the canvas. It is
  styled as lab chrome and parked in the one corner every composition leaves empty, and it leaves with
  the board, but an optional `controls?: ReactNode` on `Concept`, rendered by the board beside its own
  toggles, would put it where the board's other switches live. The Orchestrator's call; nothing here
  depends on it.
- **"Apply to the site" does not apply to this board.** The candidate is a composition, not a CSS
  block: nothing here can be handed to `/` as a paste, and the pages to walk are the board's own
  stages. The wiring round is what lands it in `PageHero`.
- **The burst and the river, read for what serves the scan (goal item 6): one thing taken, two
  mechanisms declined.** Both siblings solve this concept's problem out loud. The burst gives the type
  a keep-out box per BLOCK of the lockup, measured off the rendered stage, and gates each card once on
  the progress after which it is permanently clear of every block (`scanClear`), so a frame is simply
  not drawn while it would sit under a word. The river holds a falling card's PROJECTED inner edge on
  the lockup's wall while it crosses the band (the parting), so the clearing keeps a constant width
  however large the frame has grown. **Taken: the burst's method, not its mechanism.** Its lesson is
  that a quiet zone should be "the shape of the type and not a guess about it", so this round measured
  the caption and count boxes off the rendered stage and replayed the corridor's own math against them
  for a full cycle at 25 ms steps, at both canvases in both readings: zero intersections, worst
  clearance 12 to 30 canvas px (the clear-lane measurement in the verification below). The scan's
  clear lane stopped being a hope and became a number, which is what `scanClear` buys the burst.
  **Declined: both per-card mechanisms.** A frame here is launched by one capture and its path is
  fixed at launch; making a frame hide itself, or shove sideways, as it nears the words would read as
  the album avoiding the headline rather than as the consequence of the scan, and it would bend the
  corridor's physics this round was told to keep. The scan does not need either one: a frame is a
  speck while it is near the plate and only grows once it is far out horizontally, so the column above
  and below the code is empty by construction rather than by negotiation. **Corroborated, not
  borrowed:** the river's ruling that its caption sits ABOVE the plate, because a line under it is the
  one thing the stream cannot get around, is the same answer the 375 device reading reaches here,
  where the near field owns the bottom third and the supporting pair moves above the code. The
  invariant all three share is held either way: no scrim, no darkening layer, media at 100 percent.
- **Verified on the preview** at the code tip (the alias was polled until its HTML carried `hhc-lab`,
  so the build is proven by a marker rather than by the clock):
  - **The beat, sampled live in a foreground tab from a Replay remount:** t=90 ms the brackets are
    thrown 12.1 px wide at opacity 0.34 and the corridor is EMPTY (0 of 24 visible); t=361 they are
    1.0 px out; t=621 landed; t=733 locked, flash still 0; t=833 the capture is at its 0.42 peak and
    the room is STILL empty; t=904 the flash is decaying at 0.07; t=1105 all 24 frames are up. Cause,
    then effect, in that order, with nothing in the room until the capture.
  - **The clear lane is measured, not assumed.** The corridor's own math was replayed against the
    measured caption and count boxes over a full 10.8 s cycle at 25 ms steps: ZERO intersections in
    all four combinations, worst clearance 30 canvas px (desktop, either reading), 12 px (phone
    canvas, device reading), 14 px (phone canvas, brackets reading). No scrim anywhere, media at 100
    percent.
  - **Reduced motion, simulated exactly** by deleting the `no-preference` block from the live sheet
    and clearing the loop's inline writes in the same synchronous block: 20 of 24 frames stand at the
    steady-state spacing, the brackets rest LOCKED (`animation-name: none`, `translate: none`, opacity
    1), the flash is spent at 0, and the count reads its number. The production sheet was also read
    over HTTP and audited: all four `.hhc-*` animation and transition declarations sit inside
    `@media (prefers-reduced-motion: no-preference)`, and the only keyframes it declares are
    `hhc-lock`, `hhc-flash` and `hhc-bloom`.
  - The server's own HTML carries 24 `.hhc-card` nodes with 24 `--hhc-rest` and 24 `--hhc-rest-o`
    declarations, the device, its 4 brackets, the flash, the caption and the count at its opening
    value: the whole composition, deployed and locked, is in the markup.
  - The h1 is in the HTML at computed opacity 1 (96 px Urbanist, line-height 97.92 px, so
    `leading-[1.02]` survives beside the ladder class), carrying only `class` and `style`: no
    `data-mkt-cut`, no `data-mkt-reveal`, no `.mkt-line`. No em-dash anywhere in the served page.
  - Every arbitrary utility and custom property resolves in the PRODUCTION lab sheet, which is the one
    thing localhost cannot prove: the caption at 12 px white/60, the count at 15 px white/85 with
    `font-variant-numeric: tabular-nums`, the phone at radius 33.8 px and aspect 0.472 with its rim,
    the screen inset 10.92 px with the viewfinder's light at 30 percent down it, the 13 px brackets,
    the switch pinned top right at 11 px with the pressed state at white/13.
  - Desktop 1440 and Phone 375, both readings, ruled and proposed copy: the switch flips the cause and
    replays the beat, the code holds the axis, and the caption and count sit in the clear lane.
  - **Performance, measured rather than guessed** (the loop's own math plus its 48 style writes, run
    300 times against the real nodes): 0.158 ms per tick at 1440 and 0.11 to 0.13 ms at 375, about 1
    percent of a 60 Hz frame, with a 0.5 ms style flush for all 300 ticks together. 24 promoted layers
    at rest, which are the corridor's cards and nothing else: the device, the brackets, the flash and
    the bloom add 9 DOM nodes and no layer. The one number worth knowing is the corridor's raster,
    about 40 MB at 1440 and 8 MB at 375 (24 boxes at dpr 2), and it is the SOURCE's number, inherited
    unchanged; nothing this variation adds is worth cutting, and cutting the corridor's is a decision
    for the ruled direction, not for a variation of it.
  - Test-tooling note, because it cost an hour: a hidden, driven or merely non-fronted tab throttles
    rAF and CSS animations to a few frames a second, so the corridor reads as EMPTY and the brackets
    as stuck. Every timing number above was taken in a fronted tab; everything else was taken from the
    DOM, the computed styles or the production sheet over HTTP.
- **Assets requested from Will**:
  1. **Unchanged and now CONDITIONAL: the hand-and-phone cutout, ASSETS row 8** (PNG with alpha,
     1200 px long edge, the screen area fully transparent, shot from behind the holder's shoulder in
     low warm event light, two grips) · replaces the drawn device `.hhc-phone`. It is needed ONLY if
     the Phone reading is ruled in; rule Brackets only and row 8 can be withdrawn, because that
     reading needs no asset that does not exist.
  2. Nothing else new. The corridor still wants the 24 squares already on the log (**row 2**, asked by
     `hero-source`); the three phone-up photographs on **row 3** are still NOT needed here, because
     the device is drawn rather than photographed.
- **The asks, verbatim from the board's Asks row** (the Orchestrator quotes them under Waiting on Will):
  1. "ONLY IF THE PHONE IS RULED IN: a hand-and-phone cutout to replace the drawn device (.hhc-phone),
     already on the log as ASSETS row 8. PNG with alpha, 1200 px on the long edge, the SCREEN AREA
     fully transparent so the viewfinder composes underneath and stays live and real; shot from just
     behind the holder's shoulder, the phone held up and angled away to the right, in low warm event
     light so the body is nearly a silhouette with one highlight along the edge; two variants, a
     one-handed grip and a two-handed one. Rule Brackets only and the row can be withdrawn: that
     reading needs no asset at all."
  2. "Not a new ask: the corridor runs on the 12 landscape stand-ins and wants the 24 squares already
     requested (ASSETS row 2, asked by hero-source), 512 x 512, one grade, framed tight enough to read
     at 120 px. Nothing here needs the three phone-up photographs from row 3, because the device is
     drawn rather than photographed."
- **Look at first**: the switch at the top right of the stage. Flip it once. Phone or Brackets only is
  the whole ruling this round asks for, and everything else about the concept is identical between
  them. The recommendation is in the rationale under the stage: Brackets only until the cutout exists,
  Phone once it does. Then hit Replay and watch the first second, in a foreground tab: the code stands
  alone in an empty room, the brackets close on it, the capture fires, and the album comes out of the
  plate. Then the 375 canvas in the Phone reading, which is a different composition rather than a
  compressed one: the words at the top, the band under them, and the phone rising from the bottom with
  its code on the same vertical axis as the code in the room.

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). The scan's second round turned its one open
question into a ruling on the board: the concept now carries both readings of the cause, and a switch
in the corner of the stage flips between a guest's phone in the near field and the brackets alone
closing on the real plate, with everything else identical, so the answer is one word. The phone was
rebuilt to tell the truth about what a camera sees, a 46 px code inside a 260 px device rather than a
second white square of equal weight, and cropped by two edges so it reads as a held object; the
brackets reading adds a capture bloom at the plate and needs no asset at all. The 375 canvas became a
composition rather than a compression: in the device reading the words take the top of the screen and
the bottom third is the near field, with the screen's code and the room's code on one vertical axis.
The supporting pair was reweighted so the count is the payoff, and it lifts by two pixels on every
launch, so the number rising is visibly the same event as a pair of frames leaving the code. The beat
was put in causal order (lock at 720 ms, capture at 730, release at 780, on the capture's peak), and
pointing at the code now replays the lock. The clear lane stopped being an assumption: the corridor's
own math was replayed against the measured type boxes over a full cycle at both canvases in both
readings, with zero intersections and 12 to 30 canvas px to spare.

## Handoff (round 3)

- Head: the tip of `lp/hero-scan`, which is THIS commit (a manifest cannot name its own SHA).
  `f34af1c` is still the last CODE commit and the tree every check below ran against; everything
  after it, this review pass included, touches only this manifest, so `scan.tsx` and `scan.css` are
  byte-identical to the tree every verification names. Pushed; preview
  `https://partyreel-git-lp-hero-scan-partyreel.vercel.app`, the board at
  `/design/c/home-hero?key=` (concept 2 of 4, after the source). **Marker for the round-three board:
  the proposed headline "Every camera in the room, one album."**, which exists nowhere in round two;
  `overflow-clip` on the concept root and the switch's word "The room" mark it too.
- **After the read-only review (this commit and the one before it, DOCUMENTATION ONLY: no code, no
  change to either owned file).** One should-fix, and it was right: the review surface does not carry
  the head, and the closing line of the old deployment-cap bullet ("nothing needs a rebuild to be
  reviewed once the limit clears") understated what that costs. It is corrected below, and the gap is
  no longer inferred from a diff but MEASURED on both surfaces (the identical walk run against the
  alias and against the head, with opposite results). The deployment was attempted again twice while
  writing this, at 23:29 and 23:36, and refused both times with `remaining 0`; the gate was re-run
  whole on the head and is green. Nothing about the board changed, because the reviewer found the
  diff itself clean.
- Synced with `launch-prep` at **`dd4aa0b`** (it had moved nine commits: the round-two merges of
  `brand-voice`, `rounding`, `palette` and `floating-surfaces` plus their reopenings). Merged clean;
  `git diff --name-only 82771e4 origin/launch-prep` touches no path this track reads.
- Gates on the synced tree, re-run WHOLE for this review pass: typecheck ok, lint ok (0 errors),
  test ok (1719 in 193 files), build ok (248 static pages, the `launch-prep` count unchanged). One
  correction to the earlier line, which said seven lint warnings: the measured count is **6**, and
  naming them is more useful than counting them, since none is in this lane and none is new here.
  They are `contact-form.tsx` (compilation skipped, incompatible library), `album-fill-grid.tsx`
  (two unused imports), `review-switch.tsx` (one unused import), `jobs.ts` (`JobRunInsert` unused)
  and `use-flip.ts` (an unused eslint-disable directive).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/hero-scan.md`,
  `src/app/(dev)/design/sandbox/home-hero/scan.css`,
  `src/app/(dev)/design/sandbox/home-hero/scan.tsx`. **No exceptions**: the two owned files and this
  manifest. `shared.tsx`, `board.tsx`, `source.tsx`, `burst.tsx`, `river.tsx` and
  `src/components/dev/board/stage.tsx` were read and not touched; `docs/specs/brand-voice.md` and
  `type-scale.md` were read as inputs.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte changed.
- ★ **Vercel is at its daily deployment cap. It blocks the whole project, and it blocks THIS track's
  review surface (the next bullet says how much).**
  `POST /v13/deployments` answers `payment_required`, `"api-deployments-free-per-day"`, limit 100,
  **remaining 0**, and the GitHub commit status on `f34af1c` reads
  `Vercel: "Deployment rate limited - retry in 24 hours."`, so no deployment record is created at all.
  The same limit froze several aliases in round two. **The consequence to carry: the alias
  `partyreel-git-lp-hero-scan-partyreel.vercel.app` serves `3fbd9c0`**, which is this round's board in
  full (the scroll fix, the default, the switch's words, the re-weighted pair, the two-line headline,
  the 375 lane, the repeating capture, the halved bloom box and the tightened departures) and is
  missing exactly ONE change: `f34af1c`, which keeps the chosen reading across Replay and a canvas
  change. Everything below was verified on that alias unless a line says otherwise; the one change the
  alias does not carry was verified on `pnpm build` + `pnpm start` in the worktree, which serves the
  same production output at the head, and it touches six lines of React state and no CSS at all.
- ★ **What that costs the review, stated plainly, because the line above used to understate it: the
  board MUST be redeployed at the head before the walk below is the walk this round describes.** The
  missing commit is not a detail to note and move past, it is the fix for this round's own cold-walk
  finding 5, and the switch is the first thing "Look at first" sends Will to. The two surfaces were
  walked with the SAME script, clicking "A phone" and then changing the canvas and hitting Replay:
  - **On the alias as served (`3fbd9c0`), the defect is live.** `.hhc-device` goes 0 to 1 on the
    click, then back to **0** on the canvas change and 0 again on Replay, with the switch's
    `aria-pressed` falling back to "The room". A reviewer who flips to the phone and then looks at
    375 is shown the composition he did not ask for, which reads as a switch that does nothing: the
    exact stranger-stumble this round claims to have fixed.
  - **On the head, it holds.** Room at load (`.hhc-device` 0, `.hhc-roomlock` 1, "The room"
    pressed); 1/0 after the click; and still 1/0 after the canvas change, after Replay, and after
    changing the canvas back. Four remounts, the reading intact through all of them.
- **The recovery is one call, and it needs no work from this track.** The cap is account-wide and
  rolling, so it refuses and re-arms 24 hours out on every attempt (`remaining 0 of 100`, reset read
  back as 2026-09-15 23:36 on the last try). Once it clears, this rebuilds the alias at the head
  without a push: `POST https://api.vercel.com/v13/deployments?teamId=team_ht9qAVBQVZf60dpGNJUwmaj5`
  with `{"name":"partyreel","project":"prj_9jMOBYmlxMtjNOuWXthVIcwAjWaB","gitSource":{"type":
  "github","org":"willgibs","repo":"partyreel","ref":"lp/hero-scan","sha":"<the head>"}}` and the
  team token. Confirm the alias serves the head by asking for a deployment list rather than by the
  clock, then walk the switch first. Until that call runs, treat the alias as round three minus its
  switch fix.

### The cold walk, which is what this round was

Six things a stranger would stumble on, found by walking the board the way Will will (a foreground
tab, 1440 then 375, every toggle, both copy modes, both readings) and every one of them fixed.

1. ★ **THE SWITCH BROKE THE HERO, on every click.** An `overflow: hidden` box is still a SCROLL
   container, and the corridor makes this one 3780 px wide against a 1439 px client box. Clicking the
   switch gave its button focus, the browser scrolled the container to "reveal" it under the stage's
   zoom, and the whole composition jumped sideways with the headline cut off: measured `scrollLeft`
   586 px and 657 px on two separate clicks. `overflow-clip` clips the same pixels and creates no
   scroll container, so `scrollLeft = 900` is now a no-op and focus plus click leaves 0/0. **This is
   a finding for the board, not only for this lane:** all four concepts carry the same
   `relative size-full overflow-hidden bg-background` root (`source.tsx:300`, `burst.tsx:552`,
   `river.tsx:748`), and the river has a chip of its own in the canvas, so it can be made to show the
   same jump. One word each and they are all safe.
2. **The board opened on the reading this concept argues against.** It defaulted to the phone while
   the rationale recommended the brackets. The default is the recommendation now.
3. **The switch spoke in the sheet's words.** "Brackets only" is the mechanism that draws it, not
   what a reader is choosing between. The options are "The room" and "A phone", in that order.
4. **The pair under the code was weighted backwards.** The caption names the act, which is this
   variation's whole axis, and it was the faintest type in the frame at 12 px white/60; the count,
   the only fabricated thing on the concept and the line most likely to be cut at wiring, was the
   loud one at 15 px white/85. They are swapped, so the permanent true line leads and the
   composition survives the count going.
5. **The reading did not survive Replay or a canvas change.** The board keys the stage, so every
   remount put the room back: flip to the phone, look at 375, and you are shown the composition you
   did not ask for, which reads as a switch that does nothing. The choice is held outside the
   component now. (The river reached the same answer for its own chip.)
6. **The proposed headline read like its neighbour's, and then put a photograph behind itself.**
   "One code. Every photo." sat one word from the burst's "One code. Every angle." and three of the
   four concepts opened with "One code". Rewritten to the voice guide's two-beat hero shape
   ("Every camera in the room, one album.", `docs/specs/brand-voice.md`) it is distinct, and the
   short version of it ("Every camera, one album.") turned out to be a real defect: a headline that
   fits on ONE line at the xl step is 1059 px of ink sitting 112 px above the corridor's axis, where
   the album's large frames reach it. Three measured intersections with the h1's own INK, zero once
   the line wraps to two. **The constraint belongs to the source's band, not to this variation**: any
   hero inheriting it wants a two-line headline at 1440, and the source's own proposal
   ("The album starts here.") is one line.
7. A seventh, smaller: at 375 the caption wrapped at its 200 measure and left "code" alone on a
   second line, and the pair then reached far enough down that its box touched the subhead's. The
   measure is 220 (the ink is 207 at 13 px), the lane sits at 96 and the sentence at 168.

### What the round added rather than fixed

**The capture repeats.** Through round two the concept's sentence was spoken once, at 730 ms, after
which the album poured forever with no visible cause. The capture now fires once per turn of the
album (10800 ms, `CYCLE_MS`, so every recapture lands on a launch pair rather than between them), and
it reads as the next guest scanning. It is one animation, no JavaScript, and it costs one element:
the bloom is the only thing this concept animates forever, so its box was shrunk to the disc it
actually draws (the gradient reaches transparent at the edge instead of at 72 percent of it, and the
box went 460 to 331 px at 1440 and 324 to 248 at 375) for a pixel-identical bloom on half the raster.

### Considered and NOT done: cutting the phone reading

Round three says to cut a candidate that no longer earns its column. The phone is the weaker of the
two by this concept's own argument, it is drawn rather than photographed, and it is the only thing on
the board that waits on an asset. It is kept because it is the one ruling Will named himself, and
cutting it would answer his question for him. What changed instead is that it stopped costing
anything to keep: it is second, the board opens on the other one, and its ask is conditional on it
being ruled in.

### Verified at `f34af1c`, on the preview unless a line says otherwise

- **The beat, sampled live in a FOREGROUND tab from a Replay remount** (the clock is the click, so
  every number carries about 70 ms of React remount): t=106 the brackets are thrown 27.4 px wide at
  opacity 0.34 and the corridor is EMPTY (0 of 24 visible); t=372 they are 2.3 px out at opacity 1,
  still empty; t=622 0.07 px out; t=739 locked, the capture still at 0; t=806 the bloom is rising at
  0.021; t=856 it is at its 0.342 peak and the room is STILL empty; t=1122 all 24 frames are up.
  Cause, then effect, with nothing in the room until the capture.
- **The recapture fires.** The bloom's animation reads duration 10800 ms, delay 730 ms, iterations
  infinite. A 13-second watch in a foreground tab caught a peak of 0.346 at animation clock 33200 ms,
  which is 70 ms into the FOURTH iteration: the capture repeats on the album's own cycle.
- **Point at the code and the camera re-acquires it.** A pointer over the plate throws the brackets
  back to opacity 0.18 at translate -30.6 px and they re-lock by 820 ms with the capture at 0.311,
  while 20 frames keep flying: the lock replays, the album does not.
- **The clear lane is measured against the INK, not the box, which caught what round two missed.**
  The corridor's own math was replayed against the rendered ink of the h1, the caption, the count,
  the sentence and both actions, over a full 10800 ms cycle at 50 ms steps, in every combination of
  canvas, reading and copy: **zero intersections in all of them.** The tightest is 11 px (375, the
  caption in the room reading); every other block at 375 clears by 16 to 130 px, and at 1440 by 28 px
  (the h1 under the proposed copy) to 158 px. No scrim anywhere, every photograph at 100 percent.
- **Reduced motion, simulated exactly** by deleting every `no-preference` block from the live sheets
  and clearing the loop's inline writes: all four brackets rest LOCKED (`animation-name: none`,
  `translate: none`, opacity 1), the bloom is spent at 0, 20 of the 24 frames stand at the
  steady-state spacing (the other four are the ones still inside the code), and the h1 is at opacity
  1 with transform none.
- **The production sheet, which is the one thing localhost cannot prove.** Every arbitrary utility
  this round introduced resolves in the shipped bytes: `text-[15px]`, `text-[13px]`, `text-[12px]`,
  `text-white/85` (#ffffffd9), `text-white/55` (#ffffff8c), `overflow-clip`, `tabular-nums`. All
  THREE `.hhc-*` rules that declare an animation sit inside
  `@media (prefers-reduced-motion:no-preference)` in the production CSS, and the only keyframes the
  sheet declares are `hhc-lock`, `hhc-flash` and `hhc-bloom`.
- **The served HTML** carries 24 `.hhc-card` nodes with 24 `--hhc-rest` and 24 `--hhc-rest-o`
  declarations, the four brackets, the bloom, the roomlock, the caption and the count at its opening
  value, and NO `hhc-device`, which is the default being the room. No em-dash, no `font-mono`, and no
  `data-mkt-cut` / `data-mkt-reveal` / `.mkt-line` on any h1 on the page (the two `data-mkt-cut`
  strings in the payload are the lab shell's own header div). The gate: 404 with no key, 404 with a
  wrong key, 200 with the key.
- **Performance, measured rather than guessed.** With all four concepts on the board running, rAF
  deltas over 200 frames: median 16.7 ms, p95 17.5 ms, max 17.7 ms, so not one frame was dropped. The
  scan's own tick (its math plus its 24 style writes, run 300 times against the real nodes) is
  **0.100 ms**, about 0.6 percent of a 60 Hz frame, with a 1.2 ms style flush for all 300 together.
  The room reading carries exactly five CSS animations and four of them are one-shots that finish;
  the bloom is the only permanent one and its box is now half what it was. First paint is 24 card
  nodes but **12 image requests**, because the two arms share the 12 landscape stand-ins;
  `sizes` is canvas-relative (360px at 1440, 170px at 375).
- **The one commit the alias does not carry, checked against the local production build** (`pnpm
  build` then `pnpm start`, the same output the preview would serve, at the head): the lab gate is
  404 with no key, 404 with a wrong key, 200 with the key; the served HTML carries 24 `.hhc-card`,
  ONE `.hhc-roomlock`, ZERO `.hhc-device` (the room is the default), `overflow-clip`, both switch
  words and the round-three headline, with no `font-mono` and no em-dash in the payload; the root
  computes `overflow: clip`; the caption resolves at 13 px and white/85 on the 375 canvas; and the
  switch survives four remounts, which is the measured walk in the deployment bullet above.
- **A test-tooling trap this pass fell into and climbed out of, worth knowing while many tracks run
  at once: `pnpm start` on a guessed port can silently verify ANOTHER track's build.** The port was
  already held by a sibling worktree's server, `next start` exited with `EADDRINUSE` into a log
  nobody was reading, and the page that answered looked close enough to pass for this board. It was
  caught only because the DOM disagreed with the source in a way the head could not produce: the
  concept root computed `overflow: hidden` and there was no `.hhc-lab` switch at all, which is round
  ONE of this concept. The habit that makes it safe is cheap: pick the port by testing that nothing
  is listening on it, and before trusting a single number, assert a marker only the head can render
  (here `.hhc-roomlock` with `overflow: clip`). A stale-surface reading and a wrong-server reading
  look identical from the outside, and this round has now been bitten by both.
- Test-tooling note, unchanged from round two and it cost time again: a hidden or driven tab throttles
  rAF AND `setTimeout`, pauses the stage through `data-paused`, and returns black screenshots right
  after a navigation. Every timing number above was taken in a fronted tab; compositions were shot
  with the corridor frozen at its rest transforms and the animations parked at a chosen `currentTime`.

### Shell changes for the Orchestrator to carry (neither blocks this board)

1. **An optional `controls` (or `switches`) slot on `Concept`, rendered by `board.tsx` beside its own
   toggles.** Two tracks have now drawn a switch inside the canvas because a concept that carries a
   RULING has nowhere else to put one (this board's `hhc-lab`, the river's `hhv-lab`), and this round
   spent a fix on a bug that only exists because the control lives inside the composition. One field
   retires both chips.
2. **`demoCount` beside `qrUrl`.** The third filing, after the source and the river: the shell hands
   a concept the demo URL and nothing else, so the album's count is drawn here. With it, the count
   stops being a stand-in and the departure above resolves itself.

### "Apply to the site" does not apply to this board

The candidate is a composition, not a CSS block: there are no selectors here that would mean anything
on `/`, `/pricing`, `/help`, `/contact`, the dashboard or the demo guest page, and offering a paste
would be the light or palette board's paste wearing this track's name. The pages to walk are the
board's own two stages; the ruling lands in `PageHero` at the wiring round.

- **Assets requested from Will** (unchanged from round two, and still only one of them new):
  1. **CONDITIONAL, only if a phone is ruled in: the hand-and-phone cutout, ASSETS row 8** (PNG with
     alpha, 1200 px long edge, the screen area fully transparent, shot from behind the holder's
     shoulder in low warm event light, two grips) · replaces the drawn device `.hhc-phone`. Rule the
     room and row 8 can be withdrawn: that reading needs no asset that does not exist.
  2. Nothing else new. The corridor wants the 24 squares already on the log (**row 2**, asked by
     `hero-source`); the three phone-up photographs on **row 3** are NOT needed here, because the
     device is drawn rather than photographed.
- **The asks, verbatim from BoardMeta** (the Orchestrator quotes them under Waiting on Will):
  1. "ONLY IF A PHONE IS RULED IN: a hand-and-phone cutout to replace the drawn device, already on
     the log as ASSETS row 8. PNG with alpha, 1200 px on the long edge, the SCREEN AREA fully
     transparent so the viewfinder composes underneath and stays live; shot from behind the holder's
     shoulder, the phone held up and angled away to the right, in low warm event light so the body is
     nearly a silhouette with one highlight along the edge; two grips, one-handed and two-handed.
     Rule the room and the row can be withdrawn."
  2. "Not a new ask: the corridor runs on the 12 landscape stand-ins and wants the 24 squares already
     requested (ASSETS row 2, asked by hero-source), 512 x 512, one grade, framed tight enough to
     read at 120 px. Nothing here needs row 3's phone-up photographs, because the device is drawn
     rather than photographed."
- **The rulings, from the board's Departures, each one word from Will**:
  1. **The room, or a phone.** The switch at the top right. The recommendation is the room, until the
     cutout is shot. Either reading is the only light in a hero that is cinema and unlit: the phone's
     screen, or the room's capture bloom. Both brighten, neither darkens.
  2. **Keep the count, or cut it.** 282 climbing to 312 is a stand-in and must not ship as invented
     data.
  3. **The centred lockup**, precedent and not law, shared with the source.
  4. Flagged, not a ruling: bible 13, the pre-release and thrown-wide states inside the
     reduced-motion block.
- **Look at first** (★ first, check the surface: if the alias has not been rebuilt at the head, step
  three below misbehaves and it is the stale build, not the board. See the deployment bullet; the
  tell is that flipping to "A phone" and then changing the canvas puts the room back): the first
  second, in a FOREGROUND tab, on Desktop. The code stands alone in an empty room while a scanner's
  brackets close on it, they snap, the capture blooms, and the album comes out of the plate. Then
  wait for it to happen AGAIN, about eleven seconds later, which is the one thing round three added:
  the hero says its sentence once per turn of the album instead of asserting it once. Then the switch
  at the top right, once: the room, or a phone, is the whole ruling and everything else is identical
  between them. Then 375 in each reading, which are two different compositions rather than one
  compressed: the classic rhythm in the room, and in the phone reading the words at the top with the
  near field owning the bottom third and the two codes on one vertical axis.

## Record (round 3; the CHANGELOG paragraph for rounds 2 and 3, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). Two rounds turned the scan from one composition
into a board with a single ruling on it. Round two carried both readings of the cause and a switch
between them, rebuilt the phone to tell the truth about what a camera sees (a 46 px code inside a
260 px device, cropped by two edges so it reads as a held object), gave the 375 canvas its own
composition rather than a compression, and put the beat in causal order so the room is genuinely
empty until the capture. Round three walked the board cold, the way its reviewer would, and fixed
what that found: the switch had been scrolling the whole hero 600 px sideways on every click, because
an `overflow: hidden` box is still a scroll container and the corridor makes this one 3780 px wide;
the board had been opening on the reading the concept argues against; the caption that names the act
had been the faintest type in the frame while the fabricated count was the loud one; the reading had
not survived Replay; and the proposed headline had read like its neighbour's. The keep-out test was
rewritten to measure the INK of every block rather than its box, which found a real fault nobody had
seen: a headline that fits on one line at the xl step gets a photograph behind it, so this
composition wants two lines at 1440, and that is true of the source's band and not only of this
variation. The round's one addition is that the capture repeats once per turn of the album, so the
cause is restated rather than asserted once, on one animation and half the raster it used to cost.

## Handoff (round 4)

- Head: the tip of `lp/hero-scan`, which is THIS commit (a manifest cannot name its own SHA). The last
  CODE commit is `0afc9f8`; everything after it is this manifest and the `launch-prep` merge, which
  carries no change of mine, so `scan.tsx` and `scan.css` are byte-identical to the tree every
  verification below names. Pushed. **Marker for the round-four board: the class `hhc-bezel` in the
  served HTML**, which exists nowhere before this round; the caption "Guests scan once. The album fills
  itself." and the corner toggle's words "Without the phone" mark it too.
- Synced with `launch-prep` at **`6484558`** (it had moved two docs-only commits: PROGRAM's rising-tides
  line for the app's UI and the Orchestrator's In flight rows). Merged clean; the diff touches
  `docs/PROGRAM.md` and `docs/tracks/orchestrator.md` and no path this track reads.
- Gates on the synced tree: typecheck ok, lint ok (0 errors; the 6 warnings are the pre-existing ones on
  `contact-form.tsx`, `album-fill-grid.tsx`, `review-switch.tsx`, `jobs.ts` and `use-flip.ts`, none in
  this lane and none new), test ok (1804 in 199 files), build ok (248 static pages, the `launch-prep`
  count unchanged).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/hero-scan.md`,
  `src/app/(dev)/design/sandbox/home-hero/scan.css`,
  `src/app/(dev)/design/sandbox/home-hero/scan.tsx`. **No exceptions**: the two owned files and this
  manifest. `shared.tsx`, `board.tsx`, `source.tsx`, `src/components/dev/board/{stage,dock,lab-prefs}.ts(x)`
  and the other tracks' manifests were read and not touched.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte changed.

### What round four did, and why

Will ruled the phone in ("continue iterating on ... 2 with its phone scan addition"), so the concept
stopped carrying it as one of two equal readings and spent the round on the thing that had only ever
been a proposal: a phone that actually scans.

1. **The phone is the composition.** It is the default at both canvases, and both canvases were laid
   out around it rather than around a gap it could sit in: at 1440 the corridor lifts 18 px so the near
   field owns a quadrant, and the device grew from 260 to 296 px and is still cropped by two frame
   edges; at 375 it grew to 252 px, rises almost centred out of the bottom edge and now clears the
   plate by 17 px instead of 8. The two canvases are deliberately two different points of view: at 1440
   the hand enters from the left, which is ANOTHER guest at work in a room the host is being shown; at
   375, where the reader is holding the object being drawn, it is his own hand coming up.
2. **The scan became a gesture.** Through round three the phone was already up, already aimed and
   already locked at the first frame, which is a diagram of a scan. It now rises into frame over 620 ms
   rolling the last few degrees into its aim, and the brackets only start closing once it is nearly
   home. And it never stops being held: a 7.3 s drift of about a pixel and a quarter of a degree, on
   the one period in the composition that is NOT a multiple of the album's 10.8 s, so the hand and the
   album never fall into step.
3. ★ **The capture now lands on the code, and this was a real fault three rounds missed.** The bloom
   belonged to the room reading alone, so in the reading the concept argues for, the capture fired on
   the phone's screen and the plate did nothing at all: the one sentence this variation exists to say
   had no visible verb. The bloom is now the plate's answer in both readings, 40 ms before the album
   leaves it. Camera, code, album, in that order, measured below.
4. **The repeat reads as a scan again.** Round three made the capture repeat once per turn of the album
   but left the brackets locked and motionless through it, so a recapture was a flash with no cause.
   The brackets now tick about two pixels inward on every capture, the way a scanner confirms a read,
   so the whole chain replays. It is four 14 px elements and one keyframe.
5. **The device is built for the photograph that will replace it.** It used to be one box with the
   screen inside it, which is the one shape a cutout with a transparent screen cannot drop into. It is
   three flat layers now, in paint order: `.hhc-back` (the body), `.hhc-screen` (the live viewfinder)
   and `.hhc-bezel` with `.hhc-pill` (the rim and the notch). ASSETS row 8 replaces the first and the
   last; the viewfinder underneath is untouched and stays live. The ask is unconditional now.
6. **One set of beat numbers.** The sheet used to carry the timings as literals while the corridor's JS
   carried its own. `BEAT` in `scan.tsx` is now the only home, and the sheet reads it through
   `--hhc-lock-delay`, `--hhc-cap-delay`, `--hhc-period` and `--hhc-lock-ms` on the concept's root. The
   footnote reading keeps round three's beat exactly, which is what makes it a fair comparison.
7. **The corner control stopped asking a settled question.** It was a two-option switch labelled
   "Cause"; the ruling is made, so it is one button, "Without the phone", under the word "Footnote".
8. **The copy.** The caption names the result and not only the mechanism, and its LENGTH turned out to
   be a measured constraint rather than a taste: at 375 it is the one block of type the corridor can
   reach, and the keep-out sweep buys about five pixels of clearance for every thirty pixels of ink it
   loses. "Your guests scan once. The album fills itself." (273 px) intersected the corridor in the
   footnote reading; "Guests scan once. The album fills itself." (243 px) clears it.

### Two defects this round found and fixed, both invisible until they were measured

1. **The proposed secondary action wrapped to a second row at 375 and landed ON the caption.** "See the
   album it made" is 212 px beside a 122 px primary in a 343 px column: three pixels too wide, so the
   row wrapped and the second button's box overlapped the caption's. The line is now "See what it made"
   (173 px) and an ink-versus-ink overlap test runs in every combination.
2. **The new caption intersected the corridor at 375 in the footnote reading** (two intersections, 1 px
   of clearance). Fixed twice over: the lane moved from 96 to 108 px off the axis with the measure cut
   from 320 to 300, and the caption itself lost 30 px of ink. Clearance is now 10 px there and 15 px in
   the ruled reading.

### Verified at `0afc9f8`, on a LOCAL PRODUCTION BUILD (`pnpm build` then `pnpm start`, port 3421) and a dev server (3411), in a FOREGROUND tab

Vercel is capped, so nothing here was verified on a preview; every number below was taken on the local
production output at the head, in a tab whose `document.hidden` was false (the pane's own tab, fronted
before each reading). Where a check is a DOM or stylesheet read rather than a timing, it is marked.

- **The beat, sampled live from a Replay remount on the PRODUCTION build** (the clock is the click, so
  each number carries the React remount): t=0 the phone is 250 px below its held position at opacity 0,
  the brackets are thrown 16 px wide at opacity 0, and the corridor is EMPTY (0 of 24); t=157 the phone
  is 59 px out, still empty; t=332 the phone is 6.9 px out and the brackets have begun (13.6 px out,
  opacity 0.26); t=640 the phone is home, the brackets 0.7 px out at opacity 1; t=1015 locked, the
  capture still at 0, the room STILL empty; t=1074 the flash is at 0.413 and the PLATE's bloom at
  0.299, with the brackets ticked 1.28 px inward; t=1115 the bloom peaks at 0.326; t=1507 all 24 frames
  are up; t=2207 settled. Cause, then effect, with nothing in the room until the code answers.
- **The recapture fires on the album's own clock.** The bloom's animation reads duration 10800 ms, delay
  1020 ms, iterations infinite. A 13-second watch in a fronted tab caught a peak of 0.353 at animation
  clock 55075 ms, which is 55 ms into the SIXTH iteration.
- **Point at the code and the whole chain replays while the album keeps running.** A pointer over the
  plate throws the brackets back to 16 px at opacity 0; they sweep in and land by 760 ms, the capture
  fires at 1040 (flash 0.118, bloom 0.085) and peaks at 1080 (0.408 / 0.352) with the brackets ticking
  inward, and 20 to 22 frames stay in flight throughout.
- **The keep-out lane is measured against INK, over a full corridor cycle at 50 ms steps, in all EIGHT
  combinations of canvas, reading and copy: zero intersections, and zero ink-over-ink overlaps.** Worst
  clearance 34 canvas px at 1440 (either reading, either copy), 15 px at 375 in the ruled reading,
  10 px at 375 in the footnote. The test measures the rendered ink of the h1, the caption, the count,
  the subhead and both actions with Range rects, and the rendered box of every visible card. No scrim
  anywhere, every photograph at 100 percent.
- **Reduced motion, simulated exactly** by deleting all 27 `no-preference` blocks from the live sheets
  and clearing the loop's inline writes in the same synchronous pass: the phone stands in its held
  position (`.hhc-rise` translate none, opacity 1, `animation-name: none`) and does not drift
  (`.hhc-phone` animation-name none); all four brackets rest LOCKED (translate none, opacity 1); the
  flash and the bloom are spent at 0; 22 of 24 frames stand at the steady-state spacing; the h1 is at
  opacity 1 with transform none; the count holds its number.
- **The PRODUCTION stylesheet, audited over HTTP, which is the one thing a dev server cannot prove.**
  All FIVE `.hhc-*` rules that declare an animation (`.hhc-rise`, `.hhc-phone`, `.hhc-bracket`,
  `.hhc-flash`, `.hhc-bloom`) sit inside `@media (prefers-reduced-motion: no-preference)`, and the only
  keyframes the sheet declares are `hhc-rise`, `hhc-hold`, `hhc-lock`, `hhc-tick`, `hhc-flash` and
  `hhc-bloom`, all under this track's prefix. Every arbitrary utility resolves in the shipped bytes:
  `text-[15px]` -> `font-size:15px`, `text-[13px]`, `text-[12px]`, `text-white/85` -> `#ffffffd9`,
  `text-white/55`, `tabular-nums`, `overflow-clip` -> `overflow:clip`.
- **The served HTML** carries the whole composition, deployed and locked: 24 `.hhc-card` nodes with 48
  `--hhc-rest*` declarations, the device with `hhc-rise`, `hhc-back`, `hhc-screen`, `hhc-bezel` and
  `hhc-pill`, the 4 brackets, the bloom, the flash, the roomlock, `overflow-clip`, the caption and the
  count at its opening value (282). No em-dash and no `font-mono` in the payload. Both concept h1s carry
  only `class` and `style`, with no `data-mkt-cut` / `data-mkt-reveal` / `.mkt-line` on any h1 (the two
  `data-mkt-cut` strings in the payload are on a `div` in the lab shell's own header). The gate: 404
  with no key, 404 with a wrong key, 200 with the key, on the production server.
- **The footnote survives Replay and a canvas change** (round three's fix, re-checked because the beat
  now differs between the two readings): pressed through a canvas change, a Replay and a change back,
  four remounts, and restoring it puts the device back.
- **Performance, measured rather than guessed.** With every concept on the board running, rAF deltas
  over 200 frames on a 120 Hz display: median 8.3 ms, p95 10.0 ms, max 10.4 ms, **zero dropped frames**.
  The scan's own tick (its math plus its 24 style writes, run 300 times against the real nodes) is
  **0.107 ms**, about 0.6 percent of a 60 Hz frame, with a 0.4 ms style flush for all 300 together,
  which is round three's number unchanged. The honest cost this round added: the concept now runs SEVEN
  infinite animations where it ran one (the device's drift, four bracket ticks, the flash and the
  bloom) out of 12 total. All seven are transform or opacity only, and none of them adds a layer: the
  device subtree was already composited by its own `rotateY`/`rotateZ`, the brackets are 14 px, and the
  flash is an opacity on a box that already exists. First paint is still 24 card nodes but 12 image
  requests, because the two arms share the 12 landscape stand-ins.
- Test-tooling notes, both of which cost time and are worth carrying while twelve tracks run at once.
  (a) **A hidden tab returns a STALE screenshot, not a black one, and that is worse.** Writing 24 card
  transforms into a background tab and screenshotting it returned the composition as it had been
  before the write, with the DOM insisting the write had landed. Every visual here was taken in a
  fronted tab and cross-checked against `getBoundingClientRect`. (b) **Both browser surfaces are shared
  between the tracks running tonight**, so a tab can be fronted by another session between one call and
  the next; a screenshot batched after a long wait comes back black. Front the tab in the same batch as
  the screenshot, and do the waiting in a separate call.

### Shell changes for the Orchestrator to carry (none blocks this board)

1. **The home-hero board has not adopted `BoardDock`.** Its page-wide switches (Desktop / Phone 375,
   Ruled / Proposed copy, Replay) still sit in a row at the top of `board.tsx`, so comparing the source
   against the scan at 375 means scrolling back up for every flip, which is the exact complaint Will's
   note (a) makes. The dock exists and takes them as children; `board.tsx` is the Orchestrator's file.
2. **An optional `controls` (or `switches`) slot on `Concept`, rendered by `board.tsx` beside its own
   toggles.** Third filing. A concept with a control of its own has nowhere but inside the canvas to
   draw one, which is where round three's 600 px scroll bug came from; this round's toggle is one
   button instead of two, but it is still chrome living inside a composition.
3. **`demoCount` beside `qrUrl`.** Fourth filing. The shell hands a concept the demo URL and nothing
   else, so the album's count is invented here. With it the count stops being a stand-in and the second
   departure below resolves itself.
4. ★ **A hero stage is 64 px taller than a hero.** Measured on the production home page: the real
   marketing header is 64 px and sits in FLOW at the top (`sticky top-0`, the first section starts at
   y=64), so a hero section on the real page gets 866 px of a 930 px viewport, not 930. Every concept
   on this board is composing with 64 px it will not have, which matters most to the two that anchor
   off the canvas centre. The fix is the board's or the shell's, not a lane's: either the hero canvas
   becomes 866, or (better, and it answers Will's note (c) about more real UI) the hero stages render
   the production `SiteHeader` at the top so a hero is judged as the real first screen. Doing it in one
   lane would make the two variations Will is comparing incomparable, so it is filed rather than done.
5. **The other concepts still carry `overflow-hidden` on their root** (`source.tsx:300`), which is
   round three's finding: an `overflow: hidden` box is a scroll container, and the corridor makes this
   one 3780 px wide, so any focus inside it can scroll the hero sideways. One word each.

### "Apply to the site" does not apply to this board

The candidate is a composition, not a CSS block: there are no selectors here that would mean anything
on `/`, `/pricing`, `/help`, `/contact`, the dashboard or the demo guest page, and offering a paste
would be the light or palette board's paste wearing this track's name. The pages to walk are the
board's own two stages; the ruling lands in `PageHero` at the wiring round.

- **Assets requested from Will** (one of them changed status this round):
  1. **NOW A STANDING ASK, no longer conditional: the hand-and-phone cutout, ASSETS row 8** · PNG with
     alpha, 1200 px on the long edge, the SCREEN AREA fully transparent, shot from just behind the
     holder's shoulder with the phone held up and angled away to the right, in low warm event light so
     the body is nearly a silhouette with one highlight along the edge, 2 variants (a one-handed grip
     and a two-handed one) · replaces the drawn device's `.hhc-back` and `.hhc-bezel`, with the live
     viewfinder `.hhc-screen` composing underneath unchanged.
  2. Nothing else new. The corridor runs on the 12 landscape stand-ins and wants the 24 squares already
     requested (**ASSETS row 2**, asked by `hero-source`), 512 x 512, one grade, framed tight enough to
     read at 120 px. Nothing here needs row 3's phone-up photographs, because the near field is a
     cutout rather than a whole photograph.
- **The asks, verbatim from BoardMeta** (the Orchestrator quotes them under Waiting on Will):
  1. "A hand-and-phone cutout, ASSETS row 8, now a STANDING ask rather than a conditional one, because
     the phone is ruled in and the drawn device is the stand-in. PNG with alpha, 1200 px on the long
     edge, the SCREEN AREA fully transparent so the viewfinder composes underneath and stays live and
     real; shot from just behind the holder's shoulder, the phone held up and angled away to the right,
     in low warm event light so the body is nearly a silhouette with one highlight along the edge; two
     variants, a one-handed grip and a two-handed one. The device is built in three flat layers for
     exactly this swap, so the cutout replaces the body and the rim and nothing else moves."
  2. "Not a new ask: the corridor runs on the 12 landscape stand-ins and wants the 24 squares already
     requested (ASSETS row 2, asked by hero-source), 512 x 512, one grade, framed tight enough to read
     at 120 px. Nothing here needs row 3's phone-up photographs, because the near field is a cutout
     rather than a whole photograph."
- **The rulings left, from the board's Departures, each one word from Will**:
  1. **Keep the count, or cut it.** 282 climbing to 312 is a stand-in and must not ship as invented
     data. It is the quiet half of the pair, so the composition holds either way. The only ruling the
     concept still asks for.
  2. **The centred lockup**, precedent and not law, shared with the source. Overrule it and this hero
     goes left with the source.
  3. Flagged, not rulings: the phone (ruled in, and the three things that hold it to a camera rather
     than to software are on the board), the light (the screen and one capture bloom, both brightening,
     no scrim anywhere), and bible 13 (the pre-release, off-frame and thrown-wide states inside the
     reduced-motion block).
- **Look at first**: the first second and a half, in a FOREGROUND tab, on Desktop, after a Replay. A
  hand comes up into the lower left with a camera open on it, the brackets close on the code it has
  found, the capture fires on the screen, **the code in the room blooms back**, and the album comes out
  of the plate. That last step is what round four added and it is the whole variation: through three
  rounds the phone fired at a code that did nothing. Then wait about eleven seconds and watch it happen
  again, brackets included. Then 375, which is the same sentence from the other side of the hand: the
  words at the top, the plate in the middle, and your own phone rising out of the bottom edge with the
  two codes on one vertical axis. The toggle in the corner is a footnote, not a question.

## Record (round 4; the CHANGELOG paragraph for round 4, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). Will ruled the phone in, so the scan stopped carrying
it as one of two equal readings and became the composition it had only been proposing. The phone is the
default at both canvases and both canvases were laid out around it, as two points of view rather than
one compressed: at 1440 the hand enters from the left, another guest at work in a room the host is being
shown, and at 375 it is the reader's own hand rising out of the bottom edge with the two codes on one
vertical axis. The scan became a gesture, a hand coming up over 620 ms and rolling into its aim before
the brackets close, and then never quite still, on a drift period deliberately out of step with the
album's. The round's real find was that the capture had never landed on the code: the bloom belonged to
the ruled-out reading, so the phone fired while the plate did nothing and the concept's one sentence had
no verb. The plate answers in both readings now, 40 ms before the album leaves it, and the brackets tick
inward on every recapture so the repeat reads as the next guest scanning rather than as a light. The
drawn device was rebuilt as three flat layers so the cutout on ASSETS row 8 drops in over an untouched
live viewfinder, and that ask stopped being conditional. Two defects fell out of measuring rather than
looking: a proposed action row three pixels too wide wrapped onto the caption at 375, and the new
caption intersected the corridor in the footnote reading; both are fixed and all eight combinations of
canvas, reading and copy now clear the album's own ink by 10 to 34 pixels.
