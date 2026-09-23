---
track: event-safety
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "6d27b17a"            # the launch-prep SHA the branch was cut from
board: event-safety
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-safety/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/lab/
  - src/components/shared/media-lightbox.tsx
  - src/components/app/event-feed/review-room.tsx
  - src/components/app/event-settings/
  - src/app/(app)/dashboard/[eventId]/guests/page.tsx
  - src/components/social/guest-list.tsx
  - src/components/guest/entry-shell.tsx
  - src/components/guest/entry-modal.tsx
  - src/lib/guest/entry-steps.ts
  - src/app/(dev)/design/sandbox/media-viewer/spec.ts
  - src/app/(dev)/design/sandbox/identity-door/spec.ts
  - src/app/(dev)/design/sandbox/host-curation/spec.ts
  - src/app/(dev)/design/sandbox/profile-page/spec.ts
  - src/app/(dev)/design/sandbox/voice-guest/spec.ts
  - docs/systems/guest-flow.md
  - docs/systems/trust-safety-forensics.md
  - docs/systems/host-app.md
---

# lp/event-safety

**Goal.** A NEW lab board, `event-safety` (Will, 2026-09-23): how a host blocks a bad actor from an event and keeps an event closed, drawn inside the three answers he gave (a block puts the person out and removes their uploads; approve newcomers, close to newcomers and an invite list; all free on every plan). Nine decisions, every option drawn; a catalog, nothing wiring production.

## The brief

**Will's words (2026-09-23), verbatim.** "I just thought about one safety feature we should build that hasn't been concepted yet. Let's say a bad actor gets in with a verified email - the host can hide/delete all of their uploads, but there's no way to actually stop those uploads from continuing. We should think of some sort of block feature per event to prevent continued abuse. This may also warrant some sort of invite-only feature as well to ensure events stay closed." And on addresses the same day: "Guests should not see other confirmed guests' emails, making them more comfortable knowing only the host sees it. Exposing emails publicly would go from a safety feature to privacy concern - the host assumes responsibility of ensuring that safety."

**His three answers (2026-09-23), the product rules this board draws inside:**
- **What a block does: "Out, uploads removed".** A block is per event, made by the host and undone by the host. It puts the person OUT of that event: they cannot join, upload, open the album, like anything in it, or claim rows onto it; every refusal is re-checked per request at the server (the join, the presign, the complete, the gate), so a session opened before the block stops at its next request. Their uploads leave the album in the same step (a host removal: they wait in Deleted and a host can restore them), so they drop off the guest list and every count. They meet a plain closed door, never the word "blocked".
- **Which closed doors: "Approve newcomers", "Close to newcomers", "An invite list"** (he did not pick "a fresh link"). Approve newcomers: a newcomer confirms an email and waits at the door until the host lets them in or declines (a decline is a block). Close to newcomers: whoever is already in keeps going, nobody new joins. An invite list: only addresses the host listed can confirm in. Everyone already in stays in under all three.
- **Plans: "Both free on every plan".** No lock chip, no upgrade prompt anywhere on this board.

**The facts the drawings must respect (the Orchestrator's maps, 2026-09-23).**
- Nothing like this exists: no per-guest block, remove-guest, link rotation or account suspension. The only block (`user_blocks`) covers following. Today a host can remove uploads one at a time, hold every upload for review, or pause uploads for everyone.
- Who a person is to an event: a confirmed guest is an account (`guests.user_id`, every device they use); a name-only guest is one row minted by one browser (`guests.id`). Device ids are capture-only by rule (never gating) and a venue shares one IP, so a block keys on the account, the confirmed address or the row, never a device or an IP. On an event without Require verified emails, a block therefore holds on one browser, and the block's sheet should offer turning Require verified emails on.
- The host sees a confirmed guest's address under the name in the host's viewer, and (wired this round) in the Guests room; a typed, unconfirmed address never shows to anyone. A guest never sees another guest's address.
- The host's Guests room (`src/app/(app)/dashboard/[eventId]/guests/page.tsx`, `src/components/social/guest-list.tsx`) shows nothing while the event's public guest list is off today; blocking, the addresses and a waiting queue need it either way (one of your questions).
- A password change evicts nobody already unlocked for up to 12 hours today (a ROADMAP line), so do not draw a password change as a way to close an event.
- Everything is free on every plan (his word); Require verified emails, Require an upload to view, Review and Pause are free today too.

**The decisions, one question each** (`defineExploration`; progressive with `after` where one answer shapes another; every option drawn at 375 and 1440; options are real contenders, never forced apart):
1. Where a host blocks: the uploader credit's menu in the host's viewer, a row in the Guests room, Review's decline, or a combination (draw each entry as the host would meet it).
2. The block's sheet: what it says leaves with the person (their uploads, their place on the list), the one-browser caveat for a name-only guest with Require verified emails offered right there, and whether it confirms first or acts at once with an Undo.
3. The door a blocked person meets: on arrival, and mid-visit when an upload is refused and the album closes (plain, never "blocked"; the words are placeholders judged for size and tone, not final copy).
4. The blocked list and unblocking: where the host sees who is blocked and lets someone back (their removed uploads stay in Deleted to restore by hand, or come back with them).
5. The host's Guests room when the event's public guest list is off: does the host's room list its guests regardless (the switch then governs only what guests see), and how does it say so.
6. How the closed doors are chosen in the event's settings sheet (`src/components/app/event-settings/`): one "who can join" choice (anyone with the code / approve newcomers / closed to newcomers / an invite list) or separate switches, beside Require verified emails, Require an upload to view, Review and Pause.
7. Approve newcomers: the waiting door a newcomer sees, and the host's queue (the hub card's count, a Guests room section; let in, or decline as a block).
8. Close to newcomers: the closed door a newcomer meets, and how "already in" reads to the host.
9. An invite list: the host's editor (adding addresses, one by one or pasted) and the doors of a listed and an unlisted person.

**Never ask what a standing board asks, and name each in the board's context:** `media-viewer.who` (the credit's shape: put the block item on today's shipped credit), `identity-door`'s asks (the field, the member nudge, the verified gate's benefit, the name menu, undoing an email), `host-curation`'s bulk act, undo, count and arrivals, `profile-page.view-all` (how the full guest list opens), and the seven `voice-guest` lines. Read their `spec.ts` files first.

**Build from the kit** (`src/components/lab`), with your own fixtures in the board folder (not `sandbox/gallery-fixtures.ts`, which another lane is reshaping). `Fit` and `Measured` land in the kit from the `lab-scene-kit` lane during your build (the Orchestrator announces it in `docs/tracks/orchestrator.md`): import them from `@/components/lab` after syncing past it, and never declare functions with those names (`kit-discipline.test.ts` refuses a board that does). The truth for the shipped pieces: `src/components/shared/media-lightbox.tsx` (the credit), `src/components/app/event-feed/review-room.tsx`, `src/components/app/event-settings/{event-settings-sheet,uploads-section,visibility-section}.tsx`, the Guests room page and `guest-list.tsx`, the door (`src/components/guest/{entry-shell,entry-modal,guest-name-step,password-gate}.tsx`, `src/lib/guest/entry-steps.ts`). Register the board directly after `host-storage` in `registry.ts`, `boards.ts`, `touchpoints.ts` and `DESK_ORDER` (your own lines only; the Orchestrator moves the desk order at the merge). The board at 1440 and 375 with reduced motion honoured; no em-dash; no mono face.

**Asks for Will's assets**: none expected; name any in the Handoff.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

Each was taken on its recommendation and built; the first five also stand on the board as its carried calls or in its round line.

- **Nine steps or thirteen?** Four of the brief's nine each held two independent choices: where the blocked list lives / what letting someone back restores; the newcomer's waiting door / the host's queue; the newcomer's closed door / how "already in" reads; the invite list's editor / the unlisted person's door. Recommended and taken: thirteen narrow steps, the second of each pair staged behind the first with `after`, so every step is one pick (PROGRAM: "Prefer more rounds of narrower questions to one wide one"). Overrule: merge a pair back into one step whose options are whole designs.
- **Which screen first?** Taken: 375 on every step (a bad actor turns up mid-party, the host acts from a phone, and every door is a phone), 1440 on every knob (`phone-first`).
- **The host's own Guests room: rows or the album's chips?** Taken: rows (today's room draws chips with the address under a confirmed name; a row has room for the address, a count and a menu); the album keeps its chips (`room-rows`).
- **What stands behind a closed or waiting door?** Taken: the ghost river a password page shows, never the teaser's photographs, on an approve-newcomers or invite-list event before the check too (`nothing-behind`).
- **Someone already in, on a new phone, at a closed album?** Taken: the closed door keeps a quiet "Already a guest? Confirm your email" for anyone with a confirmed address; a typed name is its one browser (`back-in`).
- **What the block's sheet says about turning on Require verified emails mid-party.** Taken: its real cost, drawn in the switch's own line (newcomers confirm an email first, and everyone who typed a name confirms one at their next photo: the shipped mid-visit flip in `guest-flow.md`).

## System-doc edits (in place, owned facts only)

- none (the lane owns no system fact; the board draws what the wiring round would state)

## Deferred (ROADMAP one-liners, bucket named)

- The lab and the kit: `Several` (an option drawn as several screens: phones side by side on equal columns, laptops stacked and cut short) and `ScrollHere` (scroll a frame's sheet or page to the card a decision is about) are local to `event-safety`; `voice-guest`'s `Pair` is the same idea as `Several`. Kit candidates.
- The lab and the kit: `lab:demo` compares only an option's FIRST frame, so a composite option whose first frame matches another option prints "same picture" (`event-safety.entry`, `all` against `credit`), and on a stage taller than about three screens a `--save-shots` capture lands misaligned (the lab's sticky bar inside it). Comparing every frame, and scrolling each one into view before its clip, would end both.

## Handoff (replaces the chat report)

- **Work commits** (pushed on `lp/event-safety`): `8fba5b00` (the board, its registration lines, `library.md` regenerated), `4c0c4611` (the viewer's menu seated by the credit's height; two lines truer), `73a7e3e1` (`Fit` and `Measured` imported from `@/components/lab`; the stopgap `pending-kit.tsx` deleted), `3a1f029c` (the held closed door keeps "What is Partyreel?"; the board's context names the neighbours' asks). **Sync commit:** `4f89613e`, `git merge origin/launch-prep` at `33d70510` (host-followons and lab-scene-kit landed; the one conflict, `docs/design/library.md`, regenerated by `pnpm design:rules` on the merged tree). launch-prep has not moved since (`git log HEAD..origin/launch-prep` empty at the handoff).
- **Gates on the synced tree (`3a1f029c`), each on its own exit code:** `pnpm design:rules` 0 (no diff after it) · `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` 0 (no diff) · `pnpm typecheck` 0 · `pnpm lint` 0 (9 warnings, none in a file this lane touched) · `pnpm test` 0 (365 files, 4104 passed, 1 skipped) · `pnpm build` 0 · `pnpm lab:smoke --base http://localhost:3134` 0 (520 checks, 0 failing; `event-safety` reads 815 of 1200 words) · `pnpm lab:demo --board event-safety --base http://localhost:3134` 0 (13 steps, 0 failing; one warning, `entry`: "same picture: On their name, in the viewer = All three", because the tool compares a composite option's FIRST frame and the three-door option opens on the viewer by design; a Deferred line).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, before this commit adds the manifest):
  ```
  docs/design/library.md
  src/app/(dev)/design/(shell)/lab/boards.ts
  src/app/(dev)/design/sandbox/event-safety/block.tsx
  src/app/(dev)/design/sandbox/event-safety/board.tsx
  src/app/(dev)/design/sandbox/event-safety/event-safety.css
  src/app/(dev)/design/sandbox/event-safety/fixtures.ts
  src/app/(dev)/design/sandbox/event-safety/guest.tsx
  src/app/(dev)/design/sandbox/event-safety/host.tsx
  src/app/(dev)/design/sandbox/event-safety/scene.tsx
  src/app/(dev)/design/sandbox/event-safety/settings.tsx
  src/app/(dev)/design/sandbox/event-safety/spec.ts
  src/app/(dev)/design/sandbox/registry.ts
  src/app/(dev)/design/touchpoints.ts
  ```
  Exceptions: `registry.ts` (2 lines), `boards.ts` (2 lines) and `touchpoints.ts` (the `RulingId` and `SandboxId` lines, the board's RULINGS row, its `DESK_ORDER` line), each directly after `host-storage` as the brief says; `docs/design/library.md` is the gate's own output (`pnpm design:rules`: the board count 25 to 26 and the board's row in the standing-boards table), committed as `host-storage`'s lane did.
- **The items:**
  - The board `/design/lab/event-safety`, "Keeping an event safe": 13 decisions, 39 options, every option drawn at 375 (the default) and 1440 (a Screen knob on every step), over Maya and Jay's wedding where Dom Hale (a confirmed address) keeps sending a nightclub to a wedding.
  - Two knobs of its own: Who is blocked (Dom, or Rick, a typed name on a names-only party, which draws the one-browser note and the Require verified emails switch) on the block step; When (arriving, or mid-visit with a photo refused) on the blocked door.
  - The steps: `entry` (where Block lives), `sheet` (the block itself), `door` (the blocked door), `blocked` (the blocked list), `restore` (what letting back in restores), `room` (the Guests room with the album's list off; `today` declared), `choose` (who can join), `waiting` (a newcomer's waiting door), `queue` (where the host lets newcomers in), `newcomer` (the door when closed to newcomers), `inside` (how "already in" reads), `editor` (the invite list), `unlisted` (the door off the list). Staged: `sheet` and `blocked` after `entry`, `restore` after `blocked`, `waiting`, `inside` and `editor` after `choose`, `queue` after `waiting`, `newcomer` and `unlisted` after `door`.
  - Everything is quoted from the shipped pieces (the viewer and its credit capsule, the Guests room, Review, the hub and its cards, the settings sheet's cards, the door's held drawer and desk panel, the not-found family, the failure sheet, the Dialog, the DropdownMenu anatomy with its footer rail, the toast); the real `NotFoundScreen`, `GuestBar`, `GhostRiver`, `FeedSectionHeader`, `FeedSectionEmpty`, `VisibilitySelector`, `FooterQr`, `Card`, `Switch` render as themselves. No portal, no Server Function, no network; every act inert.
  - Measured captions, read off each frame: the Block (or Let in, Let back in, Undo) control's height and how far down the screen it sits; how many lines each door's plain line takes; how much of the hub's counting card is on screen at 375.
  - A finding for the `queue` step: at 375 the hub's cards row runs past the phone's edge, so a count on the third card (Guests) is half a card at rest; the hub frame's caption says how much.
  - No lock chip or upgrade prompt anywhere (his "Both free on every plan"); no em-dash, no mono face; reduced motion honoured (nothing on the board animates of its own; the production entrances it mounts keep their reduced-motion blocks; `lab:demo` runs emulating reduced motion).
  - Verified at 375 and at 1440: `lab:demo --save-shots` on the default knobs, then a second pass with the knobs flipped (1440, Rick, mid-visit) and flipped back (`git status` clean after), every capture read.
  - A creative delight for the wiring round (emil): the block's receipt. When Block lands, the sheet's strip of their uploads folds into one stack that slides toward the album's Deleted filter as the sheet leaves (transform and opacity only, about 240ms on the emphasis curve; a plain fade under reduced motion), so the host sees where the photographs went without a sentence saying it.
- **Assets requested from Will:** none (the stills are the twelve bootstrap photographs; the addresses are `example.com`).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** thirteen steps where the brief named nine (the Questions' first line) · 375 first (`phone-first`) · the host's room as rows (`room-rows`) · nothing real behind a closed or waiting door (`nothing-behind`) · the quiet way back in for a confirmed address (`back-in`) · the block sheet's switch says its real cost · each step's recommendation: `all`, `confirm`, `private`, `foot`, `ask`, `always`, `choice`, `both`, `room`, `same`, `sentence`, `both`, `another`.
- **Look at first:** `entry` at 375 (the three doors into one block, side by side), then `sheet` with Who is blocked on Rick (the one-browser note and its switch), then `door` with When on mid-visit.
