---
track: identity-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "6a1d56f5"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/ui/
  - src/app/globals.css
  - src/app/theme.css
  - src/components/guest/camera/
  - docs/systems/design-system.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity.json
  - src/app/(dev)/design/sandbox/identity/spec.ts
---

# lp/identity-wiring

**Goal.** Will's three settled identity traits in production: the halo on every focusable atom, the shrink on every action, and the bright edge on everything that floats.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3136 is yours; 3000 is Will's desk.

**From Will's desk 3 answers on identity r4** (his verdicts: `docs/reviews/identity.json`; the board's own drawing of each: `src/app/(dev)/design/sandbox/identity/`, its option code is the spec):
1. **focus = halo:** "a quiet ring of light round it: a fine line of ink stands 2px off the control over a clear band, in a soft aura (grey on paper, light in the room); it gathers in as it arrives." Lands: every focusable atom's focus-visible: keys, fields, switches, checks, radios, a slider's thumb, tabs, the shutter.
2. **press = shrink:** "the control gives under the finger by about two pixels at every size, from a chip to the 44px key, the way a phone's own controls do." Lands: every action's active state: buttons, chips, segments, the shutter and the code chip.
3. **edge = floating:** "every pop-out takes the edge in place of its hairline, on paper too; in the room every dialog, sheet and panel takes it on its free edge. Cards stay flat." Lands: `globals.css`'s bright edge (`data-lit`), carried from media to the surfaces the answer names, on dark grounds only.

Change only these three traits, one home each (a token or a utility, never per-component copies), and nothing of the atoms' forms: identity r5 (a board, in parallel) asks the field, the buttons, selected and the toggles as one set, and brand r2 (Afterglow, picked on desk 4) owns colour and light, so the edge keeps today's light until its pick. Reduced motion lands each at once. Pin each by a test that fails on the old code (a focusable atom without the halo, an action without the press, a floating layer without the edge), and keep `popup-kinds.test.ts` and the Library's specimens green. Wiring rigor: the whole gate; walked on your port at 1440 and 375, by keyboard (focus) and by pointer (press), in the room and on paper; the PREMISE lines `lab:smoke` prints for the boards whose `lives` include `src/components/ui/` listed in your Handoff.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Does a menu's or a popover's trigger give under the finger too?** Recommended, and built: no, as production
  already had it (`press-shrink` skips `[aria-haspopup]`). Radix anchors the layer to its trigger in the press's own
  frame, so a shrunk trigger would hang the menu a pixel or two off where the trigger springs back to; the menu
  opening is that press's answer.
- **Does the camera's shutter take the house's two-pixel give?** Recommended, and built: no. Its press is a camera's
  (the face sinks to 0.9 and turns red to film), which says photo or video; its focus is the halo like every control's.
- **Do the body panels (the marketing nav's panel, the code card) take the edge in the room?** Recommended, and built:
  not now. His answer and the board's nine screens name the display's pop-outs and the work layers; a body panel is
  the page's own material (white on paper, where no light shows), so it keeps its hairline until a board draws it.
- **Does a call site that gives an atom a ring of its own keep it over the halo?** Recommended, and built: yes, and the
  halo leaves whole, never its band behind. That is how Create's name on its rule opts out (`focus-visible:ring-0`, as
  the board treated it: "no field atom"); the marketing nav's triggers, the only other atoms a call site ringed, now
  wear the halo (the lane check's one line).

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md` (45607b367): the identity's opening (the atoms' forms still shadcn's, their focus,
  press and floating light the house's); a section, "The atoms' focus and press" (the halo in the ring slot and the
  opt-out, its band a ground's token with the photograph's set and the dark subtree, `--halo-at`, `--halo-band`,
  `data-halo` and the error ring's scope, no box-shadow transition, the press's landing and let-go, `--press-scale`,
  the popup trigger, the camera's shutter); the elevation contract's ring (the display's edge left it); the bright
  edge (what floats wears it, the paper step and `--lit-r`, the scrolling layer, the toast's `::before`); the
  floating-layer contract's materials; the toast's edge and halo composed past sonner.

## Deferred (ROADMAP one-liners, bucket named)

- Design: the product's hand-rolled controls move onto the halo (118 call-site lines spell `focus-visible:ring-*` on
  elements of their own beside the atoms' one mark: `grep -rn "focus-visible:ring" src --include=*.tsx`).
- Design: Crystal's lip and hairline compose through Tailwind's inset slots, so a glass round keeps them under the halo
  (the halo replaces its `box-shadow` while it holds focus, as the old ring did).
- Design: a quick layer that scrolls itself (the Display menu's popover, a long dropdown) scrolls an inner body, so
  its light stays whole when scrolled.
- Design: the contact form's topic `SelectContent` names a corner of its own (`rounded-xl`), so its paper light is off
  concentric at the corners: wear the display's corner or name `--lit-r`.
- Lab: the customize board's camera frame composes production's camera parts without `dark`, so a light session's
  frame shows paper's halo on black (the board's own wrapper; it leaves with the board).

## Handoff (replaces the chat report)

- **Commits, pushed:** 8ae51835a (the three traits and their test) and 45607b367 (design-system.md). No sync:
  launch-prep moved (album-order's merge 9f400ed6d, records, two cuts) but nothing into my reads (`identity.json`, the
  identity spec), and the merge is clean (`git merge-tree --write-tree HEAD origin/launch-prep` printed a tree, no
  conflict).
- **Gates, each on its own exit code, on 8ae51835a's code** (45607b367 adds the doc alone): typecheck 0, lint 0, test 0
  (1012 files, 12595 tests), build 0 (`✓ Compiled successfully`, 268 pages; the built CSS carries `focus-halo`,
  `press-shrink`, `lit-display`, `halo-arrive`), `lab:smoke --base http://localhost:3136` 0 (`212 checks, 0 failing`,
  `SCOPE all: src/app/globals.css`). Logs: `../partyreel-wt/_scratch/identity-wiring/gate-*.log`.
- **PREMISE: none printed.** The boards whose `lives` include `src/components/ui/` or globals.css are `identity` and
  `brand`, and neither has an open ask in its current round (identity r4's eight asks are all on the ledger).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file +
  `src/components/marketing/chrome/marketing-nav.tsx`, one line deleted: the quiet trigger's own
  `focus-visible:ring-2 focus-visible:ring-ring/40`, which as a call-site ring would have replaced the halo on the
  marketing nav's triggers while its links wore it.
- **focus=halo:** `@utility focus-halo` (globals.css, THE FOCUS HALO) worn by every focusable atom in
  `src/components/ui/` (Button in every variant and size, chips, segments, tabs, Input, Textarea, SelectTrigger,
  Switch, Shutter, CodeChip, CodeMat, Badge, GlyphCount, the code field's caret slot by `data-halo`, the nav's trigger
  and link, the Add's Cancel, sonner's toast and buttons) and by the camera's shutter, reel, Retry and shot keys;
  `--halo-gap` and `--halo-bloom` on every ground, a photograph's set on `data-surface="photo"` and Button
  `on-photo`/`glass`; it arrives from `--halo-t` in 140ms and leaves at once, inks the destructive colour in error, and
  is an outline under forced colours.
- **press=shrink:** `@utility press-shrink` on Button (0.96, small keys 0.95, the CTA 0.98, rounds 0.92), chips,
  segments and tabs (0.95), the code chip (0.92), the code mat (0.98), the shutter (0.94), the Add's Cancel (0.98), the
  camera's Retry (0.95) and shot keys (0.92); it lands at 0ms and lets go on each atom's 150ms.
- **edge=floating:** `lit-display` in `floatingDisplay` (its `ring-1 ring-border` gone), `lit-work` in
  `floatingWorkSurface` (popup.tsx and sheet.tsx read it now), the toast's `::before` with its border clear, all in
  globals.css's THE EDGE ON WHAT FLOATS: quick layers on both grounds (a pixel in on paper, concentric through `--lit-r`,
  which the tooltip's corner is spelled through), work layers in the room on their free edge (a dialog all round, a
  sheet along its top, a panel and the responsive Sheet at a desk down its left, nothing on a screen, a cover or a
  fixed-side Sheet).
- **The camera** is `dark` (its controls read the room's tokens in a light session too); the reel's fade moved to
  `.cam-reel-film`, and the reel stands 6px in from the glass so its halo is whole.
- **The pin:** `src/components/ui/identity-traits.test.ts`, 24 tests, all red on launch-prep's sources
  (`_scratch/identity-wiring/old-code-check.log`: `Tests 24 failed (24)`), green here.
- **Walked on 3136** in a headless Chrome of my own (scripts and shots in `_scratch/identity-wiring/`): by keyboard, the
  halo on a key, a chip, a tab, a field, a switch, a select, the shutter and the code chip at 1440 and 375, paper and
  room (`walk-focus.mjs`, `shots/focus-*`); by pointer, every give and clock (`walk-press.mjs`: the 32px key 0.96, a
  give of 3.96 by 1.28px, held at 0s and let go at 0.15s); the light on a menu, a popover, a tooltip, a select, a toast
  and the popup's shapes and the responsive Sheet, paper and room, both widths (`walk-edge.mjs`, `probe-frames.mjs`,
  `shots/edge-*`); reduced motion (the halo whole at once), a photograph's halo on on-photo and glass, a field in
  error, Create's opt-out leaving no band, the nav, the caret slot moving with a typed digit, forced colours (an
  outline, no layer light), a menu's trigger and a disabled key never giving (`walk-extra.mjs`, `walk-optout.mjs`,
  `walk-otp-nav.mjs`, `walk-antagonist.mjs`); the camera's controls in its own `dark` (`walk-camera.mjs`).
- **Assets requested from Will:** none.
- **Board ideas:** the check, radio and slider production still lacks (the board drew them on stand-ins) would arrive
  wearing the halo and r5's toggles.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** (1) a menu's trigger never gives (Q1); (2) the camera's shutter keeps a camera's press
  (Q2); (3) body panels keep their hairline (Q3); (4) a call site's own ring replaces the halo (Q4); (5) the band is
  painted, so on paper a white atom merges with it and the code chip reads 2px larger, as the board drew it; (6) a
  field shows the halo on every focus, a tap included (the board's note); (7) a glass round gives up Crystal's lip and
  hairline while it holds focus, as with the old ring; (8) a work layer on paper generates a transparent light (a
  handful open at once) rather than none; (9) the code chip, the code mat and the shutter now give under reduced
  motion too, at once, as Button always did; (10) chips and tabs left `transition-all` for named properties on the
  house's emphasis curve; (11) the camera's reel stands 6px in from the glass.
- **Look at first:** a menu on paper, its light a pixel inside the screen's edge, and a dialog in the room
  (`shots/edge-dropdown-menu-1440-light.png`, `shots/edge-popup-1440-dark.png`); then Tab through Account or Settings
  on paper at 375, where the fields live.
