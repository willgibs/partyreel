---
track: storage-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "f8b83bbc"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/storage/
  - src/components/app/pricing/pro-price-list
  - src/components/app/pricing/pricing-sheet
  - src/components/app/dashboard/storage-meter
  - src/lib/billing/storage-guard
  - src/lib/db/queries/storage-list
  # added at build: the list's Server Functions, the Plan card's one rounding, the plan's re-read
  # after a removal, and the Library specimen that mounts the list and the refusal over inert data
  - src/app/(app)/dashboard/storage-actions
  - src/app/(app)/account/page.tsx
  - src/components/app/pricing/use-plan-facts
  - src/app/(dev)/design/(shell)/library/compositions/composition-demos.tsx
  - src/app/(dev)/design/(shell)/library/compositions/gallery-demos.tsx
  - src/app/(dev)/design/gallery/specimens.generated.json
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

Each is built as recommended, his to overrule.

- **Remove asks nothing first.** Built: the list's Remove runs at once with the product's one Undo (the brief), where
  the album's Delete asks first (popups' `confirm=dialog`). Overrule: a count-named confirm, as the album's.
- **One number, one rounding.** Built: what she stores and what she must free print rounded up wherever they appear
  (the meter, the Plan card, the refusal and the fit line, the list's All chip, the strip); a file's, an event's or a
  selection's size prints to the nearest tenth, since rounded up a file a hair past 9.4 GB read 9.5 GB. Overrule:
  every figure in the flow rounded up.
- **The Pro head.** Built: her plan with its billing ("Pro 500 GB, monthly"), "Your Pro plan" until the sheet's read
  lands; the line under it unchanged. Overrule: "Your plan: Pro 500 GB, monthly".
- **Billing in the sentence.** Built: a size offered instead is named with its billing everywhere ("or choose Pro 500
  GB, monthly"), the routes' refusals included; the Pro list's fit line reads at her billing and offers nothing when
  the size that fits is hers. Overrule: billing named in the Pro list alone.
- **Download across events.** Built: one event's selection downloads at once (export-flow's zip); a selection across
  events asks which event (the choice menu, one zip each), since an export is one event's. Overrule: Download waits
  until the selection is one event's.
- **The meter's door.** Built: "See what's using space" under the figure in the meter's popover, for any tier with
  something stored, opening the list with no goal and a line that removed items stop counting at once and wait in
  Deleted for 30 days. Overrule: a goal on it too when she is over her own cap.
- **Who added it.** Built: "You" for her own uploads, a guest's name with the Unverified mark when unproved, nothing
  for a nameless row. Overrule: her name with a Host badge (the board's drawing).
- **The filter.** Built: All first (what she stores), then her events heaviest first, each with its total, shown once
  she has two events. Overrule: events by date.
- **Paging.** Built: 40 at a time with "Show more" and "40 of 1,234"; the bulk bar's All takes what is shown. Overrule:
  an endless scroll, or All taking every item in the filter, loaded or not.
- **The strip is the Pro flow's.** Built: only a refused Pro price opens the list with a goal (its switch is
  change-plan); a pass holder's or Free host's sheet keeps its one card and its plain refusal line. Overrule: the
  list's door on that refusal too, its switch a checkout.
- **Catching up.** Built: the page behind refreshes, and the plan re-reads its facts, once, as the list closes (the
  list opened from a refused price lives inside that price's row, so a re-read while open could unmount it). Overrule:
  figures behind the list that move with each removal.
- **Remove and switch's toast.** Built: the removal's Undo toast shows before Stripe's confirm page opens, so a refused
  or failed switch leaves it there to take back. Overrule: no toast on that path.

## System-doc edits (in place, owned facts only)

- `billing-caps.md` "Plan changes": a refusal names the size that fits with its billing; what a host stores prints
  one way (rounded up) on every surface, a file's or an event's size to the nearest tenth.
- `billing-caps.md` "The in-app pricing surface": a size too small is a door (the flip, the list, the goal strip that
  only calls change-plan, removes first, counts from before this visit's removals and re-bases on a refusal).
- `lifecycle-recovery.md` "Restoring": the list's Undo is one capacity-gated `restore_media` per item, so on a full
  plan it puts back part of a removal and says so.

## Deferred (ROADMAP one-liners, bucket named)

- Utils: `formatBytes` prints "41.0 GB" for a value that rounds to a whole number (it tests the value before
  rounding; `formatBytesUp` tests after); the size list's event chips and rows show it.
- Lab: `host-storage`'s plan quote (`sandbox/host-storage/plan-sheet.tsx`, its TITLE) and its `head-stays` carried
  call still say "You are on Pro already"; production leads with her plan now.
- Billing follow-ons: the size list's per-event totals walk every active item's size (one keyset walk per 150
  events); a `host_event_storage()` aggregate would answer one row per event once an account outgrows ~30,000 items.
- Library: the StorageMeter entry's own specimen opens the list over the real Server Functions (a signed-out Library
  reads "Couldn't load"); the StorageList entry is the inert one.

## Handoff (replaces the chat report)

- Commits on `origin/lp/storage-wiring`, cut from `2b28c9c9`: `283352b3` and `3c01b6a7` (the owns additions, the
  manifest alone), `e05fb42b` (the work), and this handoff. No sync: launch-prep moved to `937d3a0a` (crumbs-6's merge
  and records), touching none of this lane's paths or reads (`git diff --name-only HEAD...origin/launch-prep`: guest,
  admin and marketing files, `reel.md`, ROADMAP, tracks).
- Gates on `e05fb42b`, each its own exit code (`_scratch/storage-wiring/gate-*.log`): `pnpm typecheck` 0; `pnpm lint`
  0 (5 warnings, none in a touched file); `pnpm test` 0 (520 files, 5,847 tests); `zsh scripts/build-lock.sh pnpm
  build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 (225 checks, 0 failing). No board, so no `lab:demo`.
- Lane check: owned paths (with the seven added to `owns` at build: the list's Server Functions, the Plan card's
  rounding, `use-plan-facts`, the Library's two compositions files and the regenerated `specimens.generated.json`) +
  this file, and the record: `docs/systems/billing-caps.md`, `docs/systems/lifecycle-recovery.md`.
- The list: `components/app/storage/` (`storage-list.tsx` the shell every door mounts, `storage-list-body.tsx` loaded
  on first open, the rows, the filter, the strip, the refusal face; pure rules and one reducer beside them), opened
  as popups' `list` kind: panel at a desk, screen in a hand whose Back says "Dashboard" or "Your plan".
- The data: `lib/db/queries/storage-list.ts` (RLS-scoped, `events!inner` naming the host, paged by `(size, id)`
  through `readAllPages`' budget; totals read whole; items presigned, credited without an address) behind
  `dashboard/storage-actions.ts` (`getRequestAuth`, zod at the boundary, the cap in words; remove through
  `removeMediaBulk` per event; Undo through `restore_media` per item). Checked on the real PostgREST (the keyset
  continues a size tie by id) and under RLS as willg97 (`EXPLAIN ANALYZE`, rolled back: her 12 events' index, a top-N
  sort of 1,273 rows, 2.3 ms).
- The flip: `pro-price-list.tsx`'s Too small is a press; a server refusal flips its row the same way; the sheet
  re-reads its facts when the list closes (`use-plan-facts`' `reads`), so a size that now fits is a price again.
- Storage-r2's notes: `planWithBilling` and `proFitLine` (`storage-guard.ts`); `formatBytesUp` for what she stores on
  the meter and the Plan card; the Pro head.
- Verified locally on `/design/library/storage-list` (the meter's door and a refused price over an inert source) at
  1440 and 375: the flip and Keep, the list stacked over the real plan dialog (its facts answered in the page for
  the check), largest first, a chip reading one event, Show more (38 of 543, then 78), a selection reaching Remove and
  switch, the removal and its Undo, focus back on the door when the list closes. The real Server Function answered a
  signed-out read with its `unauthorized` shape through the lazy chunk, in dev and in the production build. The live
  pass is build 14's red-team (sign-in cannot run locally); it stops before Stripe's confirm page.
- Assets requested from Will: none.
- Board ideas: the over-cap grace banner says "largest files first" with no door; it could open the size list with a
  goal of her own cap. A goal on the meter's list whenever she is over her cap.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the twelve Questions above.
- Look at first: `/design/library/storage-list` (tap Pro 100 GB's Too small, then See what's using space; tick two
  videos to watch the strip reach Remove and switch; Undo on the toast), then on the alias as willg97 the Account
  Plan card's Change plan and the dashboard meter's See what's using space.
