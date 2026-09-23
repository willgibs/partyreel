---
track: event-safety
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
