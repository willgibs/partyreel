---
track: host-storage
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
