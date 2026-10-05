---
track: library-specimens-2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "735ccbdc"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/(shell)/library/compositions/
  - src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/app/event-feed/event-hub-head.tsx
  - src/components/app/create-event-wizard.tsx
---

# lp/library-specimens-2

**Goal.** Two Library specimens the ROADMAP asks for: the hub-head specimens draw the real facts strip, and Create's whole room is a composition anyone can press through with no session.

## The brief

**The work** (dev-only, so the light gate applies: `docs/PROGRAM.md`, "Speed over proof in exploration"; typecheck, lint, the Library's tests, `pnpm lab:smoke --base http://localhost:3131`):
1. **The Library's hub-head specimens** (`HubCoverDemo`, `HubBandDemo` in `library/compositions/composition-demos.tsx`) hand `HubCover` no `arrivals`, so they draw the facts strip's flat quiet line. One prop each draws the real one; the entry's lede in `gallery-demos.tsx` still calls the facts "today's" (say what the strip is).
2. **A Library composition of Create's whole room.** The wizard's `create` stand-in prop already draws it with no row written, so every screen, the add step's night included, can be pressed through with no session.

Fixtures only: no Server Function, no network. Nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app. Port 3131 is yours. Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is at its end; a successor may resume you).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and listed again under "Calls his to overrule".

- Is the hub-head's "Tonight" lit on open, its newest photograph a few minutes old on the page's clock, so it quiets after a quarter-hour as the hub's strip does? Recommended: yes; the lit end is the strip's signature state and the Library is where it can be seen. The cost is a specimen that is not byte-stable (only distances are drawn, so server and browser paint the same marks and nothing mismatches). Overrule: a fixed quiet night (`TONIGHT_AGE_MINUTES` in `compositions/hub-night.ts` past `LIT_WITHIN_MINUTES`).
- Does Create's composition draw in the lab's `Frame` (a same-origin iframe at 375 and 1440) or in a div? Recommended: the frame. The room is `fixed`, its type ladder is a `vw` clamp and the carry flies her words in viewport coordinates, so a div draws the browser's width and a transformed one (`WhatStaysDemo`'s trick) offsets every flight by the frame's own place. Overrule: a div at the Library's column.
- Does the composition include the door at the plan's limit as a third specimen? Recommended: yes, it is a screen of Create; See Pro is held, since the plans' sheet is a real Checkout door.

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md`, the facts strip's line: it no longer names the Library's specimen as the case that draws the flat quiet line (the specimens hand a night's arrivals now) (`11f80b8d8`).

## Deferred (ROADMAP one-liners, bucket named)

- Code hygiene: `create-event-wizard.tsx` moves focus with the global `document` (`document.getElementById(questionId)` in the two effects that focus the question), so drawn in any other document (the Library's frame) the question never takes focus; read `room.current?.ownerDocument`.

## Handoff (replaces the chat report)

- **Commits, pushed to `origin/lp/library-specimens-2`:** `938cc9f06` (the hub-head specimens), `e0b597609` (Create's room), `11f80b8d8` (the one-line doc fix), then this manifest alone (its sha is the chat line). `origin/launch-prep` had not moved since the base (`b4dd8d74f`; `git rev-list --count HEAD..origin/launch-prep` = 0 at the last fetch), so there is no sync commit.
- **Gates (the light gate, `docs/PROGRAM.md` "Speed over proof"), each on its own exit code, on `e0b597609`'s code (nothing under `src/` changed after it):** `pnpm typecheck` exit 0 (`_scratch/library-specimens-2/typecheck.log`); `pnpm lint`, the whole repo, exit 0 with no warning (`lint.log`); the Library's tests, `vitest run design/gallery "design/(shell)/library" src/components/lab src/components/app/create-event-wizard`: 33 files, 279 tests passed, among them `specimens.test.ts`, `gallery.test.ts`, the lab's `boundary.test.ts` and the wizard's own; `pnpm lab:smoke --base http://localhost:3131`: 128 checks, 0 failing, scope "library: yes", and it visited `/design/library/create-room` and `/design/library/hub-cover` (`smoke.log`). No full test run, no build, as the light gate has it.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths (`composition-demos.tsx`, `gallery-demos.tsx`, new `create-room-demo.tsx` and its test, new `hub-night.ts` and its test, all under `library/compositions/`) + this file, and two exceptions: `src/app/(dev)/design/gallery/specimens.generated.json` (the specimens' source artifact, regenerated with `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`: `specimens.test.ts` fails until it matches the entries, so a new specimen cannot land without its five lines) and `docs/systems/host-app.md` (one stale parenthetical, above). `library/components/gallery-demos.tsx` (also owned) needed no edit.
- **Item 1, the hub-head's real strip:** `HubCoverDemo` and `HubBandDemo` each hand `HubCover` an `arrivals` prop, `TONIGHT` (`nightArrivals(now - 3 min)` in new `compositions/hub-night.ts`: 214 photographs over a wedding's night, runs of Add with the toasts' rush and a dinner lull), and take their album count from it; `before` hands `[]`. The entry's `for`, lede and two hints (`compositions/gallery-demos.tsx`) now say what the strip is. Seen in the Browser pane at 1440 and 390: 52, 104 and 160 marks by tier, "214 photos & videos, landing now", the newest 2, 3 and 5 marks lit, the end dot lit; the week before draws 19, 36 and 54 waiting marks and "No photos yet"; no hydration warning in the console. `hub-night.test.ts` pins it (5 tests: 214 photographs, oldest first at the minute given, a shape with a rush and a lull, a lit end of a handful of marks, and `arrivalsOf` of the same manifest equals it).
- **Item 2, Create's whole room:** new `compositions/create-room-demo.tsx` (`CreateRoomDemo`, `CreateRoomScene`, `standInCreate`) and entry `create-room` (new section "Create", at the head of `COMPOSITION_ENTRIES`): the real `CreateEventWizard` over `create={standInCreate}` (answers after 1.1 s with an event nobody wrote, `qr_style` kept), in the lab's `Frame` at 375 by 812 and 1440 by 900 (zoomed down to the column by `FitToWell`, the frame's own viewport unchanged) and the door at the plan's limit (`atCap`, one capped event). Pressed by hand through every screen at 375 (name, the add step with its night, the look, Create event, the beat developing and arriving) and at 1440; the carry's flight sampled every 40 ms in the laptop frame goes from the field's words (520, 392) to the head's line (667, 17), so a flight is measured in the frame's own viewport as it must be. Held: Get it ready (the location stays `/design/library/create-room`, the beat stays) and See Pro (no dialog opens in either document); links are swallowed by the frame. Start again remounts the room with the field focused. `create-room-demo.test.tsx` pins it (8 tests; removing the hold fails the two hold tests, checked by hand).
- **What the specimen does that production does not:** the name's field does not take focus as the room opens (the first scene stands `inert` for its first commit, so a frame never takes the Library's keyboard focus); the room's two focus moves read the global `document`, so in a frame the question never takes focus (Deferred); Create leaves its `pr-just-made-event` flag in `sessionStorage` as ever, and the scene takes it back when it goes.
- **ROADMAP lines this satisfies (the Orchestrator's to delete):** "Create: a Library composition of the whole room…", "Design: the Library's hub-head specimens…" and "The lab: a Library specimen of Create's room whole…". That last line's `lab:demo` clause is not met: `lab:demo` presses the open steps of boards, and a Library entry is not one; the carry and the develop were held by hand, as above.
- Assets requested from Will: none
- Board ideas: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- **Calls his to overrule:** "Tonight" is lit on open and quiets after a quarter-hour (the Questions' first); Create is drawn in a real-viewport frame, not a div (second); the door at the plan's limit is a third specimen with See Pro held (third); the name's field takes no focus as the room opens here.
- **Look at first:** `/design/library/create-room` on any `pnpm dev` (any key): press through the phone's frame to the beat, Start again, then the laptop's and the door; and `/design/library/hub-cover` for the lit strip on "Tonight" (it quiets a quarter-hour after the page loads).
