---
track: identity-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
  its own rounder corners (cards 12, menus 16, dialogs 20), and the 6px reached fields (identity r3's) and every screen's
  own `rounded-*`. Overrule: 6px.
- **Is a toast's state still a filled slab?** Recommended and built: no. Every toast is the display, and its state is
  its glyph lit in green, amber or red (status=lights: colour where it means something); 172 of the 190 `toast` calls
  are typed, so keeping the slabs would have left display on 11 toasts. The board drew only a plain toast. Overrule:
  success, warning and error keep their filled slabs on the display's shape.
- **Does the live mark breathe?** Recommended and built: yes, as lights drew it (the recording red rings out from the
  dot every 1.6 s, still under reduced motion). Its old reason against ("a host keeps the hub open all night, and a light
  that beat for hours would pull her eye off the album") is the call to weigh. Overrule: a still red dot.
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

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...

## Where I am

- Done and pushed: the work commit `b613fdab` (all wiring, tests, docs, Library). Gate on it: typecheck 0, lint 0,
  test 0 (813 files, 9,590 tests), build 0.
- Remaining: `lab:smoke --base http://localhost:3131` and `lab:demo --all` at 1440 and `--width 375` (dev server on
  3131: `rm -rf .next/dev && pnpm dev -p 3131`), then the Handoff below and `status: handed-off`.
- Captures: `../partyreel-wt/_scratch/identity-wiring/before/` and `after/` (the harness `shoot.mjs` needs an
  uncommitted scratch route, `src/app/(dev)/design/zz-identity-scratch/`, deleted before the gate).
