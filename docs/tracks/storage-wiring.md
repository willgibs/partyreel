---
track: storage-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "f8b83bbc"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/storage/
  - src/components/app/pricing/pro-price-list
  - src/components/app/pricing/pricing-sheet
  - src/components/app/dashboard/storage-meter
  - src/lib/billing/storage-guard
  - src/lib/db/queries/storage-list
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/host-storage.json
  - docs/systems/billing-caps.md
  - docs/systems/lifecycle-recovery.md
  - docs/systems/design-system.md
---

# lp/storage-wiring

**Goal.** Build Will's three `host-storage` round-1 picks: the size list (largest first across every event, with an All / per-event filter, in the lists panel), the live goal strip that finishes a plan switch, and the refusal flipping the tapped size inline and stacked. The six prices keep today's rows until his `prices` round-2 pick.

## The brief

**His round 1 answers** (`docs/reviews/host-storage.json`, each note there):
- `order=flat`: one ranked list, largest first across every event. His note: a filter to go to All or one event (not a choice between mixed and grouped); hosts will differ.
- `goal=live`: when a smaller plan is why the host is here, a sticky strip counts down as items are selected for Remove, and at zero its own button finishes the switch.
- `refusal=inline`: the tapped size flips to the refusal in place: what is stored, what it holds, the gap, then the two ways out. His note: stacked vertically, so a card's lines don't break as they do in a tight three-column layout.
- `prices=?` is on the desk as round 2 (build 13). Keep today's six plain rows (`pro-price-list.tsx`) and flip the tapped row there; his pick re-faces the rows later.

**Round 1's carried calls, taken:**
- A row carries a thumbnail, the size (and duration for a video), the event, who added it, and the date.
- Bulk Remove to Deleted on the product's bulk bar, with the Undo toast curation-wiring built (`showUndoToast`, `src/components/shared/undo-toast.ts`; reuse it, never a second one).
- A Download entry beside Remove hands off to the export flow.
- One line says Deleted holds only up to the new plan's size, so older items purge sooner.

**Where it opens:** popups' `lists=panel` (a side panel at a desk, its own screen in a hand; `PopupContent kind`). There are two doors:
- the storage meter's popover on the dashboard;
- the plan's "See what's using space". Stacked over the plan at a desk, its Back says "Your plan", and closing it returns to the plan.

The `host-storage` board's round-2 drawings (`src/app/(dev)/design/sandbox/host-storage/`: `storage-list.tsx`, `plan-sheet.tsx`, `prices.tsx`) show these picks built as a reference; build from production's components, not the board's.

**The strip's button:**
- While items are only selected, it reads "Remove and switch": they go to Deleted first, since the cap counts active bytes.
- Once enough is removed, it reads "Switch to Pro 100 GB" and runs the existing change-plan path.
- The server's storage guard decides again, and the Stripe webhook stays the only writer of tier and cap. Never trust the client for either.
- Stripe is TEST. Nothing here calls Stripe beyond the existing path, and no check completes a checkout.

**Fold in storage-r2's notes:**
- The Pro fit line tells a Pro 500 GB monthly host "or choose Pro 500 GB" when it means the yearly price (`pro-price-list.tsx` feeds `refusalSentence` its yearly rows); say which.
- One account's bytes print two ways in one flow (`formatBytes` rounds to nearest, `formatBytesUp` up, in `src/lib/utils.ts`), so 110.83 GB reads 110.8 GB, then 110.9 GB. Use one rounding within one flow.
- A Pro host pressing Change plan is greeted "You are on Pro already" (an upgrade door's words); lead with her plan instead.

**Data and security:**
- Per-item sizes (`media.file_size_bytes`) are read under RLS for the host's own events (never the service role), ordered by size on the server.
- ★ PostgREST cuts every read at 1,000 rows: page or read whole with `readAllPages`, chunk id lists with `inChunks`, count with `head: true` (`src/lib/db/read-all.ts`).
- Removal goes through the existing RLS-scoped, column-locked bulk remove.
- A new read lives in `src/lib/db/queries/storage-list.ts`, and every Server Function re-verifies with `getUser()`.
- If an owned path isn't enough (the account page's Plan card, a route), add it to `owns` in your manifest before editing, or name a one-line exception.

**Verify:**
- Vitest for the list's rules (order, the filter, the strip's arithmetic, one rounding) and the read's paging.
- The list and the refusal at 1440 and 375.
- `pnpm lab:smoke` whole.
- The live pass on the alias is build 14's red-team (sign-in cannot run locally). It stops before Stripe's confirm page, never paying.

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
