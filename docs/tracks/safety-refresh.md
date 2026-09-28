---
track: safety-refresh
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Each is built as recommended; none is a one-way door (the board ships no production byte).

- Does the viewer's credit open the same look a Guests-room name opens (face, "Confirmed their email", the host-only
  address, Block), or a menu of its own? Recommended: the same look (`kinds.tsx`'s `PersonLook`, drawn from
  `guest-peek.tsx`), so `all` is three doors onto one look and one block.
- With its mail half gone to `emails.guest`, does `waiting` keep two forms, the lit door or a waiting page? Recommended:
  yes. `both` folded into `held` (without the mail they were one answer), `email` became `page`; `held` recommended.
- Does a refusal a block causes mid-visit keep the failure sheet's Retry? Recommended: keep it, as the sheet ships for
  every refusal, in his `failed=exact` words ("2 of 2 didn't upload", Retry both), so a block never reads different
  from any other refusal (the board drew Close alone before).
- In `queue.review`, which line comes first? Recommended: Waiting to join first (a person at the door outranks a
  photograph), then his "3 new" on the grid it folds into, the arrows ringed on the first photograph and never on a
  person.
- Where does the blocked list open from its settings row? Recommended: as a list kind (a panel over the settings
  panel at a desk, a screen under "Settings" in a hand), drawn as two frames: the row, then the list.

## System-doc edits (in place, owned facts only)

- none (a lab board; no system fact moved)

## Deferred (ROADMAP one-liners, bucket named)

- The lab and the kit: `PopupQuote` (a popup kind drawn still in a frame, its shape read off `popup-kinds.ts` on
  production's own shape classes) is local to `event-safety/kinds.tsx` and copies `popup.tsx`'s private content and
  overlay strings; a kit candidate beside `Several` and `ScrollHere`, or `popup.tsx` exports the two.

## Handoff (replaces the chat report)

- Work commit `5d16b19a` (the board and its touchpoints row), pushed; this manifest's commit is the head in the chat
  line. No sync: launch-prep moved to `9a121eca` (voice-r2 at `0abfdeac` and records), none of it in my `reads`, and
  `git merge-tree --write-tree HEAD origin/launch-prep` is clean (touchpoints.ts: a different row).
- Gates on `5d16b19a`, each on its own exit code, heavy steps one at a time through the lock per the pacing note:
  `zsh scripts/build-lock.sh pnpm typecheck` 0; `pnpm lint` 0 (5 warnings, all in files this lane never opened);
  `zsh scripts/build-lock.sh pnpm test` 0 (510 files, 5738 tests); `zsh scripts/build-lock.sh pnpm build` 0;
  `pnpm lab:smoke --base http://localhost:3134` 0 (231 checks, event-safety 811 words of 1200);
  `pnpm lab:demo --board event-safety --base http://localhost:3134` 0 (12 steps, 0 failing).
- Re-run, and why: before the pacing note the whole gate ran once on the pre-commit tree (green); one `lab:demo` of it
  timed out in the door step's evaluate (60 s) while the Mac was short of memory and a headless Chrome from my own
  capture script had outlived a timed-out run (killed, its profiles removed; the script now kills its Chrome on any
  exit); three reruns clean, then the gate above on the commit. Nothing lost.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the eight files under
  `src/app/(dev)/design/sandbox/event-safety/` + `src/app/(dev)/design/touchpoints.ts` (the event-safety row only:
  asks, note, variants, lives, which the brief gives this lane) + this file.
- The settings kind (blocked, choose, inside, editor): `SettingsSheet` reads its shape off `popup-kinds.ts`
  (`kinds.tsx`), his unfocused panel at a desk and a screen under "‹ Maya & Jay" in a hand; the cards carry the
  shipped words (the ShieldCheck of each `ConfirmSwitch`, the size cap's line, the `guestExperienceSummary` line, video).
- The lit door (door `held`, waiting, unlisted, and `newcomer` whenever `door` is answered `held`): `DoorLamp`,
  `DoorHeading`, `DoorGlyph`, `AlmostIn` and `DoorCheck` imported, the Sheet quoted from `SheetContent`'s classes,
  `floatingEdgeEntranceResponsive`, `DOOR_SHEET` and `DOOR_SCRIM`; "You're in" blooms (`lamp="bloom"`).
- door: the mid-visit failure sheet is the shipped sheet's structure in `failed=exact`'s words; the held door says
  "2 of 2 didn't upload" on its way shut (`guest.tsx`'s `REFUSED_HEADING`, one home for both).
- entry: the viewer is production's (the real `FaceCredit` top left, `CHROME` and `peekMetrics` for the photograph and
  its neighbours' slivers, `LIGHTBOX_ACTION` in the capsule, the desk filmstrip); Block sits in the look at every door;
  the Guests room's rows drop their menu in `guests` only; Review rejects, and its notice names the three rejected.
- queue: Review on the real `ReviewGrid` in his curation picks; the hub's cards on `room-card.ts` (`roomRowLayout`,
  `roomCardSize`, `reviewCardFace`, `EVENT_ROOMS`), so the counting card's caption now reads "whole on screen".
- waiting: the mail half left for `emails.guest`, which `flow-refresh` adds to that question as an option.
- Trims: the touchpoints row no longer says "the block's sheet", "Thirteen decisions" or "The block itself"; the
  spec's "asked elsewhere" and its header comment name no retired board (media-viewer, identity-door, popups).
- Untouched: `restore`, `room`, `newcomer` keep ids, words and drawings; their default worlds capture pixel-identical
  before and after at 375 and 1440 (a stash-and-compare, 0.000% on all 18 frames).
- Assets requested from Will: none.
- Board ideas: `waiting` could offer a third road, a newcomer adding photos while they wait (held with them until let
  in, gone with a decline); the look a host blocks from shows no count or strip of that person's uploads yet
  (popups-wiring's deferred strip), which is the context a block most wants.
- Stale ROADMAP lines for the Orchestrator: "Host: at 375 the hub's cards row runs past the phone's edge" (fixed by
  `room-card.ts`'s 2x2, its own comment citing this board) and "Host: the Review peek ... never listens for" Escape
  (`selectable-media-grid.tsx` now closes on Escape).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: Block as a destructive button on the look's foot; the look in a hand as the peek's Sheet over
  the viewer; the settings' unrelated cards folded to their heads; the Review card reading "Off" on the hub (review is
  off at this wedding); people declined with "Decline" while photographs are rejected; `entry.guests` rows without
  their menu while `room`, `blocked` and `queue`'s rows keep theirs (untouched, so `room-rows`' "a menu" still reads).
- Look at first: `entry` at 375 and 1440 (the credit's look and the room's), `door` at 375 with When on mid-visit,
  then `unlisted`'s "You're in" in light and dark.
