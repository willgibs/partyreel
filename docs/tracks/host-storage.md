---
track: host-storage
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "8d1f66fd"            # the launch-prep SHA the branch was cut from
board: host-storage
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/host-storage/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/lab/
  - src/components/app/dashboard/storage-meter.tsx
  - src/components/app/pricing/pricing-sheet.tsx
  - src/components/app/event-feed/event-gallery.tsx
  - src/lib/constants/tiers.ts
  - src/app/(dev)/design/sandbox/host-curation/spec.ts
  - src/app/(dev)/design/sandbox/export-flow/spec.ts
  - docs/systems/billing-caps.md
---

# lp/host-storage

**Goal.** A NEW lab board, `host-storage` (Will, 2026-09-22): where a host sees each item's size in a view apart from the gallery's cards, in what order, how freeing space reads when a smaller plan is the reason, and the plan sheet's two new faces (the refusal, a Pro host's six prices). Five decisions, every option drawn; a catalog, nothing wiring production.

## The brief

**Will's words (2026-09-22), verbatim.** "This also inspires the idea that media size per item should be included for hosts somewhere, so they know how to get rid of the largest files first if needed. Should be a separate view than the media cards themselves because including the storage on each card makes the gallery less beautiful, and including it in the lightbox exclusively makes the host have to hunt through each media item individually to check storage sizes. Sorting by gallery file size (up and down) should also be a sort option when we get there." It comes from his ruling that no plan change may leave a host storing more than the new plan's cap: "show them their total storage used now and ask them to delete media to get under the storage cap of their selected pro plan before being able to switch."

**Rising Tides (Will, 2026-09-22):** "the library's purpose is more our working rules to keep consistency across what we've built and new builds, but not hard rules that can't be reshaped. Working guidelines, not hard rules ... everything is unprotected, anything may be relitigated for better solutions despite any past decisions." A rule that blocks better work is reshaped deliberately and named in your Handoff.

**What this is.** A NEW lab board, `host-storage`: a catalog to select from, nothing wiring production. The `storage-guard` lane is building the server check and a plain refusal right now; this board designs where a host finds sizes, how they free space, and the plan sheet's two new faces. The facts it draws on: the cap counts ACTIVE bytes (non-removed media in non-deleted events), so a Remove frees room at once; Pro is 100 GB / 500 GB / 2 TB, monthly or yearly, and passes (75 GB each) stack; the deleted-items budget is one cap, so after a shrink the oldest deleted items purge early; per-item sizes are stored (`media.file_size_bytes`) but no screen shows one today; the album's View menu keeps Sort switched off ("Coming soon"); the dashboard's storage meter is a slim bar with a popover; the account page's Plan card shows "X of Y used"; the over-cap grace banner says "remove media" with no way to find large files.

**Five decisions, one question each, every option drawn** (`defineExploration`; options that are real contenders for the one decision, never forced apart):
1. `where`: where a host sees per-item sizes: an account-level Storage page (every live event counts toward the cap; reached from Plan and storage, the meter's popover, the refusal and the grace banner), a details list in the album's View menu (per event), or a Storage sheet from the meter.
2. `order`: largest first across every event, or grouped by event (each event's total, then its largest items).
3. `goal`: how freeing space reads when a smaller plan is the reason: a live "left to free" count toward the chosen size that becomes the switch itself once it fits, or plain totals with the plan named.
4. `refusal`: the plan sheet's refusal, drawn after `goal`: the numbers (stored, the chosen size's cap, the gap) and the ways out (the size that fits; free up space).
5. `prices`: a Pro host's six prices in the plan sheet (today a Pro host sees only Manage billing): how the current plan, the other sizes and the interval switch sit, including a size that does not fit.

**Your calls, drawn the same in every option** (list them for his overrule): what a row carries (thumbnail, size, event, who added it, date); multi-select with Remove to Deleted; a Download-first way out (the download itself is `export-flow`'s); one line saying Deleted keeps items only up to the new size after a switch; real sizes on realistic media (a few multi-GB videos among many small photos, since the largest files are the story).

**Never ask what a standing board asks, and name each in the context:** `host-curation` (the bulk act's toast and undo, the count, what a tap opens), `export-flow` (how a download reads, its cap and its failure states), `media-viewer.holds` (no size in the lightbox), `reel-host.curation`, and the ruled app-pricing and app-vocabulary rows (touchpoints). The album's size sort is a later wiring item; draw it only if it sits naturally inside `where`'s album option.

**Build from the kit** (`src/components/lab`), with YOUR OWN fixtures in the board folder: not `sandbox/gallery-fixtures.ts`, which still mints a nameless anonymous uploader (a ROADMAP line) and would put an impossible person in "who added it". The truth for the shipped pieces: `storage-meter.tsx`, `pricing-sheet.tsx`, the account page's Plan card, `event-gallery.tsx`'s View menu. Register the board directly after `host-curation` in `registry.ts`, `boards.ts`, `touchpoints.ts` and `DESK_ORDER` (the Orchestrator moves the desk order at the merge). The board at 1440 and 375 with reduced motion honoured; no em-dash; no mono face.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none: a lab-only round, nothing shipped, no `docs/systems/` fact changed.

## Deferred (ROADMAP one-liners, bucket named)

- Wiring `refusal` needs a new `PricingTrigger` kind (today's union is `locked` / `room` / `plan`,
  `pricing/triggers.ts`) and a real per-account, per-item size query (today's `getHostStorageSummary` is an
  aggregate and `listEventMedia` is per-event; neither lists a host's items across events by size): bucket,
  billing polish, after the launch checkpoint.

## Handoff (replaces the chat report)

- Work commit `6a423d7a` (the board + registrations); sync commit `985a0b7d` (merged `origin/launch-prep`, which had
  moved by two commits touching only `docs/tracks/orchestrator.md` and `usher/kit/record.py`, neither in `owns` or
  `reads`; the merge was clean, no conflicts). Both pushed. The head is in the chat line.
- Gates on the synced tree (`985a0b7d`), each its own exit code, all 0: `pnpm design:rules` (24 standing boards,
  `host-storage` row added to `docs/design/library.md`; re-run on the synced tree produced no further diff),
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` (140 specimens, no diff), `pnpm typecheck`, `pnpm lint`
  (0 errors; 9 pre-existing warnings in files this lane never touched, 0 in `sandbox/host-storage/*`), `pnpm test`
  (353 files, 3895 passed, 1 pre-existing skip), `pnpm build`, `pnpm lab:smoke --base http://localhost:3134` (493
  checks, 0 failing), `pnpm lab:demo --board host-storage --base http://localhost:3134` (5 steps, 0 failing, every
  step draws its options, tallest 1.6 screens / wordiest 161 words, both well inside budget).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the 8 files under `sandbox/host-storage/` (owned)
  + `registry.ts`, `boards.ts`, `touchpoints.ts` (registration directly after `host-curation`, named in this
  manifest's own brief) + `docs/design/library.md` (regenerated by `pnpm design:rules`, mandated after the
  `touchpoints.ts` change; not hand-edited) + this file. Nothing else.
- The items:
  - `spec.ts`: the five decisions (`where`, `order`, `goal`, `refusal`, `prices`), every option drawn, staged
    `where → order → goal → refusal → prices`; four carried calls above the sections (row contents, the bulk act,
    Download-first, the Deleted-budget line), each with its own overrule line.
  - `fixtures.ts`: this board's own 64-item, 4-event, one-host fixture (never `gallery-fixtures.ts`, which still
    mints a nameless anonymous uploader); every number in every screen (`110.8 GB`, the `10.8 GB` gap against
    Pro 100 GB) is `reduce`d off this array, not hand-typed.
  - `storage-list.tsx`: the row, the flat/grouped bodies, the live goal-strip (verified interactively: selecting the
    two largest videos counts down to zero and reveals Switch; committing Remove to Deleted keeps that progress
    after the selection clears), the real `BulkBar`/`BulkBarAction` driving local resolved-promise state, the
    Undo toast, and the Deleted-shrinks note.
  - `surfaces.tsx`: the three `where` chromes: the account Storage page's entry points quoted from the Plan card,
    the storage meter's popover and the over-cap grace banner (each gaining one new link); the album's View menu
    quoted with a new Storage group (Album/Sizes) beside the untouched Tile size/Sort/Filter; the meter's sheet.
  - `pricing.tsx`: the plan sheet's two new faces, quoting `pricing-sheet.tsx`'s own private `PlanCard`/`holds()`
    (neither exported) rather than the live portalling `Sheet`; nothing here starts Checkout or opens the real
    billing portal.
  - Registered directly after `host-curation` in `registry.ts`, `boards.ts`, `touchpoints.ts` and `DESK_ORDER`.
- Assets requested from Will: none (the fourteen bootstrap `MARKETING_IMAGES` stills, cycled, same as every other
  board).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule:
  - The brief named `refusal`'s outcome (the numbers, the two ways out) and `prices`' subject (six numbers, a size
    that does not fit) but not their alternative shapes; the three-way splits I drew (`inline`/`swap`/`banner`;
    `rows`/`cards`/`matrix`) are this lane's own contenders, not his.
  - Every screen is drawn over ONE scenario: a Pro host on 500 GB, 110.8 GB stored, tapping Pro 100 GB. The more
    common real trigger for this whole feature is a LAPSED Pro falling back to Free's 2 GB cap
    (`lifecycle-recovery.md`'s `over_capacity` sweep), which refuses far more dramatically; I kept the Pro-to-Pro
    story because decision 5 is specifically about Pro's own six prices, but the Free-cap case may be the sharper
    picture for `goal`/`refusal` alone.
  - The View menu's new group is named "Storage" with two options (Album/Sizes), sitting beside Filter rather than
    folded into it; `app-vocabulary`'s ruled row (one View menu, arbitrary groups) allows either.
- Look at first: `where` at 1440 (the account option's four entry points first), then `goal`'s live strip: select
  the two largest videos (9.4 GB, 9.1 GB) in either the `where` or `goal` frame and watch it read `10.8 GB left`,
  then `1.4 GB left`, then `Ready to switch`; then `prices`' matrix wearing whichever `refusal` you land on.
