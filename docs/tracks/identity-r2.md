---
track: identity-r2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "7a875407"            # the launch-prep SHA the branch was cut from
board: identity
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/identity/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity.json
  - src/components/ui/
  - src/app/globals.css
  - src/app/theme.css
  - src/lib/glass.ts
  - docs/systems/design-system.md
  - src/app/(dev)/design/(shell)/library/
  - src/app/(dev)/design/rules/bible.ts
  - src/components/app/event-settings/
  - src/components/guest/upload/intent-sheet.tsx
  - src/app/(app)/account/
  - src/app/(app)/dashboard/[eventId]/review/
---

# lp/identity-r2

**Goal.** Identity round two: viewfinder made Partyreel's own atom by atom, its voice asked first as a layer and every atom group drawn in whichever voice he picks, so one sitting settles each atom individually before the family wires at the source.

## The brief

**Why.** Will answered `identity` r1 on 2026-10-02 (`docs/reviews/identity.json`): `family=viewfinder`. His note: "Though it needs some further refinement and polish, I think this feels like the most themed/bespoke, minimal yet high-info-density-conveyance, sleek direction that fits our modern event media platform." And with the same desk: "For the new viewfinder identity ... I'd like to implement that through the lab so we can ensure these atomic elements that compose our new foundation are all individually perfect." The family is `families/viewfinder.ts` in this folder; r1's carried calls stand (the screens' own parts wear the family; photographs at its 2px).

**Round two's asks.**
1. **`voice`, the root**: how far the camera's language speaks. Build it as a LAYER of variables the atoms read (label case, tracking, numerals, meters), so every atom option renders in any voice. Options: r1's instrument voice as drawn; a consumer camera's voice (recommended: the camera in a hand, not on a bench: labels in sentence case at reading weight, spaced-capital readouts only where a camera prints them (counts, live, time), no slashed zero, meters as frames rather than tape); and one bolder take of your own. His "not too dev-tool-ish" is this ask's test.
2. **Four atom asks, each `after: { ask: "voice" }` and drawn in his voice pick**: `actions` (buttons, icon buttons, links, chips, toggles and segmented controls), `fields` (inputs, selects, switches, checks, radios, sliders, tabs), `layers` (cards, sheets, dialogs, popovers, menus, toasts, tooltips), `status` (badges and live, progress, skeletons, avatars and face rows, empty states). Three options each, inside viewfinder. If a voice cannot be a pure layer, the board says which answers bind under which voice.

**How each option is drawn.** Every atom in every state (rest, hover, press, the focus lock, disabled, loading, error), at 1440 and 375, on paper and in the room; then on real screens nobody rewires this round: Settings' door and event pages, the guest's Add sheet, Account and billing, and Review. Your views drop `guest-action-dock`, `event-link-row`, `event-code-door`, `room-card` and `notification-bell` (this round's wirings move them). Folded into `status`: the four ways "nothing here yet" is drawn today and `AvatarGroup`'s fixed 8 px overlap (the ROADMAP's lines).

**The atom contract** (header-wiring builds these in `src/components/ui/`; identity r2 styles exactly these hooks in the lab at the same time, so the names are fixed):

| Hook | What it is |
| --- | --- |
| `data-slot="shutter"` | the round Add: `data-state` `idle`, `sending` or `done`, its progress in `--progress` (0 to 1) |
| `data-surface="photo"` | any container standing on a photograph |
| Button `data-variant="on-photo"` | the white primary on a photograph |
| Button `data-variant="glass"` | the glass round on a photograph (usually `size="icon"`) |
| `data-slot="code-mat"` | the code on its white mat |
| `data-slot="code-chip"` | the code as a chip in the sticky bar |
| `data-slot="glyph-count"` | an icon and a number, its words on hover and a tap |
| Badge `data-variant="live"` | the live mark |

The heads' atoms do not exist in production until `header-wiring` merges: draw them as stand-ins wearing exactly these hooks, and style the hooks. The sheet styles atoms only: r1's screen-specific selectors (`viewfinder.ts` 254-264: `[data-code-door] button[aria-label^="Show the code"]`, `[role="group"][aria-label="This event"]`, `[role="group"][aria-label="What the link opens"]`) go, so the wiring at the source never inherits a dead selector.

**Who asks what this round:** identity owns the atoms and their voice; the dashboard, the hub's head, Create and the hero are their own boards and draw in production's atoms.

**The direction, one for every board and wiring this round** (Will's notes, 2026-10-02):
- **Bespoke and experiential**, sleek and modern (never vintage), sophisticated (never playful-messy: "for grids, I'd prefer not to get messy and begin tilting anything"), minimal yet high-information with far less text, and the bible's ten (`/design/library`: media is the color, premium is the floor).
- **Who it is for**, his words with this desk: "Want to ensure we feel bespoke without getting too dev-tool-ish, remaining a modern consumer app usable for anyone at any event (it's okay if grandma and grandad slip through, would rather frame this as cool to a younger expected host/guest crowd, probably 18 [parties] to 50ish [event guests, conference attendees). Don't want to build a boring app just for the least tech-friendly guests. Seems like our core entry -> upload -> view path is pretty clear for anyone."
- **His role**: "I'm just the tastemaker at this point - let's act accordingly, drive your best ideas across our site/app/platform as the world's leading design engineer." Build and draw your boldest real answer; he picks and steers.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/identity/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `identity`, its title, `surface`, `desk: 10` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

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
