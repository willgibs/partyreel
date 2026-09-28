---
track: curation-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "9427c912"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-feed/review
  - src/components/app/event-feed/use-review-triage
  - src/components/app/event-feed/selectable-media-grid
  - src/components/app/event-feed/bulk-bar
  - src/components/app/host-selection-provider
  - src/components/shared/media-lightbox-parts/actions
  - src/components/app/event-settings/uploads-section
  - content/help/review-uploads-before-they-appear.mdx
  - content/help/hide-remove-and-restore.mdx
  - content/help/a-photo-is-missing-from-the-album.mdx
  - content/help/bulk-select-and-batch-actions.mdx
  - content/help/moderate-and-curate-your-album.mdx
  - src/components/marketing/sections/features/curation/
  - src/components/marketing/sections/shared/bulk-select-mock
  - src/app/(dev)/design/sandbox/host-curation/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/host-curation.json
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
---

# lp/curation-wiring

**Goal.** Build Will's seven `host-curation` answers into the host's review room: Reject at the door with Hide kept for an approved photo, the verdict on the desk's peek, the keyboard with no hint row, Undo on the bulk toast, the "N new" line for arrivals, the uniform grid kept; bring the public words that promise a refused guest silence in line with `told=line`; then retire the board.

## The brief

**His answers** (`docs/reviews/host-curation.json`, each note there in full):
- `queue=uniform`: the fixed-aspect grid helps scanning across lots of media. The album's own shape is for experiencing it. Production's Review already draws it (`review-grid.tsx`: `layout="uniform"`), so keep it as it is.
- `verb=reject`: "Reject offers a clear yes/no decision to new uploads ... Hide gives no option to reject, which inherently accepts everything." Reject is the refusing verb in the review queue (the review bar, the peek, the viewer's controls on a waiting photo, the settings line). Hide stays the word for taking down an approved photo in the album. The row state does not change: refusing is still pending to hidden, and remove is still its own act into Deleted.
- `peek=verdict`: at a desk the peek carries Approve and Reject, so the yes/no happens where the photograph is big enough to judge, before any other handling. The phone already has its verdict in the viewer's controls.
- `keys=arrows`: arrows move, Enter approves, Backspace rejects, and Escape already closes the peek. No hint row; at most a tooltip carrying the key on the verdict buttons. "Include the common keyboard controls if a user simply expects them to work."
- `undo=undo`: Undo on the bulk act's toast, for the seconds the product still knows which ones were meant. It is the product's first Undo, so build it once where `storage-wiring`'s bulk Remove can reuse it later.
- `arrivals=prompt`: uploads that land mid-review never join the grid under a held selection. A line above the grid says how many ("3 new"), and a tap folds them in. His note: "Fantastic catch on ensuring we don't sneak live uploads into a current review." The review room is not live today, while the hub is; find the live signal the hub already has rather than adding a poll.
- `told=line` is built (`TRACKER_TELLS_REFUSAL`, `src/lib/guest/upload-tracker.ts`): a refused upload reads "Not in the album" in her uploads. The tracker's words are `voice-guest` round 2's question now; leave `TRACKER_WORDS` alone. What this lane owns is the public words that still promise silence. Examples: `a-photo-is-missing-from-the-album.mdx` ("Hosts can hide or remove anything, instantly and silently"), and the review article's lines on what a guest sees. Grep the help articles, the curation feature page and its mocks for more. A guest at an event that reviews uploads now sees her refused photo marked in her own uploads, and nobody else sees it.

**Then retire `host-curation`** in one commit: its folder, and its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` (named exceptions; the ledger is the Orchestrator's to delete). Its `told` words move to voice-guest round 2, already on the desk.

**Neighbours:**
- `safety-refresh` and `triage-refresh` draw this room in the lab with these picks.
- `crumbs-6` may run beside you and owns the guest's voice lines, the two admin fixes and `mock-parity.test.ts`. If a curation mock needs a parity line, it is a named exception there.
- A path outside your owns (the peek's own component, the hub's live signal): add it to `owns` in your manifest before you edit it, or name it as a one-line exception.

**Verify:**
- Vitest for the triage logic (the keys, the fold-in, Undo's reversal).
- The room at 1440 and 375: the peek's verdict, the arrow keys, a bulk approve then Undo, and a new arrival under a held selection.
- `pnpm lab:smoke` whole, since the Library renders these components.
- The live pass on the alias is the red-team's at build 13.

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
