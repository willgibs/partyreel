---
track: glass
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree, each step's own exit code: design:rules, specimens, typecheck, lint, test (N), build (M pages), lab:smoke, lab:demo
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + the registration lines + the generated files
- Each decision, one line: the surface, the options with their numbers, the recommendation, the measured cost
- Captures (paths): every option at its true size over a real photograph
- Assets requested from Will: none (row 14 stands)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
