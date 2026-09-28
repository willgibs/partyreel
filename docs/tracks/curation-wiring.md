---
track: curation-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
  # added at build: Undo's reversal on the server, the room's live seed, the shared Undo toast,
  # the guest-facing article that promised silence, and the Library specimen that mounts the room
  - src/app/(app)/dashboard/[eventId]/actions
  - src/lib/db/mutations/media
  - src/app/(app)/dashboard/[eventId]/review/
  - src/components/shared/undo-toast
  - content/help/what-guests-can-and-cant-see.mdx
  - src/app/(dev)/design/(shell)/library/compositions/composition-demos.tsx
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

- **The phone's verdict.** The brief says the phone already has its verdict in the viewer's controls; production's
  Review opened the same plain peek at every width (a waiting photo never reaches the viewer; its curate group says
  so). Built: the verdict peek at every width, Reject and Approve under the photograph, moving on after each.
  Overrule: the product's one viewer, curating, on a phone (the board's `viewer`, which his "yes/no before any
  additional handling" note argued against). `media-lightbox-parts/actions.tsx` is untouched: nothing reaches it.
- **Undo on every verdict, not only a bulk one.** Built: a key's or the peek's verdict is a bulk of one and toasts
  with Undo too (a stray Backspace is the likeliest slip), one toast per room, a later verdict's replacing it.
  Overrule: Undo on bulk acts only.
- **Undo's window.** Built: 6 seconds (`UNDO_WINDOW_MS`), paused while hovered or the tab is hidden.
- **Arrivals into an emptied queue.** Built: the line alone ("3 new" over an empty grid, never "all caught up"); a
  tap folds them in. Overrule: fold in on their own when nothing is on screen.
- **Keys beyond the pick.** Built: Delete rejects as Backspace does (a Windows keyboard's refusing key), Space opens
  the peek (Quick Look), Home and End, Escape leaves select mode; in select mode no key gives a verdict (Space and
  Enter toggle), and a key on any other control is that control's. Overrule any.
- **The room's cadence.** Built: the hub's own (the host's version poll, 60 s with the doorbell's socket up, 12 s
  down, at once after any verdict lands and on the tab's return), since the doorbell rings for the approved set
  only. Overrule: a faster clock while the room is open (the same poll, shorter).
- **Words.** Built: "Approved 5 photos", "Rejected 1 video", "4 uploads" for a mix (a reject's toast amber); the
  settings line "Hold new photos until you approve or reject them, instead of showing them live."; the help says a
  refused photo shows "marked as not in the album" in her uploads without quoting the tracker's words
  (voice-guest r2's to redraw).

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md` "Moderation and curation": Reject at the door and Hide in the album, the peek's
  verdict, the keys, the bulk controls' Reject, Undo on every verdict with `returnToReview`'s scope, the room live
  on the hub's store with its line, the beat's condition.
- `docs/systems/design-system.md` "Toasts": the one Undo helper beside the two error helpers; sonner's global stub is
  the component project's.

## Deferred (ROADMAP one-liners, bucket named)

- Help-sync: `day-of-checklist-for-hosts` sends a host to "the event page" to tap Approve all, which lives in Review.
- Host: the review peek is `aria-modal` with no focus trap, so Tab walks out of it behind the look.
- Lab: `event-safety/settings.tsx` quotes the old review line ("Hold new photos for your approval ..."); its next
  refresh takes the settings line's new words.

## Handoff (replaces the chat report)

- Commits, pushed: `f4d16b0c` the retirement (alone), `e921f238` the work, `52131cec` the sync merge of
  launch-prep (pointer-wiring, marketing-refresh, crumbs-6's cut; auto-merged); the boot's first sync was a
  fast-forward to `c6fa1370` before any lane commit (help-refresh's edit of an owned article, the Orchestrator's
  note), so it has no commit. The head is in the chat line.
- Gates on the synced tree `52131cec`, each on its own exit code: `pnpm typecheck` 0, `pnpm lint` 0 (5 warnings, none
  in a touched file), `pnpm test` 0 (515 files, 5,793 tests), `zsh scripts/build-lock.sh pnpm build` 0
  (`/dashboard/[eventId]/review` among the routes), `pnpm lab:smoke --base http://localhost:3131` 0 (224 checks, 0
  failing; host-curation off the desk). No board, so no `lab:demo`.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths (with the six added to `owns` at build)
  + this file, and these exceptions: `registry.ts`, `boards.ts`, `touchpoints.ts` (the retirement's named lines);
  `mock-parity.test.ts` (crumbs-6's; two pins in the curation block: the demo's Reject, the modes card's settings
  line); `never-rides-along.tsx` (one line: the privacy page's verbatim quote of the settings line);
  `library/compositions/gallery-demos.tsx` (the review-section entry's lede and specimen label, true to the new
  specimen); `docs/systems/host-app.md` and `design-system.md` (the record above).
- Reject at the door: the bar's glyph `CircleX` (the tracker's refused mark) in amber, the peek's pill, the settings
  line; Hide kept in the album; the row still lands `hidden` (`review-actions.tsx`, `uploads-section.tsx`).
- The peek's verdict: `SelectableMediaGrid`'s peek is controllable and carries Reject and Approve in the one glass
  pill under the media (never over it or a video's controls), 44 px targets on a phone, the keys in each tooltip;
  focus lands on the look, and on close on the tile it showed last (`selectable-media-grid.tsx`).
- The keys: `review-keys.ts` (document listener, scoped to the room; the cursor is a `data-kbd-focus` ring outside
  the tile, the album's own attribute pattern, since `:has(:focus-visible)` repaints unreliably in Chromium).
- Undo: `shared/undo-toast.ts` (`showUndoToast`, built for storage-wiring's bulk Remove to reuse);
  `returnToReviewAction` + `returnToReview` (allow-listed `from`, a real event id, refused once review is off, scoped
  to the verdict's state); Review's verbs stop revalidating (`actions.ts`, its test reshaped with the scar).
- The line: the review page seeds `HostAlbumProvider` like the hub (`review/page.tsx`: `planHubManifest`, no links);
  `review-live.ts` reads waiting and decided off its manifest; the triage holds arrivals behind "N new", folds them in
  at the head on a tap (tiles from the host's links route, or a server render's), drops what left elsewhere, never
  what it acted on (`use-review-triage.ts`, pure rules in `review-queue.ts`).
- The verdicts run beside each other (only an upload whose own verdict or Undo is in the air refuses a press); the
  bar holds only for a bulk act. The review tile's lost `data-review-tile` hook is back, so the exit and a returning
  tile's entrance play as globals.css always meant (the grid's extraction had dropped it).
- told=line in public: `review-uploads-before-they-appear`, `a-photo-is-missing-from-the-album` ("instantly and
  silently" gone), `moderate-and-curate-your-album`, `hide-remove-and-restore`, `bulk-select-and-batch-actions`,
  `what-guests-can-and-cant-see` (the one own-uploads exception), the curation FAQ and its demo (Reject, the caption).
- The retirement: `f4d16b0c` (the folder and its three registrations); the ledger is the Orchestrator's to delete.
  ROADMAP lines 56 (the missing-photo article's "silently") and 141 (`host-curation/queue.tsx:490`) are settled.
- Verified locally on the Library's specimen (the whole room over inert writes, `/design/library/review-section`) at
  1440 and 375: the peek's verdict by tap and by key, arrows (5 columns at 1440), Enter and Backspace with the cursor
  moving on, Escape back to the last tile, a selection held while "1 new" arrived and folded in at the head, a bulk
  approve then Undo back in place, Approve all's beat undone mid-beat. Vitest: `review-queue`, `use-review-triage`
  (Undo, arrivals, departures, the peek, concurrency), `review-room` (keys, peek, line), `review-live` (the real
  store over a fake transport), `undo-toast`, `actions` and `media` (the reversal's scope). The live pass is the
  red-team's on the next alias build (sign-in cannot run on localhost).
- Assets requested from Will: none.
- Board ideas: the peek could credit who sent the photograph (the board's `viewer` option carried the face-led
  credit; a host judging a stranger's photograph may want the name before the verdict).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (the host's column grant and `media_host_all`
  already let a host write `pending`; the app allow-lists it for Undo alone).
- Calls his to overrule: the seven Questions above, each built as recommended.
- Look at first: `/design/library/review-section` (tap a tile, press the arrows, Enter, Backspace, Undo on the toast,
  "A guest sends one" under a selection), then the real room on the alias with a moderated test event.
