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
