---
track: hero-scan
status: handed-off
cut: "ca952b5"
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
  - src/app/(dev)/design/rules/bible.ts
  - src/lib/constants/marketing-media.ts
  - src/lib/shared/use-ambient-pause.ts
  - docs/ASSETS.md
  - docs/tracks/hero-source.md
---

# lp/hero-scan

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
- Synced with `launch-prep` at `4b035c1` (a docs-only commit; merged clean, nothing in this lane).
- Gates on the synced tree: typecheck ok, lint ok (0 errors; the 7 warnings are the pre-existing ones
  on `review-switch.tsx`, `contact-form.tsx`, two feature sections, `jobs.ts` and `use-flip.ts`, none
  in this lane), test ok (1698 in 193 files), build ok (248 static pages, the `launch-prep` count
  unchanged).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/hero-scan.md`,
  `src/app/(dev)/design/sandbox/home-hero/scan.css`,
  `src/app/(dev)/design/sandbox/home-hero/scan.tsx`. **No exceptions**: the two owned files and this
  manifest. `shared.tsx`, `board.tsx`, `source.tsx`, `burst.tsx` and `river.tsx` were read and not
  touched.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte changed.
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
