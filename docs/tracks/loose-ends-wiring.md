---
track: loose-ends-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "818555b8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/faq-accordion.tsx
  - src/components/marketing/faq-accordion.test.tsx
  - src/components/marketing/sections/home/faq-accordion.tsx
  - src/components/marketing/sections/features/album/review-switch.tsx
  - src/components/marketing/sections/features/album/everywhere-stage.tsx
  # added for the corner mark and its lightbox (the mark rides the newest tile, so the grid and the fill's
  # derivation carry it; the lightbox is a new file beside the stage)
  - src/components/marketing/sections/features/album/album-fill-grid.tsx
  - src/components/marketing/sections/features/album/use-album-fill.ts
  - src/components/marketing/sections/features/album/use-album-fill.test.ts
  - src/components/marketing/sections/features/album/everywhere-peek.tsx
  - src/components/marketing/sections/features/album/everywhere-peek.test.tsx
  # the board these picks came from retires in this lane (a board is one folder since lab-revamp's stage two;
  # its picks are what this lane built), a folder deletion in a commit of its own
  - src/app/(dev)/design/sandbox/loose-ends/
  # docs/systems/marketing-content.md is contact-wiring's claim: the one FAQ fact this lane falsifies (the FAQ is
  # no longer native <details>) is a one-line exception there, edited in place and listed in the Handoff
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/loose-ends.json
  - docs/systems/design-system.md
---

# lp/loose-ends-wiring

**Goal.** Wire loose-ends r1's picks: one FAQ look as a real heading, the rings in the Live | Review switch, and the Everywhere stage's corner mark with his easter-egg lightbox.

## The brief

**His r1 answers** (`docs/reviews/loose-ends.json`, 2026-09-29), wired now: `faq-look=heading` (every FAQ's question at 14/500 moves into a real heading, everywhere: `faq-accordion.tsx` and `home/faq-accordion.tsx` converge on one look; crumbs-12 has since made every heading `font-heading` at 700, so follow production's heading rule where it and the pick meet, and say how); `review-photo=rings` ("We'll end up switching this anyway pre-launch, with a brand new media kit, mostly generated in Higgsfield": the Live | Review switch's photograph becomes the rings, and your Handoff asks for an ASSETS row for that slot); `everywhere-pill=corner` with his easter egg ("a really neat easter egg delight if we included a subtle hint these images were clickable, with a fun little lightbox preview when clicked. However, it should clearly feel like a fun easter egg demo, not trap visitors in a demo they didn't ask for. This may fall on its face completely on next review"): the quiet corner mark on the newest tile, and a press opens a small lightbox that is clearly a demo and closes in one tap. `phone-cycle=today` keeps 3.2 s (no change). The two chart asks fold into a later admin exploration (leave the charts).

**The board:** `lab-revamp` stage two merged (`8cb5f21a`), so `sandbox/loose-ends/` is this lane's to retire (a folder deletion in a commit of its own, after the sync); its ledger stays for the Orchestrator's record. Marketing's motion rule is in `docs/systems/marketing-content.md` (calm and fluid, never still long enough to miss a step).

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

All three are built as recommended and are Will's to overrule (the Handoff's Calls line points here).

1. **How does the FAQ question become a heading?** Built: an `<h3>` around a `<button aria-expanded>` (the WAI-ARIA accordion pattern), not the pick's drawing, an `<h3>` inside a native `<summary>`. A `<summary>` takes a button-like role whose children are presentational, so the heading drops out of some screen readers' heading lists (MDN says so; Chromium's own tree keeps it, so a check in Chrome alone passes, and `ax-summary.mjs` in the scratch dir shows both trees). The cost: /events and every /features FAQ, which shipped zero JS, are now a small client island (a `<noscript>` rule opens every answer), and a closed answer is `inert`, so find-in-page no longer opens one there (Chromium opens a closed `<details>` on a match). If he wants the zero-JS pair back, it is this one component.
2. **At what weight?** Built: the pick's 14 px (the `working` step) at the heading face's one weight, 700, not the drawn 14/500: crumbs-12 made `font-heading` the one home of a heading's weight and `type-ladder-policy.test.ts` refuses a weight class beside it. Question and answer now share a size, so the question leads by face, weight and colour (design-system.md: an answer must not outrank its question).
3. **What does a press on a tile do?** Built: any tile opens its photograph (the hint is on the newest only), one tap anywhere closes it, it asks nothing back (no link, no like, no Start free), it says "Just a demo. Tap anywhere to close." in words, the loop holds still while it is up, and it is pointer-only: the stage stays `aria-hidden` decoration, so a keyboard or screen-reader visitor never meets the egg (a focusable inside an aria-hidden stage is worse than none).

## System-doc edits (in place, owned facts only)

- `docs/systems/marketing-content.md`, the `/events` bullet's FAQ sentence (was "native `<details>`"; now the one shared accordion and why a heading never sits in a `<summary>`), `598fc07f`. Not this lane's file (contact-wiring's claim): the one listed exception below.

## Deferred (ROADMAP one-liners, bucket named)

- Marketing: `HomeFaqAccordion` (`sections/home/faq-accordion.tsx`) is a thin wrapper over `FaqAccordion` (its `mt-0` default) kept only because `pricing-page.test.ts` pins its name; delete it and pin `FaqAccordion` when a lane owns that test (the home passes `mt-10`, pricing's Reveal carries its own gap).
- Marketing: a closed FAQ answer is `inert`, so find-in-page cannot open it on /events and /features (a closed native `<details>` opened on a match there before); `hidden="until-found"` with a `beforematch` handler is the accordion form of that, if it matters.

## Handoff (replaces the chat report)

- Commits on `lp/loose-ends-wiring`, all pushed: the work `e170397c` (faq-look=heading), `654e8a35` (review-photo=rings), `dd581c5f` (everywhere-pill=corner and its lightbox), `1e0578c6` (the stage's two integration points tested); the sync `2642ab6c` (`git merge origin/launch-prep` at `38373a35`, clean); the two relays `7e3e7547` (owns) and `349bc8be` (the board's folder retired, a deletion of its own); `598fc07f` (the one doc line). launch-prep has moved since (`git fetch` at `2eb477a7`: crumbs-15 merged at `7bc20d9e` in `src/lib/db`, `src/app/api` and the app layer, records and pickups, and desk-tune cut, owning `sandbox/locked-door/` alone); none of it touches this lane's paths, and `design-system.md`, the one `reads` file that changed, changed only in its lab paragraph, so no second sync. The head is in the chat line.
- Gates on the synced tree at `1e0578c6` (the last code commit; the manifest-only commit after it changes `docs/tracks` alone), each its own exit code, logs in `../partyreel-wt/_scratch/loose-ends-wiring/gate2/`: `pnpm typecheck` 0 · `pnpm lint` 0, no warnings · `pnpm test` 0 (602 files, 6970 tests) · `zsh scripts/build-lock.sh pnpm build` 0 (263 static pages) · `pnpm lab:smoke --base http://localhost:3134` 0 (132 checks, 0 failing; SCOPE boards none, library and shell yes; its one PREMISE line, demo-framing's `names`, names marketing-content.md, whose edit here is the FAQ sentence and touches nothing that ask rests on). The same five steps ran green at `598fc07f` before the test commit (`gate/`, 6968 tests). No `lab:demo`: `board: none`, and this lane's own board is retired.
- Walks, on `pnpm dev` and on the production build served by `next start` (headless Chrome over DevTools with real pointer, touch and key events; scripts and 64 shots in `../partyreel-wt/_scratch/loose-ends-wiring/`): `faq-sweep.mjs` (all 13 FAQ pages at 1440 and 375: one list, an h3 around exactly one button per question at 14 px / 700 in the heading face, the heading order under an h2, no `<details>`, every `aria-controls` resolves, closed panels `inert`, a click opens one and a second closes it, no horizontal overflow, a clean console; 260 checks green on the production build, and in dev its only misses are Next's own LCP notices on unrelated hero images) · `faq-focus.mjs` (a focus ring, Enter opens and closes) · `faq-nojs.mjs` (scripting off: every answer shows) · `faq-ax.mjs` (on /events, /pricing and /features/album no closed answer is in the accessibility tree, and opening one adds exactly that answer) · `faq-rm.mjs` (reduced motion: no transition, a click opens at once) · `peek-flow.mjs` (15 checks at 1440 with the mouse and at 375 with touch; 44 runs, 42 green, the two misses below) · `peek-rm.mjs` (reduced motion: no travel, 0 console errors) · `peek-clickthrough.mjs` (a press on the ground closes it and never falls through to a link beneath) · `peek-press-stress.mjs` (120 presses on random tiles at random moments, 120 opened) · `peek-console.mjs` (three open-close cycles in dev, no React or Radix warning).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = this file + the owned paths (the FAQ's three files, the album folder's seven, the retired board's eight) + one exception: `docs/systems/marketing-content.md`, contact-wiring's claim (the Orchestrator's relay 2): one FAQ sentence edited in place because this lane falsified it, three lines in the `/events` bullet, far from the contact facts, so the two lanes' hunks should merge clean.
- The items:
  - `faq-look=heading` (`e170397c`): `faq-accordion.tsx` is the one FAQ on the home, /pricing, /events (the hub and the four types) and every /features page (`HomeFaqAccordion` is the same list with no top gap of its own); a real heading per question, the chapter-2 height clocks, one open at a time, closed answers `inert`, a `<noscript>` rule; `faq-accordion.test.tsx` (6 tests) pins the structure, the mechanism and that the two entry points draw identically. The heading rule where it and the pick meet: Questions 1 and 2.
  - `review-photo=rings` (`654e8a35`): the Live | Review switch's one travelling photograph is `wedding-rings` (`UPLOAD` in `review-switch.tsx`); it reads at the 56 px queue tile and is none of the album's three.
  - `everywhere-pill=corner` and his easter egg (`dd581c5f`, `1e0578c6`): the newest tile on the laptop and the phone wears a quiet expand mark from the first frame (it fades to the next newest as one lands); a press on any tile grows a small lightbox out of it in the album viewer's grammar (`everywhere-peek.tsx`), which says it is a demo and asks nothing back; `everywhere-peek.test.tsx` (13 tests: the lightbox, the grow, reduced motion, the marks, the stage's pause and its aria-hidden, the last two mutation-checked) and the fill's pure `newest` field (`use-album-fill.test.ts`, 2 tests).
  - `phone-cycle=today`: no change (`HOLD_MS = 3200` in `getting-in-stage.tsx`). The two chart asks are left alone (ROADMAP's admin-portal line already carries them).
  - The board retired: `sandbox/loose-ends/` deleted (`349bc8be`); its ledger `docs/reviews/loose-ends.json` stays for the Orchestrator's record.
- Assets requested from Will: the Live | Review switch's candid upload · one photograph, square (1:1) at 720 px (it draws at 144 px in the phone plate and 56 px in the host's queue tile), in the new kit's one grade: a candid moment a guest would upload at a celebration, its subject centred and legible at 56 px, and none of the album's three beside it (a golden wedding hour, party balloons, a reception table) · replaces `wedding-rings` (`UPLOAD` in `review-switch.tsx`; ASSETS row 27 lists `wedding-rings` among the twelve stills, so its delivery covers this slot when it meets this spec, and a kit that renames ids changes that one constant)
- Board ideas: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule: Questions 1 to 3 above, each built as recommended; and the rings are a stand-in until his kit.
- Look at first: on the alias once this merge is built (nothing here sits behind the allow-list, so the local walks above are a real check and the live pass is only the build's own): `/features/album` at 375, the Everywhere section (a small dark expand mark on the newest tile of the laptop and the phone; press one, the card grows out of the tile, says it is a demo, and one tap or Escape closes it), then the Live | Review switch in Review (the rings at the 56 px queue tile); then any FAQ (`/`, `/pricing`, `/events`, a `/features/*` page) at 375: one look, the questions show as h3 in the heading outline, Tab shows a focus ring and Enter opens and closes. One measured edge: `peek-flow.mjs` missed its "press another tile" step twice in 33 scripted touch runs (once under three runs at once) and never in 11 mouse runs, while 120 presses at random moments all opened: the likely cause is a tap lasting long enough for a column's slide or a bottom tile's unmount to move the target, so the tap opens the neighbour or nothing (not reproduced at rest); if it matters, hold the loop while a pointer is down.
