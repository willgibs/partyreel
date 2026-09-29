---
track: desk-tune
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "4d8e9e0e"            # the launch-prep SHA the branch was cut from
board: locked-door
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/locked-door/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/reviews/locked-door.json
  - src/components/guest/door/waiting-step.tsx
  - src/components/guest/door/shut-door.tsx
  - src/components/guest/door/ask-step.tsx
  - src/components/guest/door/unlisted-ask.tsx
  - src/components/guest/entry-modal.tsx
---

# lp/desk-tune

**Goal.** Make the door family board true again before Will's sitting: its "as today" drawn from the doors settings-wiring shipped, its asks' context re-read against them, and every option its own picture at a phone's width.

## The brief

**Why.** `locked-door` r2 (the door family: four open asks, `family`, `shape`, `wait`, `lost`) sits first on Will's desk, and it was drawn before `settings-wiring` (merged at `7c0fbcb1`) built the doors in production. The board's own `today.tsx` still draws the wait and the shut door as the round predicted them (its own `waitWords("today", …)` and `shutWords("today", …)`), while production now ships `WaitingStep` and `WaitingDoor` (`src/components/guest/door/waiting-step.tsx`), `ShutDoor` (`shut-door.tsx`), `AskStep` (`ask-step.tsx`) and `UnlistedAsk` (`unlisted-ask.tsx`), with their own words (`waitingCopy`, `shutDoorCopy`, `askCopy`, `unlistedAskCopy`) and the entry modal's steps. So every "as today" option compares against a door that no longer exists (`node scripts/lab-scope.mjs --since 882064e0` prints the board's PREMISE line). Will is holding this board until it is true again: his time is the scarcest in the program, so this lane is small and fast.

**Do:**
1. Make "today" production: draw each state's today from the shipped components and their copy functions, fed the board's fixtures (as the board already does for the not-found family with `NotFoundScreen`), never a copy of them; retire whatever the real components replace in `today.tsx` and `words.ts`.
2. Add the shipped door files to the spec's `lives`, so the next change to them raises this board's PREMISE line.
3. Re-read each ask's context layer (`where`, `when`, `matters`, `lands`, each option's `gains` and `costs`, `because`) and the board's `opening` (`about`, `settled`, `earlier`) against the shipped doors, and correct any line the build made false. Keep every ask id and option id (the ledger `docs/reviews/locked-door.json` names them); if an option is now the same as today, say so in its ask rather than dropping it.
4. At a phone's width (`pnpm lab:demo --board locked-door --width 375`), `shape`'s "Two, as today" and "Each state its own" draw the same picture: make every option visibly its own at 375, and check the other three asks there too.
5. Leave the lab's own layout alone: each stage starting about a screen under its question at 375 is a ROADMAP line (fold the context below `sm`), and `src/components/lab/step.tsx` is `crumbs-16`'s.

**Not yours:** production's door (`src/components/guest/`, `src/app/(guest)/`): draw it, never change it; a flaw you find in it goes under Board ideas. The ledger (`docs/reviews/`) is the Orchestrator's.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/locked-door/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `locked-door`, its title, `surface`, the `desk` place this brief names (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- none: every call is built and listed under the Handoff's calls; nothing here is a one-way door.

## System-doc edits (in place, owned facts only)

- none (the lane owns the board's folder alone, and no system fact changed).

## Deferred (ROADMAP one-liners, bucket named)

- The lab and the kit: `lab:demo` hands `Page.captureScreenshot` an in-window frame box in viewport coordinates, which Chrome reads as page coordinates, so on a step taller than its 3000px capture window every frame comes back flat or shifted (every stacked step at `--width 375`, and the laptops the `screen=1440` knob stacks); adding `scrollX` and `scrollY` to that box fixes it (probed: locked-door at 375 then draws every option with no same picture) (from `desk-tune`).
- Guests: `entry-modal.tsx` exports neither `WelcomeStep` nor `SuccessStep`, so the door family board and the help center's door screens quote both class for class; exported (or moved beside `door/`), both draw the real welcome and "You're in" (from `desk-tune`).

## Handoff (replaces the chat report)

- Work commit `2ff1436b`, pushed. No sync: launch-prep moved to `61a4ee00` (crumbs-15, loose-ends-wiring, contact-wiring) with nothing under this lane's paths or the door files it draws; its one line in a read (`guest-flow.md`, "a missing event answers moved") touches no ask, re-read.
- Gates on `2ff1436b`, each on its own exit (logs in `partyreel-wt/_scratch/desk-tune/`): typecheck 0 (`typecheck-head.log`), lint 0 (`lint-head.log`), test 0, 600 files and 6953 tests (`test.log`), build 0 through build-lock (`build.log`), lab:smoke 0, 6 checks, the board at 836 of 1200 words (`smoke.log`), lab:demo 0, four steps ok at 1440 (`demo-1440.log`).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the ten files under `src/app/(dev)/design/sandbox/locked-door/` + this file; no exception.
- Today is production (`today.tsx`): the wait is `WaitingDoor` in the entry modal's `pt-7` step box; the shut door is `ShutDoor` on its page (its words, `previous` for Priya and Dom, `UnlistedAsk` for Lena unlisted, "Already a guest? Log in" for the newcomer); the 404 is `e/[token]/not-found.tsx`'s page itself. The welcome and "You're in" stay quoted (unexported: Deferred). `waitWords("today")`, `shutWords("today")` and `UNLISTED` are retired from `words.ts`.
- `lives` gains `waiting-step.tsx`, `shut-door.tsx`, `ask-step.tsx`, `unlisted-ask.tsx` (`spec.ts`).
- Context re-read against the doors, every id kept (`spec.ts`): `family.today` (closed to a newcomer, private to someone who was in; its cost now the plain page), `family.lit` (shut, today's page and words with the lock lit: the build took its words), `wait.still` relabelled "Today's wait, as it ships" with `live` and `pick` building on it, the settled lines and the `unlisted` call marked built.
- The directions say today's words where they say what today says (`words.ts`, `furniture.tsx`): the wait reads `waitingCopy` with today's eyebrow (a clock, "Asked"), live mark and way out (`WaitHold`); the lit column's shut door reads `shutDoorCopy`; the unlisted foot is `UnlistedAsk`; the way back in is the shipped "Log in".
- At 375, a phone-width lab stacks the four phones (`scene.tsx`'s `useOnPhone`), so shape's split and bespoke differ where they differ (the wait, a sheet against a page) and pressing between two options is a blink at any state. `lab:demo --width 375` as it stands captures the stacks flat (`demo-375-upstream.log`, the Deferred line); with that line's fix (`lab-demo-docclip.mjs`) every step draws its options with no same picture, at the defaults and wearing `family=today|host|lit` (`demo-375-docclip.log`, `fixed-375-*.log`, frames beside them). OUT OF REACH at 375 is the lab's layout, left alone as briefed.
- The other asks at 375: `family` and `wait` distinct in every direction, and `lost` in all but `family=today`, where it draws one picture by design (the spec's header: today's shut door is already the 404's sibling; `follows` says "as they are today").
- Every frame is inert (`scene.tsx`): production's pieces are live (their links, the ask's POST, Use a different email's sign-out), and a frame is a picture (read in the browser: every frame `[inert]`, no focusable outside it).
- Assets requested from Will: none.
- Board ideas: production's ask (`AskStep`, "Maya lets each guest in", Ask to join) is a door state the family never draws, a fifth frame; and the welcome at a door Maya answers or an invite list shows her face and no date, which the `welcome` knob's two options do not draw.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: `wait.still` is today's wait in every direction, so the directions' waits say today's words (overrule: the round's predicted still wait, and no today in the ask); the directions' way back in is the shipped "Log in" (the round drew event-safety's "Confirm your email"); at a phone's width the strips stack (overrule: a sideways row, its difference off screen).
- Look at first: the `wait` step (still is production's held door; live and pick build on it), then `shape` at 375 (split against bespoke on the wait).
