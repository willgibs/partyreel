---
track: voice-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "aed50c02"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/guest/upload-tracker
  - src/components/guest/upload-tracker
  - src/components/guest/upload/stack-tile
  - src/components/shared/album-window-plan
  - src/components/guest/gallery-live
  - src/components/guest/save-account-prompt
  - src/components/guest/guest-name-menu
  - src/components/app/event-feed/review
  - src/components/app/event-feed/use-review-triage
  - content/help/how-guests-join-and-upload.mdx
  - content/help/messages-guests-might-see.mdx
  - src/components/marketing/mock-parity.test.ts
  - src/app/(dev)/design/sandbox/voice-guest/
  - src/components/marketing/sections/features/album/review-switch
  - src/components/marketing/sections/features/album/album-copy
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/voice-guest.json
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
---

# lp/voice-wiring

**Goal.** Build Will's voice-guest round 2 answers: a held photo shows only in her uploads, her uploads say "Waiting for approval" and "Not approved", the keep asks "Keep this event" (her name menu's card too), and his host note in Review that an approved photo can always be hidden later; then retire voice-guest.

## The brief

**His answers** (`docs/reviews/voice-guest.json`, r2, each note there; the options' exact words are in the board's `lines.ts` and `spec.ts`):
- `held=uploads`: a photo the host is still deciding on shows only in her uploads, the tracker's badge counting it. The album's head draws no held tile (`upload/stack-tile.tsx`'s `WaitingTile`, the head slots in `album-window-plan.ts`, `gallery-live.tsx`). A file still sending keeps its stack tile. The upload area's own held line and the keep's "Sent" sentence stay true beside it.
- `status=approval`: `TRACKER_WORDS` reads "Waiting for approval" for a held photo and "Not approved" for one the host left out. His note: "A bit more clear, I don't think anyone's feelings will be hurt by direct wording here since it offers clarity." One state, one name, everywhere it is said: the tracker, the keep's sent line, the help, and the album feature page's mock (`review-switch.tsx`, and its hint in `album-copy.ts`, which still quotes the retired toast: ROADMAP's line). `mock-parity.test.ts` moves with them.
  - The admin portal's confirm (`moderation-grid.tsx`) is `triage-wiring`'s, which takes these words; leave it.
- **His host note on `status`:** "We should have a note for the host when making approvals that they can always hide an approved photo later, so they're more lenient on 'accept and hide' vs 'reject'." One quiet line in the Review room (`review-section.tsx`), never a hint row.
- `keep=warm`: the keep step asks "Keep this event" (the warm option's words, `save-account-prompt.tsx`'s `keepCopy`). His note: "'Keep this event' is best because they likely already have their own photos saved, the incentivize is everything else in the event." Her name menu's card, which still says "Save this event for later" (`guest-name-menu.tsx`), takes the same title. The door screen that Confirm your email opens keeps its own photos-first wear (round 2's carried call `keep-confirm`).
- **Fold in** ROADMAP's review-room line: ids the room acted on never leave `known` (`use-review-triage.ts`), and `arrivals(waiting, known)` (`review-queue.ts`) filters them out. So an upload that returns to pending from elsewhere never shows until a reload. Retire both ROADMAP lines in your Handoff.

**Then retire `voice-guest`** in one commit: its folder and its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` (named exceptions). The ledger is the Orchestrator's.

**Paths:** `safety-wiring` holds the guest page (`e/[token]/page.tsx`), the look and the guest list; `pricing-wiring` holds pricing; `triage-wiring` holds `src/components/admin/`. Add any other path to `owns` before editing it.

**Verify:**
- Vitest for the words, the head's slots with a held photo (none drawn) and the `known` fix.
- The album and her uploads at 375 and 1440.
- `pnpm lab:smoke` whole.
- Will's real-upload check sees it live.

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
