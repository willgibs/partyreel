---
track: safety-refresh
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e199f43f"            # the launch-prep SHA the branch was cut from
board: event-safety
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-safety/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/trust-safety-forensics.md
  - docs/systems/design-system.md
  - docs/systems/guest-flow.md
---

# lp/safety-refresh

**Goal.** Refresh `event-safety`'s nine stale asks onto production as it stands (the settings panel, the lit door, the review room with Will's curation picks), keeping its three current asks untouched.

## The brief

**A refresh, not a new round.** Keep each board's `round.n`, and say in `round.changed` what moved. Change only the asks named below: every other ask keeps its id, question, options, recommendation and drawing exactly, because Will may be answering those on build 12 while you work, and his answers must still transcribe. Where a frame draws production, draw production as it is at your base: open the files, never trust a spec's own claim about "today" (a read-only audit on 2026-09-28 found the drawings below out of date; each finding cites its evidence, check it before you build on it). Offer the fix at its source, and keep every road an option still holds. Your boards' `touchpoints.ts` rows are yours (their text, `asks` and `lives`; nothing else in that file). `node usher/kit/board-card.mjs <board>` prints what a board asks. Author with `defineExploration` as the boards already do.

**Two shared fixes cover seven of the nine:** the board's `SettingsSheet` drawn as the settings kind (`PopupContent kind="settings" routed`: its own screen under a back arrow in a hand, an unfocused side panel at a desk, a list opening in the side panel; `src/components/ui/popup-kinds.ts`, popups-wiring `3e7952e3`), and `HeldDoor`/`DoorStep`/`InStep` drawn as the lit door (guest-door `6f06207e`, door-r3-wiring `97038b8e`: lit icons, `DoorHeading` from the left, `DoorCheck` blooming in the lamp's hues). Import production's parts where you can, so the board cannot drift again.

**Per ask:**
- `entry`: the `credit` option draws the old credit pill at the viewer's foot, but production's credit is `FaceCredit` at the top left (`7eb190de`; the spec cites `media-viewer.who`, a board retired at `89095cff`). `guests` draws a "..." menu on a row, but every name now opens `GuestPeek` (`src/components/social/guest-peek.tsx`, popups `peek=card`), which already shows the host-only address: the natural door for Block. `review` says Hide; host-curation's `verb=reject` makes it Reject, and its `peek=verdict` adds a review peek that could carry Block. All four roads stay.
- `door`: `held` is drawn on the door before the lit look. The mid-visit failure line follows voice-guest's `failed=exact` ("2 of 8 didn't upload", Retry both). `private` and `gone` are fine.
- `blocked`, `choose`, `inside`, `editor`: drawn in the retired bottom Sheet; move them to the settings kind.
- `waiting`: `held` and `both` sit on the pre-lit door. Its mail half repeats emails' `guest` ("Should a guest ever get a mail"), so it leaves this ask. `flow-refresh` adds it to that question as an option; say so in your Handoff.
- `queue`: `review` puts "Waiting to join" where host-curation's `arrivals=prompt` now puts its "3 new" line. His `keys=arrows` (arrows move, Enter approves, Backspace rejects, no hint row) and `verb=reject` reshape the same room. Redraw `review` with both lines in one order and people kept out of Enter and Backspace.
- `unlisted`: `another` and `ask` sit on the pre-lit door, and the listed guest's "You're in" is the old green disc; production blooms `DoorCheck` in the lit sheet.

**Untouched:** `restore`, `room`, `newcomer`.

**Also trim:**
- The board's `touchpoints.ts` row still says "the block's sheet", "Thirteen decisions" and "The block itself". That ask moved out at `c238a48c` and was answered `confirm=dialog`.
- The spec's "asked elsewhere" list names three retired boards (media-viewer, identity-door, popups).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

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
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
