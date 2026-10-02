---
track: desk-tune-3
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
