---
track: crumbs-10
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
