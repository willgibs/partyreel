---
track: lab-frame
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "51a68e5a"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/lab/frame
  - src/components/lab/portal-container
  - src/lib/use-media-query
  - src/components/lab/frame-window
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/PROGRAM.md
  - docs/systems/design-system.md
  - src/components/ui/popup.tsx
  - src/components/ui/sheet.tsx
  - src/app/(dev)/design/sandbox/identity/scene/page.tsx
---

# lp/lab-frame

**Goal.** Make the lab's portalled Frame a faithful window for production's own components: a frame-scoped window the media hooks read, Radix layers that live inside the frame (their popper wrapper, scroll lock and focus guards), and the glow filter host, so a board can mount production's layers at any width without quoting them.

## The brief

**Why.** Five ROADMAP lines ("The lab and the kit", quoted there) describe one fault: a board's portalled `Frame` is not a window of its own.
- A production hook that reads the window (`useMediaQuery`, `matchMedia`) inside a frame reads the LAB's window, so a frame at 375 draws a component's desk branch (event-ready had to quote Settings for it; identity solved it with a scene route of its own, `sandbox/identity/scene/page.tsx`, a document per frame).
- Radix in a frame reads the lab's window and document: a popper's wrapper takes `z-index: auto` (a menu mounted open paints under the page beside it, host-dashboard r2 repaired its own frames in `shell.tsx`), a Dialog's Title check warns falsely, and an open layer locks the LAB's page scroll and puts its two focus guards in the lab's body.
- A frame carries no glow filter host (`GlowFilter` mounts once, in the root layout), so a board cannot draw production's `Glow`, `SectionLight` or `ScreenLamp`.

**Do:** a frame-scoped window that production's media hooks read when they render inside a frame (a context the Frame provides, read by `src/lib/use-media-query.ts`; the product's behaviour outside the lab byte for byte unchanged, pinned), Radix's popper wrapper, scroll lock and focus guards kept inside the frame, and a glow filter host mounted per frame. Change nothing under `src/components/ui/` (identity's board styles those atoms and sits on Will's desk now): the fix lives in the lab's Frame and the hooks. Prove each with a test that is red on today's Frame (a frame at 375 answering a phone's media query; a menu painting above the page beside it; the lab's body scroll untouched with a frame's layer open; a Glow drawn in a frame). Then say which boards' quotes this frees (the ROADMAP's line on boards that quote a Radix layer) without changing any board: each board moves on to production's own layers in its own next round.

**Boundaries.** No board folder (`src/app/(dev)/design/sandbox/`) is yours; the lab's shell beyond the Frame only where the frame's context must be provided. The bible (`src/app/(dev)/design/rules/`) is the Orchestrator's.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --all --base http://localhost:3131` and `pnpm lab:demo --base http://localhost:3131` on every board (the whole lab, since the Frame is under every board); the four faults reproduced before and gone after in a headless Chrome of your own at 375 and 1440.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Should a portalled frame keep a drawn popup out of the tab's history?** Now that a frame answers its own width, a
  place popup (Settings, a list, a peek's sheet) drawn open at a hand's width runs production's `useBackCloses` and
  takes one entry in the lab tab's history (measured on the lane's probe: `history.state.prPopup` set at load; the
  tab's first Back pops it and the drawing stays), as a routed frame's already does through the joint session history
  (identity's scene route). Recommended: yes, the day a board draws one: `useOwnedEntry` (`src/lib/history-entry.ts`,
  not this lane's) stands down on a context the Frame provides, as `useMediaQuery` reads its window. Built: nothing
  (Deferred carries the line); no board draws one today.

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`, the lab: "A portalled `Frame` is its own world" refined in place into "is a window
  of its own" (the scene waits for its sheets; the frame's window for the media hooks; the lock and guards on the
  frame's body, the lab's kept for its own layers; the glow host; what still reads the lab's window; its elements'
  own prototypes).
- `docs/systems/design-system.md`, the glow engine: "`GlowFilter` mounts once, in the root layout" refined into "once
  per document" (the root layout and each portalled lab frame).

## Deferred (ROADMAP one-liners, bucket named)

- The lab and the kit: production code that reads `window.matchMedia` itself still answers for the lab's window in a
  portalled frame (`ui/sheet.tsx`'s phone open focus, `use-keyboard-inset.ts`'s desk and coarse tests,
  `help-palette.tsx`, `cinema-hero.tsx`, `demo-modal/opens.ts`, `live-reel-view.tsx`'s orientation,
  `report-queue.tsx`); the element's own `ownerDocument.defaultView` (as `album-stream.tsx` reads) or the media hook's
  window would answer for the frame, and `use-scroll-direction.ts` (the `MarketingHeader` line) could read the same
  window (from `lab-frame`).
- The lab and the kit: a place popup drawn open at a hand's width in a portalled frame takes an entry in the lab tab's
  history (`useBackCloses`; a routed frame's already does); `useOwnedEntry` standing down on a context the Frame
  provides would keep it out (from `lab-frame`, its Question).
- The lab and the kit: in a portalled frame radix's focus trap still listens on the lab's document (FocusScope's
  focusin and focusout, which a frame's focus never reaches), and a frame's elements wear the frame's own prototypes,
  so production's `instanceof HTMLElement` answers false there: Settings' popup drawn in a 375 frame leaves focus on
  the frame's body where production focuses its panel (`popup.tsx`'s open focus; measured on the lane's probe);
  `nodeType` or the element's own window's constructors answer in both (from `lab-frame`).
- The lab and the kit (in place of the line on "the boards that quote a Radix layer", whose three quotes are gone):
  the quotes a portalled `Frame` frees, each moved in its own board's next round: take-home's download menu
  (`menus.tsx` quotes `ResponsiveMenu`'s rows), create-wizard's light (`create-wizard.css`'s gradients standing in for
  `SectionLight` and `ScreenLamp`), host-dashboard's popper repair (`shell.tsx`'s `FRAME_SHEET` z-index line), and
  demo-framing's three own `GlowFilter`s (`hero.tsx`, `specimen.tsx`, `tiles.tsx`: a second host in the frame's
  document now, identical and after the frame's own) (from `lab-frame`).

## Handoff (replaces the chat report)

- Work commit `ebb0b5c8`, then `e1d48e94` (design-system.md only: the GlowFilter line rewrapped, one clause on the
  frame's prototypes), both pushed; the head is this manifest's commit. No sync: `origin/launch-prep` moved from the
  cut (`51a68e5a`) to `891767cc` (crumbs-52, crumbs-53 and disposable-camera merged), none of it in this lane's owns or
  reads but ROADMAP's records, and `git merge-tree HEAD origin/launch-prep` merges clean.
- Gates on `ebb0b5c8`, each on its own exit code (logs `_scratch/lab-frame/gate-*.log`): `pnpm typecheck` 0;
  `pnpm lint` 0; `pnpm test` 0 (790 files, 9,347 tests); `zsh scripts/build-lock.sh pnpm build` 0;
  `pnpm lab:smoke --all --base http://localhost:3131` 0 (188 checks, 0 failing); `pnpm lab:demo --all --base
  http://localhost:3131` 0 (19 steps, 0 failing, "Every step draws its options"). On `e1d48e94` the six test files
  that read the docs (prefetch-policy, links, exploration, gate-dev-cache, no-em-dash, content-policy) 0.
- Lane check, `git diff --name-only origin/launch-prep...HEAD`: `docs/systems/design-system.md` (System-doc edits),
  `docs/tracks/lab-frame.md`, `src/components/lab/frame-window.tsx`, `src/components/lab/frame.test.tsx`,
  `src/components/lab/frame.tsx`, `src/lib/use-media-query.test.tsx`, `src/lib/use-media-query.ts`: each under an
  `owns` prefix, this manifest, or the listed system doc. `owns`' `src/components/lab/portal-container` went unused:
  the container lives in `src/components/ui/portal-container.tsx`, untouched, and the frame still provides it.
- The four faults, each reproduced on the frame before and gone after in a headless Chrome of the lane's own, a 1440
  lab with a 375 frame and a 375 lab with a 1440 frame (`_scratch/lab-frame/probe.mjs` over a local route never
  committed), and each pinned by a ★ test in `src/components/lab/frame.test.tsx`, red on the frame before (six failed
  of twelve with `frame.tsx` and `use-media-query.ts` put back to `51a68e5a`, the six older ones green):
  - **A frame answers its own width.** `useMediaQuery` reads the window a `MediaWindowProvider` hands it, the page's
    own where none is (`src/lib/use-media-query.ts`); `FrameWindow` hands the frame's. Live: lab 1440 with a 375
    frame, the reading desk to hand and Settings' popup `panel` to `screen` (the phone's bar and Back); lab 375 with
    a 1440 frame, hand to desk and `screen` to `panel`. The product's side is pinned by `use-media-query.test.tsx`
    (the global `matchMedia`, one subscription taken and given back, a false server render).
  - **A menu drawn open stands above the page beside it.** The `auto` was not the lab's `getComputedStyle` (it reads a
    frame's element right: `50`): the scene was portalled before the frame's copied `<link>` sheets loaded, so radix
    read its content's z-index in an unstyled page and kept it (a menu opened by a press after the sheets stood at
    50). The scene now mounts once the copied sheets have loaded, under a 3 s ceiling (`frame.tsx`'s copy effect).
    Live: the wrapper `auto` to `50`, the page's z-10 card over the menu to the menu over the card, at both widths.
  - **The lab's page untouched beside a frame's open popup, the frame's page locked.** Before: the lab's body
    `data-scroll-locked="1"`, `overflow: hidden`, two focus guards, its wheel `0 -> 0` at 1440 and its finger and
    wheel `0 -> 0` at a phone (touch emulated); the frame's body unlocked and unguarded, its wheel `0 -> 300`. After:
    the lab's body bare, its wheel `0 -> 400`, finger `0 -> 267` and wheel `267 -> 467` at a phone; the frame's body
    locked (`overflow: hidden`, its wheel `0 -> 0`) with radix's two guards at its edges. The lab's own palette beside
    it keeps its lock, guards and wheel stop while open and gives them back on close (`probe-palette.mjs`). Radix
    writes all of it onto the realm's document, so `frame-window.tsx` settles the lab's body against the lab's own
    layers, runs a cancelling wheel or touch listener on the lab's document only while the lab holds a lock (with the
    body settled and that gate off, the ★ test's wheel stays cancelled), and re-makes the lock and guards on the
    frame's body while a layer of the frame holds them.
  - **A glow in a frame finds its host.** `FrameWindow` mounts `GlowFilter` in the frame's document: `#glw-warp`
    there (before: the lab's only). A sharp square under `filter: url(#glw-warp)` in the frame warps with the host and
    draws plain without it, the dropped chain (`_scratch/lab-frame/shots/g4-warped.png`, `g4-no-host.png`); a resting
    `throw` lamp measures no difference either way (its gradients are already soft).
  - And the Title check: a production dialog in a frame no longer logs radix's false "requires a `DialogTitle`" error
    and its Description warning (four and four per probe run before, none after; a ★ test): a `radix-` id the lab
    does not hold is looked up in the frames.
- The ROADMAP lines this closes: "Radix in a portalled `Frame` reads the lab's window and document"
  (`host-dashboard-r2`), "a portalled frame carries no glow filter host" (`create-wizard`), "a production hook that
  reads the window" (`lab-sitting`), "a radix layer open inside a portalled frame still locks the LAB's page scroll"
  (`lab-sitting`), "`ui/responsive-menu.tsx` cannot be drawn in a lab frame" (`flow-refresh`: it portals into the frame
  since `lab-sitting` and reads the frame's query now), and `PopupQuote`'s premise (`safety-refresh`: production's
  popup draws in a frame at its own shape now). "The boards that quote a Radix layer" (`desk-tune-3`) is replaced by the
  Deferred line naming today's quotes (its three are gone: event-ready and disposable-mode retired, demo-framing's
  welcome sheet no longer drawn).
- The boards this frees, none changed: take-home's download menu (`menus.tsx`: "QUOTED, BECAUSE THE REAL MENU CANNOT
  BE DRAWN IN A FRAME"), create-wizard's light (`create-wizard.css`: "THE LIGHT IS A STAND-IN FOR THE AURORA"),
  host-dashboard's popper repair (`shell.tsx`'s `FRAME_SHEET`), demo-framing's three own `GlowFilter`s; identity's
  scene route exists for the window ("so a production popup answers to the frame's own window", `lab-smoke.mjs`).
- Assets requested from Will: none.
- Board ideas: identity's next round draws its frames portalled (one React tree, knobs without a reload, no scene
  route to gate and crawl) now that a portalled frame answers its own width; the `MarketingHeader` scroll line closes
  through the same window (`use-scroll-direction.ts` reading it).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule:
  - Radix's page-wide effects are kept in the frame by settling the lab's realm (lab-only, readied by the first frame
    and kept: the lab's body observed and settled against its own layers, the lab document's cancelling wheel and
    touch-move listeners gated on its own lock, `getElementById` looking a `radix-` id up in the frames), not by a scene
    route per board (identity's), which gives each frame a realm of its own at the cost of a route, a reload per knob
    and the key's plumbing.
  - The frame's lock and guards are radix's, re-made on the frame's body (react-remove-scroll-bar's margin-mode rule
    with the frame's own scrollbar width, the two guard spans as radix makes them); radix's cancelling of a wheel on a
    nested scroller outside the layer is not re-made (the body's overflow is what stops the frame's page).
  - The scene waits for the frame's copied sheets under a 3 s ceiling, so no frame is ever left empty.
  - The id lookup reaches the frames for `radix-` ids only (radix's own existence checks), not for every id.
- Look at first: `src/components/lab/frame-window.tsx` (`readyTheRealm`, `settleLab`, `settleFrame`), then the six ★
  tests at the foot of `src/components/lab/frame.test.tsx`.
