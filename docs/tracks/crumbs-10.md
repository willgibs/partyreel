---
track: crumbs-10
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "277f31a3"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/admin/reports/
  - src/components/admin/
  - src/app/admin/help-feedback/
  - src/components/marketing/sections/home/cinema-hero
  - src/app/(app)/account/renew/
  - src/components/marketing/chrome/mobile-menu.tsx
  - src/components/app/my-uploads-gallery.tsx
  - src/components/app/recently-deleted-grid.tsx
  - src/components/ui/popup.tsx
  - src/lib/content/llms
  - src/lib/lifecycle/sweeps/passes.ts
  - src/lib/db/queries/social.ts
  - src/lib/db/mutations/social.ts
  # Added at boot, where the brief's items live outside the cut's claims:
  - src/components/app/report-review          # the album arm's cards and closed lines (item 1)
  - src/lib/admin/reports                     # wayBackOf and the closed log's words (item 1)
  - src/lib/db/queries/reports                # the lines' way back, decided server-side (item 1)
  - src/app/api/stripe/checkout/route         # the renewal refusal's sentence is the route's (item 4)
  - src/components/app/renew-checkout         # its note on what `not_eligible` covers (item 4)
  - src/components/marketing/chrome/mobile-menu.test.tsx
  - src/lib/db/queries/my-uploads             # which uploads sit on an album that reads private (item 6)
  - src/components/app/media-grid.tsx         # GridMedia's `likeable` (item 6)
  - src/components/likes/like-button          # no heart where a like would be refused (item 6)
  - src/lib/db/mutations/media                # restore_media's `status`, carried (item 7)
  - src/app/(app)/dashboard/[eventId]/actions # ...through the hub's restore (item 7)
  - src/components/app/recently-deleted-grid.test.tsx
  - src/components/ui/popup.test.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/admin-observability.md
  - docs/systems/host-app.md
  - docs/systems/design-system.md
---

# lp/crumbs-10

**Goal.** Fix build 19's red-team findings (Dismiss's missing way back, the help-feedback table cut at 375, the home's wasted preloads, /account/renew's wrong sentence for an account that never held a pass, the phone menu's missing description) and five small ROADMAP carry-overs.

## The brief

**Build 19's red-team** (2026-09-29, the alias at `fd196846`; its ledger is `/Users/gibby/local/ai/partyreel-wt/_scratch/redteam-19/ledger.txt`) passed all seven journeys and found:
1. **Minor: Dismiss has no way back.** Dismiss is one press with no confirm and no Undo, on the toast or the closed line, so a slip closes a harm report for good (only SQL reopens it). Remove, the heavier verdict, has both. Will's admin-triage r1 `closed=window` gives a closed report its window's Undo, so give Dismiss one too: the toast's Undo and the closed line's reopen the report, inside the same window (`src/app/admin/reports/actions.ts`, the report cards).
2. **Minor: /admin/help-feedback's "By article" table is cut off at 375.** The 617 px table sits in a 343 px sideways scroller: the No column is cut mid-column, Helpful and Last click are off-screen, and nothing hints that it scrolls. Draw it for a phone (each article a stacked row, or columns that fit), in the portal's own grammar.
3. **Nit: the home wastes preloads at 1440.** Each load logs six "preloaded but not used" warnings: the card's four prints at `w=96`, one band frame at `w=384` and a CSS chunk. The prints end up showing the band's already-fetched `w=384` copies, so the `w=96` fetches are waste. Stop the card's prints preloading what they never show (they are stand-ins sharing the band's photographs until ASSETS row 33 lands). Measure LCP and CLS before and after.
4. **Nit: /account/renew tells an account that never held a pass "Yours has ended".** Give it a sentence true to having no pass, with See plans first.
5. **Nit: the marketing phone menu has no description.** Its `aria-describedby` points at an element that doesn't exist, and Radix logs "Missing `Description`" on every open. Give it a visually hidden description, or drop the reference as Radix documents (doc-check it).

**ROADMAP carry-overs**, quote each line's words in your commit and Handoff so the Orchestrator retires it:
6. Host: her Uploads feed (`my-uploads-gallery.tsx`, mode `keep`) shows a heart on a private album's photo that now always refuses. Hide the heart where the event reads private.
7. Host: the Deleted view's Restore says "Restored. It's back in the album." (`recently-deleted-grid.tsx:95`) for an item `restore_media` returns hidden (it answers `status`). Say what it did, as Let back in does.
8. Design system: `PopupBody` could keep its children whole itself (`*:shrink-0`), so no flex-column body can crush a clipping Card again.
9. Marketing: `llms.ts:114` says "Albums can be open, link-only, or password locked", naming no private album and calling an open one link-only.
10. Code hygiene: the three casts marked "the generated types learn notify_pass_renewal" (`lifecycle/sweeps/passes.ts`, `db/queries/social.ts`, `db/mutations/social.ts`) go now that `types.ts` carries the column.

**Not yours:** a guest can report only the whole event (the Report link at the event page's foot, `report-dialog.tsx`), so the portal's item path is reachable only through `/api/reports` with a media id. That rides admin-triage round two's wiring, whose `harm` redraws the form. `crumbs-11` runs beside you on the slug family and the sign-in return path: none of its paths are yours. Add any other path to `owns` before editing it.

**Verify:**
- Vitest for each change; the Dismiss Undo's guarded write included (only a report the operator closed, inside the window).
- The help-feedback page at 375 and 1440 on a local harness.
- The home's console at 1440, with its LCP and CLS.
- `pnpm lab:smoke` whole.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Does every verdict that changed only the report reopen, or Dismiss alone?** A person's Mark actioned is also
  one press with no confirm, so the same slip closes a harm report for good there. Recommended: one rule later (a
  verdict that touched only the report reopens inside the window), in admin-triage round two's wiring, which redraws
  the verbs with the host queue's Undo (its `look` frames carry it); built here: Dismiss alone, on both arms (the
  album and item cards, and People), as briefed.
- **A dismissal's window is 30 days from the verdict** (`RECENTLY_DELETED_WINDOW_DAYS`, the removal's own number:
  `closed=window`'s "one lifecycle rule instead of two clocks"). Recommended as built.

## System-doc edits (in place, owned facts only)

- `admin-observability.md` (Reports): the closed line's way back gains a dismissal's reopen (`reopenReportAction`,
  the guards in its write, a hold no bar; Mark actioned and an album's Action have none).
- `design-system.md` (the floating-layer contract): `PopupBody` keeps its children whole (`*:shrink-0`).
- `lifecycle-recovery.md` (Restoring): `restore_media` answers its `status`, and the bin's toast says it.
- `guest-flow.md` (the like bullet): an item marked `likeable: false` offers no heart; the profile's Uploads marks an
  upload to an album that reads private to her.

## Deferred (ROADMAP one-liners, bucket named)

- Marketing (performance): every page preloads the root 404's `trail.css` (a root `not-found.tsx`'s CSS is preloaded
  on every route; measured: `/`, `/pricing`, `/help`, `/login`, `/about`), one "preloaded but not used" warning a load
  site-wide; fold the trail's rules into the global sheet or load the 404's `Trail` lazily (from `crumbs-10`).
- Marketing (performance): the home's `full-quality` section (`PhotoSection`, `photo-section.tsx:357`, `priority`,
  deprecated in Next 16 for `preload`) preloads a `w=1920` photograph on load for a section far below the fold, and
  Chrome may then draw the band's `wedding-golden` frame from that copy (build 19's one band-frame warning, not
  reproduced here) (from `crumbs-10`).
- Code hygiene: `pnpm lint`'s four standing warnings, none of them this lane's: unused `useEffect`/`useState` in
  `album-fill-grid.tsx`, an unused `step` in `lab/_desk/review-session.tsx`, `contact-form.tsx`'s React Compiler skip
  on `form.watch` (from `crumbs-10`).

## Handoff (replaces the chat report)

- **Commits, pushed**: `854faa8b` (the manifest's added claims), `b05b5747` (the work), `e6d2d646` (the help-feedback
  table's phone line), `2413b011` (the system docs), `f2b831cb` (the sync: `origin/launch-prep` at `d98df14f`, a clean
  merge; `crumbs-11`'s merge had touched `host-app.md`, a read). The head is this manifest's commit.
- **Gates on the synced tree `f2b831cb`**, each on its own exit code (logs in `../partyreel-wt/_scratch/crumbs-10/gate/`):
  `pnpm typecheck` 0; `pnpm lint` 0 (four warnings, none in a file of this lane's: Deferred); `pnpm test` 0 (566
  files, 6,448 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 (196
  checks, 0 failing); `--production --key` against the build as well, 0 (202 checks). No board, so no `lab:demo`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path under an `owns` prefix, this file, or
  the four system docs above. Two claims went untouched: `src/components/admin/` (the report cards live in
  `src/components/app/report-review.tsx`, claimed at boot) and `src/app/(app)/account/renew/` (the page shows the
  checkout route's own sentence, so the fix is the route's).
- **1 · Dismiss's way back.** The toast's Undo (`toastDismissed`, the product's `showUndoToast`) and a dismissed line's
  Undo (`ClosedUndo`) both call `reopenReportAction` (`src/app/admin/reports/actions.ts`), on both arms. Its write
  carries the guards (`status eq dismissed`, `resolved_at gte reopenFloor(now)`): pinned against the fake PostgREST
  in `actions.test.ts`, with past-window, actioned, already-open, below-AAL2 and malformed refusals; `wayBackOf`
  answers `reopen` at the page's one clock read (`reports.test.ts`, `queries/reports.test.ts`); the cards'
  wiring in `report-review.test.tsx` and `person-report-list.test.tsx`. Never pressed live: the portal cannot be
  signed in locally, and the hold keeps it off Will's Chrome.
- **2 · /admin/help-feedback at 375.** `by-article-table.tsx`: below `sm`, Article, Yes and No, the title wrapping and
  the last click on its own line under the shelf; Helpful and Last click from `sm` up. A local harness (a throwaway
  route, deleted) in the portal's frame: 375 → table 343 px in a 343 px card, three columns, no page scroll; 1440 →
  five columns, 896 of 896 (`_scratch/crumbs-10/help-feedback-375.png`, `-1440.png`); `page.test.tsx` pins the day
  under the article.
- **3 · The home's wasted preloads.** `printSizes` (`cinema-hero-card.tsx`): a print of a band photograph asks the band
  frame's sizes, so React preloads one copy for both. Local production builds, headless Chrome, fresh profile, 1440×900
  @1x, three runs each (`_scratch/crumbs-10/before-1440.txt`, `after-1440.txt`, `synced-1440.txt`): unused-preload
  warnings 4/3/4 → 1/1/1 (the one left is the 404's `trail.css`: Deferred); image preloads 17 → 13; `w=96` fetches
  4 → 0; LCP 168/140/156 → 184/164/152 ms, the H1 both times (local noise, ±20 ms a run); CLS 0 → 0. At 1440 @2x,
  375 @3x, 767 and 900×1200: 2 to 4 warnings → 1, CLS 0, LCP 148 to 168 ms (`before-others.txt`,
  `after-others.txt`). `cinema-hero.test.tsx` renders the hero on the server and fails on the old sizes (run).
- **4 · /account/renew for no pass.** The checkout route (`src/app/api/stripe/checkout/route.ts`) answers an account
  with no pass row "This account has no Event Pass to renew. Start one from the pricing page.", still `not_eligible`
  so See plans leads; "Yours has ended" stays a lapsed holder's (`route.test.ts`, `renew-checkout.test.tsx`).
- **5 · The phone menu's description.** `aria-describedby={undefined}` on its panel, as Radix documents (checked on
  Context7) and the house's menus do. Headless Chrome at 375 opening it: the alias (build 19) had a dangling
  `aria-describedby` and "Missing `Description`"; the synced production build has none and no warning.
  `mobile-menu.test.tsx` fails without the fix (run).
- **6 · "Host: her Uploads feed (`my-uploads-gallery.tsx`, mode `keep`) shows a heart on a private album's photo that
  now always refuses ("Couldn't save that like."), as it already did on a blocked account's; hide the heart where the
  event reads private".** `getMyUploadCards` reads each album her guest uploads sit in as she sees it
  (`getEventByQrToken`, a block included, six at a time, a failed read keeping the heart) and marks those uploads
  `likeable: false` (`GridMedia`); `LikeButton` and the desk glyph offer nothing there (`my-uploads.test.ts`,
  `like-button.test.tsx`).
- **7 · "Host: the Deleted view's Restore says "Restored. It's back in the album." (`recently-deleted-grid.tsx:95`)
  for an item `restore_media` returns hidden (it answers `status`); say what it did, as Let back in now does".**
  `restoreMedia` and `restoreMediaAction` carry the status; `restoredWords` says back in the album, back and still
  hidden from everyone, back in Review, or (no status) back where it was (`recently-deleted-grid.test.tsx`,
  `media.test.ts`, `[eventId]/actions.test.ts`).
- **8 · "Design system: `PopupBody` could keep its children whole itself (`*:shrink-0`), so no flex-column body can
  crush a clipping Card again".** It does (`popup.tsx`, `popup.test.tsx`); the two flex-column bodies (the share
  sheet, the claims review) have no child meant to shrink.
- **9 · "Marketing: `llms.ts:114` says "Albums can be open, link-only, or password locked", naming no private album and
  calling an open one link-only".** It reads public to anyone with its link, a password, or private to its host
  (`llms.test.ts`).
- **10 · "Code hygiene: the three casts marked "the generated types learn notify_pass_renewal"
  (`lifecycle/sweeps/passes.ts`, `db/queries/social.ts`, `db/mutations/social.ts`) can go now that `types.ts` carries
  the column".** Gone; the typecheck infers each row from the generated types.
- **Assets requested from Will**: none (ASSETS row 33 already carries the prints' own photographs).
- **Board ideas**: the portal's other tables (exports, accounts, forensics, jobs) still scroll sideways at 375; the same
  fold (the columns the page is for, the rest into the first cell) would draw each for a phone.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule**: a dismissal's reopen clears its note, as a removal's Undo does; it reopens over a held
  item (reopening restores nothing); the toast's Undo is the product's six seconds, the line's the 30 days; the
  phone table drops Helpful (Yes, No and the tint say it); the prints draw the band's 384 w (640 w at 2x) copies in
  their small windows, no new bytes (`fetchPriority="low"` was the alternative: Chrome-only reuse, a small fetch
  elsewhere); the no-pass sentence is also what an account whose pass became Pro's credit reads (true of it); the
  menu drops its description rather than gaining a hidden one; a like already given on a closed album keeps its
  tile mark (she unlikes from Likes); the restore's words above; the llms sentence above.
- **Look at first** (build 20's red-team; nothing here reached a live press): on `/admin/reports` at 1440 and 375,
  dismiss a staged report and press the toast's Undo inside its six seconds, dismiss another and press its line's
  Undo, and one dismissed more than 30 days ago (a backdated `resolved_at`) refuses in words; `/admin/help-feedback`
  at 375; the home's console at 1440 (one warning left, the 404's CSS); a guest's Uploads viewer on a private
  album's upload (no heart); the Deleted view's Restore of a hidden item ("still hidden").
