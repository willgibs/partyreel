---
track: hero-burst
status: integrated
cut: "ca952b5"
merged: "4caffc3"      # the branch head merged into launch-prep
merged_round_1: "2d0631e"
preview: true           # Will reviews this concept on its preview as it builds
owns:
  - src/app/(dev)/design/sandbox/home-hero/burst.tsx
  - src/app/(dev)/design/sandbox/home-hero/burst.css
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

# lp/hero-burst

## Round 2 (Will, 2026-09-14: "another iterative round on all active tracks before review")

**Round 2 (the goal).** The burst has the origin in every direction; now make it the best version of
itself against Will's criterion (a stranger's first read is "if I scan this, I get all of these").
(1) **The headline trade** on the board: a toggle between the ladder's `lg` and `xl` steps so Will
rules it with both in view, and the quiet zone tuned for each. (2) **The first second and a half**
tuned: the code alone, the slip, the eruption; the near-frame wipe kept legible (a frame that wipes
past the viewer must never read as a glitch). (3) **The shadow**: the light spec (`docs/specs/light.md`)
proposes a LIFT family with an alpha per ground; use its numbers for the frames' drop shadow, or
show why the burst needs its own, and keep it flagged. (4) **The supporting elements**: the Caption
line under the code, the proposed copy ("One code. Every angle." named the field; test it against
the ruled thesis on the board), the CTAs. (5) **The phone canvas** as the same composition, which is
the claim this variation makes against the source: prove it. (6) **Performance**: measure the loop
(frame time, layer count, paint) at both canvases and cut what does not earn its cost. (7) Read the
scan and the river (read-only) and take what serves the burst. (8) Tighten the departures to the
ones Will must rule on. Keep the hand-done projection; keep the h1 at paint and media at 100 percent.

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

**Goal.** The burst, variation 3 of the home-hero board's third round (Will, 2026-09-14: three more variations off the source). Your axis: THE ORIGIN IN EVERY DIRECTION. The source streams left and right in two perspective rows; the burst takes the same causality onto the depth axis and around the compass: frames are born at the code and radiate outward in all directions, toward the viewer and past the edges (Melius's own centre-out, on z as well as x), so at any width the code reads as the source of everything on screen. The type holds a cleared zone (a quiet disc or band around the code where no frame flies, so the h1 and the code never fight a photograph; no darkening layer ever). Radial is orientation-agnostic, so Phone 375 gets the same composition rather than a compressed strip. The perpetual loop stays a pure function of elapsed time (the source's lesson: no state, no timers, recycling from a modulo), with position and scale on separate curves so a frame leaves small and slow and is large and quick as it dissolves at the edge; the branch-out is one reveal tween from the code. Supporting elements clarify: a Caption line under the code, the CTAs, and your copy proposal. Media at 100 percent.

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

**Verify on.** partyreel-git-lp-hero-burst-partyreel.vercel.app, `/design/c/home-hero?key=` (the key is
`DESIGN_PREVIEW_KEY` in `.env.local`): your concept at Desktop and Phone 375, ruled and proposed
copy, Replay, reduced motion (the rest state), the h1 present at opacity 1 off the DOM.

### What your variation shows

Desktop: the QR at the centre at scanning size inside a cleared zone; frames born at the code and
flying outward on a radial (with a z component: perspective so the near frames grow past the viewer
and the far ones recede), fading in at the origin, dissolving past the edges; the h1 inside or
above the cleared zone, the subhead and CTAs below, no photograph ever under a word. Phone: the
same radial at 375 (the cleared zone smaller, the frames fewer, the code still scannable). Reduced
motion: the field deployed at rest around the code. Replay: the burst from the code. Departures to
flag: a lamp under the code if you light it; the centred lockup; any scrim (there should be none).
The asks: the 24 squares (`docs/ASSETS.md` row 2) serve this variation as they serve the source;
name any extra shape you need (a portrait set for the vertical radials, for instance).

### The rules of this wave (every track)

- **The shell is shared and registered.** Never edit `board.tsx`, `shared.tsx`, `board.css`,
  `source.tsx`, `touchpoints.ts` or `rules/bible.ts`; never CHANGELOG, STATUS, ROADMAP, PROGRAM,
  CLAUDE, AGENTS, `docs/ASSETS.md`; ask in Handoff.
- **Sheets.** Keyframes under your prefix `hhb-` only (`keyframe-uniqueness.test.ts` reads every
  sheet under the lab; `hhs-` is the source's, `hh-` the board's); a sheet never imports tailwindcss;
  `glow-contract.test.ts` pins the BorderBeam and GlowFilter counts across `src`, so compose `<Glow>`
  only if you light anything (and flag it). No em-dashes anywhere.
- **Sync** `origin/launch-prep` only per PROGRAM.md (before handoff if it moved; mid-round only when
  `docs/tracks/orchestrator.md` announces a landed change to one of your `reads`).
- **Handoff:** fill Handoff and Record below, `status: handed-off`, push; the chat report is one
  line, "handed off at <sha>".

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- **none.** No production byte moved, and no owned fact belongs in a system doc yet: the burst is a
  lab concept until Will rules on the board.

## Deferred (ROADMAP one-liners, bucket named)

- Home hero (the wiring round, if the burst is ruled): production wires the loop to
  `useAmbientPause` rather than to the stage's `data-paused`, and the pre-burst frame wants a
  `<noscript>` companion rule so a reader with JavaScript off and motion allowed still gets the
  deployed field (the one departure flagged on the board; the source flagged the same thing).
- Home hero (the wiring round, if the burst is ruled): the quiet zone's boxes (`KEEP` in `burst.tsx`)
  are measured numbers for the lab's two fixed canvases. Production is fluid, so the wiring round
  either derives them from the lockup at layout time (a ResizeObserver on the type, once, feeding the
  same clearance scan) or pins the lockup to a fixed measure at each breakpoint. Do not ship the
  literals as-is against a fluid column.

## Handoff (round 1)

- Head: the tip of `lp/hero-burst` (a manifest cannot name its own SHA). The work commit is
  `59cdd49`, which is what the preview alias was verified at; the sync merge is `9e3a94c`. Pushed;
  preview `https://partyreel-git-lp-hero-burst-partyreel.vercel.app`, the board at
  `/design/c/home-hero?key=` (concept 3 of 4).
- **Synced with launch-prep at `3d40173`** (it had moved 68 commits: media-kit, floating-surfaces,
  palette, type-scale, kill-mono). Nothing under `sandbox/home-hero/` moved, so the contract is
  unchanged; of my `reads`, `caption.tsx` lost its `MonoCaption` sibling in the kill-mono sweep (this
  concept was already on the one Caption atom), `stage.tsx` gained a doc-only ★ about breakpoint
  prefixes reading the real viewport inside a zoomed stage (this concept carries none: it keys off
  `mode`), and `CANVAS`, `LADDER` and `GUTTER` are untouched.
- Gates on the synced tree: typecheck ok, lint ok (0 errors; the 7 warnings are pre-existing, on
  `brand-voice/board.tsx`, `contact-form.tsx`, two album sections, `jobs.ts` and `use-flip.ts`),
  test ok (1697 in 193 files), build ok (248 static pages; this change adds no route).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/hero-burst.md`,
  `src/app/(dev)/design/sandbox/home-hero/burst.css`,
  `src/app/(dev)/design/sandbox/home-hero/burst.tsx`. **No exceptions**: the two owned files and this
  manifest. `shared.tsx`, `board.tsx` and `source.tsx` were read whole and not touched; the shell had
  everything the concept needed.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte changed.
- **Verified on the preview at `59cdd49`** (Vercel READY at that SHA; the alias was polled until its
  HTML carried `hhb-card`, so the build is proven by a marker rather than by the clock), and the
  gates re-run after the sync at `9e3a94c`:
  - The gate: 404 with no key, 404 with a wrong key, 200 with the key.
  - The server's own HTML carries 26 `.hhb-card` nodes with 26 `--hhb-rest` and 26 `--hhb-rest-o`
    declarations, so the deployed field is in the markup: reduced motion, a crawler and a cold paint
    all get the album standing still around the code rather than an empty stage.
  - The h1 is in the HTML at computed opacity 1 with `transform: none`, at 72 px on the desktop
    canvas and 36 px on the phone, with no `data-mkt-cut` / `data-mkt-reveal` / `.mkt-line` on any h1
    on the page. It never moves, before or during the burst.
  - Desktop 1440 and Phone 375, ruled and proposed copy: 12 to 13 frames in the air on the desktop
    canvas and 9 on the phone, the code still at the exact centre at scanning size (140 px and
    100 px), the type clear of every photograph at both widths and under both copies.
  - **The quiet zone, measured live rather than argued**: over 11 s of the running field on the
    desktop canvas under the taller (proposed) copy, sampling every visible card against the h1, the
    caption, the sentence, both buttons and the QR, the closest any visible frame came to any of them
    was **36 px**. No photograph is ever under a word, in any direction, at any moment of the loop.
  - Replay: the burst from the code, measured on the stage. Desktop: nothing at 200 ms, three frames
    beside the code at 400 (180 px out), four at 800, seventeen at 1010 (the crest, 731 px out),
    settling to ten to fourteen. Phone: nothing at 440 ms, two at 660, fourteen at 1100, settling to
    six to nine. One eruption, then the rain.
  - Reduced motion: simulated by deleting the `no-preference` block from the live sheet and clearing
    the loop's inline styles, which leaves exactly the cascade a reduced-motion reader gets. The
    field stands fully deployed around the code, 12 frames, the lockup untouched.
  - No em-dash, no `font-mono` and no `MonoCaption` anywhere in the two owned files; the eight
    `font-mono` hits on the served page are the board shell's variant badge, outside this lane.
- **Assets requested from Will** (the concept lists these on the board too):
  1. **24 event photographs as 512 x 512 squares** · one grade, 6 to 35 KB webp each, across
     weddings, birthdays, corporate and festivals, framed tight enough to read at 90 px (a face, two
     hands, a glass, a sparkler, a first dance), never a wide room shot · replaces the 12 landscape
     stand-ins the field cycles (`FRAMES` in `shared.tsx`). **This is `docs/ASSETS.md` row 2, already
     requested for the source**; the same 24 serve the burst unchanged, and at 24 no frame is ever on
     screen twice.
  2. **8 of those same 24 also as 4:5 portrait crops** · 512 x 640, the same photograph recropped,
     same grade · replaces the square box on the third of the field that already lays out 4:5.
     Guests shoot vertical, so a field of nothing but squares reads as a deck of cards rather than as
     an album. This is the one ask the burst adds, and it needs no new photography.
  3. Nothing else. The QR is the real demo event's, live from `NEXT_PUBLIC_DEMO_QR_TOKEN`; there is
     no plate art, no lamp and no video in this concept.
- **The departures, verbatim from the concept** (the Orchestrator quotes them under Waiting on Will):
  1. "Bible 13, decorative layer only: the frames' pre-burst state sits inside the reduced-motion
     block, so with JavaScript off and motion allowed the field rests around the code instead of
     leaving it. Putting it in an effect instead would paint the album deployed and then snap it back
     to the code. The h1, the code, the caption, the sentence and the actions are plain markup, never
     gated, and reduced motion gets the field fully deployed."
  2. "Bible 10, flagged because the hero is unlit by the standing ruling: the frames carry a soft
     drop shadow. Rule 10 allows exactly this (stacked or overlapping media cards need separating)
     and the burst overlaps constantly, near frame over far, so without it the depth axis collapses
     into a flat scatter. It is a shadow, never a lamp: no light source is added and no photograph is
     darkened."
  3. "Precedent, not law: the lockup is centred rather than left-aligned, because the code owns the
     axis. The first thing to overrule if the home hero should stay left."
  4. "Not a departure, but the visible difference from the source and worth a ruling: the headline
     sits on the ladder's lg step (text-7xl on desktop, text-4xl on the phone) rather than xl,
     because the quiet zone has to stay small enough for the burst to own the canvas around it. Both
     are cinema steps of the one site ladder (bible 5)."
  5. "There is no scrim, no darkening layer and no lamp anywhere in this concept. Media at 100%."
- **Look at first**: the first second and a half after a Replay. The code sits alone, two or three
  frames slip out beside it, and then the whole album erupts in every direction at once and keeps
  going. Then: whether the headline at the ladder's lg step is the right trade for the burst having
  the canvas (departure 4, the one real choice on the board), whether the proposed copy earns the
  composition ("One code. Every angle." names the field, which the ruled thesis does not), and
  whether the phone reads as the same composition rather than a thinner one, which is the claim this
  variation makes against the source.

## Record (round 1)

Merged into `launch-prep` at `<sha>` (2026-09-14). The burst, concept 3 of the home-hero board's
third round, replaced its placeholder. It keeps the source's ruled sentence and takes it onto the two
axes a corridor cannot use: around the whole compass, and forward out of the screen. Frames are born
inside the code and fly outward and toward the viewer, so a near frame grows until it wipes past the
edge while a far one stays small and slides out, and nothing on screen has any other origin. The
projection is done by hand rather than with a CSS perspective parent, because the screen position,
the apparent size and the paint order all have to be readable as numbers, and because the transform
string then stays a pure function of the clock. Travel is the square root of progress and size lags
it; the perspective term multiplies both, so the acceleration is depth rather than an easing curve
imitating one. The quiet zone is one box per block of the lockup rather than one rectangle around all
of it, and each card is given, once, the progress after which its own box is permanently clear of
every block: measured live over 11 s of the running field, the closest any visible frame came to any
word was 36 px, with no scrim and no darkening layer anywhere.

## Handoff (round 2)

- **Head**: the tip of `lp/hero-burst` (a manifest cannot name its own SHA). The work commits are
  `fdc0aad` (round two of the field), `3386667` (the birth size) and `c25c7b3` (the ref form the
  step toggle needs); the sync merge with `origin/launch-prep` is `cbca83e`. After `b9922eb` comes
  the review pass: `61165c9` (the copy substitution named on the board, the loop measured on all
  three axes, the Verified header and the design-key gate corrected) and two commits that touch
  ONLY this manifest. **The build the preview alias serves is `8043b8e`**, and since every commit
  after it changes this file alone, which is never served, the board on the alias is this head's
  board to the byte. `61165c9` is the last commit that changed a source file. The board
  is at `/design/c/home-hero?key=` (concept 3 of 4). **The round-two marker in the served HTML is
  `hhb-lab`**, the headline toggle on the stage, which round one did not have: if a surface does not
  carry it, it is not this head.
- ★ **The preview blocker is CLEARED, and it was not what the message said** (it is the whole
  wave's, not this track's). From about 22:05 on 2026-09-14 every push to the
  project answered "Deployment rate limited, retry in 24 hours", and
  `partyreel-git-lp-hero-burst-partyreel.vercel.app` went on serving ROUND ONE (`8333f9d`) while
  this branch's round-two head sat unbuilt. It is NOT a flat 24-hour freeze: the project's own
  deployment list shows builds going READY right through it at 22:04:10, 22:18:42, 22:33:19 and
  22:48:02, one about every 14 and a half minutes, so the limit is a leaky bucket that admits one
  deployment per slot across ALL branches, and eight round-two tracks are pushing into it. A push
  that misses the slot is not queued, it is refused: the refusal lands on the commit as a GitHub
  status, which is the fastest way to tell a lost race from a broken build
  (`gh api repos/willgibs/partyreel/commits/<sha>/status`). The API names it exactly:
  `api-deployments-free-per-day`, "more than 100", and the project's own list holds exactly 100
  deployments in the trailing 24 hours, so the bucket refills only as yesterday's roll out of the
  window. **How this branch got its build**, since the honest thing is to say it: two pushes were
  refused (`61165c9` at 22:47, `8043b8e` at 23:02, the second losing the 23:02:50 slot to
  `lp/hero-scan` by seconds), so the third attempt asked Vercel for a preview deployment of this
  branch's own SHA on a 5 second retry loop and took the 23:17 slot. It is the same build a push
  would have made, on the same branch alias, with no production target and no config touched, but
  it is a deploy an Agent normally gets for free and here had to ask for: **flagged for the
  Orchestrator rather than buried.** **For the Orchestrator**: the alias only needs ONE build of any
  commit carrying the round-two concept, since the manifest is not served; if the alias ever shows
  round one again, re-request rather than assume the branch is broken. The check on any surface
  claiming to be this head: `hhb-lab` in the HTML, 34 `.hhb-card` nodes, and the proposed h1 reading
  "One code, and the album fills." Missing any of the three, it is not this head.
- **Synced with launch-prep at `521ea66`** (22 commits: the light, palette, type-scale, rounding,
  floating-surfaces, media-kit, brand-voice and hero-river round-two landings). Under
  `sandbox/home-hero/` only `river.tsx` and `river.css` moved, which are another track's lane;
  `shared.tsx`, `board.tsx`, `source.tsx` and the whole board shell (`src/components/dev/`) are
  untouched, so this concept's contract is identical to round one's. The light spec's board grew a
  `candidates.ts`, which is where the LIFT numbers this concept adopts now live.
- Gates on the synced tree: typecheck ok, lint ok (0 errors; the same 7 pre-existing warnings, on
  `brand-voice/board.tsx`, `contact-form.tsx`, two album sections, `jobs.ts` and `use-flip.ts`), test
  ok (1698 in 193 files), build ok (248 static pages; this change adds no route).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/hero-burst.md`,
  `src/app/(dev)/design/sandbox/home-hero/burst.css`,
  `src/app/(dev)/design/sandbox/home-hero/burst.tsx`. **No exceptions.** `shared.tsx`, `board.tsx`,
  `source.tsx`, `scan.tsx` and `river.tsx` were read and not touched.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte changed.
- **Shell change proposed (the Orchestrator's call, not mine to make).** The home-hero board predates
  the shell's `BoardMeta` and renders its own `ConceptMeta`, whose rows are Eyebrow, Proposed copy,
  Departures and **Asks**, where "Asks" is the `assets` array. So a concept has nowhere to put the
  CHOICES Will rules on, and mine are carried in `departures` with a "Rule on," prefix per line. One
  field on `Concept` (`asks: string[]`) and one row in `ConceptMeta` would fix it for all four
  concepts. I did not touch `shared.tsx` or `board.tsx` to do it.
- **Assets requested from Will** (the concept lists these on the board too):
  1. **24 event photographs as 512 x 512 squares** · one grade, 6 to 35 KB webp each, across
     weddings, birthdays, corporate and festivals, framed tight enough to read at 90 px (a face, two
     hands, a glass, a sparkler, a first dance), never a wide room shot · replaces the 12 landscape
     stand-ins the field cycles (`FRAMES` in `shared.tsx`). **This is `docs/ASSETS.md` row 2, already
     requested for the source**; the same 24 serve the burst unchanged.
  2. **10 more as 4:5 portraits** · 512 x 640, same grade, and they may be recrops of the 24 rather
     than new photography · replaces the square box on the third of the field that already lays out
     4:5, and takes the pool to 34 so no frame is on screen twice on the desktop canvas. Guests shoot
     vertical, so a field of nothing but squares reads as a deck of cards rather than as an album.
  3. Nothing else. The QR is the real demo event's, live from `NEXT_PUBLIC_DEMO_QR_TOKEN`; no plate
     art, no lamp and no video in this concept.
- **The asks, verbatim from the board** (the four "Rule on" lines in `departures`, which is where
  this board can carry them; the Orchestrator quotes them under Waiting on Will):
  1. "Rule on, the headline step: the toggle on the stage, bottom right. lg (text-7xl at 1440,
     text-4xl at 375) leaves the burst the canvas and keeps the corridor a frame leaves the code
     through; xl (text-8xl, text-5xl) is the louder promise and costs the field about 80 px of quiet
     zone in every direction. Both are cinema steps of the one site ladder (bible 5), and the field
     re-solves for whichever is showing."
  2. "Rule on, the copy, and note that it CHANGED: the proposed h1 replaces round one's proposal,
     'One code. Every angle.', and the subhead was rewritten with it. The old line named the field
     but not what a guest gets; 'One code, and the album fills.' is the voice guide's arrival shape
     and says what the burst actually shows, one code and everything arriving
     (docs/specs/brand-voice.md). Rule on the new pair, or send the old line back. The ruled thesis
     stays the default under the board's copy toggle (bible 21)."
     **Said plainly, because the round-2 goal quoted the old line and round 1's Handoff still
     advertises it.** Round one proposed: h1 "One code. Every angle.", subhead "Guests scan it, and
     every photo and video they shoot lands in your album. No app, no account, nothing to hand out
     but the code." At this head the concept proposes: h1 "One code, and the album fills.", subhead
     "Every phone in the room finds it and uploads at full size, with nothing to install." The
     secondary action is unchanged ("Open the live album"). Bible 21 makes the copy the concept's to
     propose, so the change is legitimate; it is still a thing Will should be told rather than left
     to find by diffing two rounds.
  3. "Rule on, the centred lockup: precedent, not law. The code owns the axis here, so the type is
     centred rather than left-aligned. The first thing to overrule if the home hero should stay left."
  4. (a departure, not a choice) "Departure, bible 10 (the hero is unlit by the standing ruling): the
     frames carry a drop shadow. It is the light spec's LIFT family (docs/specs/light.md), the
     geometry and the cinema alphas verbatim, at four times the offsets, because LIFT separates two
     cards a pixel apart and these are separated by a depth axis measured in hundreds of units."
  5. (a departure, not a choice) "Departure, bible 13, decorative layer only: the frames' pre-burst
     state sits inside the reduced-motion block, so with JavaScript off and motion allowed the field
     rests around the code instead of leaving it."
- **Verified, measured rather than argued** (on the synced tree at 1440 and 375, against a
  PRODUCTION build, `pnpm build` then `pnpm start`, driven over CDP; every number below is off the
  live DOM, not off the source. Where a line was measured on the PREVIEW instead, it says so: the
  preview walk is the last bullet of this block, and nothing else in it was taken from the preview):
  - **The quiet zone**: over ~12 s of the running field on the desktop canvas, sampling every visible
    card against the h1's, the caption's, the sentence's and both buttons' real ink rects, the
    closest any frame came to any word was **31 px** (to the h1), under the taller proposed copy.
    On the phone, **27 px**. No photograph is ever under a word, in any direction, at any moment of
    the loop, with no scrim and no darkening layer anywhere.
  - **The three beats, after a Replay**: 0 frames until 420 ms (the code alone); 7 frames from 502 to
    1002 ms, growing 33 px to 97 px and out from behind the plate by 752 ms (the slip); 11, 18, 25,
    26 at 1087 to 1338 ms with the widest frame going 141 px to 406 px (the eruption); settling to 11
    to 15 with the widest between 300 px and 445 px.
  - **The field**: 34 cards at 1440 (13.2 on screen on average, median frame 217 px and widest
    448 px of the canvas; 52 percent horizontal / 27 diagonal / 21 vertical, up 47 / down 53) and 32
    at 375 (9.4 on screen, median 113 px and widest 191 px of a 375 canvas, up 59 / down 41). Six of
    the 34 have a corridor wide enough to be born behind the plate, spread across the cycle, so a
    photograph slides out from under the code every 1.2 to 2.6 seconds. Nothing is ever launched that
    is not seen: none of the golden-angle candidates are refused at 1440 (three at the xl step), and
    35 of 67 are refused at 375, where the lockup is nearly as wide as the canvas.
  - **Reduced motion** (simulated by deleting the sheet's one `no-preference` block from the live
    cascade and clearing the loop's inline styles, which leaves exactly a reduced-motion reader's
    cascade): 20 of the 34 frames stand deployed around the code, 114 px to 375 px wide, the lockup
    untouched, the h1 at opacity 1.
  - **The h1**: in the served HTML, computed opacity 1, `transform: none`, 72 px at lg and 96 px at
    xl on the desktop canvas, with no `data-mkt-cut`, `data-mkt-reveal` or `.mkt-line` on it.
  - **Performance, the goal's three dimensions, per canvas** (round two's first pass reported frame
    time only, from one dev-build sample with all four concepts looping; this is the production
    build, with the other three variants detached so the page holds ONE loop, 360 frames per
    condition, and a paused control so every number is the BURST's own share rather than the page's.
    The pause is proved, not assumed: 17 cards move in 400 ms running, 0 paused):
    - **Frame time.** Desktop 1440: frame interval median 16.7 ms, p99 16.8, worst 16.8, over 360
      frames, so not one frame was dropped; the frame's BUSY time (frame start to the task that runs
      after the browser has committed the frame) is 2.7 ms median against a 1.4 ms paused control, so
      the burst's own share of a 16.7 ms frame is **1.3 ms, 8 percent of the budget**. Phone 375:
      identical interval, busy 2.7 ms against a 0.9 ms control, **1.8 ms**, the difference being that
      the phone canvas rasterises at 1:1 while the desktop stage is zoom-fitted to 0.69.
    - **Paint.** Split off the busy time: script 1.9 ms vs 1.3 control (0.6 ms of loop) and the
      RENDER TAIL, style plus layout plus paint plus composite, 0.8 ms vs 0.1 (0.7 ms). Chrome's own
      counters over the same window agree and add the fact that matters: **LayoutDuration 0.0 ms and
      LayoutCount 0**, running or paused, at both canvases. The loop writes only `transform`,
      `opacity` and `z-index`, so it never touches layout; the whole cost is 362 style recalcs in 362
      frames, 87 ms, **0.24 ms a frame**. Painted area, sampled every frame for 4 s: the field covers
      a median 0.81 of the canvas at 1440 (p90 0.94, worst 1.03) and 0.60 at 375 (p90 0.77, worst
      0.85), so the album never costs even one full canvas of overdraw.
    - **Layer count.** The compositor's real layer tree, each layer resolved back to its owning node:
      **47 layers at 1440, of which 34 are `.hhb-card`**, and 44 at 375, of which 32 are. One layer
      per card, which is the pool size, so nothing is promoted twice and nothing else in the concept
      is promoted at all. Measured whether it is a CHOICE: overriding `will-change: auto` on every
      card leaves the count at 34 and the frame identical (2.8 ms median either way), because a
      `matrix3d` transform promotes on its own. So the declaration buys a stable layer rather than an
      extra one, and there is no layer here to cut.
    - **What was cut, and what the measurement says it saved.** The acceptance walk refuses a
      direction before it is DOM: at 375, 35 of 67 candidates at the lg step and 43 of 75 at xl,
      which is more than half the compass in layers, nodes and image requests that round one would
      have paid for. The loop skips a style write that would write what is already there (about a fifth of the
      writes over a cycle, and the z-index write is the one that re-sorts a stacking context). Eager
      loading is confined to the frames seen in the first 2.6 s. Nothing left in the loop reads the
      DOM, which is why LayoutCount is 0.
  - **The served HTML** (from the production build's own server): 34 `.hhb-card` nodes with 34
    `--hhb-rest` and 34 `--hhb-rest-o` declarations, so the deployed field is in the markup and a
    reduced-motion reader, a crawler and a cold paint all get the album standing still around the
    code rather than an empty stage; 4 `hhb-lab` hits, the round-two marker; 1 hit of the proposed
    h1 and 0 of round one's.
  - **The design-key gate, re-checked after all** (the earlier note said it could not be, because
    `requireDesignKey` is open in development and only 404s in a production build): a local
    production build serves `/design/c/home-hero` as **404** with no key and **200** with
    `?key=`, so the lab is closed on a built tree. This round changed nothing about it.
  - No em-dash, no `font-mono` and no `MonoCaption` in either owned file.
  - The headline toggle flipped lg to xl and back three times inside one mount: 11, 12, 11 frames in
    the air, nothing frozen (the reason the card refs take React 19's cleanup form).
  - **THE PREVIEW, WALKED** (the light-QA line the first handoff had to leave undone). Deployment
    created 23:17:14 and READY 23:19 on 2026-09-14 at `8043b8e`, on
    `partyreel-git-lp-hero-burst-partyreel.vercel.app`. Fetched cache-busted and served fresh
    (`x-vercel-cache: MISS`, `age: 0`): 4 `hhb-lab` hits, 34 `.hhb-card` nodes, the proposed h1 in
    the markup and round one's only inside the copy ask that quotes it.
    - **1440**: the burst's stage measures 1437 x 927, 34 cards with 14 on screen at the instant of
      the probe, the h1 at 72 px with computed opacity 1 and `transform: none`, the lg / xl toggle
      live at the bottom right, and the page has **0 px of horizontal overflow**.
    - **375**: driven as a real 375 x 760 device at dpr 2, not just a narrow window. The pool
      re-solves to 32 cards, the stage measures 373 x 758, the h1 to 36 px, the lockup and the code
      hold the centre with the field around them, and again **0 px of horizontal overflow**. The
      same composition at both canvases, which is the claim this variation makes.
    - **Reduced motion** (`prefers-reduced-motion: reduce` emulated for the load, so the concept's
      own guard runs rather than a simulation of it): the field stands deployed around the code,
      the loop writes **0 inline styles** and **0 of 34 cards change over 1200 ms**, and the h1 is
      at opacity 1. The board is a still photograph of the album, which is what the sheet promises.
    - The design-key gate holds on the preview as well as on a local production build:
      `/design/c/home-hero` is **404** there without `?key=`.
- **A finding against the river, for Will rather than for me** (bible 22, and the round's "read the
  other variations"): the river parts its stream around the type by holding a card's inner edge on
  the block's wall, instead of gating it. Applied here that would let EVERY direction be born at the
  plate rather than only the ones with a corridor, which is strictly more of what the burst argues.
  I did not take it, because on a radial field an x-only parting turns every vertical lane into an
  S-curve around the headline, which is the river's own look: the burst would converge on the river
  and the board would lose an axis. It is a real choice and it is Will's, not mine.
- **Look at first**: the first second and a half after a Replay, and specifically the moment a
  photograph slides out from under the code (about every 1.2 s once the field is running). That is
  the whole of what round two changed: round one put a 110 px hole around the object, so the album
  never visibly left it. Then flip the headline toggle at the bottom right of the stage, because it
  is the one choice that changes the composition rather than the styling, and the field re-solves
  around whichever step is showing. Then the phone, which is the claim this variation makes against
  the source: the same lockup, the same code at the exact centre, the burst re-solved for a canvas
  that is tall rather than wide (the deep lanes are vertical there, and more than half the compass is
  refused because the lockup is nearly as wide as the screen).

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). Round two of the burst made the code the emitter
rather than a hole in the field: the QR lost its keep-out box, so a frame is now born behind the plate
that paints above it and slides out from under it, which is the one thing round one never showed.
Travel and size moved onto ease-out curves in world units and the perspective term was left to supply
the acceleration, so the big moments happen on the canvas instead of past the edge. Birth depth, gain
and reach became a function of the direction: the axis a canvas has room on takes the near-camera
flights, the cramped one the far field, which is what lets one description compose 1440 and 375. The
pool is built by acceptance, so a direction this canvas and this lockup cannot carry is never launched
(none refused at 1440, more than half at 375) and the field re-solves when the lockup changes, which
is what makes the headline step a toggle on the stage. A 260 ms hold turned the opening into three
beats; the shadow became the light spec's LIFT family at four times the offsets; the proposed h1 is
now "One code, and the album fills." in place of "One code. Every angle.", subhead rewritten to match.
