---
track: graphite-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "42cdc1b8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/globals.css
  - src/app/theme.css
  - src/components/ui/
  - docs/systems/design-system.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity.json
---

# lp/graphite-wiring

**Goal.** Wire Will's room=graphite (the room's pop-outs, tooltips and toasts at oklch 0.29, the edge light 40%, as tokens) and give the popover the menus' collision padding.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's pick on identity r3 (2026-10-04), to wire: room=graphite.** Read the board (`src/app/(dev)/design/sandbox/identity/sheet/room.ts`, its graphite values) and `docs/reviews/identity.json`. In `.dark` only (paper keeps the display; dialogs, panels and sheets unchanged): menus, popovers, selects, the Add's rows, tooltips and toasts at oklch 0.29 (the display 0.165, the room's background 0.085), muted text at 0.77, the highlighted row a 55% ring with a 9% fill, the edge light 40% (from 30%). Every value a token in `globals.css`, so the brand round re-tints it in one change.
- **And red-team 51's NIT:** the storage ring's popover sits flush to the left edge at 375, because `src/components/ui/popover.tsx` sets no `collisionPadding`; give it the menus' 8.
- **Ownership:** `src/components/ui/`, `globals.css` and `theme.css` are yours this round; other lanes propose what they need there through the Orchestrator. identity r4 (a lab board drawing now) reads your tokens live, so keep names stable.
- **And identity r4's finding (measured on its board):** globals.css's bright edge (`[data-lit]`) draws its pixel on a padding ring that rounds to nothing under about half scale (a page zoomed out, a laptop's smaller steps), so the photographs' edges vanish at a zoomed-out desk. A 1px transparent border under the same mask holds at every scale: the board's `sheet/edge.ts` `ON` on `lp/identity-r4` (`git show lp/identity-r4:src/app/(dev)/design/sandbox/identity/sheet/edge.ts`). Wire it in globals.css and measure it at 50% and 100% zoom.
- A 1.5px line in production is a box-shadow spread: Chrome draws an outline or border width in whole CSS pixels.
- **And one press model for taps on words (crumbs-64's finding, merged before you):** the code's corner mark (`event-code-door.tsx`), `ui/glyph-count.tsx` and the pricing matrix's `RowTip` (`src/components/marketing/sections/pricing/row-tip.tsx`) each carry the same logic beside a tooltip primitive that refuses a finger: a tap toggles, a cursor's click keeps it open, a key toggles. Promote one `TapTooltip` into `ui/tooltip.tsx` and move the three onto it (the two outside `ui/` are exceptions named in your Handoff). Refine design-system.md's "A tap never opens a tooltip" with it: icon controls still never open one by a tap.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

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
