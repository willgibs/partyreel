---
track: hero-river
status: integrated
cut: "1cf4cea"
merged: "8a55535"      # the branch head merged into launch-prep
merged_round_2: "047d269"
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

**Rulings in force.** The bible on `/design/library/rules` (second edition), above all 1 (media is the color:
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

**Verify on.** partyreel-git-lp-hero-river-partyreel.vercel.app, `/design/lab/home-hero?key=` (the key is
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

### Binds (every track)

**Binds.** The bible, the contracts of every component under a path you own, and the policies
(`/design/library/policies`); everything else is precedent (`docs/design/README.md#what-binds-you`,
rendered at `/design/library`). Shell changes are asked for in the Handoff and announced in
`docs/tracks/orchestrator.md`; never edit `src/components/dev/`, `src/components/lab/`,
`touchpoints.ts`, `rules/bible.ts`, another track's files, or CHANGELOG, STATUS, ROADMAP, PROGRAM,
CLAUDE, AGENTS, `docs/ASSETS.md`, `docs/design/rulings.md`, `docs/reviews/`. Light QA (Will,
2026-09-14): the board at 1440 and 375 in a foreground tab, reduced motion honoured, the gate green
on the synced tree.

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
  `/design/lab/home-hero?key=` (concept 4 of 4).
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

- Head `b72d56b` plus this commit (a manifest cannot name its own SHA); `b72d56b` is the tree every
  check below ran against. Pushed. The board is `/design/lab/home-hero?key=` (concept 4 of 4).
  **Marker for the round-two board: `hhv-plate`**, the printed card's class, which exists nowhere in
  round one; `--hhv-fade-b0` marks anything after the first round-two commit and
  `--hhv-lab-scale` marks this head.
- ★ **BLOCKER FOR THE WHOLE WAVE, not for this track alone: Vercel is deployment rate limited.**
  Every push after `6915bd5` returns the GitHub commit status
  `Vercel: "Deployment rate limited - retry in 24 hours."`
  (`https://vercel.com/partyreel?upgradeToPro=build-rate-limit`), and NO deployment record is created
  at all, so this is not a build that failed, it is a build that was never started. Nine tracks
  pushing previews in one afternoon is what spent it. **The consequence to carry:** the alias
  `partyreel-git-lp-hero-river-partyreel.vercel.app` is frozen at `6915bd5`, which is round two's
  FIRST commit. It has the printed card, the held beat, the settled count, the crops and LIFT; it
  does NOT have the rebuilt phone, the two-stop dissolve, the shorter desktop ramp, the loop's cut,
  the phone measure or the chip's scale. Every other track's `lp/*` alias is frozen the same way at
  whatever it last built, and `launch-prep` cannot deploy either. Nothing here needs a rebuild to be
  reviewed once the limit clears; the head is pushed and the gate is green on it.
- **What the live pass ran against instead, and why it is not a downgrade.** `pnpm build` and then
  `pnpm start` on the worktree, which serves the same production output the preview would, at the
  same code. The one thing it cannot exercise is Vercel's own edge, and this board touches no route
  handler, no auth, no R2 and no Stripe: it is a static lab page behind the `DESIGN_PREVIEW_KEY`
  gate, and that gate was tested on the production server (404 with no key, 404 with a wrong key,
  200 with the key). Everything below was measured there unless it says otherwise.
- Synced with `launch-prep` at **`4b035c1`** (it had moved one commit,
  `docs(design-system): the candidate block, recorded beside the tuner`, which touches only
  `docs/systems/design-system.md` and nothing this track reads). `git merge origin/launch-prep`, no
  conflicts, and the whole gate re-ran on the merged tree.
- Gates on the synced tree, re-run at this head: typecheck ok, lint ok (0 errors; the 7 warnings are
  the pre-existing ones on `contact-form.tsx`, `review-switch.tsx`, `album-fill-grid.tsx`, `jobs.ts`
  and `use-flip.ts`), test ok (1698 in 193 files), build ok (248 static pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/hero-river.md`,
  `src/app/(dev)/design/sandbox/home-hero/river.css`,
  `src/app/(dev)/design/sandbox/home-hero/river.tsx`. **No exceptions**: the two owned files and this
  manifest. `shared.tsx`, `board.tsx`, `source.tsx`, `scan.tsx` and `burst.tsx` were read and not
  touched; `docs/specs/palette.md`, `light.md`, `type-scale.md`, `brand-voice.md` and `media-kit.md`
  were read as inputs and not touched.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte moved.
- **Shell changes the Orchestrator should carry** (neither blocks the board, both are one line):
  1. **Where the line sits belongs on the BOARD, not in the stage.** The ruling this concept most
     needs is a toggle, and `board.tsx` owns the board's toggles, so the chip is drawn inside the
     stage at the top left with a `hhv-lab` class and an explicit "lab only" comment. It is the one
     thing on the canvas that is not the composition. If a second concept ever wants a per-concept
     switch, the clean shape is an optional `switches` field on `Concept` that `board.tsx` renders
     beside the Copy toggle; until then this chip is the cheapest honest answer and it leaves with
     the ruling.
  2. **`demoCount` beside `qrUrl`.** The shell hands a concept the demo's URL and nothing else, so
     the album's count is hard-coded here. Same line the source and the scan filed.
- **"Apply to the site": not applicable, and deliberately so.** This concept's candidate is a
  composition, not a token block: there is no CSS paste whose selectors would mean anything on `/`
  or `/pricing`, and offering one would be the light or palette board's paste wearing this track's
  name. Its ruling lands as a hero component in the wiring round. The one thing here that IS a
  token-shaped proposal (the cards' overlap cue) is the light board's LIFT, adopted rather than
  re-proposed, so that paste is `docs/specs/light.md`'s to offer.
- **Assets requested from Will (no new rows; round one's two asks are already in `docs/ASSETS.md`):**
  1. **24 event photographs as 512 x 512 squares, one grade, 6 to 35 KB webp each**, framed tight
     enough to read at 110 px · `ASSETS.md` row 2, unchanged: the two arms carry disjoint halves, so
     with 24 every frame in the stream is unique where the 12 stand-ins double four · replaces the
     12 landscape stand-ins in `FRAMES` (`shared.tsx`) and retires `CROP` in `river.tsx`.
  2. **12 event photographs as 4:5 portraits, 720 x 900, one grade, 15 to 60 KB webp each** · row 12,
     unchanged; the portrait third of row 3 or row 7 serves instead and may be cheaper to unpark ·
     replaces the portrait cards (`wf` 0.8) in `CARD_POOL`.
  3. **The demo event's live media count**, as a number the hero can render · not a picture, a shell
     change (see above) · replaces `COUNT_TO`, the 248 stand-in.
  4. **Not an ask, a wiring idea worth Will's ruling**: if this hero ships, the frames in the stream
     should BE the demo event's own media (row 5, the curated folder). The count is then literally
     the album the stream renders, and the hero stops illustrating the product and starts being it.
- **The asks, verbatim from BoardMeta** (this board renders them under "Asks" from `concept.assets`;
  the Orchestrator quotes them under Waiting on Will):
  1. "24 event photographs as 512 x 512 squares, one grade, 6 to 35 KB webp each, framed tight enough
     to read at 110 px · ASSETS row 2, already requested and unchanged: the two arms carry disjoint
     halves, so with 24 every frame in the stream is unique, where the 12 landscape stand-ins double
     four of them · replaces the 12 landscape stand-ins in FRAMES (shared.tsx) and retires the
     per-frame crop table in river.tsx."
  2. "12 event photographs as 4:5 portraits, 720 x 900, one grade, 15 to 60 KB webp each, from the
     same shoot as the squares · ASSETS row 12, already requested and unchanged; the portrait third
     of row 3 or row 7 would serve instead and may be cheaper to unpark · replaces the portrait cards
     (wf 0.8) in CARD_POOL, which are cropped out of landscapes today."
  3. "Nothing else is a picture. The one ask left is the shell's: the demo event's live media count,
     as a number the hero can render (a demoCount prop beside qrUrl, from a build-time count on the
     demo event or the RPC the guest page already uses) · replaces COUNT_TO, the 248 stand-in, and
     COUNT_FROM becomes that count minus the arrivals shown."
  4. "One idea for the wiring round rather than an ask: if this hero ships, the frames in the stream
     should BE the demo event's own media (ASSETS row 5, the curated folder). The count is then
     literally the album the stream renders, the line under the CTAs becomes true rather than
     plausible, and the hero stops illustrating the product and starts being it."
- **The rulings, from the board's Departures** (each is one word from Will):
  1. **The line: on the card, or above the plate.** The chip at the top left of the stage. Round one
     said a line under the plate was impossible; round two says that was true of a FLOATING line and
     false of a PRINTED one. On the card is the default because it is the better object.
  2. **The code at the top rather than at the exact centre**, which is the concept's one real
     argument with the source.
  3. **The count under the CTAs: keep it or drop it.** It is the evidence for "See a real album", and
     it is the only fabricated thing on the board.
  4. **The centred lockup**, precedent and not law, shared with the source.
- **What this board took from the first wave** (said on the board, in the last Departures line): the
  light spec's LIFT at its cinema alphas carries the cards' overlap, replacing a one-off shadow; the
  voice guide's hero shape and its rule on absences rewrote the proposed h1 and subhead (one absence,
  not two); the media kit's "readable at 120 px" test is what the asks are written against. The
  type-scale board's finding that this hero invented `leading-[1.02]` locally is real and recorded:
  the h1 keeps it until a ladder is ruled and then takes the ruled leading for its step.
- **Verified at `b72d56b`**, against the PRODUCTION build served locally (see the blocker above):
  - **The clearing is still a geometric guarantee, measured not eyeballed.** A probe read the
    rendered INK box of the h1 (grown 10 px), the subhead, both CTAs and the count, and tested every
    visible card's live rect against all five, every frame, for 150 frames in each of the EIGHT
    combinations (2 canvases x 2 copy modes x 2 line placements). Worst overlap: **0 px, in all
    eight.** The frames grew, straightened and parted throughout.
  - **The held beat:** after Replay the first frame crosses 5 percent opacity at **803 ms** (a 620 ms
    hold plus the growth), so the code and the words stand alone for four fifths of a second. The
    count holds at 241 until the pour and ticks with the arrivals.
    ★ **This claim was FALSE on the Desktop canvas from round two until `2ed6cba`**, and it is left
    standing here with this marker rather than rewritten, because it is what round two reported. The
    first frame did cross 5 percent at 803 ms, but sixteen OTHER frames stood at the bottom of the
    hero through the whole hold. Round three finding 5 has the measurement and the fix.
  - **The line placement survives Replay** (the board remounts the stage, so the choice lives in a
    module store rather than in component state), and the QR's CENTRE is pinned to the same y in both
    placements: 141 on the desktop, 97 on the phone, so the toggle moves one line and nothing else.
    The printed card measures 164 x 168 on the desktop and 164 x 140 on the phone.
  - **The served HTML** carries 16 `.hhv-card` nodes, 16 `--hhv-rest` declarations, 16 `--hhv-pos`
    crops, the printed card, and the count's SETTLED figure (248) as the markup, with the ticking 241
    hidden outside the reduced-motion block. The lab gate: 404 with no key, 404 with a wrong key, 200
    with the key. No em-dash, no `font-mono`, no `data-mkt-cut` / `data-mkt-reveal` / `.mkt-line` on
    any h1.
  - **Reduced motion**, read off the MARKUP rather than off the running page, which is the honest
    way: a reduced-motion reader's effect returns before it writes a single inline style, so what
    they get is exactly the 16 `--hhv-rest` transforms the server printed. Parsed from the served
    HTML: the 16 rest transforms spread from dy 0 to dy 990 (the whole fall) at scales 0.32 to 1.0,
    15 of the 16 at an opacity above 0.05 (the sixteenth is the frame still inside the code, which is
    the steady state), the count's settled 248 is the visible span and the ticking one is display
    none outside the `no-preference` block. On the running page the h1 measures opacity 1 with
    transform none. Deleting all 27 `no-preference` blocks from the live sheets leaves the stream
    standing rather than collapsed.
  - **Performance, measured at both canvases.** With all FOUR concepts on the board running, rAF
    deltas over 200 frames: median 16.7 ms, p99 18.7 ms, max 18.7 ms, so not one frame was dropped;
    the river alone and the river with its stream removed measure the same, which is the honest
    answer (the stream is not the cost). `long-animation-frame` reports blockingDuration 0 with a
    render phase of 2.4 to 2.8 ms. The 16 promoted layers are ~7.1 MB at the desktop canvas, and a
    card's DOM box is its LARGEST visible size, so nothing is rasterized above 1:1. The one cut the
    pass earned: the loop now skips any card that has fallen past the point the bottom dissolve has
    already taken to zero, which on the phone is roughly a third of the flight, plus an opacity write
    only when it changes.
- **Look at first**: the FIRST TWO SECONDS on Desktop, which is now a designed beat rather than an
  accident (the code and the words alone, then the album pours). ★ Not true on the Desktop canvas
  as round two shipped it; see round three finding 5. Then the chip at the top left, twice:
  the code as a printed card with its line, and the code as a bare plate with the line floating above
  it. That is the ruling. Then the phone, where the composition is new: at 375 a full-measure h1
  leaves no corridor beside it, so the album pours out of the code and DISSOLVES into the words
  rather than being flung aside, and the frames start large because there are only 200 px of band to
  grow in. Last, the count under the CTAs: it settles at 248 instead of climbing forever, and it is
  the only fabricated thing on the board.

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). Round two of the river answered its own round-one
departure: the line CAN sit under the code, because putting it inside the white object turns the plate
into the card an event actually puts on a table, and the stream is born behind that card instead of
having to bow around a floating line. Both placements are on the stage under one chip, so the ruling
is made with both in view. The pour became a designed beat (the code and the words stand alone for
620 ms, then the album falls), the count stopped climbing forever and now settles at its figure with
the settled number as the state at rest, frames straighten as they land, and the twelve landscape
stand-ins are cropped off the photograph rather than centred. The phone was rebuilt rather than
retuned: a full-measure h1 at 375 leaves no corridor beside it, so the bottom dissolve took a second
stop and the album now pours out of the code and dissolves into the words, with frames that start
large because the band is only 200 px deep. The clearing stayed a geometric guarantee, re-measured at
zero overlap across all eight combinations of canvas, copy and line placement. The cards' overlap cue
became the light board's LIFT at its cinema alphas, and the copy proposal was rewritten against the
voice guide.

## Handoff (round 3)

- **Head: this commit** (a manifest cannot name its own SHA), on top of `5e7d58b`, the second
  `launch-prep` merge. The round's last commit of SOURCE is **`2ed6cba`**, and the code is four
  commits in all: `274dea4` built it, `d9040aa` fixed the dead line the first read-only review
  found, `3a4ceb3` answered the second review (the phone's rest-state count), and **`2ed6cba`
  answers the third: the held beat did not hold on the desktop.** `4aea15d` and `5e7d58b` merged
  `launch-prep`; every other commit in the round is this manifest.
  The whole gate was re-run on `2ed6cba`, and **every measurement that depends on the clock actually
  running was re-taken at that head**, in a real foreground page rather than off a stepped clock.
  Which those are, and what stands from `d9040aa` on code the diff proves identical, is named under
  Verified below.
  Pushed. The board is `/design/lab/home-hero?key=` (concept 4 of 4).
  **Marker for the round-three board: `hhv-delta`**, the stream wrapper's second class, which exists
  in no earlier round; the absence of `hhv-lab` (the cut chip) marks it too.
- ★ **The preview alias serves round TWO, and that is not this track's to fix.** Every push from
  this branch since `274dea4` has been refused by Vercel with
  `Vercel: "Deployment rate limited, retry in 24 hours."` and no deployment record is created at all,
  so `partyreel-git-lp-hero-river-partyreel.vercel.app` still serves `6915bd5`, round two's first
  commit. The ceiling is the PROJECT's daily deployment cap, spent by eight tracks pushing previews
  on one afternoon, and it refills as a leaky bucket rather than lifting at a fixed hour
  (`docs/tracks/media-kit.md` round two; `lp/hero-burst` `8043b8e`): a slot opens about every 14.5
  minutes and whichever branch pushes first inside that window takes it, so a push is an entry in a
  race and not a deploy. This branch entered it five times and lost every one, the last by five
  seconds. Round three's first draft of this bullet took the message at its word and called it a
  standing 24 hour freeze, which was wrong and is corrected here. **No further attempt was made this
  round and the Vercel API was not called**, this third pass included, which was also its explicit
  instruction: the cap still stands, so verify locally and say so, which is the next bullet. Nothing about the build is at fault, and the alias serves this head
  the moment any push from this branch wins a slot. One line tells Will which round an alias is
  serving: `curl -s "<alias>/design/lab/home-hero?key=" | grep -c hhv-delta` returns 1 on round three
  and 0 on round two, where `grep -c hhv-lab` returns 1 instead.
- **How the board was verified instead: a local production build, at BOTH canvases.** `pnpm build`
  then `pnpm start` in the worktree, which serves the same production output the preview would at
  the same code, and the board opened there at `/design/lab/home-hero?key=` and driven at **Desktop
  1440 and Phone 375**: Replay, the held beat, the clearing, the dead line and the steady state at
  this head; reduced motion and the copy toggle at `d9040aa`, on identical executable code. The one thing this cannot
  exercise is Vercel's own edge, and this board touches no route handler, no auth, no R2 and no
  Stripe: it is a static lab page behind the `DESIGN_PREVIEW_KEY` gate, and that gate was tested on
  the production server at this head (404 with no key, 404 with a wrong key, 200 with the key).
  **The method, and what it cost the round to get wrong twice.** Two things bit, and both are
  recorded here because either one alone can turn a measurement into fiction:
  - ★ **A BACKGROUND tab is not a slow foreground tab, it is a stopped one.** rAF does not fire
    there and the stage sets `data-paused`, so the concept's clock never leaves `elapsed` 0, nothing
    is written, and the canvas also screenshots black
    (`docs/systems/testing-verification.md`). Rounds one to three worked around that by DRIVING the
    loop off a stepped clock, which is exact for geometry and blind to anything that depends on the
    clock actually starting: the held beat is precisely that, and that is how a 620 ms defect lived
    through the round that introduced it, the cold walk that re-judged the board and two read-only
    reviews. **Every number below was re-taken in a real FOREGROUND
    page**, measured at 121 fps with an 8 ms median frame gap and ~1077 real frames per walk, with
    the fps and `document.visibilityState` asserted in the same call (one walk here silently lost
    the foreground mid-run and reported 13 frames in 11 s; it was thrown away and re-run).
  - ★ **A rebuilt chunk can keep its old filename, and `next start` serves it `immutable`.** An A/B
    against the pre-fix build on the same port measured the CACHED chunk and cleanly "disproved" a
    defect that was really there. Each build was therefore served on its **own port** (the fix on
    3163 and 3164, the pre-fix baseline on 3162), and the served bundle was grepped for the guard
    before trusting a single reading.
  What still holds from the earlier passes, on identical code: a standalone replication of the
  concept's pure math reproduces all **16 `--hhv-rest` strings character for character** off the
  SERVER's own output, and the rest state read off the LIVE cascade at each canvas (after deleting
  all 27 `no-preference` blocks from the running sheets, which is exactly what a reduced-motion
  reader resolves) matches it to 0.1 px.
- Synced with `launch-prep` **twice**. First at `dd4aa0b` (84 commits: the round-two merges of
  brand-voice, type-scale, palette, light, media-kit, floating-surfaces, rounding and hero-scan),
  `git merge origin/launch-prep` at `4aea15d`. Then again at the review fix, at **`fb395fe`**
  (69 more: the round-three merges of hero-scan, light, type-scale, media-kit and hero-burst, plus
  the candidate block reaching the guest surface), merged at **`5e7d58b`**. No conflicts either
  time. Of the files this track READS, only the sibling concepts moved (`scan.tsx`, `scan.css`,
  `burst.tsx`, `burst.css`); `shared.tsx`, `board.tsx`, `board.css`, `source.tsx`, `stage.tsx`,
  `bible.ts`, `marketing-media.ts`, `use-ambient-pause.ts` and `ASSETS.md` are untouched by either
  sync and by me, so nothing this concept renders changed under it. The board's served markup was
  re-checked on the merged tree: 16 `.hhv-card` nodes, all **16 `--hhv-rest` strings still character
  for character** what the concept's own math computes, `hhv-delta` present, `hhv-lab` absent, no
  em-dash, no `font-mono`, no `MonoCaption`, and the lab gate 404 / 404 / 200.
- Gates re-run at each head, last on **`2ed6cba`**: typecheck ok, lint ok (0 errors; 6 warnings,
  all pre-existing, on `contact-form.tsx`, `album-fill-grid.tsx`, `review-switch.tsx`, `jobs.ts` and
  `use-flip.ts`), test ok (**1761 in 197 files**), build ok (248 static pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/hero-river.md`,
  `src/app/(dev)/design/sandbox/home-hero/river.css`,
  `src/app/(dev)/design/sandbox/home-hero/river.tsx`. **No exceptions**: the two owned files and this
  manifest.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte moved.
- **"Apply to the site": still not applicable, and still deliberately.** This concept's candidate is a
  composition, not a token block: there is no CSS paste whose selectors would mean anything on `/` or
  `/pricing`, and offering one would be the light or palette board's paste wearing this track's name.
  So the page walk the round asks for (`/`, `/pricing`, `/help`, `/contact`, `/dashboard`, an event
  page, the demo guest page) has nothing from this board to wear and was not run: nothing this track
  produces can appear on those pages until the wiring round. Its ruling lands as a hero component
  there.
- **Shell change the Orchestrator should carry: one, down from two.** Round two asked for a per-concept
  `switches` field on `Concept` so the line-placement chip could live in `board.tsx`; that ask is
  WITHDRAWN, because the chip is cut. What remains is round one's and the scan's: **`demoCount`
  beside `qrUrl`**, the demo event's real media count, so no count ships as drawn.

### What the read-only reviews found, and what each fix was

The handoff went to a read-only review three times before Will. **The first pass** read `6d53fab`
and returned three findings; **the second** read the same `6d53fab` and returned four, of which two
(the popping frames and the dropped re-read) had already been fixed at `d9040aa` and `f87f906` by
the time it arrived, one restates the capped preview, and one is new and real: the phone's
reduced-motion count. **The third** read `0749a99`, found the four prior defects answered, and
returned ONE finding, which is the most serious the round produced: the held beat did not hold on
the Desktop canvas, and this Handoff stated the opposite as a measured number. All of them are
answered here, and all were inside this lane except the deployment cap, which belongs to the
project.

1. **BLOCKING, both passes: the preview does not serve this round's board.** True, and still true.
   Not this track's to fix: the cap is the project's, the alias bullet above carries the mechanism
   (a leaky bucket, not a day-long freeze) and the one-line marker check, and the second pass's own
   instruction was to verify locally and say so rather than keep racing for a slot. **Five pushes
   from this branch have been refused**, the last five seconds after another track took the slot,
   and no sixth was attempted this round. The bullet above states how the board was verified on a
   local production build at BOTH canvases, by what method, and that `hhv-delta` is the marker that
   tells round three from round two.
2. **Frames popped out of existence near the bottom of the stream, on both canvases.** Correct, and
   the one real break in the mechanism. The loop hid a card the moment its CENTRE passed `deadY`,
   but a card is laid out and scaled about that centre, so the cut threw away the whole upper half
   of a frame while the mask was still fully opaque there. **Measured on the running page under the
   old rule**, by driving the real loop and reading the transforms it writes: 19 cards a cycle were
   cut with their top edge at y 755.6 to 779.9, where the desktop mask is opaque until 818.4, so a
   150 to 174 px slab of a 262 to 339 px wide photograph vanished in one frame, about every 0.61 s.
   The phone was the same shape at a smaller size: 24 cuts a cycle, the worst at mask alpha 0.90
   with a 96 px slab. The fix is a new `topEdgeAt`, the centre minus the half-height of the TUMBLED
   box (a rotated frame reaches higher than its layout box), and the loop now drops a card at the
   first moment none of it can be seen. **After, re-measured at this head by driving the real loop
   for 1200 frames at each canvas: nothing visible is thrown away.** Desktop, 18 cuts in 15 s, every
   one with the card's top edge at y 927.7 to 929.7, at or below the canvas's own bottom edge, so
   the mask alpha there is 0 and the discarded slab is 0 px of a 301 to 332 px box. Phone, 29 cuts,
   top edge y 348.3 to 349.5 against a dissolve that ends at 349.6, alpha at most 0.003 and at most
   0.3 px discarded. The code's own comment, the `deadY` field doc and the claim in this Handoff are
   all true again. Cost: **1.7 to 2.4 more card writes per frame, measured**, which is what the
   comment above the test was already claiming to buy.
3. **Round 3 item (2) was silently dropped.** Correct, and fixed at `f87f906` before the second pass
   read the branch. The re-read is its own section below: it says plainly that no reviewer findings
   on the round-two handoff exist in the record, lists what was read from the other tracks
   (`brand-voice`, `media-kit`, `type-scale`, `light`, `palette`, `rounding`, `floating-surfaces`,
   `hero-scan`, `hero-burst`) and names the two things it changed on the board, the alias bullet it
   corrected and the one dependency it left on the record.
4. **The reduced-motion claim was true of the inline opacity and false of the page, on the PHONE.**
   Correct, and the second pass's one new finding. "All 16 cards standing" was read off
   `--hhv-rest-o`, which the bottom dissolve then overrides: at 375 the dissolve is complete at
   y 349.6 while the fall runs to y 545, so three cards stand entirely under it and a fourth is a
   9 px band at alpha 0.082. **The phone shows 12 of 16, and the Handoff now says so per canvas**
   (the desktop does stand all 16, the last two dissolving out through the bottom edge). The rest
   state itself was NOT moved, deliberately: the driven loop shows 12 to 14 frames visible at any
   instant on the phone, so the still is a true frame of the stream, and the tail below the dissolve
   is what lets a card recycle without popping. Filling the band would make the reduced-motion still
   denser than the stream it stands for. The reasoning is now a comment above the rest transform in
   `river.tsx`, so the code cannot drift from this claim again.
5. **THIRD pass, and the one that matters: the held beat did not hold on the Desktop canvas, and
   this Handoff stated the opposite as a measured number.** Correct in every particular, and fixed
   at `2ed6cba`. The loop's clock ran negative through the hold and the comment claimed that put
   every progress above 1, so the loop wrote nothing. `mod` does the opposite: it wraps a negative t
   to the END of the cycle, and the cycle is deliberately a hair shorter than the flight, so the
   largest progress the modulo can return is 0.9796 on the desktop and 0.9809 on the phone and the
   `at > 1` cut can never fire at all. **Measured on the pre-fix build, served on its own port, in a
   foreground page:** all 71 sampled desktop frames of the hold carried 16 cards at opacity 1, in
   two piles at canvas x -377..359 with their top edges at y 846..929 against a `deadY` of 930. The
   first third of a second was the album sliding out of the bottom of the hero, not the code and the
   words alone. The phone measured 0 visible throughout, so it read correctly by accident: its
   dead-line test at 46% of the canvas hides exactly those progresses. **After the fix, same method,
   on its own port:** desktop 71 hold frames with zero cards visible and a maximum opacity of 0,
   first frame over 5 percent at 795 ms; phone 72 frames, same, at 768 ms. The clock is now clamped
   at zero and the stream hidden while it is held, which is also the pour's own first instant, so
   there is no seam between the hold and the pour.
   Two further comments the same arithmetic disproves were corrected in the same commit: the file
   header's held-beat paragraph, and the claim that `at > 1` guards a reachable state.
   **Why it survived the round that shipped it, the cold walk that re-judged the board and two
   reviews** is the method note above: every earlier reading drove the loop off a stepped clock,
   which is exact for geometry and blind to a defect that lives in whether the clock starts. That lesson, and the `immutable`-chunk one beside it, are the two
   things this round would tell the next agent first.

### The re-read (round 3 item 2), and what it changed

- **The reviewer's findings on the round-two handoff: there are none in the record.** No findings
  block was ever written into this manifest (`grep -ri reviewer docs/tracks/` on this branch hits
  only the round-three brief's own sentence, in every track's copy of it), and none was handed to
  the round. So there was nothing to re-read, and the right answer was to say so rather than leave
  the item unanswered. Said here.
- **`brand-voice`, round 3, finding 1: the home page is about to carry two different counts.** The
  decomposition band two sections below the hero already ships "Built from 214 photos. Shot by 23
  guests.", and the guide's Do 3 allows one source and one pair of numbers on a page. **This changed
  the board**: the count departure now names that band, so the third ruling reads "keep it and read
  it from the same demo event the band reads, or drop it here and let the band carry the proof
  alone" rather than a bare keep-or-drop.
- **`media-kit`, the call sheet: both of this board's picture asks are already rows on it.** That
  board asks for the same 24 squares at 512x512 (ASSETS row 2) and the same 12 portraits at 720x900
  (row 12), as 1:1 and 4:5 crops of ONE 36-frame shoot with codes W1 to T6, explicitly not a second
  setup. **This changed the board**: both asks now say so, so Will answers one ask across two boards
  instead of being asked twice for the same shoot.
- **`media-kit` round two and `lp/hero-burst` `8043b8e` on the deployment ceiling.** Both had
  already diagnosed the leaky bucket. Reading them is what corrected the alias bullet above, and it
  is the clearest cost of having skipped item (2) the first time.
- **`type-scale`, round 3: a dependency to record, not a change to make.** Its board asks for the
  marketing ladder and recommends B, with C (the front of the site as a poster) as the overrule.
  This concept's h1 renders at `LADDER.xl[mode]`, and the desktop silhouette table is the measured
  ink of that face at 96 px. **If C is ruled, this lockup's ink table has to be re-measured before
  the hero ships**; `river.tsx` already says that for a copy change, and this is the same trigger
  from the other side.
- **`light`, `palette`, `rounding`, `floating-surfaces`, `hero-scan`, `hero-burst`: nothing that
  changes this board.** The LIFT alphas this concept borrows for the cards' overlap cue are
  unchanged in `docs/specs/light.md`; no token this board reads moved; and the two sibling hero
  concepts ask for the same `demoCount` shell prop this one does, which is the ask already recorded.
- **The specs.** Only two have moved off `launch-prep` at all, both on their own branches:
  `brand-voice.md` (now a round-three proposal: a utility-hero row and a Do 2 model sentence, both
  about `/contact`, while the hero example and Do 3 this board quotes are unchanged in substance)
  and `media-kit.md` (the call sheet, above). `light.md`, `palette.md`, `type-scale.md`,
  `floating-surfaces.md` and `reel-v1.md` are untouched since round two, so the fourth departure's
  three citations still read the text they were written against.

### What the cold walk found, and what each fix was

Walked the round-two board first, at 1440 and then 375, every toggle and both copies, before touching
anything. Six things a stranger would stumble on; all six are fixed.

1. **The album never came out of the code.** At the steady state the nearest frame to the plate was
   319 px off axis 96 px below it, and the top of the hero read as a code alone with photographs
   beside it. Cause, measured: the arm's fan opened over the first fifth of the FLIGHT, and gravity
   makes a fifth of the flight a tenth of the distance, so the fan was fully open 96 px down. The fan
   is now a function of the DISTANCE fallen. The first three frames now sit at x 3, -22 and 47 with
   the card 164 px wide, so they are inside the object they were born in.
2. **Three lanes collapsed into two ruled columns.** The clearing was one 800 px rectangle across the
   whole block, so every card was pinned to the same wall from 210 px of fall to the bottom of the
   hero: the concept's own claim, the album opens around the headline and closes under it, was never
   on screen. The clearing is now the lockup's measured ink, row by row. The banks open to 350 at the
   headline and close to 110 under the count, in view.
3. **The stream had holes.** Eight launches per arm against a nine-and-a-half-launch flight left a
   fifth of the cards on the ground and put three frames in the hero's top third. The cadence now
   divides the flight (1200 against 9800 on the desktop, 1030 against 8400 on the phone), so every
   frame is airborne and gravity does the spacing. 14 frames on the desktop canvas where there were
   11, 11 on the phone where there were 9.
4. **The phone threw frames off the side of the screen at 83 percent opacity.** The clearing's gate
   read a card's whole layout box, most of which was already below the dissolve. It now reads the
   card's VISIBLE box, clipped at the dissolve's last stop, which on the phone means the clearing
   correctly never fires and the album simply dissolves where it is. The guarantee is not weakened,
   it is stated properly, and it re-arms by itself if the dissolve is ever retuned.
5. **A control that did nothing.** "Scan the demo" was an inert `<Button>`. It is the button a
   stranger presses first, because it is the one that says show me; it is now a link to the demo
   event, the same place the code goes.
6. **The proposed copy ran three headline lines and pushed the count to y 893 of 930.** It is now
   "One code, and the album fills.", which is the voice guide's two-beat shape trimmed to hold two
   lines at the xl step, and the subhead's measure went from 560 to 500 so both copies set the same
   block shape. One measured silhouette now serves both.

And one cut, which is the round's answer to "a candidate cut if it no longer earns its column":
**the line-placement chip is gone.** Walked cold, the floating line loses plainly (a bare plate with
a line belonging to nothing beside it), and the chip was the only thing on the canvas that was not
the composition, which on a stage reads as product UI. One build, the printed card; the ruling
survives as a one-word departure.

### Verified at `2ed6cba`, against the production build served locally

**Which numbers were re-run at this head.** `2ed6cba` is the first head in the round whose
executable code differs from `d9040aa`, and the difference is confined to the hold: for every
`elapsed >= HOLD_MS` the loop is byte-for-byte what it was, which is why the steady-state numbers
below are unchanged rather than merely unrechecked. Re-run at this head, in a foreground page: the
gate, the served markup, the lab gate, the HELD BEAT at both canvases, the clearing against the
lockup's rendered ink at both canvases, the dead line at both canvases, the visible count of the
running stream at both canvases, and a fresh production load's console. Standing from `d9040aa` on
code the diff proves identical: the rest state, the silhouette table, bible 13 and the cost
figures.

- **The clearing is a geometric guarantee, measured and not eyeballed.** A probe read the rendered
  INK of the headline's two lines, the subhead's lines, both buttons and the count, and tested every
  visible card's live rect against all of them, every frame, for a full cycle in each of the four
  combinations of canvas and copy. Re-run at `d9040aa`, on this head's code, because the dead-line fix puts frames on
  screen that used to be deleted there: **desktop 0 px of overlap, both copies, 9843 and 9880
  card-frames checked over 621 driven frames**, of which **1471 are frames the fix restored** (past
  the old centre cut), so the guarantee was re-tested exactly where the new frames appear. **Phone:
  0 px of VISIBLE overlap, both copies, 6778 card-frames each, 1044 of them restored.** The box
  tested is the TUMBLED one, wider and taller than the layout box, so the check is conservative.
  As before, the phone's raw layout boxes do reach
  58 px into the headline's ink, and every one of those pixels is below the dissolve's last stop,
  which is 22 px above that ink. Both numbers are reported because the second one is the honest
  description of what the phone does.
  **Re-measured at `2ed6cba` in a foreground page**, against the rendered ink of the lockup's own
  text nodes and each card's live tumbled rect clipped at the dissolve's last stop: **desktop 0 px
  of overlap, raw and visible, over 602 frames and 75,960 card-against-line checks; phone 0 px of
  VISIBLE overlap over 601 frames and 78,210 checks**, with the raw layout boxes reaching 57.5 px,
  which is the same 58 px said the same way. The guarantee is intact after the hold fix.
- **The dead line, re-measured in the same foreground walks.** Every recycle still fires only once
  none of the card can be seen: **desktop 5 cuts in 5 s, phone 10, and at every one of them the
  card's top edge was already 0.53 px (desktop) and 0.29 px (phone) BELOW the dissolve's last
  stop.** Nothing visible is thrown away, which is the `d9040aa` fix holding under the new hold.
- **The held beat, measured after a Replay in a FOREGROUND page, at 121 fps, on the fixed build
  served on its own port.** This is the number the third review caught the round stating falsely, so
  it is stated here as what was sampled rather than as what the code intends. **Desktop: 71 sampled
  frames from the loop's first write through 620 ms, zero cards visible on every one of them, and a
  maximum opacity across all sixteen cards of exactly 0**; the first frame crosses 5 percent opacity
  at **795 ms** (the 620 ms hold plus the growth), so the code and the words stand alone for four
  fifths of a second. **Phone: 72 frames, the same result, first frame over 5 percent at 768 ms.**
  The count holds at 241 through the hold, first ticks at 1.84 s and settles at 9.04 s.
  One thing the fix does NOT remove, said plainly because it is visible if you look for it:
  **exactly ONE frame of the rest state paints at the mount itself** (33 ms on the desktop walk,
  22 ms on the phone), because the server's HTML is the rest state and this is a passive effect, so
  the earliest any JS hide can land is after that commit has painted. Only a layout effect could
  move it, at the cost of a server-render warning, and the alternative is hiding the stream in the
  markup, which is the reduced-motion reader's own still. Said in the code too, above the hold.
- **The silhouette is measured, not guessed.** The desktop table is the rendered ink of both copies:
  headline line 1 at 421.8..537 (half 348 ruled, 297 proposed), line 2 at 519.7..634.9 (270 / 291),
  the subhead at 662.4..704.8 (249 / 244), the buttons at 745.1..789.1 (150 / 156), the count at
  807.1..823 (106 in both). The knots sit outside each of those by 2 to 6 px, and the profile is
  monotone between knots, so the largest half-width over a card's own vertical extent is exactly an
  endpoint or a knot: the check is exact rather than sampled.
- **The served HTML** carries 16 `.hhv-card` nodes, 16 `--hhv-rest` transforms, 16 `--hhv-pos` crops,
  the printed card, `hhv-delta`, and the count's SETTLED figure (248) as the markup with the ticking
  241 hidden outside the reduced-motion block. No `hhv-lab`, no em-dash, no `font-mono`, no
  `MonoCaption`, and no `data-mkt-cut` / `data-mkt-reveal` / `.mkt-line` on any h1 on the page. The
  lab gate on the production server: 404 with no key, 404 with a wrong key, 200 with the key. All
  re-checked at `2ed6cba`. **A fresh production page load, in a clean tab, logs nothing to the
  console at all** on both the pre-fix and the fixed build, so the printed card hydrates clean. (The
  one thing that does log is a run of Replays in a single tab: `next/image` preloads the board's
  shared media on every remount and the browser warns that three of them went unused at the width it
  preloaded. It is the board's four concepts sharing one media pool, not the river, and it never
  appears on a page load.)
- **Reduced motion, per canvas, with the count the MASK leaves rather than the count the markup
  carries.** A reduced-motion reader's effect returns before it writes a single inline style, so what
  they get is exactly the 16 rest transforms the server printed, resolved through the bottom
  dissolve. Both canvases were read on the running page by deleting all 27 `no-preference` blocks
  from the live sheets, which is the exact cascade that reader gets, and then measuring every card's
  tumbled top edge against the dissolve's own stops.
  - **Desktop: 16 of 16 stand**, spread y 175.1 to 1067.8 at scales 0.35 to 1.00, inline opacity 0.731
    at the lowest. The last two are dissolving as they leave: 76 px of one at peak alpha 0.69 and 23 px
    of the next at 0.21, which is the album going out through the bottom of the hero.
  - **Phone: 12 of 16 read, not 16.** The dissolve is complete at y 349.6 and the fall runs to y 545,
    so three cards stand entirely below it with nothing on screen and a fourth is a 9 px band at
    alpha 0.082. Earlier rounds said "all 16 standing", which was true of the inline opacity and
    false of the page; this is the corrected claim.
  - **The rest state is still the settled composition, and that is the point**: the RUNNING stream,
    sampled every real frame for the five seconds after it settles at `2ed6cba`, shows **12 to 14
    frames visible at any instant on the phone (mean 12.86) and 15 to 16 on the desktop (mean
    15.7)**, so the still is a true frame of the stream and not a thinned one. Those are the driven
    clock's earlier figures (12.5 and 15.5) confirmed in real time, which is worth one line because
    the driven clock is the instrument the third review found a blind spot in. The
    tail below the dissolve is load-bearing: a card may only recycle once none of it can be seen, so
    without it the recycle is the pop the dead-line test exists to prevent. Moving the rest state up
    to fill the band would buy four frames in the still by making it denser than the stream it stands
    for, which is the one thing a designed rest state may not be. Said in the code as well, above the
    rest transform.
  - The ticking count is hidden and the settled 248 shown in that cascade, on both canvases.
- **Bible 13:** the h1 measures opacity 1, transform none, clip-path none, with no `data-mkt-cut`,
  no `data-mkt-reveal` and no `.mkt-line`. Its line pitch measures 98 px against a 96 px face, so
  `leading-[1.02]` is in effect: worth saying because the type-scale board found this same lockup
  losing that leading to tailwind-merge. It cannot happen here, because the class is a template
  literal and never passes through `cn()`.
- **Cost, measured on the production build at both canvases rather than asserted.** The river's own
  loop, including every style write: **0.156 ms per frame** on the desktop canvas, of which the 16
  cards' placement (the new silhouette clearing included) is **0.07 ms**; all FOUR concepts on the
  board together cost 0.59 to 1.08 ms per frame, under 7 percent of a 16.7 ms budget. 16 promoted
  layers, **5.65 MB** at the desktop canvas and **1.69 MB** at the phone, and a card's DOM box is its
  LARGEST visible size, so nothing is rasterized above 1:1. The loop still skips a card once the
  dissolve has taken it to zero, but the test is now its TOP EDGE rather than its centre (the review
  defect above), which costs **1.7 to 2.4 more card writes per frame, measured**. Re-measured at
  `d9040aa` by the same stepped clock: all four concepts together, **0.17 ms per frame** at either
  canvas. That is lower than the 0.59 to 1.08 ms above, which is machine state and not code; the
  honest reading of the pair is that the whole board's loop is a small fraction of a 16.7 ms frame
  either way, and both were taken with a stepped clock in a hidden tab, where a style write costs
  its JS but no paint. Nothing here earned a cut; the honest report is that the stream is not the
  cost.
- The rAF CADENCE itself could not be sampled: the only browser available to this session drives a
  background tab, where rAF is suspended and a frame-time sampler records zeros
  (`docs/systems/testing-verification.md`). The loop was therefore driven by a stepped clock, the
  same callbacks at a deterministic timestamp, which is what every measurement above ran on; the
  per-frame COST is real JS time and the per-frame BUDGET is arithmetic, not a measured 60 fps.
- Light QA: the board read at 1440 and at 375, both copies, Replay, reduced motion, the h1 at paint,
  all of it on the local production build. **What a screenshot cannot do here, said plainly:** this
  session's browser drives a BACKGROUND tab, so a capture of either canvas comes back black and the
  stage is paused inside it. That is the tooling, not the board (`docs/systems/testing-verification.md`),
  and it is why every claim above is a measurement off the DOM, the live cascade or the served
  markup rather than an eyeballed still. The composition at 375 is described below and its geometry
  is in the numbers; the last thing only an eye can settle, whether that geometry LOOKS right at
  375, is a thirty second look on the alias once a slot opens, or on any foreground tab at
  `localhost` with the board open.
- **Assets requested from Will (no new rows; round one's two asks, unchanged):**
  1. **24 event photographs as 512 x 512 squares, one grade, 6 to 35 KB webp each**, framed tight
     enough to read at 110 px, which is measured: that is the size a frame is as it leaves the code ·
     `ASSETS.md` row 2, unchanged, and the SAME row the media kit's call sheet asks for (1:1 crops
     of that board's 36-frame shoot, codes W1 to T6, not a second setup), so it is one ask across
     two boards · replaces the 12 landscape stand-ins in `FRAMES` (`shared.tsx`) and retires `CROP`
     in `river.tsx`.
  2. **12 event photographs as 4:5 portraits, 720 x 900, one grade, 15 to 60 KB webp each** · row 12,
     unchanged, and again the call sheet's own row, as 4:5 recrops of the same masters, so it costs
     no extra shooting; the portrait third of row 3 or row 7 serves instead and may be cheaper to
     unpark · replaces the portrait cards (`wf` 0.8) in `CARD_POOL`.
  3. **The demo event's live media count**, as a number the hero can render · not a picture, a shell
     change (`demoCount` beside `qrUrl`) · replaces `COUNT_TO`, the 248 stand-in.
- **The asks, verbatim from BoardMeta** (this board renders them under "Asks" from `concept.assets`;
  the Orchestrator quotes them under Waiting on Will):
  1. "24 event photographs as 512 x 512 squares, one grade, 6 to 35 KB webp each, framed tight
     enough to read at 110 px, which is the size a frame is as it leaves the code · ASSETS row 2,
     already requested and unchanged, and it is the SAME row the media kit's call sheet asks for
     (1:1 crops of that board's 36-frame shoot, codes W1 to T6, not a second setup), so this is one
     ask across two boards and Will answers it once: the two arms carry disjoint halves, so with 24
     every frame in the stream is unique, where the 12 landscape stand-ins double four of them ·
     replaces the 12 landscape stand-ins in FRAMES (shared.tsx) and retires the per-frame crop
     table in river.tsx."
  2. "12 event photographs as 4:5 portraits, 720 x 900, one grade, 15 to 60 KB webp each, from the
     same shoot as the squares · ASSETS row 12, already requested and unchanged, and again the
     media kit's call sheet asks for this row as 4:5 recrops of the same masters, so it costs no
     extra shooting; the portrait third of row 3 or row 7 would serve instead and may be cheaper to
     unpark · replaces the portrait cards (wf 0.8) in CARD_POOL, which are cropped out of
     landscapes today."
  3. "Nothing else is a picture. The one ask left is the shell's: the demo event's live media
     count, as a number the hero can render (a demoCount prop beside qrUrl, from a build-time count
     on the demo event or the RPC the guest page already uses) · replaces COUNT_TO, the 248 stand-
     in, and COUNT_FROM becomes that count minus the arrivals shown. Better still, and the
     recommendation: if this hero ships, the frames in the stream should BE the demo event's own
     media (ASSETS row 5, the curated folder), so the count is literally the album the stream
     renders and the hero stops illustrating the product and starts being it."
- **The rulings, from the board's Departures. Three words settle this board:**
  1. **The code at the top rather than at the exact centre** (and the centred lockup with it). The
     one real argument with the source, and the first thing to overrule.
  2. **The line under the code, printed on the card.** Built one way now; say "above" and the
     floating version comes back in a line.
  3. **The count under the buttons: keep it (read from the demo event) or drop it.** It is the
     evidence for "See a real album", and it is the only invented number on the board; every other
     number in the concept was measured off the page. The voice board's round-three finding sharpens
     it: the decomposition band two sections below already ships its own pair of numbers, and the
     guide allows one source per page, so keeping this means both read the demo event.
  Bible 13's decorative-layer gating is flagged as the fourth departure because the wave rules put
  bible departures on the board rather than in a footnote; it is not a ruling Will has to make.
- **Look at first**: the FIRST TWO SECONDS on Desktop, **and press Replay to see them**, because a
  cold load spends its first frames hydrating. The code and the words stand alone for 620 ms with
  nothing falling (measured: 71 frames of the hold with zero cards visible, and the first frame
  crossing 5 percent at 795 ms), then the album pours out from behind the card, and the first frames
  are still inside the card's own width, which is the thing round two could not do. Round three
  shipped this beat broken on the desktop and the third review caught it, so it is the first thing
  to look at rather than the last. Then let it settle and watch ONE bank: it opens
  to the headline's width, and then visibly closes as the type narrows, past the subhead, past the
  buttons, until the two arms are almost rejoined as they leave the bottom of the hero. That shape is
  the lockup's own silhouette and it is the round's one real idea. Then the phone, where the same
  mechanism reads as a dense braid pouring out of the card and dissolving into the headline with
  nothing flung aside. Last, the count under the buttons: it settles at 248, and it is the only thing
  on the board nobody can stand behind yet.

## Record (round 3; the CHANGELOG paragraph for rounds 2 and 3, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). Two rounds turned the river from a diagram into a
composition. Round two answered its own round-one departure: the caption line CAN sit under the
code, because putting it inside the white object makes the plate the card an event puts on a table,
and the stream is born behind that card instead of bowing around a floating line; it also proposed
the pour's held first beat, settled the count, straightened the frames as they land, took the light
spec's LIFT for the overlap cue and rebuilt the phone as one braided lane. Round three walked it
cold and found the desktop failing its own sentence, because its lateral law was written against the
clock while everything a reader sees is written against the fall. The fan now opens over the first
third of the DISTANCE, so the album leaves the card; the clearing took the lockup's measured ink row
by row, so the banks open around the headline and close under the buttons; the cadence divides the
flight; the chip was cut to one build; and three reviews caught a frame dropped by its CENTRE, a
rest-state count the mask disproved, and a held beat that never held until this round clamped it.
