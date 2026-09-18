---
track: glass
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "46cb1737"         # the launch-prep SHA the branch was cut from
board: glass            # round one of the Glass exploration Will asked for by name (2026-09-17)
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/glass/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/systems/design-system.md
  - src/components/shared/media-lightbox.tsx
  - src/components/guest/guest-masonry.tsx
  - src/components/guest/guest-reel-overlay.tsx
  - src/components/app/host-media-grid.tsx
  - src/components/app/unsave-button.tsx
  - src/components/ui/floating-layer.ts
  - src/components/ui/floating-layer.test.ts
  - src/components/marketing/chrome/header-shell.tsx
  - src/components/marketing/sections/features/album/album-fill-grid.tsx
  - src/app/(dev)/design/sandbox/gallery-width/spec.ts
---

# lp/glass

**Goal.** Round one of `glass`: the exploration Will asked for by name ("bank a near-term agent for a
dedicated Glass exploration across marketing and app so it feels more infused to our product. Glass +
aurora atmospheric feels like a beautifully complementary identity for a media-forward product",
2026-09-17), drawn first where glass exists for a reason: **the app's chrome over photographs**. Six to
eight decisions with `defineExploration`: the glass recipe itself on one real surface, then each media
surface as its own decision, and where a surface meets a light ground its light-ground answer as its own
step (Will, 2026-09-18: draw both, ask separately). **Not in this round:** any production byte (the wiring
lands his picks), the marketing site (the header's `GlassLayer`, the overlays and the set-pieces over
media are round two), Card and the floating layer (Card ships FLAT by ruling and no one-off glass:
floating-surfaces r7), any surface that is not chrome over media.

**Binds.** The bible, the contracts, the policies. `docs/systems/design-system.md` says "there is no
translucent surface in the system": this is the one exploration allowed to break it, on the board. Bible
1 (media is the colour: the chrome stays achromatic, the photographs take the stage) and 4 (a guest page
is the host's event). `docs/PROGRAM.md` "A round returns DECISIONS": options are never forced apart; two
recipes that agree is a finding.

## What is settled, so build rather than ask

- **Where glass already is, faintly**: the masonry's like and unsave buttons (`guest-masonry.tsx:174,201`,
  `host-media-grid.tsx:53`: `bg-black/40 backdrop-blur-sm`), the app's unsave button
  (`unsave-button.tsx:42`, `bg-background/80 backdrop-blur`, so it FOLLOWS the theme), the event feed's
  action bar and its stuck filter pills, the event card's badges, the admin shell's header, the entry shell's
  scrim. Production's only rule about it: nothing inside a MOVING tile carries backdrop-blur
  (`album-fill-grid.tsx:30`). Read them; edit none.
- **The floating layer refuses glass in production** (`floating-layer.test.ts:267`) because Glass was banked:
  the board's glass lives in your own directory (a copy of the component to vary its chrome, or a class in
  your board's sheet on a real component), never a production file, so no policy trips.
- **The real condition is a photograph behind the chrome, changing**: a lightbox over full-bleed media, a
  masonry tile a guest scrolls, the reel overlay's controls over a playing reel. Draw every option over real
  photographs (the marketing set in `sandbox/home-hero/shared.tsx`'s FRAMES, or the demo event's), never a
  flat swatch; a masonry step is drawn at a phone (`tile: "phone"`), because a guest is on a phone.
- **Glass costs frames on a phone.** Measure each recipe's cost under CPU throttling (Chrome's DevTools
  protocol, `Emulation.setCPUThrottlingRate` 4) while a masonry scrolls; say the numbers on the step
  (long tasks, frame gaps). A recipe he cannot afford on a phone is not an option; a cheaper one that reads
  as glass is the finding.
- **The aurora is one light in three forms, dark grounds only** (Will, 2026-09-17), and the Library's
  Aurora entry holds it; the marriage he named ("Glass + aurora atmospheric") is round two's, on the
  marketing set-pieces. Round one may show ONE step where the recipe sits over a lit photograph, no more.
- **The asset**: the dark, low-key menu-ground photograph (ASSETS row 14) is parked for the Higgsfield
  month; use the darkest real photograph in the set and say so.

## The decisions (six to eight)

1. **The recipe** ("How much glass?"), on the lightbox's action pill over a real photograph at 1440: three
   or four close recipes (the blur radius, the tint and its alpha, the bright edge, saturation), each named
   in numbers, one recommended. Every later step wears the winner (a preview is a function of state).
2. **The lightbox**: its action pill and attribution pill in the recipe / today's flat pills / a third.
3. **The masonry's buttons** over tiles, at a phone: the recipe / today's faint glass / flat.
4. **The reel overlay's controls** over a playing reel.
5. **The host's media grid** (the same family as 3, on the host's page).
6. to 8. **The light-ground answers**, one step per surface that meets the app's light theme (the unsave
   button and any chrome that reads `background`): the recipe on paper / a light-ground variant / none.
   At least one; draw dark and light as separate steps, never a package.

## The lab you are building for

The step is the page with a dock: every option mounted once at true size, flipped or side by side, a sticky
head naming what is shown and at what scale, the answer in a sticky dock. `pnpm lab:smoke` refuses a board
over 1,200 words; `pnpm lab:demo` fails a step that is CLIPPED, UNLABELLED, NO DOCK, frozen, or whose stage
starts lower than 0.6 of a screen. The worked example is `src/app/(dev)/design/sandbox/gallery-width/spec.ts`.
Mobbin (the MCP) is there if you want to see how media-forward products wear glass over photographs;
encouraged, never required (`docs/design/guidance.md`).

**Register your board under the exception** (the only lines you add outside your `owns`):
- `sandbox/registry.ts`: the import, and the member at the HEAD of `BOARDS`;
- `(shell)/lab/boards.ts`: the import, and the entry at the HEAD of `BOARD_COMPONENTS`;
- `touchpoints.ts`: the id at the HEAD of the `SandboxId` union, into `RulingId` directly after
  `"river-visual"`, and one RULINGS row at the END of `RULINGS` (after the last row; copy river-card's
  shape, `board` block included);
- `touchpoints.test.ts` takes NO line.
Other lanes add theirs at the same places; the Orchestrator merges keep-both. Never reorder or reformat.
`pnpm design:rules` regenerates the artifacts (allowed in the lane check).

## Verify, and the gate

The board at 1440 and 375, reduced motion honoured, every recipe's cost measured. Dev server on port 3132,
stopped by port (`lsof -ti tcp:3132 | xargs -I{} kill {}`), never an unscoped kill. The gate, each step on
its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`,
`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3132`,
`pnpm lab:demo --board glass --base http://localhost:3132` (0 failing).

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **Does the lightbox's backdrop belong in round one at all?** The goal names the pills, the tile chips
  and the reel overlay; the overlay BEHIND the photograph is the fourth piece of the lightbox's chrome
  and the one place glass changes what the product feels like rather than what it looks like, so it is
  drawn as `behind`. Recommended answer: keep it, because it measured cheap (22ms of compositor work
  against the wall's 8ms, a seventh of what the tile chips already pay) and because the step is the only
  one that asks a product question rather than a material one. Carried on with the recommendation.
- **Is the quiet grade one rule or two materials?** `grades` asks it as a decision, and the answer sets
  whether the Library gets one glass entry with a `grade` prop or two. Recommended: one entry, two
  grades, the quiet one DERIVED (half the blur, no edges, a little more tint) so a later retune of the
  recipe moves both. Carried on with the recommendation.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. `docs/systems/design-system.md` says "there is no translucent surface in the system" and the
  floating layer refuses a `backdrop-filter`; both stay true until Will rules, and the wiring round is
  what edits them.

## Deferred (ROADMAP one-liners, bucket named)

- **Lab**: `scripts/lab-demo.mjs` captures with `captureBeyondViewport: true` plus a `clip`, which makes
  Chrome resize its render surface and remount the step's iframes. On a step whose stage holds three
  frames, one comes back solid black and the pixel diff reads two identical grids as 84 percent
  different. It never fails a board, but it inflates every reading and would hide a genuinely frozen
  stage behind a false pass. The fix is one line: scroll to the top and clip in viewport coordinates
  (the window is already taller than any step). Found and worked around in this track's own capture
  script; `scripts/` is not in this lane.
- **Marketing / Glass round two**: the marriage Will named ("Glass + aurora atmospheric") on the
  marketing set-pieces, the header's `GlassLayer` and the overlays over media, once round one's recipe
  is ruled.

## Handoff (replaces the chat report)

- Head: the tip of `lp/glass`, pushed (this manifest commit; the board landed at `feb1639a` and
  the sync merge at `72366be7`). Synced with `launch-prep` at
  `c6294203bc6af7ea95a9cffc7782c67489a34440`: it had moved 16 commits, `body-type` and `voice`
  landed, both registering at the same three places, resolved keep-both with `glass` at the head
  of each list and `pnpm design:rules` re-run on the merged tree.
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` 0 · specimens 0 (120
  specimens on 90 entries) · `pnpm typecheck` 0 · `pnpm lint` 0 (9 warnings, 0 errors) · `pnpm test` 0
  (2197 tests, 233 files) · `pnpm build` 0 (254 static pages) · `pnpm lab:smoke` 0 (250 checks, glass
  at 671 words of the 1,200 budget) · `pnpm lab:demo --board glass` 0 (7 steps, 0 failing).
- Lane check, `git diff --name-only origin/launch-prep...HEAD`:

```
docs/design/library.md
docs/tracks/glass.md
src/app/(dev)/design/(shell)/lab/boards.ts
src/app/(dev)/design/sandbox/glass/board.tsx
src/app/(dev)/design/sandbox/glass/fixtures.ts
src/app/(dev)/design/sandbox/glass/glass.css
src/app/(dev)/design/sandbox/glass/measured.ts
src/app/(dev)/design/sandbox/glass/recipes.ts
src/app/(dev)/design/sandbox/glass/spec.ts
src/app/(dev)/design/sandbox/glass/surfaces.tsx
src/app/(dev)/design/sandbox/registry.ts
src/app/(dev)/design/touchpoints.ts
```

  Owned paths, this file, the three registration lines, and `docs/design/library.md` (generated by
  `pnpm design:rules`). No production file moved.

### The decisions, one line each

Cost is Chrome's compositor trace (`Display::DrawAndSwap`) over a three second scroll of forty tiles at
375, DPR 3, CPU throttled 4x; contrast is white against the pill, read off the board's own frame with
the glyphs hidden. **No filter at all is 10ms; the product already pays 127ms today**, so the spread
between recipes is small next to the spread between glass and none.

1. **`recipe` · the lightbox's action pill, 1440.** Today (8px blur, 55% black) · Veil (16px,
   brightness 0.62, 18%) · **Frost (26px, 0.55, saturate 1.6, 12%, a 16% top edge)** · Crystal (42px,
   0.68, saturate 2, 4%, both edges). Worst twelfth of the pill, over the middling photograph: today
   5.3:1, Veil 4.56, Frost 5.23, Crystal 3.72 (under the 4.5 small text wants). Cost 127 / 170 / 177 /
   223ms. **Frost**: the most glass that keeps its text.
2. **`grades` · one material or two.** **Two**, the quiet grade derived (half the blur, no edges, +0.1
   tint) for anything read-only: 169ms against 177, and an album of badges stops reading as a stack of
   panes.
3. **`behind` · the lightbox's backdrop.** **The album, blurred, at half brightness** · the same at 28
   percent · today's 90 percent black wall. 22 / 23 / 8ms: one full-screen pane costs a seventh of what
   the tile chips already pay, which is the round's biggest surprise.
4. **`tiles` · the chips over gallery tiles, 375.** **The quiet grade** (169ms) · the full recipe
   (177ms) · flat, no filter (10ms, about seventeen times less). Flat is the only real escape if a
   phone struggles; quiet is glass a phone can afford.
5. **`reel` · the controls over a playing reel, 375.** **The recipe's dark glass** · white glass as
   today · flat white. The only white chrome in the product, beside a solid white Download.
6. **`row` · the host's tile row, 1440.** **One bar holding three glyphs** (56ms) · three separate
   panes (93ms) · today's three chips. One blurred region per tile instead of three: 40 percent less,
   and it reads as one control rather than three.
7. **`paper` · the app's light theme, 1440.** **Dark glass whatever the theme** · paper glass following
   it (a white tint over a brightened backdrop, ink glyphs) · dark glass with a brighter edge. Asked on
   its own step, never packaged with the dark one.

- **Captures** (true size, over real photographs, never committed):
  `/private/tmp/partyreel-captures/glass/`, 30 files: `recipe-{today,veil,frost,crystal}.png` at 1440
  over the darkest photograph plus `-mid` and `-bright` sets, `grades-{two,one}.png`,
  `behind-{album,dim,wall}.png`, `tiles-{quiet,full,flat}.png` at 375, `reel-{dark,white,flat}.png` at
  375, `row-{bar,chips,today}.png`, `paper-{dark,paper,edge}.png`, and `_page-recipe-375.png` /
  `_page-tiles.png` for the step itself at both widths.
- **Assets requested from Will**: none. ASSETS row 14 (the dark, low-key menu ground) stands; until it
  lands the board uses the darkest real photograph the repo holds (`concert-confetti`, mean luminance
  50 of 255) and says so on the step.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Look at first**: `behind`. It is the one step that changes what the product feels like rather than
  what it looks like, and the measurement inverted the assumption the round started with: the
  full-screen pane is the cheap one and the forty little chips are the expensive one.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-18). Round one of the Glass exploration Will banked by
name returned seven decisions at `/design/lab/glass`, drawn where glass exists for a reason: four
recipes named in numbers on the lightbox's action pill, then one grade or two, what sits behind the
photograph, the chips over tiles at a phone, the reel's controls, the host's row as three panes or one,
and the light ground on its own step. Every option is a real app screen in a real viewport over real
photographs, on copies of the app's chrome under the board's own directory, so no production byte moved
and the floating layer's refusal still stands. Every number under a frame was measured rather than
computed: contrast off the rendered pill, cost off Chrome's compositor trace under a 4x throttle, which
found that the product already pays seventeen times the flat cost on its tile chips while a
full-screen pane costs a seventh of that.
