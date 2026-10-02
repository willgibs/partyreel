---
track: mkt-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "a5c42530"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/privacy-hero/
  - src/app/(dev)/design/sandbox/about-press/
  - src/app/(marketing)/(cinema)/features/privacy/
  - src/components/marketing/sections/features/privacy/
  - src/components/marketing/system/page-hero
  - src/app/(marketing)/(cinema)/about/
  - src/app/(marketing)/(cinema)/press/
  - src/components/marketing/press/
  - src/lib/constants/about
  - src/lib/constants/press
  - src/app/sitemap
  - src/lib/constants/marketing-nav
  - src/lib/constants/contact
  - src/lib/content/llms
  - src/app/llms.txt/
  - src/app/llms-full.txt/
  - docs/systems/marketing-content.md
  - src/app/(dev)/design/(shell)/library/marketing/gallery-demos.tsx
  - src/app/(dev)/design/gallery/playgrounds.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/privacy-hero.json
  - docs/reviews/about-press.json
  - src/components/marketing/jsonld.tsx
  - src/app/keyframe-uniqueness.test.ts
  - public/press/
---

# lp/mkt-wiring

**Goal.** Wire Will's two marketing picks: privacy-hero's lens behind /features/privacy's words, and about-press's press-kit band on /about (facts none) with /press redirected there; both boards retired.

## The brief

**privacy-hero r4: `veil=lens`.** Will's note: "This feels like a far cleaner design. Great work." The lens is a 240px clear pane that rests on things, never faces.
- **Where it goes:** production's home is `src/app/(marketing)/(cinema)/features/privacy/page.tsx`, whose hero is short today with nothing behind it. `page-hero.tsx` already accepts a `backdrop`.
- **The port:** bring the lens from the board's `veils.ts` (`LENS`, `lensKeyframes`, `scrimShape`), `veil-layers.tsx` and `veils.css` into `src/components/marketing/sections/features/privacy/`, minus the lab-only `CANVAS` and `Mode`.
- **Spots:** the board drew only 1440x930 and 375x760, with resting spots placed on objects in the stand-in `wedding-toast`. Choose proportional spots or a set per breakpoint, and say which in your Handoff.
- **Contrast:** measure the words' 7:1 at every width.
- **Keyframes:** keep their names unique (`keyframe-uniqueness.test.ts`).
- **Performance:** a full-screen blur under a moving pane must be measured. Ship a pre-blurred still as the fallback for reduced motion and weak devices.
- **The asset:** round 4 asked for one 2880x1860 photograph. Name it under your Handoff's "Assets requested from Will" (the Orchestrator files the ASSETS row) and ship on the stand-in.

**about-press r1: `kit=band`, `facts=none`.**
- **The band:** the board's `KitBand` (`kit.tsx`) on `/about`, before the closing section, with `id="press"`. It carries four plates, one download and the usage line.
- **The redirect:** `/press` becomes a temporary (307) redirect to `/about#press`, through `redirect()` in `press/page.tsx`, NOT `next.config.ts`. `press/opengraph-image.tsx` goes.
- **The press components:** `components/marketing/press/{press-sheet,press-section,copy-button}.tsx` lose their only user and go.
- **What `constants/press.ts` keeps exporting:**
  - `FOUNDED_YEAR`, imported by `components/marketing/jsonld.tsx`;
  - `PRESS_FACTS`, which feeds `/llms-full.txt`;
  - `PRESS_KIT`, which the band's plates read.
- **References that move to `/about#press`:**
  - `sitemap.ts`;
  - `marketing-nav.ts` and `contact.ts`, with their tests, adding the contact directory's Press row;
  - `src/lib/content/llms.ts` and its test, where `PRESS_BOILERPLATE` moves into the llms builder and the Press link is retargeted;
  - the `llms.txt` and `llms-full.txt` routes.
- **What stays:** `public/press/*`, the zip, `build-press-kit.mjs`, `build-press-qr.mjs` and `press-kit.test.ts`.
- **For the record:** name the ROADMAP lines your change retires (about :41, :230, :231, and :98's Press row) in your Handoff.

**Retire both boards** by deleting their sandbox folders; their ledgers are the Orchestrator's. The Library files you own (`library/marketing/gallery-demos.tsx`, `gallery/playgrounds.tsx`) render `page-hero.tsx`, so follow any change to its props.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3133`; `pnpm lab:demo --board demo-framing --base http://localhost:3133` (it imports the nav); /features/privacy and /about read at 1440, 1024, 768 and 375 with reduced motion in a headless Chrome of your own, the words' contrast measured on the moving lens, a performance trace of the lens at 375; `curl -sI localhost:3133/press` answering 307 to /about#press.

## Questions (a recommended answer each; the Orchestrator relays them)

Every recommended answer is BUILT and his to overrule; none is a one-way door.

- **The lens's spots: proportional bands, two reaches (built).** The board's rests were places in a band (above or
  below the words, a gap clear of the header and the foot, a share of the width), so that is what is built: the
  hero's padding IS the two bands (the pane's diameter and a gap each side), the lockup sits in what is left, so no
  rest can be under a word at any width or any copy; at the board's two canvases it reproduces its rests and its hero
  heights (930; 762 against its 760). Two reaches share one set of nodes: from 640 the board's four round the words,
  below it the four corners of the screen. The pane is 124 at 375 to 240 at 1440 on a line, the gap 24 to 10.
  Alternatives: a pixel table per breakpoint (on its objects at two widths only) or rests anchored to the photograph's
  own objects (needs the real still and a set per aspect).
- **The hero's height (built: the board's own).** Its natural height is the header, two bands and the lockup (930 at
  1440, 762 at 375), stretching to a screen that is taller; on a window shorter than that (a 13-inch laptop's about
  780) the two bottom rests sit partly below the fold. Alternative: a pane that shrinks with a short window, so every
  rest is in the first screen, at the cost of the size he picked.
- **The veil is a still, not the live backdrop filter (built; the brief's shape inverted).** The pane moves over the
  veil every frame, and a backdrop filter under a moving sibling is a full-screen blur re-run round the pane, which a
  stylesheet cannot spare a weak phone from. Measured on the production build at 375 by 812, 3x, 10 seconds a
  variant, the live variant against the still (the Handoff's table): the same picture (mean |luminance| difference over
  the frame 0.0003; the middle of it to 0.0001; the outermost 50px fall off to the room by under 0.004 where the
  backdrop would mirror), and the GPU process busy 59 ms against 241 ms (about a quarter), both at 60 fps. The
  filter's numbers are the lightbox's own tokens (`--glass-behind-*`), so a retune of the material moves the hero.
  Overrule: the live `glass-behind` with the still as the fallback for reduced motion and reduced transparency; the
  board's `veil-layers.tsx` at `fefe9d30` has it.
- **The words' pools are heavier than the board's (built: 97 and 95 percent where it drew 93 and 90).** The words held
  7.0 to 7.2 over the loop on the stand-in; a brighter still would not, so the pool's plateau was raised, and the
  contrast re-measured on the stand-in and on two bright stills as a stress (festival lights, pastel balloons: 7.5
  and up). The look is the same (the pane dims into the pool as it passes behind the words).
- **The stage arrives as a 900 ms fade, and the veil asks for a small file (built).** The photograph is a large image
  that may land after the words, so the room's light comes up rather than cutting in (reduced motion: no fade); the
  veil, blurred 28px, asks for `40vw` and the pane for the screen's width, so the hero's largest image is the small
  one. Overrule: no fade; one `sizes` for both (one request, a heavier veil).
- **The about-press picks, as the board drew them (built).** The band's heading, body and download line are the
  board's `KitBand`, with the usage line folded into the paragraph; the plates, the muted panel and the ledger's
  split are its own. `facts=none`: no strip, and `PRESS_FACTS` feeds `/llms-full.txt` alone.
- **Press's doors (built, copy mine).** The header panel's Press row reads "Logos and brand files, ready to use."
  (it read "Logos, facts, and who to ask."), /contact's directory gains a "Press" row ("The brand marks, the app icon
  and a QR code, in one download."), the `press` topic's hint reads "The press kit has the brand marks, the app icon
  and a QR code." (two lines at 375), and the llms files' Press link says what is in the zip. All four go to
  `/about#press`.
- **`/press` leaves the sitemap and the one-liner leaves the code (built).** A sitemap names the address to index, and
  /press only redirects; the one-sentence boilerplate had no reader once the page went (the paragraph both llms files
  open on moved into their builder, whole).

## System-doc edits (in place, owned facts only)

- `marketing-content.md`: the Resources group (Press goes to the band, an anchor row is never current); `/about` gains
  the press kit band, the 307 redirect, the one address every door reads and the plates' literal grounds (the old
  `/press` bullet's facts, refined in place, the bullet itself gone); the utility-page rhythm no longer lists press;
  `/contact`'s directory row, hint and anchor-resolving test; and the feature family gains the privacy lens (bands as
  padding, the pane and photograph as one, the veil as a still, the pools, the photograph the one thing to swap).

## Deferred (ROADMAP one-liners, bucket named)

- Marketing: the privacy hero's three other veils (the drift, the beam, the glimpses), retired with the board, are in
  git at `fefe9d30`: `git show fefe9d30:"src/app/(dev)/design/sandbox/privacy-hero/veil-layers.tsx"` with `veils.ts`
  and `veils.css` beside it; the beam (a slow light across a darkened photograph, three stills in turn) is the likeliest
  to dress another surface (from `mkt-wiring`).
- Marketing: the day the privacy hero's real photograph lands (the Handoff's asset), re-run the words' contrast over
  the pane's loop at the widths, since the pools were sized on the stand-in (the method: freeze the pane at moments of
  its loop, hide the words, take the 95th-percentile ground under each line; `_scratch/mkt-wiring/contrast.mjs`), and
  look at the pane's four rests on it (from `mkt-wiring`).
- The lab and the kit: a headless capture of a paused compositor animation can show a stale frame (a seeked
  `currentTime` reads right in the DOM and wrong in the screenshot); freeze a seek by applying the sought transform as
  a plain style with the animation off (`freezeLensAt` in `_scratch/mkt-wiring/cdp.mjs`); testing-verification.md's
  capture notes want the line (from `mkt-wiring`).
- Marketing: no WebKit was driven (this machine has no Xcode developer tools, so no iOS Simulator): the lens's two
  WebKit mitigations (`isolation` on the pane's rounded clip, `will-change` on the filtered veil) are from known
  behaviour, so the first iPhone look is Will's or the red-team's (from `mkt-wiring`).

## Handoff (replaces the chat report)

- **Commits**, pushed to `lp/mkt-wiring`: about-press `b16ce9e4`, the lens `d3ffdc94`, its forced-colours rule and the
  press hint's length `0c9a0b09`, a comment's accuracy `bce0f552`, and this manifest (docs only). **No sync:** launch-prep
  moved (ready-wiring's merge `38d4f1ec`, its records, wave 2's cuts: 86 files, the host app, the lab's shell,
  event-ready, `pricing/comparison-table`), none in this lane's owns or reads, and `git merge-tree` against `ec254645`
  merges clean.
- **Gates on `bce0f552`** (the code head), each on its own exit code, logs in `../partyreel-wt/_scratch/mkt-wiring/` (every
  `tmp/`, `traces/` and `shots/` path below is under it, pruned with the lane):
  `zsh scripts/build-lock.sh pnpm typecheck` 0 · `pnpm lint` 0, no warnings · `zsh scripts/build-lock.sh pnpm test` 0 (735
  files, 8,711 tests) · `zsh scripts/build-lock.sh pnpm build` 0, no warnings · `pnpm lab:smoke --base http://localhost:3133`
  0 (139 checks; scope demo-framing and locked-door, the Library and the shell) · `pnpm lab:demo --base
  http://localhost:3133` 0 and `--board demo-framing` 0, both "0 steps" (neither board has an open step), so each
  answered step of both was pressed with `--only` (demo-framing slug, stage, touch; locked-door family, shape, wait,
  lost): 7 steps, 0 failing (`final-*.log`). No PREMISE line. Dev server killed by port, the production server too, no
  Chrome of mine left running.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): owned paths and this file, plus one exception,
  `src/components/shared/error-digest.tsx`: a doc comment named the deleted `copy-button.tsx` as its precedent, so it
  names what is true now (it is why `locked-door` rode this lane's lab scope).
- **The press kit band**: `about/press-kit-band.tsx` between the six convictions and the close, `id="press"`, four
  different plates read from `PRESS_KIT`, one download with its size (245 KB), his usage line, copy in
  `ABOUT_PRESS_KIT`; `press-kit-band.test.tsx`; read at 1440, 1024, 768 and 375 under reduced motion
  (`shots/aboutrm-*.png`).
- **`/press` is a 307**: `press/page.tsx` is `redirect(ABOUT_PRESS_HREF)` and nothing else (`page.test.ts`); `curl -sI`
  answers `307 Temporary Redirect`, `location: /about#press` on the dev server and on `next start` (the route is
  prerendered: `x-nextjs-prerender: 1`, `s-maxage` a year per deployment, a 307 no browser keeps); its OG image and
  `components/marketing/press/*` are deleted; it is out of the sitemap.
- **Every door reads one address** (`ABOUT_PRESS_HREF`, the band's id beside it in `constants/about.ts`): the nav's two
  Press rows (a literal the nav test pins), /contact's new Press directory row and the `press` hint (`contact.test.ts`
  resolves an anchor to an id written in the page's folder), the llms Press link (`llms.test.ts`: a fragment must be
  the band's, and no file links `/press`). Walked in a browser (`navpress.mjs`, `navcontact.mjs`, `contacthint.mjs`):
  the desktop panel from /features/privacy and from /about itself, the phone sheet from both, the footer from /pricing
  and the directory row each land the band 80px under the top (the panel and the sheet closed after), and the Press
  topic's hint card shows its link to `/about#press` in two lines at 375. The two llms routes needed no change (they
  call the builders; `curl` shows `[Press](.../about#press)` and the fact sheet).
- **`constants/press.ts`** keeps `PRESS_FACTS` (→ `/llms-full.txt`), `FOUNDED_YEAR` (→ the JSON-LD) and `PRESS_KIT`; the
  boilerplate moved whole into the llms builder, the one-liner is gone; `press-kit.test.ts`, `public/press/*`, the zip
  and both scripts untouched.
- **Both boards retired**: `sandbox/privacy-hero/` and `sandbox/about-press/` deleted, their ledgers left for the
  Orchestrator; `registry.test.ts` green.
- **The lens**, in `sections/features/privacy/` (`privacy-lens.ts` every number, `privacy-lens.css` the structure,
  `lens-stage.tsx` the markup, a server component with no script of its own): the pane and the photograph in it
  transforms only on one clock, the veil the lightbox's ground as a still, two pools behind the words, the stage hidden
  under forced colours, the pane parked on its first rest under reduced motion. At the board's two canvases it draws the
  board's rests and its hero heights; its first two rests at 1440 and its first at 375 set beside the board's frames
  (`shots/board-lens-*`, `shots/first-*`).
- **Tests that hold the promise**: `privacy-lens.test.ts` evaluates the CSS the module writes at a grid of screens
  (pane + view = 0 at every stop; every rest whole on the hero and at least the gap from the measured lockup, on the
  tightest hero and on taller ones; the module's numbers and the sheet's clamps equal; the sheet's breakpoint, custom
  properties, animations-only-under-no-preference and keyframe names held), `lens-stage.test.tsx` the markup and the
  page's wiring; each of seven mutations (a gap of 0, the view's sign, a rest off the side, the breakpoint, an animation
  outside the no-preference query, a backdrop filter, the veil losing its layer) turns its test red.
- **The words' contrast over the moving lens** (production build, `tmp/contrast-summary.txt`; the 95th-percentile
  ground under each line box, words hidden, the pane frozen at 160 moments of its loop at 375, 768, 1024 and 1440 and
  at 48 moments at 17 more widths, 320 to 2560): every line 7.55:1 or better (eyebrow 8.02, headline 13.81, subhead 7.55,
  the outline button 15.37) and the header's logo, nav and menu 6.67 or better (the board held 5.54). Reduced motion
  (the pane parked): subhead 7.70, the rest higher. As a stress, two bright stills under the same pools (festival
  lights, pastel balloons): subhead 7.49 and 7.54, headline 16.58. The pools' plateau is 97 and 95 percent where the
  board drew 93 and 90: on the board's numbers the subhead dipped to 7.02 on the stand-in and to 6.78 on the stress still.
- **The lens at 375** (production build, 375 by 812 at 3x, 10 s a variant, `tmp/perf-prod.log`, `tmp/perf-gpu-summary.txt`,
  `traces/`): 60 fps in every variant at 1x, 4x and 6x CPU throttle (rAF p50 16.7, p95 16.8 ms; 720 frames in 12 s and
  none over 33 ms, `jank.mjs`), and the main thread idle while the pane moves (3.5 ms of tasks in 10 s, no layout, style
  or script, `tmp/mainthread.log`). The GPU process's busy time over the window, which is where the veil's two ways differ:

  | variant | 1x | 6x |
  | --- | --- | --- |
  | shipped: the still | 59 ms | 22 ms |
  | the board's live backdrop filter (injected for the comparison) | 241 ms | 117 ms |
  | the still with no pane | 5 ms | 2 ms |
  | the page with no stage | 4 ms | 2 ms |

  The same picture either way (`still-vs-live.mjs`: mean |luminance| difference over the frame 0.0003, its middle
  0.0001, the outermost 50px under 0.004). This Mac's GPU is not a phone's: what a real phone does stays the red-team's.
- **Bytes** (`bytes.mjs`, the stand-in is 900 px wide so every wide candidate is its own 32 KB): the veil asks for `40vw`
  (640w at 1x and at a phone's 3x: 23 KB) and the pane for the screen's width, two requests, 55 KB at 1440 at 1x.
- **Console clean** on /features/privacy and /about at 1440 and 375 (the dev server, `consolecheck.mjs`); the hero's
  HTML adds 8.4 KB raw, 0.7 KB gzipped (the keyframes 7.3 KB, the hero's custom properties 1.1 KB:
  `.next/server/app/features/privacy.html`).
- **ROADMAP** (yours; lines as of `fefe9d30`, find them by their words): retired: about :41 (the press sheet's `--faint`
  note: the sheet is gone, the usage line is `text-muted-foreground`), :98 (the contact hint retargeted and the
  directory's Press row added), :230 (the copy-with-a-receipt primitive: `copy-button.tsx` is gone, `error-digest.tsx`
  keeps its own), :231's press-sheet half (the careers `contact-sheet.tsx` half stays), :84 (the lens's backdrop filter:
  measured, and the veil shipped as the still), :209's tail ("the privacy hero's round four is on the desk"); refined:
  :28 and :36 each lose their about-press clause, :131 loses "(privacy-hero pins its own since its round four)";
  unchanged and still true: :83 (this lane ran its legibility pass by hand, with the freeze), :85, :357 (its
  `cdc979a6` pointers resolve). The Deferred lines above are the four to add.
- **Assets requested from Will**: The privacy hero's photograph · one wide party still composed for the lens, 2880x1860
  JPEG, warm and low-key like the toast, its people toward the middle where the words sit and its middle third no
  brighter than a mid-grey (the words' contrast was measured over a dim still), small bright things (bulbs, glasses,
  flowers, sparklers) in the top and bottom thirds where the pane rests (at 1440 the top band's two places a fifth and
  four fifths of the way across, the bottom band's at 28 and 56 percent; at a phone's width the four corners of the
  middle third, so the story holds in the centre third) · replaces `wedding-toast` (`PRIVACY_STILL`: one id, then
  re-run the contrast sweep).
- **Board ideas**: the freeze-and-measure method (`_scratch/mkt-wiring/contrast.mjs`) is the legibility step ROADMAP's
  :83 asks `lab:demo` for, now proven on a production page and worth a board's tooling · the lens is the album's own
  privacy gesture, and `privacy-lens.ts` + `lens-stage.tsx` are one photograph away from dressing the guest door's wait
  or a private album's gate (:85) · a hero whose padding is its moving object's lane (the bands) cannot put the
  object under its words by construction, which the home's stream and the album page's stage solve by measurement.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule**: the veil a still for every reader, not the live ground with a still as the fallback (the
  brief's shape; measured at a quarter of the GPU process's time, the same picture) · the pools at 97 and 95 percent
  where he saw 93 and 90 · the rests as bands in two reaches, not a pixel table or the photograph's own objects · the
  hero at the board's natural height (930 and 762), so a short laptop window shows the bottom rests half · a 900 ms
  arrival for the stage and a small file for the veil · /press out of the sitemap and the one-liner dropped · the four
  Press doors' words (the nav's "Logos and brand files, ready to use.", the directory's "Press", the topic's hint, the
  llms link) · the band's usage line folded into its paragraph, as the board drew it.
- **Look at first**: `/features/privacy` at 1440 and at 375, watching the pane through one loop (16 to 18 s) and then
  with reduced motion on; then `/about#press`, and `curl -sI /press`.
