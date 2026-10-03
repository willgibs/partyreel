---
track: identity-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "5dc4dee8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/ui/
  - src/app/globals.css
  - src/app/theme.css
  - src/lib/glass.ts
  - docs/systems/design-system.md
  - src/app/(dev)/design/(shell)/library/components/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/identity/
  - docs/reviews/identity.json
---

# lp/identity-wiring

**Goal.** Wire identity r2's three picks at the source, so every screen wears them at once: voice=camera, layers=display, status=lights, on paper and in the room; corner styling leaves production (corners only as focus); actions and fields untouched until identity r3 picks.

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule. Milestone 34 (round 12) ships to `main` while you read: build nothing heavy (no `pnpm build`, no lab crawl) before the Orchestrator's message that its gate has ended; read, plan and write tests meanwhile.

**Will's answers (identity r2, his desk on build 45, 2026-10-03), in full:**
- voice=camera.
- actions=? "Please see next question's note for both answers. However, the 'corners' options here is what inspired my 'not devtool ish' comment in the last review batch, particularly the corners and loading state, so exclude that moving forward. Will mention options 1 and 2 next."
- fields=? "I'm split on last question and this one. Rings for both feels like the easiest for 'modern consumer', but also puts us back closer to the generic shadcn look we wanted to break away from. Rings for last but wells as you recommend here leaves some focuses rings, some corners, which is bad. I like wells (especially recessed inputs for subtle difference against page color) and don't mind using the viewfinder corners for focus only, including last answer. Let's launch another exploration, exploring the keys (last) plus wells (this) direction together versus all rings, plus a new third idea of anything you can think of, and including a couple in UI examples to get a feel for both in use. Like the corners last question, we can drop the corners here too, too close in the devtool direction." (identity-r3 explores actions and fields; you leave them as production has them.)
- layers=display: "I like the slightly cleaner design of this one (and black surfaces getting attention on white body when popped in), but curious if doing the same for those opposite (white surface popouts to get attention on black body) would also look good, worth an exploration and curious to hear your thoughts. I also really did like the light edge and wouldn't mind an exploration around potentially keeping that infused beyond media cards. It makes the media card themselves look much more rich." (Those two extras are identity-r3's; you wire display as drawn: near-black menus, tooltips and toasts, the chosen row light-outlined, cards flat.)
- status=lights.

**Build:** the identity board's own sheets for these three picks (`sandbox/identity/sheet/`: the voice layer's variables, the layers sheet's display, the status sheet's lights) become production's, at the source: theme tokens, `globals.css`, the atoms in `src/components/ui/`, paper (`:root, .surface-paper`) and the room. Through the atom contract header-wiring built, styling the slots that exist (`shutter`, `shutter-count`, `code-chip`, the glyph count's `data-n`, the Badge's `live`, Button's `on-photo` and `glass`): invent no new hooks. Remove any corner styling production atoms carry (a focus mark excepted). The Library's component pages show the atoms as they now are. You are the only round-13 lane editing `src/components/ui/`: the other lanes compose atoms. You merge first; the other wirings sync onto you.

**Never:** the identity board's folder (identity-r3 owns it); a screen's own layout (only the atoms and tokens move).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3131` (it crawls the Library and every board that imports an atom); `pnpm lab:demo` on every board on the desk at 1440 and 375 (the atoms move under all of them; each step still draws its options); before and after captures at 1440 and 375, paper and room, of the dashboard, a hub, a guest album with its cover and shutter, Settings, a menu, a toast and the empty states, in your Handoff.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule; none is a one-way door.

- **Does viewfinder's material wire with the picks?** Recommended and built: yes. It is r1's settled family (r2's
  `opening.settled`: "its matte body, silver on paper and near-black in the room, the recording red, and photographs at
  its 2px"), every r2 option was drawn on it, and display's flat card needs its body/card step (on Graphite paper the
  card is the page's own white, so a card with no line vanishes). Paper is a silver 0.972 with cards at 0.993, the room
  0.085 with cards at 0.15, lines ink at an alpha, `--signal`, tiles at 2px (the gap 3px), viewfinder's shadows. The
  marketing site moves with it (one `:root`). Overrule: Graphite's palette and 4px tiles stay, and a card keeps a
  hairline on paper.
- **Does the surface radius move to viewfinder's 6px?** Recommended and built: no, `--radius` stays 8px. Display draws
  its own rounder corners (cards 12, menus 16, dialogs 20), and the 6px reached fields (identity r3's) and every
  screen's own `rounded-*`. Overrule: 6px.
- **Is a toast's state still a filled slab?** Recommended and built: no. Every toast is the display, and its state is
  its glyph lit in green, amber or red (status=lights: colour where it means something); 175 of the product's 190
  toast calls are a success, a warning or an error, so keeping the slabs would have left the display to the 15 plain and
  info toasts. The board drew only a plain toast. Overrule:
  success, warning and error keep their filled slabs on the display's shape.
- **Does the live mark breathe?** Recommended and built: yes, as lights drew it (the recording red rings out from the
  dot every 1.6 s, still under reduced motion). Its old reason against ("a host keeps the hub open all night, and a
  light that beat for hours would pull her eye off the album") is the call to weigh. Overrule: a still red dot.
- **Which empty drawings become the one empty atom?** Recommended and built: the shared `EmptyState` (the likes page,
  a profile's sections) and the feed's section empty (Review, Uploads) are `ui/empty.tsx`, the lens. The dashboard's
  two photographic teasers (the ghost grid behind "Your first album starts here", the Uploads/Likes strip in its dashed
  box) are the dashboard's own page parts ("Pages are their boards'"), so they stay. Overrule: they become the atom too
  (their dashed box goes either way when the dashboard board next draws an empty account).
- **Readouts at the board's 10.5px?** Recommended and built: no, on the house `label` step (12px, 0.08em, Will's
  body-type label), semibold, tabular: the camera's spaced capitals on the ladder, never an off-ladder size. Labels and
  words were already camera's (sentence case, reading weight), so nothing else in the voice moved. Overrule: a `readout`
  step at 10.5px (theme.css plus `TYPE_STEPS`).
- **A work layer's scrim**: built as display drew it, the page half-dimmed and sharp (was 10 percent and a blur), on the
  popup, the Dialog and the Sheet (the marketing mobile menu's too); a door's own `overlayClassName` still wins.
  Overrule: the old light, blurred scrim.
- **Hand-rolled card surfaces**: Settings' step list and cards, the hub's checklist and the attended-events tile draw
  `bg-card ring-1 ring-foreground/10` themselves, so they keep their hairline (a class-coupled global rule would also
  have caught marketing's black media frames). Recommended: each becomes the `Card` atom in its surface's next lane
  (Deferred). Overrule: one scoped global rule lays them flat now.

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`: the identity paragraph (viewfinder wired with r2's three picks; r3 owns actions and
  fields); five grounds (the display, and a ground's whole pairs with `--signal`); the faint contrast numbers; status as
  light and the one empty place; readouts in the camera's voice; the rounding tokens (tile 2px, float 16px and its
  derivations, the card's `2xl`); the elevation contract (a card flat as its tone, where the ring is left); the line
  exception to "no surface token is translucent"; glass and the work scrim; the atom contract's table (code mat, glyph
  count, the live mark) and which hooks are r3's; the floating-layer contract's two materials; toasts as the display.

## Deferred (ROADMAP one-liners, bucket named)

- Design: Settings' step list and cards (`settings-rows.tsx`, `settings-furniture.tsx`, `delete-event-row.tsx`), the
  hub's checklist and `attended-events-visibility.tsx` hand-roll the card with a ring; each becomes `Card` (flat).
- Design: the help articles' pictured menus (`help/step-screens/desk-screens.tsx`) draw the body's `floatingPanel`;
  the real menus are the display now.
- Design: the brand kit (`/design/library` foundations) lists four grounds and no `--signal` or `--display*`; add the
  display ground and its tokens.
- Design: two comments still name the old room's `#040405` (`about/page.tsx`, `legal-document.tsx`).

## Handoff (replaces the chat report)

- **Commits**, pushed to `origin/lp/identity-wiring`: `b613fdab` (the wiring), `bce3e9af` (the Library foundations'
  skeleton specimen), `45eaa96a` (two doc lines rewrapped), and the manifest's own commits. **No sync**: launch-prep
  moved since the base `c925e48f` (wizard-wiring merged at `feca808e`, plus records), but none of it touches this lane's
  `reads`, and `git merge-tree --write-tree HEAD origin/launch-prep` merges clean (exit 0). The Create room it brought
  reads the room's tokens through its own `.dark`, so it wears viewfinder's room at the merge.
- **Gates on `45eaa96a`**, each on its own exit code (logs `../partyreel-wt/_scratch/identity-wiring/gate3-*.log`):
  typecheck 0; lint 0 (no warnings); test 0 (813 files, 9,590 tests); `build-lock.sh pnpm build` 0; `lab:smoke --base
  http://localhost:3131` 0 (193 checks, 0 failing). `lab:demo --all` finds no open step (every ask on the desk is
  answered), so every board's answered steps were pressed by `--only`, all 25 on seven boards, at 1440 and with `--width
  375`: 50 runs, 0 failing, every step drawing its options (`gate-demo-steps.log`, on the atoms of `b613fdab`; the later
  commits touch only the Library's foundations page and docs).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path under `owns`, this manifest, the two
  new test files beside the atoms, and these exceptions:
  - `src/components/shared/empty-state.tsx` and `src/components/app/event-feed/feed-section-empty.tsx`: the carried
    call `one-empty` makes them the one empty atom, so each now composes `ui/empty.tsx` (their callers untouched);
  - `src/components/shared/tooltip-slide.tsx`: the bulk bar's sliding tooltip reads the tooltip's material from the
    contract (`floatingTip`), or it would stay a white capsule in the room beside every other tooltip on the display;
  - the grounds' literal mirrors, each a line or two: the theme-color hexes in `src/app/layout.tsx`,
    `src/app/not-found.tsx` and `src/app/(marketing)/(cinema)/layout.tsx` (parsed before any stylesheet), the two
    `body:has(...)` grounds in `src/app/(marketing)/marketing.css`, the lab cinema stage's room in
    `src/components/lab/stage.tsx`;
  - `src/components/dev/motion-tuner-config.ts` (the tuner's baked tile and float defaults) and
    `src/components/shared/media-lightbox.tsx` (the tile radius's JS fallback): a baked value moves in three places;
  - `src/app/(dev)/design/gallery/specimens.generated.json` (regenerated from the Library's entries) and
    `src/app/(dev)/design/(shell)/library/foundations/page.tsx` (its skeleton specimen named the retired shimmer).
- **The items:**
  - Viewfinder's body (`globals.css`): paper a silver 0.972 with the card a step whiter, the room 0.085 with the card a
    step lighter, lines ink at an alpha, `--signal` beside `--destructive` in every set, tiles at 2px (gap 3px),
    viewfinder's two shadows on each ground; the mat and the slab's shadows follow.
  - The display: `--display*` on `:root` and the fifth ground `.surface-display` (whole pairs, the room's state lights,
    `color-scheme: dark`); `floating-layer.ts` gains `floatingDisplay(Panel)`, `floatingTip`, `floatingWorkSurface` and
    `floatingScrim`; `--radius-float` 16px, rows 12, a tooltip 10, a work layer a quarter rounder.
  - Quick layers on the display: the dropdown and its submenu, the select's list, the popover, the responsive menu
    (desk menu, hand rows, Cancel), the admin palette, the tooltip and the bulk bar's, every toast; the chosen row a
    light wash with a 1.5px light outline (a destructive row's in red); the palette's group heading in sentence case.
  - Work layers (the popup's shapes, the Dialog, the responsive Sheet): the body's popover, no ring or border, the
    work corner, over a half-black sharp scrim (`overlayClassName` still wins).
  - Card flat as its tone (`2xl`, no ring, a footer wash); the code mat on the card's corner with the lift.
  - Status as light: the Badge an LED and its word (readout: `label` step, spaced capitals, semibold, tabular; unlit
    ring for secondary, outline, ghost), the live mark in the recording red breathing (`live-signal`), Progress as
    twelve frames in success or (`aria-invalid`) the failure red, Skeleton breathing (`skeleton-breathe`), faces with
    no line overlapping by a quarter, the count an unlit ring, presence green, the glyph count's number a readout with
    its glyph a step back (white on a photograph).
  - Toasts: the display with sonner's dark theme always, each state's glyph lit in its colour, the Undo a small pill.
  - `ui/empty.tsx`, the one empty place (a glyph in its lens, a title, a line, an act), worn by the shared
    `EmptyState` (the likes page, a profile's sections) and the feed's section empty (Review, Uploads).
  - The Library: badge, card, avatar (a row of faces), skeleton, progress (a failed meter), the toaster (warning and
    Undo added), glyph count and the new Empty entry, all true to the atoms; `design-system.md` refined in place.
  - Tests red on the old code: `ui/display.test.ts` (the display's whole token set, `--signal` beside every
    `--destructive`, the quick layers on the display and the work layers off it) and `ui/empty.test.tsx`.
  - No viewfinder corner styling existed in production's atoms to remove (`git grep` for the marks' `--m-c`, `--m-a`,
    `lockAt` and `viewfinder` in `src/components/ui/`, `globals.css` and `theme.css` finds none; the "corner mark"
    production names is the code's door glyph beside it, a badge, not the frame); actions and fields keep their build
    until identity r3.
- **For the lanes that sync onto this**: a quick layer now carries `.surface-display` on its own element, so a lab sheet
  that redraws one (identity r3's `room`, the white pop-out) re-declares the tokens on the layer itself; an ancestor's
  set never reaches inside. The take-home board's drawn menus (`floatingPanel`) still show the body's material, where
  production's real menus are the display.
- **Verified**, headless at 1440x900 and 375x812, reduced motion, paper and room, before (build 45, the old code) and
  after: the dashboard, a hub, a guest album's Add sheet, cover and shutter (the demo event), Settings' door page,
  Account, Review, a menu with its chosen row, a popover, a tooltip, toasts (plain with Undo, success, error), badges
  and the live mark, meters, loading, faces, cards, the code mat and every empty drawing; and /pricing, /help and the
  404 (before from the alias). The contact sheet is `../partyreel-wt/_scratch/identity-wiring/captures.html`
  (`before/`, `after/`). Computed styles read in a live tab (`probe.mjs`): the menu's display ground, 16px, its edge
  and the ground's layer shadow on both grounds, the focused row's wash and inset outline, the live dot's
  `live-signal` at 1.6 s, the readout at 12px/600/0.96px uppercase, the meter's 12-frame mask, the tooltip's 10px,
  sonner's `data-sonner-theme="dark"`, the success and error glyphs green and red, the card flat at 12px, the skeleton
  breathing with no gradient.
- **Assets requested from Will**: none.
- **Board ideas**:
  - The room went from 0.105 to 0.085: the Aurora and the lamps were measured on the old room (glow-contrast's
    tables), so a quick re-measure of the cinema chapters' light on the new room.
  - The hand-rolled card surfaces (Settings' steps and cards, the hub's checklist, the attended-events tile) as one
    sweep onto the `Card` atom, so every card lies flat.
  - identity r3's `room` ask now has production's display to set the white pop-out against.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule** (each a Question above, built as recommended): the material wired (silver paper, the
  near-black room, 2px tiles), the surface radius kept at 8px, a toast's state as its lit glyph, the live mark
  breathing, the dashboard's two teasers kept, readouts on the 12px label step, the half-black sharp scrim, the
  hand-rolled cards keeping their hairline until they become `Card`.
- **Look at first**: the hub in the room at 375 (the live mark's red light and the counts as readouts, then a menu
  on the display), Settings on paper at a desk (the silver body, the panel's corner over the half-black scrim), then
  a toast with its Undo.

## Where I am

- Handed off: the Handoff above is the whole state. No process left running (the dev server on 3131 and every
  headless Chrome stopped).
