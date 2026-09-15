---
track: hero-river
status: open
cut: "<filled at boot: the origin/launch-prep SHA you branched from>"
merged_round_1: "46138e6"
preview: true           # Will reviews this concept on its preview as it builds
owns:
  - src/app/(dev)/design/sandbox/home-hero/river.tsx
  - src/app/(dev)/design/sandbox/home-hero/river.css
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

# lp/hero-river

## Round 2 (Will, 2026-09-14: "another iterative round on all active tracks before review")

**Round 2 (the goal).** The river has the origin at the top and the page as the album; now make it the
best version of itself against Will's criterion (a stranger's first read is "if I scan this, I get
all of these"). (1) **The Caption line above or under the plate** as a toggle on the board, both
built well, so Will rules it with both in view (you built the brief's version once; make it as good
as it can be before it loses). (2) **The first two seconds** tuned: the code alone, then the pour;
the parting kept a geometric guarantee as the frames grow. (3) **The count** under the CTAs: keep it
flagged as a stand-in, but design the line so it earns its place (what it says, where it sits, how it
ticks), and say what the wiring needs (`demoCount`). (4) **The phone**: the band between the code and
the headline is a third of the screen; make the phone composition the strongest of the four, since a
vertical stream is this variation's home ground. (5) **Portraits**: about 45 percent of the stream
runs portrait; the portrait asks are rows 3 and 12; meanwhile crop the stand-ins with intent. (6)
**Performance**: measure the loop at both canvases and cut what does not earn its cost. (7) Read the
scan and the burst (read-only) and take what serves the river. (8) Tighten the departures to the
ones Will must rule on. Keep the closed-form loop; keep the h1 at paint and media at 100 percent.

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

**Goal.** The river, variation 4 of the home-hero board's third round (Will, 2026-09-14: three more variations off the source). Your axis: THE ORIGIN AT THE TOP AND THE PAGE AS THE ALBUM. The source holds the code at the centre of a horizontal corridor; the river moves the code to the top of the composition, where an eyebrow sits (the code IS the eyebrow, with one Caption line under it), and the album pours DOWN out of it: a vertical stream of frames, born at the code, flowing toward the bottom of the hero and dissolving at its edge, so the page reads as the album that the scan started. The h1 and the subhead sit beside or over the cleared centre of the stream (frames part around the type, never under it; no darkening layer ever), the CTAs below. Phone-first: a vertical stream fits 375 natively, and the desktop composition is the phone's widened (two or three lanes of frames instead of one). The loop is a pure function of elapsed time (the source's lesson), recycling from a modulo, frames fading in at the code. Supporting elements clarify: the Caption line under the code, a count that reads like a live album (proposed), the CTAs, your copy proposal. Media at 100 percent.

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

**Verify on.** partyreel-git-lp-hero-river-partyreel.vercel.app, `/design/c/home-hero?key=` (the key is
`DESIGN_PREVIEW_KEY` in `.env.local`): your concept at Desktop and Phone 375, ruled and proposed
copy, Replay, reduced motion (the rest state), the h1 present at opacity 1 off the DOM.

### What your variation shows

Desktop: the QR top-centre at scanning size under the header's line, the Caption under it, the
stream of frames pouring down in two or three lanes with the type in the cleared centre (the h1
large, the frames parting around its measure), the CTAs low; the stream dissolves at the hero's
bottom edge. Phone: one lane, the code at the top, the type in the clearing, the CTAs at the
bottom. Reduced motion: the stream deployed at rest. Replay: the pour from the code. Departures to
flag: the code leaving the exact centre (the source's argument was the still centre; yours is the
origin at the top, say why), a lamp if any, the lockup's alignment. The asks: the 24 squares
(`docs/ASSETS.md` row 2); a portrait set if the lanes want tall frames (name the count and size).

### The rules of this wave (every track)

- **The shell is shared and registered.** Never edit `board.tsx`, `shared.tsx`, `board.css`,
  `source.tsx`, `touchpoints.ts` or `rules/bible.ts`; never CHANGELOG, STATUS, ROADMAP, PROGRAM,
  CLAUDE, AGENTS, `docs/ASSETS.md`; ask in Handoff.
- **Sheets.** Keyframes under your prefix `hhv-` only (`keyframe-uniqueness.test.ts` reads every
  sheet under the lab; `hhs-` is the source's, `hh-` the board's); a sheet never imports tailwindcss;
  `glow-contract.test.ts` pins the BorderBeam and GlowFilter counts across `src`, so compose `<Glow>`
  only if you light anything (and flag it). No em-dashes anywhere.
- **Sync** `origin/launch-prep` only per PROGRAM.md (before handoff if it moved; mid-round only when
  `docs/tracks/orchestrator.md` announces a landed change to one of your `reads`).
- **Handoff:** fill Handoff and Record below, `status: handed-off`, push; the chat report is one
  line, "handed off at <sha>".

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- **none.** No production byte moved, and no owned fact belongs in a system doc while the concept is
  a lab candidate Will has not ruled on.

## Deferred (ROADMAP one-liners, bucket named)

- Home hero (the wiring round, if the river is ruled): the shell hands a concept `qrUrl` and nothing
  else, so a hero with a live album count needs a `demoCount` beside it (a build-time count on the
  demo event, or the RPC the guest page already uses); the 248 stand-in must not ship. Production
  also wires the loop to `useAmbientPause` rather than the stage's `data-paused`, the same line the
  source filed.
- Design system: record the mask-composite landmine in `docs/systems/design-system.md` when a
  production surface next needs a two-axis dissolve. `mask-image: a, b` with `mask-composite:
  intersect` does NOT intersect in Chrome: the last layer's operator composites it against
  transparent black, so the pair resolves to the union and the dissolve silently does nothing (it ate
  both the side and the bottom fade here until the masks were split across two nested elements, one
  mask each, which is unambiguous in every engine and costs one div).

## Handoff (round 1)

- Head `2fcf926` plus this commit (a manifest cannot name its own SHA); `2fcf926` is the SHA the
  preview was verified at. Pushed; preview
  `https://partyreel-git-lp-hero-river-partyreel.vercel.app`, the board at
  `/design/c/home-hero?key=` (concept 4 of 4).
- Synced with `launch-prep` at **`3d40173`** (it had moved 68 commits: kill-mono, palette,
  type-scale, floating-surfaces, media-kit, light). `git merge origin/launch-prep` at `6eab1ae`, no
  conflicts, and the gate re-ran on the merged tree. The concept uses the `Caption` atom and no mono
  face, so the two-faces policy that landed with kill-mono passes untouched.
- Gates on the synced tree: typecheck ok, lint ok (0 errors; the 7 warnings are the pre-existing
  ones on `contact-form.tsx`, `review-switch.tsx`, two feature sections, `jobs.ts` and
  `use-flip.ts`), test ok (1697 in 193 files), build ok (248 static pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/hero-river.md`,
  `src/app/(dev)/design/sandbox/home-hero/river.css`,
  `src/app/(dev)/design/sandbox/home-hero/river.tsx`. **No exceptions**: the two owned files and this
  manifest. `shared.tsx`, `board.tsx` and `source.tsx` were read whole and not touched; the shell had
  everything the concept needed except the demo album's count (see the asks).
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte moved.
- **Verified on the preview at `2fcf926`** (the alias was polled to READY by SHA before any check):
  - The gate: 404 with no key, 404 with a wrong key, 200 with the key.
  - The server's own HTML carries 16 `.hhv-card` nodes and 16 `--hhv-rest` declarations, so the
    deployed stream is in the markup: reduced motion, a crawler and a cold paint all get the album
    standing at its steady-state spacing rather than an empty hero.
  - The h1 is in the HTML at computed opacity 1, transform none, with no `data-mkt-cut` /
    `data-mkt-reveal` / `.mkt-line` on any h1 on the page (bible 13).
  - Desktop 1440 and Phone 375, ruled and proposed copy: the stream runs, the code holds the top,
    and **the type is clear of every photograph at both widths under both copies**. That last one is
    measured, not eyeballed: a probe read the rendered ink box of the h1, the subhead, both CTAs and
    the count and checked each against the declared corridor (|x| <= 400, y 418..850 on desktop;
    |x| <= 166, y 378..756 on the phone). All inside, all four combinations. The first run of that
    probe is what found the ink overshoot now in the code: at leading 1.02 the h1's glyphs stand
    ~9 px above its layout box, so the corridor is grown by 14 px at both ends.
  - Replay: the stage remounts with fresh nodes, the inline transforms are gone and the computed
    state is `matrix(0, 0, 0, 0, 0, 0)` at opacity 0, which is the pour's first frame. The
    `--hhv-rest` declarations survive the remount.
  - Reduced motion: simulated by deleting the `no-preference` block from the live sheet and clearing
    the loop's inline styles, which leaves exactly the cascade a reduced-motion reader gets. The
    stream stands fully deployed on both canvases.
  - No em-dash anywhere in the served page.
- **Assets requested from Will:**
  1. **24 event photographs as 512 x 512 squares, one grade, 6 to 35 KB webp each**, across
     weddings, birthdays, corporate and festivals · already `docs/ASSETS.md` row 2 (the source's
     ask); the river takes the same set and needs no new row · replaces the 12 landscape stand-ins
     in `FRAMES` (`shared.tsx`). The two arms carry disjoint halves, so 24 makes every frame in the
     stream unique; with 12 stand-ins four are doubled.
  2. **12 event photographs as 4:5 portraits, 720 x 900, one grade, 15 to 60 KB webp each**, from the
     same shoot as the squares · about 45 percent of this stream runs portrait, because that is what
     a guest's phone shoots and a vertical stream reads best when the shapes vary; the landscape
     stand-ins crop hard to 4:5 today · replaces the portrait cards (`wf` 0.8) in `CARD_POOL`. This
     is the one NEW row; `docs/ASSETS.md` row 3 parked a 36-frame set whose portrait third would also
     serve, so it may be cheaper to unpark that.
  3. **Framed tight enough to read at 110 px** (a face, two hands, a glass, a sparkler, a first
     dance) · a frame is read here between 100 px at the code and 340 px at the bottom edge · the
     same note the source filed, and still the single biggest lift available to the concept.
  4. **The demo event's live media count, as a number the hero can render** · the shell hands a
     concept `qrUrl` only, so the count is hard-coded · replaces `COUNT_BASE`, the 248 stand-in.
     Not a picture: it is a shell change (a `demoCount` prop beside `qrUrl`, from a build-time count
     on the demo event or the RPC the guest page already uses), and it is the one thing here that
     must not ship as drawn.
- **The departures, verbatim from the concept:**
  1. The code leaves the exact centre. The source's argument was the still centre of a moving album, and it is a good one; this variation trades it for causality read top to bottom. A code in the middle of a composition is an object the page is arranged around, and a stranger reads it as a thing to scan for more information. A code at the TOP, in the eyebrow's slot, with the album falling out of it, is a beginning: everything below it is what the scan produced, which is the sentence Will asked the hero to say. The stillness survives the move, and nothing about the plate animates.
  2. Precedent, not law: the lockup is centred rather than left-aligned, because the code owns the page's axis and the stream is symmetrical about it. This is the source's departure too, and the first thing to overrule if the home hero should stay left. Left-aligning costs the symmetry of the two arms, not the mechanism: the corridor's wall simply moves.
  3. Bible 13, decorative layer only: the stream's pre-pour state (every frame collapsed at the code) sits inside the reduced-motion block, so with JavaScript off and motion allowed the stream rests at the code and the hero is the code, the type and the CTAs alone. Putting it in an effect instead would paint the album deployed and then snap it back to the code. The h1, the code, the caption, the subhead and the CTAs are plain markup and never gated, and reduced motion gets the stream fully deployed.
  4. The brief put the Caption line UNDER the code and it is above it here, which is the one place this variation argues with its own brief. A line under the plate sits about 80 px below the point every frame is born at, so every frame has to escape sideways by roughly its own width before it has fallen a card's height: frames then appear BESIDE the code rather than sliding out from behind it, which is the single read the concept exists for (built it that way first, and that is exactly how it looked). Above the plate the line still labels the code, the eyebrow is still the object, and the stream leaves the plate straight down. Overrule it and the fix is a much smaller plate or a much shorter line, not a longer ramp.
  5. The count under the CTAs is a STAND-IN figure that ticks once per launch (248 and climbing). It is the supporting element that says the album is filling right now, and it is the one thing here that must not ship as drawn: before this goes near production it reads the demo event's real media count, or it goes. Flagged on the board rather than in a footnote, because a number nobody can stand behind is a claim and not a placeholder.
- **Look at first**: the first two seconds on Desktop. The code sits alone for about half a second,
  then the whole album pours out from behind it in one beat and never stops. Then three calls that
  are all yours: whether the code belongs at the top at all (departure 1, the one real argument with
  the source); which side the Caption line sits on (departure 4); and whether the live count earns
  its line under the CTAs (departure 5), because it is the element that says the album is filling
  right now and it is also the only fabricated thing on the board. After that, the phone: the album
  there is the band between the code and the headline, roughly a third of the screen, and the arms
  leave the frame where the words begin because a 375 canvas has no room beside a full-measure h1.

## Record (round 1)

Merged into `launch-prep` at `<sha>` (2026-09-14). The river, variation 4 of the home-hero board's
third round, replaced its placeholder. It moves the source's code out of the exact centre into the
slot an eyebrow occupies, at the top of the page, and pours the album down out of it: frames are
born behind the plate, fall on a gravity curve, grow as they come, part around the headline and
dissolve through the hero's bottom and side edges, so the page reads as the album the scan started
rather than a page with an album in it. The loop is the source's lesson kept exactly: a card's
progress is a closed form of the clock and fall, scale and lateral position are all that one number,
so there is no state, no timer and no per-card bookkeeping. The parting is the new idea: while a
card's box could overlap the lockup, its projected inner edge is held on the corridor's wall, which
makes the clearing a geometric guarantee (verified against the rendered ink of the type at both
canvases and both copy toggles) and keeps the corridor a constant width as the frames grow. The
deployed stream is the rest state, written into the server's HTML as per-card custom properties;
the pre-pour frame lives inside the reduced-motion block so the pour cannot flash.

## Handoff (round 2)

- Head <sha>, pushed; preview partyreel-git-lp-hero-river-partyreel.vercel.app
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will: none, or one bullet per asset: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will): ...
- Look at first: ...

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
