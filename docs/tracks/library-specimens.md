---
track: library-specimens
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "00714317"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/(shell)/library/components/
  - src/app/(dev)/design/(shell)/library/compositions/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/app/export/export-toast.tsx
  - src/components/app/export/export-walk.ts
  - src/lib/export/walk.ts
  - src/app/admin/jobs/limits-card.tsx
  - src/lib/jobs/limits-watch.ts
  - src/lib/jobs/limits-watch-limits.ts
  - src/components/ui/tooltip.tsx
---

# lp/library-specimens

**Goal.** Three Library specimens the round's lanes asked for, so lab:smoke renders their states: the download toast's states, the Plan limits card, and TapTooltip beside the Tooltip entry.

## The brief

**Why:** three lanes deferred a specimen so `pnpm lab:smoke` renders a component's states and a regression is caught:
- **small-fixes and crumbs-65:** the download toast (`src/components/app/export/export-toast.tsx`) in its states: the cancel question, "Download cancelled.", a dropped connection, a line lost mid-stream, the done state;
- **limits-watch:** the "Plan limits" card (`src/app/admin/jobs/limits-card.tsx`, presentation-only) healthy, critical, with a failed read and with gaps ("Not wired");
- **graphite-wiring:** the Library's Tooltip entry ("useless on touch", `library/components/gallery-demos.tsx`) gains a `TapTooltip` specimen beside it (`src/components/ui/tooltip.tsx`).

**How:** follow the Library's own pattern for an entry (the existing demos in `library/components/` and `library/compositions/`). Fixtures only: no Server Function, no network, never a real account. Each specimen states its component's file. A light gate is enough for Library work (dev-only, `docs/PROGRAM.md`, "Speed over proof in exploration"): typecheck, lint, the Library's tests, `pnpm lab:smoke --base http://localhost:3131`.

Nothing of yours requests Vercel (Hobby's Active CPU). Port 3131 is yours; 3000 and 3132 are not. Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is near its end).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

All three are built as recommended; each is Will's to overrule.

- **Where does each specimen live?** The download toast is a Compositions entry in a new "Downloads" section
  (`export-toast.tsx` sits in `src/components/app`, which that family exists for); the Plan limits card is a
  Compositions entry in "The operations portal", beside its sibling admin entries; TapTooltip is a second specimen
  on the Tooltip entry (Components, Overlays), whose `for` line stops saying "useless on touch", which now names its
  test and wears the `updated` mark. Recommended: as built.
- **The toast's states are fired, not drawn.** Sonner holds a toast only after a call, so no server render can carry
  one, and a drawing would copy markup the component does not export. The entry is a panel of buttons firing the real
  `exportToasts` on the page's own toaster, one toast updated in place by its id as in production; the toast's own
  controls (the x, a question's answers, Try again) walk a fixture between the states they lead to, with no request.
  All nine tones, among them the five the lanes named; a test with the real Toaster presses each and reads its
  words, so a regression fails the gate and not only a look. Recommended: as built.
- **Plan limits' states stand as whole cards** (healthy, critical, a failed read, gaps) built from the real
  `METERS`, so a new meter appears by itself, plus two short "nothing to show" cards (never read, unreadable). Six
  cards on one page repeat the card's DOM ids (`#plan-limits`, `#limit-<meter>`): harmless here (the labels they
  point at read the same) and never in the portal, which draws one. The alternative, one card and a switch, would
  leave most states outside the server render `lab:smoke` crawls. Recommended: as built.

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`, the `TapTooltip` bullet: one clause, found here. It reads its face as an element
  (`children.props`), which a server component hands a client one as a lazy reference, so a server module drawing one
  is a 500; it is drawn from a client component.

## Deferred (ROADMAP one-liners, bucket named)

- none: the three ROADMAP lines this lane answers (`docs/ROADMAP.md` lines 24, 32 and 36: the Plan limits card, the
  Tooltip entry's TapTooltip, the download toast's states) are done and are the Orchestrator's to delete at the merge.

## Handoff (replaces the chat report)

- **Commits, pushed to `origin/lp/library-specimens`:** the work head is `bd44954c4`, after `b88e9af83` (this
  manifest's Questions), `d22b2dcb0` (TapTooltip), `d9ec121bd` (the toast, the cards, their tests). No sync commit:
  launch-prep moved (compute-presign's merge, compute-lazy-sdk's cut) and `git diff --name-only HEAD...origin/launch-prep`
  names `docs/systems/uploads-and-r2.md`, `docs/tracks/compute-lazy-sdk.md`, `docs/tracks/orchestrator.md`,
  `package.json`, `pnpm-lock.yaml`, `scripts/compute-model/budget.json`, `src/lib/media-cost-policy.test.ts` and
  `src/lib/r2/{presign,sigv4}(.test).ts`: none is this lane's path or one of its reads.
- **Gates, each on its own exit code, on `bd44954c4` (clean tree, unsynced):** `pnpm typecheck` 0
  (`_scratch/library-specimens/typecheck2.log`); `pnpm lint` 0; `pnpm test` 0, 916 files and 11,277 tests
  (`test.log`); `pnpm lab:smoke --base http://localhost:3131` 0, 145 checks and none failing, `/design/library/tooltip`,
  `/plan-limits`, `/download-toast` and both family pages 200 (`smoke2.log`). No production build: the light gate for
  dev-only Library work (the brief; `docs/PROGRAM.md`, "Speed over proof"), so the Orchestrator's merge gate is the
  build.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned paths + this file + two exceptions:
  `src/app/(dev)/design/gallery/specimens.generated.json` (the derived artifact of the owned entry modules, which
  `specimens.test.ts` fails on until `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` regenerates it: 187
  specimens on 119 entries) and `docs/systems/design-system.md` (the one clause above).
- **The items:**
  - The download toast: entry `download-toast` (Compositions, new section "Downloads") in
    `library/compositions/gallery-demos.tsx`, its demo `compositions/download-toast-demo.tsx`: twelve buttons in three
    groups fire all nine tones on the page's own toaster with `WALK_COPY`'s words and `DONE_MS`'s clocks, the five the
    lanes named among them (the cancel question, Download cancelled., a dropped connection, a line lost mid-stream,
    saved); the x, the answers and Try again walk the fixture; no request; a held toast goes when the specimen does.
  - The Plan limits card: entry `plan-limits` (Compositions, "The operations portal"), demo
    `compositions/plan-limits-demo.tsx`: six states over the real card and `METERS` (healthy OK; critical with a
    warning and a floor; a failed read of Vercel's four meters; gaps with five "Not wired" and two the vendor reports
    none for; never read; unreadable), each card in a `data-toc-skip` so its vendor h3s stay out of the page's outline.
  - TapTooltip: a second specimen on the Tooltip entry, `TapTooltipDemo` in `library/components/interactive-demos.tsx`
    (a glyph and a count, and a row's fine print); the entry's `for` line, `lede`, `test` and `updated` mark rewritten.
  - Two tests that hold the specimens to what they say, 24 in all: `compositions/download-toast-demo.test.tsx` (every
    state's words and controls on the real Toaster, the fixture walk, in-place replacement, nothing fetched, a `Record`
    over `ToastView["tone"]` that fails the typecheck when a tenth tone is added) and
    `compositions/plan-limits-demo.test.tsx` (each state's chip, rows, bars and words).
  - ★ Found: a server module cannot draw a `TapTooltip` (500: "Cannot read properties of undefined (reading
    'title')", `tooltip.tsx:184`; its face arrives as a `react.lazy`, read off a temporary log that is reverted), so the
    specimen is a client demo, and `design-system.md` says so.
- **Verified in the browser** (the lane's dev server on 3131, now stopped): each entry at 1440 and 375 (no sideways
  scroll; the dropped-connection toast at 375 holds its two lines with Try again and the x on its right), the light and
  dark split on the toast's specimen with a press from the dark pane, the cancel question through Cancel download to
  Download cancelled. in the real toast, a hover (and a click at 375) opening the TapTooltip's words, and no console
  error from the three entry pages or the two family pages.
- **Assets requested from Will:** none.
- **Board ideas:** the Library's spend watch card specimen (`docs/ROADMAP.md` line 69) is now a short lane on the same
  pattern (`plan-limits-demo.tsx`: fixtures through the real card and a test per state).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the three Questions above; the Tooltip entry's `updated` mark (the Orchestrator clears it
  at the window's close); two test files added in `compositions/`, beyond the light gate the brief asked for.
- **Look at first**: the download toast's entry (`/design/library/download-toast`): press The cancel question, answer
  Cancel download, then Try again, with the toast at the top of the page. Then `/design/library/plan-limits` ("Past a
  threshold" and "Gaps: Not wired") and `/design/library/tooltip` (hover the glyph).
