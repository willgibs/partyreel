---
track: identity
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "04afe52d"            # the launch-prep SHA the branch was cut from
board: identity
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/identity/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/ui/
  - src/app/globals.css
  - src/app/theme.css
  - src/lib/glass.ts
  - docs/systems/design-system.md
  - src/app/(dev)/design/(shell)/library/
  - src/app/(dev)/design/rules/bible.ts
---

# lp/identity

**Goal.** Open Partyreel's identity board: three or four complete atomic families, each one identity across every primitive, judged on a specimen and on three real screens, so the product stops reading as a shadcn library at the atomic level.

## The brief

**Why.** Will's library prompt, 2026-10-02, verbatim:

> Our component library still substantially resembles the original shadcn foundation without diverging enough to create an identity of our own. It makes our experience feel generically AI-designed, because even with more custom layouts and features, we still present as a Shadcn library at the atomic level. Please run as many explorations as needed to make Partyreel feel distinctly bespoke.
>
> I recognize there's only so many ways to design some smaller components, such as an achromatic button. However, the goal is to feel distinct as a sum total of all of our parts, not to simply make each of our borrowed components drastically different individually.
>
> The library components simply represent the progress we've made so far, not a locked vault. That's the importance of Rising Tides - absolutely everything is unprotected and may be re-litigated in search of better, and ultimately best, experiences and systems. Cautious steps only slow us down.

**The first ask, `family`.** Three or four complete atomic families, each one identity across every primitive:
- actions: buttons, icon buttons, links and chips;
- fields and selection: inputs, selects, switches, toggles and segmented controls;
- surfaces and overlays: cards, sheets, dialogs, popovers, menus, toasts and tooltips;
- status: badges, progress, skeletons, avatars and empty states;
- the materials, type and light the family stands on, and its interaction motion (rest, hover, press, focus, disabled, error).

A family is a sum, not a set of restyled parts. Name each by its idea, and keep them as far apart as real answers are.

**How each is drawn:**
- **A specimen sheet** of the atoms in their states.
- **Three real screens, redressed:** the host hub's head (with tonight's checklist and corner mark), a Settings step page, and the guest's Add sheet.
- **How the screens are made:** mount production's own components inside the frame under a scope that applies the family's tokens and atom variants. This is the fix at its source, and it keeps the comparison honest.
- **Widths:** every frame at 1440 and 375.

**Fixed points:**
- The bible's ten are Will's. If a family's idea bends one (for instance "media is the color", achromatic chrome), draw it so and name the principle in that option's costs.
- Every family keeps one token set.

**More asks.** Stage them behind `family` (`after`) only where a family's own details are a real second decision, such as its type pairing or its density. Later rounds narrow by atom group inside the picked family, as many as it takes, so don't ask everything now.

**Lives:** `src/components/ui/`, `src/app/globals.css`, `src/app/theme.css`, `src/lib/glass.ts` and the Library's component catalog. Its pick is wired at the source, so every screen changes at once.

**The direction, one for every board this round** (Will's notes, 2026-10-02):
- **Bespoke and experiential,** with the disposable-mode boards' creativity as the bar. On those boards: "These are so much cooler than the current host dashboard, standard event pages for both host and guest, and other areas of our app. Really creates a bespoke, experiential feeling. Going off my previous notes about wanting to redesign most of our app and especially breaking away from the shadcn generic AI build feel, this is the kind of creativity I like to see."
- **Sleek and modern,** never vintage ("our far more modern app design, which is only getting sleeker as we iterate").
- **Sophisticated, never playful-messy:** "for grids, I'd prefer not to get messy and begin tilting anything, the slight rotation may make us feel too playful for more sophisticated events".
- **Minimal yet high-information,** with far less text ("Many parts could be reshaped into more minimal yet high-info-conveyance UI, very text heavy right now").
- **The bible's ten** (`/design/library`): media is the color, premium is the floor, elegant simplicity.
- **His role:** "I'm just the tastemaker at this point - let's act accordingly, drive your best ideas across our site/app/platform as the world's leading design engineer." Draw your boldest real contenders, as far apart as the real answers are.

**Who asks what tonight, so no two boards ask one decision:**
- `identity` owns the atoms: buttons, fields, chips, cards, sheets, menus, toasts, tooltips, avatars, and the controls' materials, type and motion.
- `host-dashboard` owns the dashboard page.
- `event-header` owns the hub's head and the guest album's head.
- `create-wizard` owns the create wizard.
- `locked-door` r3 owns the door's reveal and idle loops.
- `disposable-mode` r3 owns the disposable camera, its waiting room and its save.
- `demo-framing` r3 owns the home hero's stage and the demo's door.

A page board draws composition, layout, hierarchy and its page's own expression in production's atoms. It names any new atom an option needs, and spends no option on a button's style.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/identity/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `identity`, its title, `surface`, `desk: 10` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The family** is the board's own ask (`/design/lab/identity`, step `identity.family`): Editorial, Soft, Crystal or
  Viewfinder beside today. Recommended: **Viewfinder**, the one family only Partyreel could wear (the party's own act,
  shooting, as the language of every control: keys and round dials, readouts in spaced capitals, focus as four corner
  marks that lock in). If it reads as a costume on Settings and billing: Crystal.
- **Built, his to overrule:** the screens' own parts wear the family (the room cards, the checklist, the door's
  choices, drawn as each family would wire them); photographs follow each family's tile corner (square, 8px, 6px,
  2px). Both are on the board as carried calls.
- **Built, his to overrule:** no second ask staged behind `family` this round. Each family's density and type pairing
  are part of its idea (Soft's 40px Urbanist pills, Editorial's capitals), so a second question now would tune a family
  not yet picked; round two narrows inside the pick, density and the type pairing first, then by atom group.
- **Built, his to overrule:** the board draws its frames through a scene route of its own (`sandbox/identity/scene/`,
  gated like every lab route), the design root layout's own provision (`an iframe scene route (sandbox/*/page.tsx)
  renders bare`) and floating-surfaces' precedent. Production's popups ask the WINDOW which shape to be
  (`useMediaQuery`), and a portalled frame's window is the lab's, so a 375 frame drew Settings and the Add as a desk's.

## System-doc edits (in place, owned facts only)

- none (a lab-only round: no production path changed). Two production facts the round found are under Board ideas,
  for `design-system.md`'s owner.

## Deferred (ROADMAP one-liners, bucket named)

- Design: identity round two, inside the pick: its density and type pairing first, then one atom group a round (actions,
  fields and selection, surfaces and layers, status), the specimen and the three screens carried over.
- Design: the identity specimen draws event-header's five atoms as that board drew them; once event-header's picks are
  wired, mount the real ones.

## Handoff (replaces the chat report)

- **Commits:** `9ca3d890` (the board), `02498e67` (every family whole, event-header's atoms, Viewfinder recommended),
  then this manifest; pushed to `origin/lp/identity`. Branch base `ad3180e3` (`origin/launch-prep` at boot; the
  manifest's `cut` is the Orchestrator's). No sync: launch-prep has since moved by records and two lab-only boards
  (event-header, locked-door-r3), none in my `reads` and none in a file I touch (`git diff --name-only
  HEAD...origin/launch-prep`).
- **Gates on `02498e67`** (the tree they ran on, nothing edited after), each on its own exit code: `pnpm typecheck` 0;
  `pnpm lint` 0 (no warnings); `pnpm test` 0 (746 files, 8,873 tests); `zsh scripts/build-lock.sh pnpm build` 0 (the
  scene route builds as `ƒ /design/sandbox/identity/scene`); `pnpm lab:smoke --base http://localhost:3132` 0 (177
  checks; its scope ran `all` since `scripts/lab-smoke.mjs` changed; the scene route answers 200; identity reads 439
  words of 1,200); `pnpm lab:demo --board identity --base http://localhost:3132` 0 (`identity.family ok`, 5 options,
  the stage moves up to 32.61%, 1440 starts 0.30 down with 18px to the dock, 375 starts 0.35 down), and again with
  `--state show=screens` (0, moves 53.49%) and `--state show=screens --state screen=375` (0, moves 76.17%). The dev
  server on 3132 is killed.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/identity/` + this
  file + one exception: `scripts/lab-smoke.mjs`, whose `SCENES` names the board's scene route (its own comment asks a
  board that adds one to, or the `--all` crawl never visits it), with that comment no longer claiming the list is
  empty. The entry leaves with the board.
- **The board** (`/design/lab/identity`, desk 10, surface shared, round 1, one ask `family`): five options (today,
  Editorial, Soft, Crystal, Viewfinder), each one stylesheet over production (`families/`: the token set, every atom by
  its `data-slot`/`data-variant`/`data-size`/`data-state`, the three screens' few non-atom parts), drawn as a specimen
  of every atom in its states (one sheet at 1440, four phone pages at 375; the Show knob) and on three real screens
  (the hub's head tonight with its checklist and the code's corner mark, Settings open on the door, a guest's Add over
  the album; the Screen knob draws 1440 or 375). The lab's theme toggle draws every frame on paper or in the room.
  Every frame is production's own components (AppShell, the bell and account menu, `EventCodeDoor`, `EventCardsRow`,
  `EventChecklist`, `EventLinkRow`, `SettingsProvider` with inert writes, `Popup` + `DoorPage` + `SettingsNext`,
  `UploadIntentSheet`, `GuestActionDock`, every `ui/` atom, a real sonner toast); only the hub and guest pages' server
  markup is quoted around them. Each frame's caption is read off its own document (`scene/reading.ts`: the primary's
  height, corner and face, how a card and a menu end, the popup's shape and material).
- **event-header's five atoms** (the Orchestrator's note): photo-filled type, the shutter, the white primary and glass
  rounds on a photograph, the code chip and the number doors are in every specimen, drawn first as event-header draws
  them (`families/media.ts`, values from its board) and then in each family's terms.
- **Assets requested from Will:** none.
- **Board ideas:**
  - Production's `useMediaQuery` (`src/lib/use-media-query.ts`) reads the global window, so no portalled lab frame can
    draw a phone's popup, sheet or menu; a frame-window context it reads first would let every board draw them at 375
    without a scene route. (A `design-system.md` line for its owner: a portalled frame's popup takes the LAB's
    window's shape.)
  - A Radix trigger or close overwrites its child `Button`'s `data-slot` (`dropdown-menu-trigger`, `tooltip-trigger`,
    `popup-close`), so anything finding buttons by `[data-slot="button"]` (a test, a sheet, the family wiring) misses
    every trigger button; their `data-variant` and `data-size` survive.
  - Today's select trigger is `h-9 rounded-md` beside the input's `h-8 rounded-lg`, so a form's two fields disagree in
    height and corner; every family here unifies them, and a crumbs fix could today.
  - The settings popup on a page (`PopupHeader` with `up` and no description) logs Radix's "Missing `Description`"
    warning on every open, in production as here.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** Viewfinder recommended; the screens' own parts and the photographs wear the family; no
  staged ask this round; the frames through the board's own scene route; today drawn as the first option, for
  reference.
- **Look at first:** `/design/lab/identity?session=identity.family` in the room (dark): the five tabs on The specimen at
  1440, then Three screens at 375 (the Add sheet over the album is where Crystal's glass and Viewfinder's camera read
  best), then the lab's theme toggle to paper.
