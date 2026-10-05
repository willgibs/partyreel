---
track: library-specimens-3
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "94d66338"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/(shell)/library/
  - src/components/app/pricing/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/ui/popup.tsx
  - src/components/ui/toggle-group.tsx
  - src/components/marketing/sections/shared/how-it-works-stepper.tsx
  - src/app/(marketing)/(cinema)/contact/contact-receipt.tsx
  - src/components/app/host-media-grid.tsx
  - src/components/shared/route-error.tsx
---

# lp/library-specimens-3

**Goal.** Library specimens for what lab:smoke and lab:demo cannot reach today: popup.tsx's kinds at 1440 and 375, HowItWorksStepper, toggle-group, the pricing sheet, LockChip and WelcomeToPro over a stubbed door, ContactReceipt, HostMediaGrid's arrival and the portal's gone-item report; RouteErrorMock mirroring today's error screen; every Library plate's image sizes and loading.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU is at its limit). Port 3134 is yours; 3000 is Will's desk and red-team 54's, never touched; 3130 is the Orchestrator's gate.

**Why this lane:** a component with no specimen is invisible to `lab:smoke`, so its regressions reach production unseen; and the Library is where Will judges the system. Dev-only: the Library ships no production byte, except the pricing door's seam (below).

**The specimens** (each at 1440 and 375, its states from fixtures, nothing that writes):
1. `ui/popup.tsx`'s kinds: each `PopupContent` kind, the responsive menu, the code card and the look, with the keyboard up where a field takes it. Its Sheet and Dialog specimens predate the kinds; bring them in line.
2. `HowItWorksStepper` (a full-width section) and `ui/toggle-group.tsx` (four product callers).
3. `PricingSheet`, `LockChip` and `WelcomeToPro` (`src/components/app/pricing/`): a live one puts a real Checkout door in the lab, so stub the door first, as `InertStorage` stubs the storage meter's actions (`library/compositions/composition-demos.tsx`). The seam you add in `pricing/` changes no production behaviour, pinned by its tests.
4. `ContactReceipt`; `HostMediaGrid`'s arrival (a button adding a photo to a fake store); a `PopupContent` popup's arrival guard; the portal's gone-item report and covered Albums tile.
5. `/design/library/patterns`' `RouteErrorMock` (`patterns/gallery-demos.tsx`) still draws the old Error code chip and no help line: mirror `shared/route-error.tsx`, which draws `NotFoundScreen` with its help line and digest.
6. The Library's entry pages log next/image dev warnings from their specimens (an LCP image on `loading="eager"`; `PhotoSection`'s `sizes="100vw"` on a `fill` image narrower than the viewport, in `library/components/gallery-demos.tsx`): give each plate the `sizes` and loading it renders at.

The spend watch card's specimen waits for crumbs-75 (it owns `src/app/admin/jobs/`). Gate: the whole gate, `lab:smoke --all` on your port.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Where I am

**Parked for a laptop restart (the Orchestrator's message), status stays `open`.** Resume from this branch; nothing is mid-edit.

**Done, committed and pushed** (`git log lp/library-specimens-3`): `7467c3d9c` (the shared real viewports `library/device-frames.tsx`: laptop 1440 and phone 375 `Frame` pair, `QuietArrival`, `KeyboardStandIn`, captions read off the frame; the route-error mirror + its drift test; ToggleGroup entry; HowItWorksStepper and ContactReceipt pairs), `15a95dcc2` (the pricing seam `components/app/pricing/pricing-doors.tsx` + `pricing-doors.test.tsx`; PricingSheet, LockChip, WelcomeToPro entries over inert doors; `popup-kinds` and `popup` entries, the arrival guard played; Dialog and Sheet entries redrawn), `48dbd695f` (HostMediaGrid's arrival; the gone-item reports in the report queue; the Albums grid with its covered tile; PhotoSection in a laptop-wide frame; the Library's own plates' `sizes` and eager loading; a test per demo), and this park commit (the doc edits in `docs/systems/design-system.md` and `billing-caps.md`, the arrival specimen's held tile verbs, three more door tests).

**Verified so far:** `pnpm typecheck` green at `7467c3d9c` and NOT re-run since (the later files, tests included, are unchecked by `tsc`: run it first); `eslint` clean on `src/app/(dev)/design` and `src/components/app/pricing` at the last run; `vitest` green for `design/gallery`, `design/(shell)/library`, `components/lab`, `components/app/pricing` (122 + 3 tests), `components/ui/popup`; `pnpm format` run on changed files; headless-Chrome console crawls of every Library entry at 1440 and 375 and of the family pages: no error or exception anywhere, and the only next/image warnings left are one LCP line each on `/design/library/demo-ticket` (1440), `inline-reel-player` and `reel-player` (both widths), caused by production components that hard-code `loading="lazy"` (`DemoFrame`, `InlineReelPlayer`, `ReelPlayScreen`), plus a browser preload hint on the compositions family page from Create's wizard (`look-step.tsx`); no sideways overflow at 375 on any new entry. Screenshots are in `_scratch/library-specimens-3/shots/`.

**Remaining, in order:**
1. `zsh scripts/build-lock.sh pnpm typecheck`; `pnpm format:check`; fix whatever `tsc` finds in the new files.
2. `zsh scripts/build-lock.sh pnpm test` (the whole run), then `zsh scripts/build-lock.sh pnpm build`.
3. Start the dev server (`rm -rf .next/dev && pnpm dev -p 3134`, from this worktree), then `pnpm lab:smoke --base http://localhost:3134 --all`; kill it by port when done.
4. A last fresh-eyes pass in headless Chrome with the scratch tools (`shot.mjs` per entry at 1440 and 375, `console-crawl.mjs`, `overflow.mjs`): every specimen at both widths, the keyboard switch on the form, the settings and the responsive sheet, the pricing states and the receipt's race; regenerate the artifact (`node "src/app/(dev)/design/gallery/collect-specimens.mjs"`) after any entry edit.
5. Fill this manifest: Questions (below, built as recommended), System-doc edits (the two done), Deferred, the Handoff and its lane check (`specimens.generated.json` is the one regenerated file outside `owns`); set `status: handed-off`; commit it alone; push; chat line.

**Questions I mean to write (each built as recommended):** frames only where a component reads the window itself (layers, full-width sections, the receipt), the grids and the toggle group stay in the page and follow the window; the popup entries are `popup-kinds` (the table, eight kinds) and `popup` (the element: size and the arrival guard), with Dialog and Sheet redrawn beside them; the keyboard is a stand-in written the way the hook writes it; the pricing seam swaps the Checkout and portal buttons as components (they live outside `pricing/`) and change-plan, the facts read and the router as verbs; PhotoSection is drawn in a laptop-wide frame (its plates hard-code `sizes="100vw"` and `loading="lazy"`).

**Deferred and findings to list in the Handoff:** (1) `checkout-button.tsx` and `manage-billing-button.tsx` fetch inline; moving them behind `PricingDoors` verbs lets the Library's two stand-in buttons go. (2) `DemoFrame`, `InlineReelPlayer`, `ReelPlayScreen` and `PhotoSection` hard-code lazy loading (PhotoSection `sizes="100vw"` too): an optional pass-through each would end the last three LCP lines. (3) A finding in production: `ContactReceipt`'s `Postmark` is inked `mix-blend-multiply` in near-white, which draws nothing over the cinema room's dark card (computed style read in the frame: opacity 1, multiply, oklab 0.97), so the stamp's postmark is invisible on /contact. (4) The Specimen's light/dark split draws a frame's scene twice in the lab's own theme.

**Dev server and tools:** my dev server on 3134 is killed by its port when parked (restart as above); no headless Chrome of mine is running; my two Browser-pane tabs are closed. Scratch tools are in `/Users/gibby/local/ai/partyreel-wt/_scratch/library-specimens-3/` (`cdp.mjs`, `shot.mjs`, `console-crawl.mjs`, `overflow.mjs`, `probe-arrival.mjs`, `measure.mjs`, `lcp.mjs`, `photo-scroll.mjs`, `arrival-seq.mjs`); they launch their own Chrome on port 9334 and close it.

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
