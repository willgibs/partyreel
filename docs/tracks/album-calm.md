---
track: album-calm
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "ac73941e"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/guest/refresh-coalescer
  - src/lib/guest/use-gallery-doorbell
  - src/lib/shared/use-live-poll
  - src/components/guest/gallery-live
  - src/components/app/event-feed/host-album
  - src/components/app/dashboard/use-stage-live
  - src/app/api/album/guest/sync/
  - src/app/api/album/guest/media/
  - src/lib/events/album-wire
  - docs/systems/guest-flow.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/PRICING.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/host-app.md
  - docs/systems/disposable-mode.md
  - docs/systems/database-security.md
---

# lp/album-calm

**Goal.** The live album, calmed: others' arrivals land in calm batches about every 15 s (hers at once), a hidden tab neither syncs nor listens, and a tab that comes back catches up at once with the new-media entry for what it missed; a delta carries its new items' links, so a batch arrives in one call. About half the album's server calls and Realtime messages go, and the album feels calmer.

## The brief

**Will's words (2026-10-03), in full:** "Yes, let's calm the live album. That would be a huge win for us, and 15 seconds is still an incredibly reasonable time for one guest's photos to distribute out. Don't think a ton of guests are staring at someone else uploading to judge the wait, versus just watching what pops in as they go. May even smoothen the experience so a huge event isn't just machine gunning in new items at every second, more in batches. And yes, background tabs can stop syncing, that's needlessly draining resources for something that isn't being watched. Can immediately update when it becomes active, which is probably more pleasant with the nice 'new media' animation entry to see anything new come in you missed. Also open to more opportunities like this, where we can improve UX while reducing our own costs. Massive win-wins."

**Why.** PRICING.md "What it costs us": the live album is the first wall. Every upload times every open album costs about one Realtime message and 1.2 function calls (each run twice with the proxy), so a party twice the size costs four times as much to keep live. Lever 1 there: (a) widen the coalescer (`guest/refresh-coalescer.ts`, ~2.4 s today) to 15 s and keep hidden tabs from syncing on a ping; (c) let a delta carry its new items' links (one call where there were two). Its numbers are the baseline: re-measure, never trust them.

**Build:**
1. **Calm batches.** Another guest's arrivals land together, about every 15 s, never one tile a second at a big party. Her own uploads still land at once. One clock for the batch, in one home, named once.
2. **Hidden tabs.** A hidden tab neither syncs on a ping nor stays a Realtime listener (a broadcast counts one message per listener): it leaves the album's channel while hidden. The 60 s and 12 s polls stay stopped while hidden. On its return it rejoins and syncs once, at once, and what it missed arrives through the album's existing new-media entry, never as a jump. A tab hidden for hours comes back right: the windowed rows, the links' hourly re-mint and the waiting count all hold.
3. **One call a batch.** A delta carries its new items' presigned links, so the client stops making the second links call for them. The links route stays for windows and re-mints. Every key stays server-side, and the guest's own scoping (the seal, hold-for-approval, removed, blocked) is unchanged and re-pinned by tests.
4. **Everywhere the doorbell rings.** The guest album (`gallery-live.tsx`), the host's album (`host-album.tsx`) and the dashboard's live stage (`use-stage-live.ts`) follow the same rules where they share the machinery. A wall display (a visible tab left open all night) keeps working: it is visible, so it batches.

**Measure before and after** in your scratch: the calls and Realtime messages for one guest's 20 uploads with three other albums open (two visible, one hidden), plus one tab hidden for ten minutes, then shown. Write the before/after into PRICING.md's lever 1 in place (its one home; refine the line, never append).

No product change beyond these. The develop, the seal and the waiting sheet keep their behaviour; the waiting count simply updates with the batch. Will's standard: nothing feels slower to the guest who shot it.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree, each step on its own exit code; `pnpm lab:smoke --base http://localhost:3132`; red first for the batch, the hidden tab's silence and its catch-up, and the delta's links (tests failing on today's code, logged); the before/after measurement logged in your scratch; a capture of a batch landing and of the catch-up after a hidden spell, at 375 and 1440.

## Where I am

- Built and unit-green (WIP commit): the batch clock (`refresh-coalescer.ts`, `ALBUM_BATCH_MS`), the doorbell that
  leaves its channel while hidden (`use-gallery-doorbell.ts`), the poll that never starts hidden (`use-live-poll.ts`),
  the host album on the shared poll, the stage's guard gone, and a delta carrying its new items' links
  (`album-wire-carry.ts`, `album-wire-links.server.ts`, the sync route). Red logged before the build:
  `_scratch/album-calm/red-before.log` (33 failing on today's code).
- Before measured on a base `next start` (`_scratch/album-calm/measure-before.log`); the after build is next, then the
  after measurement, the captures, the docs (guest-flow.md, PRICING lever 1) and the gate.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Does another guest's first photograph after a quiet spell wait for the clock too?** Recommended and built: yes.
  Every ping waits for the device's next tick (a uniform 0 to 15 s, 7.5 s on average), and the ticks fall at a phase
  each device draws, so a venue of phones never asks in one stampede. The alternative, a leading edge (the first ping
  at once, then 15 s batches), costs one more sync a burst on every device, lands a burst as "one, then the rest", and
  sends every phone to the server in the same second. Will's to overrule.
- **Does a tab leave the channel the instant it hides?** Recommended and built: yes, with no grace before leaving (a
  phone suspends its page seconds after hiding, so a delayed leave would never run there); a returning tab keeps its
  Live mark up to 3 s while it rejoins (`REJOIN_GRACE_MS`), so the host's pip does not blink on every return.
- **How many new items does a delta carry links for?** Recommended and built: the newest 48 (`ALBUM_DELTA_LINKS_MAX`,
  the first paint's own screenful); a bigger batch (a tab back from hours away) carries the head's, and the window asks
  the links route for the rest only if the reader goes there.

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
