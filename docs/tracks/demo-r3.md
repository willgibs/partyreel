---
track: demo-r3
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "243e7cd0"            # the launch-prep SHA the branch was cut from
board: demo-framing
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/demo-framing/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/demo-framing.json
  - src/components/marketing/sections/home/
  - src/lib/demo.ts
  - src/components/marketing/sections/features/qr/
  - docs/systems/marketing-content.md
---

# lp/demo-r3

**Goal.** Round 3 of the home hero: Will's stage hybrid (turns and centre: the link smaller, a QR bouncing in above it at each address, the stream emanating from the QR and link as one group, credits inside each card) in two or three takes, and the demo's door identity.

## The brief

**Why.** Will answered r2 on 2026-10-02:
- **Settled:** `slug=our-party`, and `touch=arrow` with his note "There should be a slight hover state so a user feels it is clickable when their cursor reaches the item." Draw the arrow and its hover as settled.
- **On `slug`:** "the demo's welcome door specifically should likely avoid this event title, can keep slug but maybe clearer name like 'Partyreel Demo' or 'Example Party' or just a custom demo door in general. I know we want to simulate the guest experience on scan, but it also seems there'd be friction if the demo is unclear overall and they land on a generic 'Our party' name."
- **On `stage`** (answered `centre`, meaning both 2 and 4), verbatim: "This is going to be a dual selection of both options 2 and 4. I absolutely love the typing and streaming taking turns so each work off of the other (new slug, new event stream, repeat). However, the address taking the stage cleans up that visual design of the item a lot, making the full screen present more polished overall, but I hate losing the stream and QR visuals. Other page heroes could definitely take some leftovers or extra ideas from our work here. But for this home hero, I was curious if we could knock the partyreel link typing font size down a little so it doesn't fight with the H1, then maybe bounce in a new QR above the input each time it's updated, and stream images off of that QR + link with the turn taking each time it updates. I'd like the QR to be vertically centered so it doesn't shift the visual balance/weight to either side, but if the QR + input could stack/overlap/somehow present as one group for the stream to emanate from, I think that would help with clarity. \"Oh, I make this event with a link/custom slug/QR, and all of our photos go in to make an album\". If the emanating photos each had a guest credit in their corner (likely within card, not on corner so it doesn't go off image). Please take this idea with a grain of salt and build your best version of the overall idea."

**Asks:**
- `stage`: his hybrid in two or three takes, your best versions.
- `door`: the demo's door identity: "Partyreel Demo", "Example Party", or a custom demo door.

His "other page heroes could take leftovers" goes in your Board ideas.

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

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/demo-framing/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `demo-framing`, its title, `surface`, `desk: 90` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

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
