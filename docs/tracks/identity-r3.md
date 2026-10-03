---
track: identity-r3
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c925e48f"            # the launch-prep SHA the branch was cut from
board: identity
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/identity/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity.json
  - src/components/ui/
  - src/app/globals.css
---

# lp/identity-r3

**Goal.** identity round 3: actions and fields as one system in three directions (keys plus wells, all rings, a new third idea), each shown inside real screens; plus two layer extras (white pop-outs over the dark room, the light edge beyond media cards).

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule. Milestone 34 (round 12) ships to `main` while you read: build nothing heavy (no `pnpm build`, no lab crawl) before the Orchestrator's message that its gate has ended; read, plan and write tests meanwhile.

**Will's answers (identity r2, his desk on build 45, 2026-10-03), in full:**
- voice=camera; layers=display; status=lights. These are settled and wired by `identity-wiring` at the source. Your drawings wear them: production's atoms once it merges, the board's own sheets before.
- actions=? "Please see next question's note for both answers. However, the 'corners' options here is what inspired my 'not devtool ish' comment in the last review batch, particularly the corners and loading state, so exclude that moving forward. Will mention options 1 and 2 next."
- fields=? "I'm split on last question and this one. Rings for both feels like the easiest for 'modern consumer', but also puts us back closer to the generic shadcn look we wanted to break away from. Rings for last but wells as you recommend here leaves some focuses rings, some corners, which is bad. I like wells (especially recessed inputs for subtle difference against page color) and don't mind using the viewfinder corners for focus only, including last answer. Let's launch another exploration, exploring the keys (last) plus wells (this) direction together versus all rings, plus a new third idea of anything you can think of, and including a couple in UI examples to get a feel for both in use. Like the corners last question, we can drop the corners here too, too close in the devtool direction."
- layers=display: "I like the slightly cleaner design of this one (and black surfaces getting attention on white body when popped in), but curious if doing the same for those opposite (white surface popouts to get attention on black body) would also look good, worth an exploration and curious to hear your thoughts. I also really did like the light edge and wouldn't mind an exploration around potentially keeping that infused beyond media cards. It makes the media card themselves look much more rich."

**The asks:**
1. **`system`**: actions and fields together, one decision, in three directions.
   - Keys and wells: bevelled keys sinking on press; recessed wells, a subtle difference against the page; the viewfinder's corners as the focus mark on both, and nowhere else.
   - All rings: pills and soft outlines, with ring focus.
   - A new third idea of your own.
   - No corners as a style anywhere, and no autofocus "hunting" loading state.
   - Each shown on its atoms in every state, and inside two or three real screens no round-13 lane rewires: Account, billing, the profile setup, the guest's Add sheet, the door's steps. That's "a couple in UI examples to get a feel for both in use".
2. **`room`**: display's inverse in the room (white pop-outs over the dark body), drawn beside a one-step lift (graphite on black). The Orchestrator's view, given to Will: a white sheet over a dark party room is striking but flashes at night. Draw both honestly, so he can see.
3. **`edge`**: the light edge he liked (matte's 1 px top highlight, keys' bevel) carried onto display's surfaces and beyond media cards (cards, sheets, the cover's glass), against none.

Retire r2's answered asks into the board's settled lines: voice, layers and status are wired. Drawings at 1440 and 375, paper and room. Start your headless captures only after the Orchestrator's message that the milestone's gate has ended.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/identity/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `identity`, its title, `surface`, `desk: 10` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3136`; `pnpm lab:demo --board identity` at 1440 and 375 with its knobs, pressing every step; `registry.test.ts` and `queue.test.ts`; your Handoff names the screens each direction is shown in.

## Questions (a recommended answer each; the Orchestrator relays them)

- One focus mark per system? Built yes: keys lock with the corners, rings with a ring, ink with the cursor (inside a key or field, round a switch or check); `identity.test.ts` holds it. Carried on the board (`one-focus-mark`).
- Does a system redraw the head's atoms (the shutter's light, Crystal, the white primary, the code chip)? Built no: they keep event-header's surfaces and take the system's shape, press and focus mark only. Carried (`head-atoms`).
- Screens at rest or in use? Built in use (a name typed on Account, the password changed on Settings' door, a guest typing it at the album's door), every option caught in the same moment. Carried (`in-use`).
- Fields at 40px in every system? Built yes, as round two carried it; actions keep production's ladder. Carried (`field-height`).
- "The door's steps": built both sides, Settings' door (the host's gates, the segmented choice, the password field) and the album's password step (production's `EntryShell` and `PasswordGate`, the guest's one form at a private album).
- The light edge drawn is production's own bright edge (`[data-lit]`'s falloff, the polished form of r2 matte's 1px lip), replacing a surface's hairline, on dark surfaces only; Crystal takes it through its own `--glass-lip`. Recommended: keep production's falloff as the one edge.
- For the Orchestrator: the board has drawn viewfinder's material (`sheet/material.ts`: silver paper 0.972, a near-black room 0.085, the display's tokens) under every frame since r1, while production's grounds are 0.995 and 0.105 and `identity-wiring`'s brief names the voice, layers and status but not the material. Recommended: `identity-wiring` (or the next wiring) wires the material's grounds with the display's tokens, since every pick so far was judged on them; otherwise a ROADMAP line.

## System-doc edits (in place, owned facts only)

- none (`design-system.md` is `identity-wiring`'s this round; no fact of this lane's lives in a system doc)

## Deferred (ROADMAP one-liners, bucket named)

- Now: Design: once `identity-wiring` merges, the identity board's own copies of round two's picks (`sheet/index.ts`'s `SETTLED`: the voice, the display, lights) leave so its frames stand on production's (from `identity-r3`).
- Now: Design: wiring identity r3's system pick grows `Input`, `Select` and `Textarea` from 32 to 40px; a screen laid out on the 32px field (an inline edit beside a 32px button) wants a look in that wiring's captures (from `identity-r3`).

## Handoff (replaces the chat report)

- Work commits `c1d643ed` (the round-three board) and `467c607c` (the guest's door, the loupes, ink's meter, the knobs named), pushed to `lp/identity-r3`; this manifest's commit is the head. No sync: `origin/launch-prep` moved only by records, `cost-model`'s PRICING.md and the main sync, and `git diff --stat c925e48f origin/launch-prep -- src/components/ui src/app/globals.css src/app/theme.css src/components/lab src/components/guest src/components/app/event-settings 'src/app/(dev)/design/sandbox/identity' docs/reviews/identity.json` is empty.
- Gates on `467c607c`'s tree, each its own exit 0: `pnpm typecheck`; `pnpm lint`; `pnpm test` (811 files, 9,585 tests); `zsh scripts/build-lock.sh pnpm build`; `pnpm lab:smoke --base http://localhost:3136` (5 checks, 0 failing, the board 678 of 1,200 words); `pnpm lab:demo --board identity` at 1440, at `--width 375`, and wearing `screen=375`, `show=door|gate|actions|fields`, `night=add|menu`, `lit=menu`, `ground=paper` (eight runs, 3 steps each, 0 failing; one warning, below).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/identity/` and this file, no exceptions.
- `system` (recommended keys): Keys and wells (bevelled keys sinking a pixel, recessed wells, the lock as the one corner and only on focus, three breathing lights for loading), All rings (r2's rings on both, a ring closing in, an arc), and Ink, this lane's idea (every control a quiet tone with no line; whatever you press, choose or type in turns to ink, near-black on paper and white in the room; focus is the cursor, a ring of the inverse inside; a press blinks to ink; working fills a meter along the key's floor). Each shown on Account and billing, Settings' door and the guest's door (each in use), and on every action and every field in all seven states, paper beside the room at 1440 and two phone pages at 375 (`sheet/keys.ts`, `rings.ts`, `ink.ts`).
- `room` (recommended graphite): the display as wired, graphite one step up, and white, the display's inverse, in the room's tokens every pop-out reads (`sheet/room.ts`), drawn on every pop-out with paper's display beside it, the guest's Add rising at the thumb at night, and a host's account menu.
- `edge` (staged after `room`, recommended everything that floats): media only as built, everything that floats (every pop-out on both grounds, every sheet, panel and dialog in the room), every dark surface (plus the room's cards and Crystal's lip), drawn on every surface with four loupes magnifying a pop-out, a card, a photograph and a glass round, and on a host's menu over Account's cards (`sheet/edge.ts`).
- Retired: r2's five asks into the opening's settled and earlier lines; the corners' styles, the hunting loader, and the losing r2 sheets (actions, fields, the instrument and display voices, matte and corners layers, readouts and corners status) deleted; Review's view gone (`rooms-wiring` rewires it). The head's stand-ins now mount production's `Shutter`, `CodeChip`, `CodeMat` and the `AlbumCover`, so ROADMAP's line on identity's head stand-ins is done (delete it).
- New tests in `identity.test.ts`: a rule that inks the corner marks answers focus or keeps them hidden, and no loading state moves them; keys draw no ring and rings and ink no marks; the edge waits on the room.
- `lab:demo` warning, honest: with `lit=menu` at 1440 media and floating read as one picture, since a one-pixel edge on a whole screen drawn at half size is under a pixel; the loupes carry that comparison, and at 375 the menu shows it. The guest's Add left the edge's places for the same reason (FROZEN at 1440).
- Assets requested from Will: none.
- Board ideas: the phone's Add sheet (`responsive-menu`'s rows) blurs the cover behind it, so the guest's own Add and glass rounds go soft the moment she presses; a sheet that dims without blurring would keep the album she is adding to in view.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: `system=keys` (his lean; ink if a bevel is too much ornament for billing); `room=graphite` (white flashes at a dark party; the display if one object on both grounds matters more); `edge=floating` (every dark surface if the room should feel lit everywhere); the four carried calls above.
- Look at first: the system step on Account in the room, then Ink and Show: The guest's door at 375; the room step's sheet (paper's display beside the room's three); the edge's loupes.

## Where I am

- Done and handed off: the board, the gates and this Handoff. Nothing is running (the dev server on 3136 is stopped; no headless Chrome is open).
