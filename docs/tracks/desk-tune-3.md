---
track: desk-tune-3
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "df7d6754"            # the launch-prep SHA the branch was cut from
board: event-ready
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-ready/
  - src/app/(dev)/design/sandbox/disposable-mode/
  - src/app/(dev)/design/sandbox/demo-framing/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/ui/popup.tsx
  - src/components/app/event-settings/event-settings-sheet.tsx
  - src/lib/events/visibility-labels.ts
  - src/components/app/event-feed/review-section.tsx
  - src/components/ui/portal-container.tsx
---

# lp/desk-tune-3

**Goal.** Make Will's desk true of build 38 before his sitting: event-ready's quoted Settings head at 375 (production hides the line that repeats its arrow, since crumbs-42), its dashboard's paused word (production's uploadsLabel), disposable-mode's quoted Review head (production's count chip and actions row), and three stale comments about a Radix layer portalling to the lab page; no ask or option id changes.

## The brief

**Why.** Will sits at the desk next, on build 38's alias, and answers it once. A read-only pass re-read the 22 open asks of the five boards whose `lives` batch 10 touched (`node scripts/lab-scope.mjs --since 21697db1`) against launch-prep's code (`c46c23a8`). Every ask holds but one drawn quote: production's Settings head changed under event-ready's quoted panel (crumbs-42), and two smaller quotes of production went stale beside it. This lane is small and exact: make each quote true of production, draw nothing new, and keep every ask id and option id (his held picks are keyed by them). An option's proposal is never a claim: keep it. Verify each fix against the production file named before you write it.

**event-ready** (`src/app/(dev)/design/sandbox/event-ready/`):
1. **The quoted Settings panel's head at 375** (`settings.tsx`, about lines 125-150). It draws "‹ Maya's 30th · Settings" in the bar AND "Maya's 30th" as a visible line under it. Since crumbs-42, production's `PopupHeader` in the `screen` shape keeps a description that repeats the arrow's label for a screen reader only (`src/components/ui/popup.tsx`, `echoesArrow`, about lines 456-511), and Settings passes the event's name as both its description and its back label (`event-settings-sheet.tsx`, about lines 216-220). So a phone shows the bar and no line. Draw it as production does: keep the line in the DOM as `sr-only` (or drop it), the bar unchanged. The same quoted panel draws the 375 "Settings as it opens" frame in every `guide` option, `list=settings`'s first frame and `create=hand`'s "Get it ready" frame when walk is `rows`; the one edit fixes them all. Check the desk-width panel against production's `panel` shape while you are there (a desk's panel names the event in its line, which production keeps visible).
2. **`dashboard.tsx:295`** types `statusLabel={e.acceptingUploads ? "Open" : "Closed"}`. Production's word for a paused event is Paused, from one helper (`uploadsLabel`, `src/lib/events/visibility-labels.ts:104`). Import it: `statusLabel={uploadsLabel(e.acceptingUploads)}`. No frame draws a paused card today; this keeps the next one true.

**disposable-mode** (`src/app/(dev)/design/sandbox/disposable-mode/`):
3. **"Her Review room, quoted"** (`host.tsx`, `ReviewQueue`, about lines 495-515, drawn for `peek=waits` with review on). It draws the Review title with a right-aligned "N waiting". Since crumbs-42 production's head is `RoomHead` (`src/components/app/event-feed/review-section.tsx`, about lines 40-62): the title with the queue's count as an amber chip beside it (its " waiting" for a screen reader only), and the Select / Approve all actions on the title's row from `sm`, on a row of their own below it at a phone. Quote that shape and those classes, and the actions where production draws them with a queue. Keep the board's own line under it ("Each one develops for everyone at …"): that is the proposal, not a quote.

**Comments only** (the three say a Radix layer would portal to the lab page; since lab-sitting a portalled `Frame` provides the portal container, `src/components/ui/portal-container.tsx`): `event-ready/settings.tsx:49-51`, `demo-framing/album.tsx:34-36` and `disposable-mode/scene.tsx:19-23`. Say what is true now: the layer is quoted, and mounting production's own is the ROADMAP line below. Change no frame for these.

**Record:** one ROADMAP line under Deferred: the boards that quote a Radix layer (event-ready's Settings panel, demo-framing's welcome sheet, disposable-mode's floating surfaces) could mount production's own now that a portalled `Frame` holds its layers, so a production change shows on the desk instead of drifting from a quote (this tune's root). Under Calls, list any wording you chose that this brief did not give.

**Verify:**
- the gate (typecheck, lint, test, build), each step on its own exit code;
- `pnpm lab:smoke --base http://localhost:3131` (its scope is these boards);
- `pnpm lab:demo --board event-ready,disposable-mode,demo-framing --base http://localhost:3131`, every step at both widths;
- each changed frame read at 375 and 1440 in a headless Chrome of your own: event-ready's Settings frames (no visible name line under the bar at 375, the desk's panel as before) and disposable-mode's Review room at `peek=waits` (the chip beside the title, the actions where production puts them).
Never open `/design/lab` in Will's Chrome: his held answers live in that origin's localStorage.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/event-ready/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `event-ready`, its title, `surface`, the `desk` place this brief names (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- none: every item had its answer in the production file its brief item names; the calls this brief did not give are under the Handoff's Calls.

## System-doc edits (in place, owned facts only)

- none: `docs/systems/design-system.md` ("A portalled `Frame` is its own world") already says a layer opens inside the frame; only the boards' comments were stale.

## Deferred (ROADMAP one-liners, bucket named)

- The lab and the kit: the boards that quote a Radix layer (event-ready's Settings panel, demo-framing's welcome sheet, disposable-mode's floating surfaces) could mount production's own now that a portalled `Frame` holds its layers (`portal-container.tsx`), so a production change shows on the desk instead of drifting from a quote; event-ready's Settings also waits on a frame-scoped window, since the popup picks its shape off the lab's window (from `desk-tune-3`).
- The lab and the kit: `locked-door` (`scene.tsx:35`) and `about-press` (`about.tsx:44`, `scene.tsx:28`) still say a Radix layer opened in a portalled frame lands on the lab's page, as ROADMAP's own `flow-refresh` line on `ui/responsive-menu.tsx` does; since `lab-sitting` it lands in the frame, so each board's next round (and that line) says what is true now (from `desk-tune-3`).
- Code hygiene: `event-card.tsx:119` documents `statusLabel` as "Open/Closed (hosted)"; the word is Open or Paused since `crumbs-42` (`uploadsLabel`) (from `desk-tune-3`).

## Handoff (replaces the chat report)

- Work `a722a12f` on `lp/desk-tune-3`, pushed. launch-prep had not moved since the cut's pickup (`24f7eb11`; `git rev-list --count HEAD..origin/launch-prep` was 0 at the work and again at this manifest), so no sync commit; the head is this manifest's commit, in the chat line.
- Gates, each on its own exit code, on the tree of `a722a12f` (clean: nothing edited between the runs and the commit); logs in `/Users/gibby/local/ai/partyreel-wt/_scratch/desk-tune-3/`, the exits in `gate2-exits.txt`: `pnpm typecheck` 0 (`gate2-typecheck.log`); `pnpm lint` 0, no warnings (`gate2-lint.log`); `pnpm test` 0, 732 files and 8,713 tests (`gate2-test.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`gate2-build.log`); `pnpm lab:smoke --base http://localhost:3131` 20 checks, 0 failing, scope the three boards (`gate2-smoke.log`); `pnpm lab:demo --board event-ready,disposable-mode,demo-framing --base http://localhost:3131` 16 steps, 0 failing, at the default width (`gate2-demo-1440.log`) and at `--width 375` (`gate2-demo-375.log`), each step measured at both screens (the stage starts 0.26 to 0.30 down at 1440 and 0.32 to 0.43 at 375, under the 0.5 reach). `demo-framing.stage` and `.touch` print their "same picture" notes (options that differ only in motion, which a reduced-motion run holds still); that board changed in comments only.
- Lane check, `git diff --name-only origin/launch-prep...HEAD`: the eight source files in the items below, all under the three owned prefixes, and this manifest; no exception. Every item was read against the production file its brief item names before it was written.
- Items, paths under `src/app/(dev)/design/sandbox/`:
  - event-ready 1: `event-ready/settings.tsx:148-153`, the quoted Settings panel in a hand keeps the event's name as `<p className="sr-only">`, as `popup.tsx`'s `echoesArrow` (`:461`, `:507`) does for Settings' description and back label (`event-settings-sheet.tsx:219-220`, pinned by `popup.test.tsx:228`); the bar and a page one level in (no description) are as they were. Read in a headless Chrome of my own at 375 and 1440, dark and light (`after-guide/`, `after-1440/`, `after-list/`, `after-create/`, `light/`), and by DOM (`verify-event-ready.mjs`): in every 375 Settings frame (the three `guide` options, `list=settings`' first, `create=hand` on the rows walk) the line is a 1 by 1 `sr-only` paragraph and the head is 53.6px, the same as the page one level in; at 1440 the line is a visible 382 by 20 span and the panel is as before. The desk's panel is class for class `popup.tsx`'s content, header, body and scrim and `floating-layer.ts`'s `panel` shape (its line visible, as production keeps it): no edit there.
  - event-ready 2: `event-ready/dashboard.tsx:41` and `:297`, `statusLabel={uploadsLabel(e.acceptingUploads)}` (`visibility-labels.ts:104`: Open or Paused). No fixture is paused, so no frame changes; forced once (the 30th's fixture set to `acceptingUploads: false`, reverted before the commit) its card read Paused, never Closed, and the other two Open (`paused-card.mjs`).
  - disposable-mode 3: `disposable-mode/host.tsx:495-557` (`ReviewQueue`, `formatCount` imported at `:49`, `CircleX` dropped), the head is `RoomHead`'s (`review-section.tsx:42`) class for class: the title, the count as an amber chip beside it (" waiting" for a screen reader only), and Select and Approve all (`review-actions.tsx`'s browse face) on the title's row from `sm` and on a row of their own at 375; the board's line under it kept. Read against production's own room (the Library's ReviewSection specimen, `/design/library/compositions#review-section`, driven in my own Chrome: `compare-review-fit1.mjs`): at 375, with the board's frame drawn at 1:1, every box is the same to the hundredth (the head 66.25px, the actions at y 38.25, "Select" 75.88 by 28 and "Approve all" 104.56 by 28), the chip differing only by its count (9, not 12); the head's markup is identical modulo the count (`compare-review.mjs`, `cmp-review-375-dark.json`, `cmp-review-1440-dark.json`), and at 1440 the actions sit flush right on the title's row (y 3.05 against 3.08). Read on `peek=waits` with Review on at 375 and 1440, dark and light (`after-peek375/`, `after-peek1440/`, `light/`).
  - Comments only: `event-ready/settings.tsx:49-54`, `demo-framing/album.tsx:34-38` and `disposable-mode/scene.tsx:19-28` say the layer is quoted, not mounted, that a portalled `Frame` hands a Radix layer its own body (`portal-container.tsx`, `lab/frame.tsx:543`), and that mounting production's own is ROADMAP's line; no frame changes. The same false claim stood in two more places in the owned folders and is made true too: `demo-framing/scene.tsx:14-20` and `event-ready/code.tsx:34-35`.
  - `disposable-mode/spec.ts:67`: `review-section.tsx` joins `lives` (the board quotes its head, and a merge touching it flags the board's open asks).
- Assets requested from Will: none
- Board ideas:
  - disposable-mode's Review quote draws its grid at 2 columns at both widths, where production's `uniform` grid (`masonry.tsx:149`) is 3 columns in a hand and `auto-fill, minmax(220px, 1fr)` from `sm`, and none of the room's host note (`REVIEW_NOTE`); the brief named only the head, so the grid is as it was (at 1440 it is two 600px tiles). A quote of both would finish the room's picture.
  - the quote-parity test ROADMAP already names (a board idea from `desk-tune-2`) would also hold this lane's two hand-quotes, `RoomHead`'s classes in `disposable-mode/host.tsx` and `PopupHeader`'s screen bar in `event-ready/settings.tsx`, against their production files.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, the shape and wording the brief did not give:
  - `disposable-mode/host.tsx`: the foot row (Reject, Approve) is gone rather than kept beside the head's Select and Approve all: production draws no row at the grid's foot (its bulk bar takes the head's slot only while she selects), and at 1440 the row stood past the frame's foot already.
  - `disposable-mode/host.tsx:518`: the room's stack is production's own `space-y-2.5` (it was `space-y-4`), so the head, the board's line and the grid sit as `review-section.tsx`'s section sits (the board's album areas already use it).
  - `disposable-mode/spec.ts:67`: `review-section.tsx` in `lives`; `popup.tsx` (the Settings bar's source) is not in event-ready's, having changed 16 times since 2026-09-20, too busy a file to flag a board for: mounting production's own (the first Deferred line) is the real fix.
  - the comments' wording, which the brief did not give: `event-ready/settings.tsx:49-54` also names why production's `Popup` could still not mount at 375 (it picks its shape off the lab's window through `useMediaQuery`, ROADMAP's `lab-sitting` line), and `event-ready/code.tsx:34-35` now says the code card's layer is one this board does not judge.
  - the first Deferred line carries the frame-scoped-window clause for event-ready's Settings, which the brief's line did not; two more Deferred lines are mine (the same comment in `locked-door` and `about-press`, and `event-card.tsx:119`'s Open/Closed doc).
- Look at first: `event-ready.guide` at 375 (any option's "Settings as it opens": the bar reads "‹ Maya's 30th", "Settings", and nothing sits under it), then `disposable-mode.peek` with Review on, the option "She waits with everyone", its "her Review queue" frame at 375 (the amber 9 beside the title, Select and Approve all on a row of their own) and at 1440 (the actions on the title's row).
