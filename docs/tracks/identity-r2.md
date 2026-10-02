---
track: identity-r2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Each is built as recommended and drawn on the board as a carried call (`spec.ts` `carried`), so his answer rides the
review line as `call:<id>=yes|no`.

1. `rings-lock`: does every build lock focus with the four corner marks? **Recommended: no, rings lock with a ring
   closing in** (6px to 2.5px), since a mark drawn on a rounded field sits on its curve; keys and corners keep the marks.
2. `live-red`: is the live mark the recording red or today's green dot? **Recommended: the recording red**, r1's signal
   light, and now delete's own red (`--signal: var(--destructive)`), so the palette gains no hue.
3. `door-parts`: do Settings' own parts wear the atoms on the screens? **Recommended: yes**: the door's "What the link
   opens" draws as the segmented control, its gates as radio cards, the password's state as a success badge, handed
   their atoms in the scene (`scene/adopt.ts`, the drawing's, never the sheet's), as wiring would make them.
4. `field-height`: do fields keep production's 32px? **Recommended: no**: every build grows a field to 38px (wells,
   corners) or 40px (rings), found and pressed in a hand; every action keeps its height.
5. `one-empty`: how many ways is an empty place drawn? **Recommended: one** (the `empty` atom: a glyph, a title, a
   line, an action, never a dashed box), which the four drawings today become when status wires.

## System-doc edits (in place, owned facts only)

- none: the round is lab only, and design-system.md's identity paragraph (viewfinder refined in the lab a group at a
  time before it wires at the source) is still true as written.

## Deferred (ROADMAP one-liners, bucket named)

- Design: identity's head stand-ins (`views/atoms.tsx`: the shutter, the code mat and chip, the glyph count, the live
  badge, the on-photo and glass buttons) mount header-wiring's real atoms once it merges, so the board judges the
  components rather than their stand-ins (refines the "identity specimen draws event-header's five atoms" line; from
  `identity-r2`).
- Design: wiring identity's picks adds the primitives the board draws on shadcn's hooks that production lacks
  (`checkbox`, `radio-group-item`, `slider`, and its own `radio-card` and `empty`), and replaces Settings' inline door
  choices, gates and password state with them (from `identity-r2`).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/identity-r2`**: `74f2cbb6` (the board's round two), `a3524554` (polish), `1069f4dd`
  (every screen carries the groups it can; the live red), then this manifest. No sync: launch-prep moved
  (dashboard-wiring, create-wizard-r2 merged), and the one read of mine it reached is the Library's
  `compositions/gallery-demos.tsx`, which the board neither imports nor draws.
- **Gates on `1069f4dd`, each on its own exit code** (logs in the lane's scratch): `pnpm typecheck` 0; `pnpm lint` 0;
  `pnpm test` 0 (748 files, 8,907 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base
  http://localhost:3134` 0 (7 checks, the board at 721 of 1,200 words); `pnpm lab:demo --board identity --base
  http://localhost:3134` 0 (5 steps, every step draws its options, at 1440 and 375), and again 0 with `--width 375`,
  `--state screen=375` and `--state show=review`.
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/identity/**` and
  this file; no exception.
- **The board** (`/design/lab/identity`, round 2, desk 10): five asks, the voice first and each atom group staged
  after it (`after: { ask: "voice" }`), three options each; every option one stylesheet over production's atoms
  (`sheet/`: material, voice, then a build per group), drawn on its atom sheet (every state: rest, hover, press, focus,
  off, `aria-busy` loading, `aria-invalid` error; paper and the room side by side at 1440, two phone pages in a hand)
  and on Settings' door and event pages, the guest's Add, Account and billing, and Review (Show, Screen and Ground
  knobs).
- **The voice is a pure layer**: `sheet/voice.ts` sets variables (label, readout, word and say roles, figures, the
  link's mark, the meter's build) on every ground's root, and `ROLES_CSS` hands each atom its role; every build reads
  them, so nothing binds (the opening says so). Options: `instrument` (r1 as drawn), `camera` (recommended), `display`
  (my bold take: no capitals, counts bold in the loud face, the meter a lit bar).
- **The atom groups, three builds each, one line through all four or mixed**: actions `keys` / `rings` (rec.) /
  `corners`; fields `wells` (rec.) / `rings` / `corners`; layers `matte` / `display` (rec.) / `corners`; status
  `readouts` / `lights` (rec.) / `corners`. The first of each is r1's drawing refined, the second the camera in a hand's, the
  third the viewfinder's frame taken furthest.
- **The atom contract, styled exactly**: `data-slot="shutter"` (idle, sending with `--progress`, done; each build its
  own: a domed release, a phone's ring, a 24-tick frame counter in one gradient), `data-surface="photo"`, Button
  `on-photo` and `glass`, `code-mat`, `code-chip`, `glyph-count` (words in a tooltip), Badge `live`, as stand-ins
  (`views/atoms.tsx`) until header-wiring's land.
- **Folded into status**: one empty atom in every build (the four drawings today), and `AvatarGroup`'s overlap as a
  share of the face (a fifth, a quarter, an eighth by build), never a fixed 8px.
- **The sheet styles atoms only**: `identity.test.ts` refuses an ARIA label or a screen's own hook in any built sheet;
  r1's three ARIA-label selectors are gone, and the views drop `guest-action-dock`, `event-link-row`,
  `event-code-door`, `room-card` and `notification-bell` (none imported).
- **Every frame proves its words**: each caption is read off the frame (`scene/reading.ts`: heights, corners, faces,
  edges, the meter's build, the lock's kind); `lab:demo --verbose` prints them (`gate-demo.log`).
- **r1 retired with the round**: `families/` (today, editorial, soft, crystal, viewfinder), the hub view and r1's
  specimen are deleted; viewfinder's r1 sheet lives on as the material plus the `instrument`, `keys`, `wells`, `matte`
  and `readouts` options.
- Assets requested from Will: none (the frames use the bootstrap stills every board reuses).
- Board ideas: Review's selection marks (the glass circle that turns green) and Settings' step numerals are drawn
  locally; once identity wires, they could take the check and readout atoms, the last two screen parts this round
  could not reach.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the five Questions above (`rings-lock`, `live-red`, `door-parts`, `field-height`,
  `one-empty`), plus two of the lab's own: the frames hold their ground by the Ground knob (an atom sheet draws both)
  rather than following the lab's theme toggle, and a phone draws a sheet as two pages on one ground.
- Look at first: the voice step at 1440 (`/design/lab/identity?session=identity.voice`): the three voices side by side
  on paper and in the room; then actions, where rings, keys and corners differ most.
