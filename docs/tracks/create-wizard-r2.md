---
track: create-wizard-r2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "7a875407"            # the launch-prep SHA the branch was cut from
board: create-wizard
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/create-wizard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/create-wizard.json
  - docs/reviews/disposable-mode.json
  - src/components/app/create-event-wizard.tsx
  - src/app/(app)/dashboard/new/
  - src/components/app/qr-preset-picker.tsx
  - src/lib/events/readiness.ts
  - docs/systems/host-app.md
---

# lp/create-wizard-r2

**Goal.** Create round two: the room's experience designed whole, screen by screen, in his layout (steppers at the top, the question just under them, the answer's space in the centre, one button at the foot), with the night compare, the code's look and the lit beat each redrawn for the room.

## The brief

**Why.** Will answered `create-wizard` r1 on 2026-10-02 (`docs/reviews/create-wizard.json`): `shape=screen` (a room of its own), `mode=night` (the cards playing the night on a slider), `hand=lit` (the code alone, lit). His notes, verbatim:
- on `shape=screen`: "Much better direction, though some of these screens (how guests add, code's look, the beat) could all be improved. May be better design to always keep the question up top so users aren't searching for the spot of the new one in a centered group each time, keeping the button at the bottom, and using the center space as needed. The name screen, for example, would be "Name your event" up top, input center, continue bottom. Then on the next screen for how guests add, the "How will guests add photos" will also be at the top and give more space in the center for clearer UI. Knowing we're giving it a room of its own, think we could use a second-layer exploration to design that room experience flow perfectly. Love the subtle steppers up top now, question would be a bit below that, lower at the top."
- on `hand=lit`: "I like this direction more because once they've created their event, we'd rather continue funneling them into the event rather than stop here and ask them to simply explore the guest experience. This screen presents more cleanly with less going on (first win), but also keeps hosts in the event flow where they can explore the event as a guest from their (ideally) completed host event page rather than mid-setup. That should feel like a final payoff, not mid-point distraction."

**Settled, drawn in every option:** the room; his layout (subtle steppers at the top, the question just under them and always in one place, the answer's space in the centre, one button at the foot); night; lit, its beat funnelling into Get it ready and Settings' first step (the hub's "See it as a guest" is the payoff, `event-header` r2's, never mid-setup); and round one's settled lines (one field, the code's look a step on samples, the beat once, the camera's step after the name, the door at the cap).

**Round two's asks** (yours to shape; each a decision drawn whole): `add`, the night compare built for the room's centre; `look`, the code's look on samples; `beat`, the lit code's arrival, its acts and what is left; `flow`, how one screen becomes the next, Back, and the steppers; and `name` only if its centre holds a real decision. The camera's step mounts the disposable foundation's control (`camera-settings`, being built now) when the wizard is wired, so draw it as that control's place. Folded in as a drawn detail: Create's hand-off lists what is left without the account's storage (`/dashboard/new` reads none; the ROADMAP's Host line).

**Who asks what this round:** identity owns the atoms (draw in production's); the dashboard, the hub's head and the hero are their own boards.

**The direction, one for every board and wiring this round** (Will's notes, 2026-10-02):
- **Bespoke and experiential**, sleek and modern (never vintage), sophisticated (never playful-messy: "for grids, I'd prefer not to get messy and begin tilting anything"), minimal yet high-information with far less text, and the bible's ten (`/design/library`: media is the color, premium is the floor).
- **Who it is for**, his words with this desk: "Want to ensure we feel bespoke without getting too dev-tool-ish, remaining a modern consumer app usable for anyone at any event (it's okay if grandma and grandad slip through, would rather frame this as cool to a younger expected host/guest crowd, probably 18 [parties] to 50ish [event guests, conference attendees). Don't want to build a boring app just for the least tech-friendly guests. Seems like our core entry -> upload -> view path is pretty clear for anyone."
- **His role**: "I'm just the tastemaker at this point - let's act accordingly, drive your best ideas across our site/app/platform as the world's leading design engineer." Build and draw your boldest real answer; he picks and steers.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/create-wizard/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `create-wizard`, its title, `surface`, `desk: 60` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and stands on the board as a carried call (`spec.ts`, `carried`), his to overrule there.

- `name`: is the name's centre a decision of its own? Recommended no, so `name` is not asked: the name alone at its
  size; at a phone the keyboard (drawn) holds the lower part of the screen and Continue rides on it. Overrule: the name
  typed onto what guests meet first, the album's door.
- `reveal`: what of the camera's own setting does Create show once the camera is picked? Recommended its develop time,
  in the place `camera-settings` (disposable-foundation's control) mounts: 9 am tomorrow, or straight away; the 24 is
  the server's count, never a setting. Overrule: nothing, the develop time waits in Settings.
- `night`: does the night play by itself as the add step opens? Recommended once, 8 pm to the party, then it rests for
  her hand (reduced motion opens on the party). Overrule: it waits for her drag.
- `close`: on the beat, where does Go to your event go, now that the foot holds one button? Recommended the close at
  the top, which on the beat leaves for the event's page. Overrule: a quieter second press beside Get it ready.
- `room`: does Create's hand-off say when the account runs out of room? Recommended yes, past 85% as on the hub (the
  wiring passes `/dashboard/new` the account's storage; ROADMAP's Host line). Overrule: room stays the hub's.

## System-doc edits (in place, owned facts only)

- none (a lab round: the board's folder and this manifest)

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits**: `97aa8aa0` (round two drawn whole) and `63f82c80` (measured at both widths, polished), on
  `lp/create-wizard-r2`, cut from `26596e48`, pushed. No sync: launch-prep moved only by records and milestone 33's
  record (`git diff --stat 26596e48 origin/launch-prep -- src/ docs/reviews/` is empty).
- **Gates on `63f82c80`**, each exit 0: `pnpm typecheck`; `pnpm lint`; `pnpm test` (747 files, 8,902 tests, through
  the lock); `zsh scripts/build-lock.sh pnpm build`; `pnpm lab:smoke --base http://localhost:3135` (22 checks, 0
  failing; the board reads 839 of its 1,200 words); `pnpm lab:demo --board create-wizard --base
  http://localhost:3135` and again with `--state screen=1440` (4 steps each, 0 failing, every frame whole above the
  dock at 1440 and 375). Logs in `../partyreel-wt/_scratch/create-wizard-r2/` (`build.log`, `demo-375.log`,
  `demo-1440.log`).
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/create-wizard/`
  (twelve files, round one's `shells.tsx` and `steps.tsx` deleted) + this file. No exceptions.
- **The board** (`create-wizard` round 2, desk 60, lab only), every screen in his layout (`room.tsx`): the steppers
  quiet at the top, the question 24 px under the head at a phone and 36 at a desk on every step (read off each frame
  as "the question N px down"), the answer's space in the centre, one button at the foot; dark, at 375 and 1440.
- `flow` (first): the room holds still (Back at the thumb), each screen slides in (Back at the head's left), or each
  answer rises into the head (recommended: the name titles the room, a pick drops into its stepper, the head is the
  way back). Four frames each: **Try it** (Create running: Continue, Back, the head's way back, the name a real
  field, the picks and the night live, Create event playing the held beat), the change played there and back, two
  screens at rest. One drawing at `p` for the still and the played change (`Between`).
- `add`: his night built for the centre: side by side (recommended), one phone with a switch, the pick in front.
  Live as the step opens (the night plays once); the camera picked shows its develop time where `camera-settings`
  will mount (`RevealRow`). The camera drawn in disposable-mode r3's picks (timeline, contact sheet).
- `look`: the code large with its four corners, the code where guests meet it (recommended: the code card held up
  and the room's screen, side by side at a desk), every look whole. Live as it opens on Classic. Paper is never
  drawn as a place: the print stock is the classic shape whatever the look.
- `beat`: the sample develops into her code (recommended), the code rises into its light onto Settings' steps, the
  code alone then the hand-off as a sheet (a floating card at a desk). Three frames each: as it arrives (playing
  where motion is welcome), at rest, and her storage at 92%, room joining what is left (production's `readiness`,
  given `storagePct`). Get it ready leads on; See it as a guest is never offered.
- Every caption is read off its frame (words to read, the phones' and codes' sizes, Back's place, the action's
  reach, ticks) and says THE CENTRE OVERFLOWS should the answer's space spill: none does at either width.
- **Assets requested from Will**: none (the marketing stills stand in, as on every board).
- **Board ideas**: the code's look never reaches paper (`print-stock.tsx` draws the classic shape at zero client JS);
  drawing the four presets server-side, as `FooterQr` draws the classic, would carry the look onto the table cards ·
  the four looks themselves (Bold's coral corners, "Playful dots") predate the room and the identity round; the
  share studio (ROADMAP) could redraw the set so the step offers looks worth choosing.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none. For the wiring, if `room` stands:
  `/dashboard/new` passes the account's storage into `newEventFacts` (no migration; the hub already reads it).
- **Calls his to overrule**: the four recommendations (`flow=carry`, `add=pair`, `look=places`, `beat=develop`) and
  the five carried calls under Questions (`name` not asked, `reveal`, `night`, `close`, `room`).
- **Look at first**: the `flow` step's Try it in each option (press Continue twice, then the name in the head or Back),
  then `beat`'s develop arriving (its first frame plays where motion is welcome).
