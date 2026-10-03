---
track: album-calm
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
- **Who writes the before/after into PRICING.md?** Recommended and done: not this lane. `cost-atlas`, cut after this
  brief, owns PRICING.md and is rewriting "What it costs us" with this lane's after-state as its baseline, so an edit
  here would conflict with its rewrite. The measurement is in the Handoff, and the lever-1 and "An open album" edits
  this lane drafted are a diff for it to take or leave (`_scratch/album-calm/pricing-lever1-proposed.diff`). Until it
  lands, PRICING's "syncs within ~2.4 s", "a hidden tab whose socket lives too" and "the client then asks links for the
  new ids" describe the album before this lane.

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`, the live gallery: the doorbell's calm batches and the hidden tab that is no listener
  (the bullet "The doorbell"), the poll's one catch-up on a return and that it never starts hidden ("The conditional
  poll"), a batch as one call ("A link is read by id"), and the arrival gate's sentence on a delta's link.
- `docs/systems/testing-verification.md`, the presign-roll soak: its one line on what a hidden tab does (a tab that
  loads hidden no longer keeps a throttled interval: it starts none), a fact of this lane's `use-live-poll.ts`.

## Deferred (ROADMAP one-liners, bucket named)

- Host: the host's delta could carry its new items' links as the guest's does (`/api/album/host/<id>/sync` with
  `album-wire-carry.ts`), one call a batch on the hub too (from `album-calm`).
- Guests: the reel tile re-deals its six stills on every arrival (`reel-tile.ts`, `planTake` over the whole album),
  and a re-dealt still no window linked costs a links call: 8 of the 26 calls in the after measurement; a deal that
  keeps the stills that still play would make every batch one call (from `album-calm`).
- Platform: the doorbell rings each visible listener once a changed row; a ping coalesced server-side (one an album a
  few seconds, `media_gallery_doorbell`, a migration) would cut the visible albums' Realtime messages as the batch
  clock cut their calls (from `album-calm`).
- Tooling: `scripts/album-perf.mjs --arrive` waits 15 s for the hide and for the arrival to reach the page, which the
  batch clock can now just exceed (a tick up to 15 s, then a round trip): its waits want 20 s (from `album-calm`).

## Handoff (replaces the chat report)

- **Commits**, pushed on `lp/album-calm`: `fa7f6334` (the machinery and its tests), `1d523b68` (the system docs and the
  doorbell's socket note), `4837da8d` (guest-flow's double-join line), then this manifest alone. **No sync**:
  launch-prep moved (crumbs-57 at `66b656ff`, crumbs-58 at `3d3e3507`, records), but nothing it brought touches this
  lane's paths or machinery (`git diff --name-only 1d3f081f origin/launch-prep` shares no path with the lane's).
- **Gates on `1d523b68`**, each on its own exit code (logs `_scratch/album-calm/gate-*.log`): typecheck 0; lint 0;
  test 0 (852 files, 10,115 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base
  http://localhost:3132` against `pnpm dev` 0 (157 checks), and against that build with `--production --key` 0 (163
  checks). `4837da8d` after it is one doc line no test reads. No board, so no `lab:demo`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned prefixes, this manifest and
  `docs/systems/testing-verification.md` (listed under System-doc edits: its one line on a hidden tab is this lane's
  `use-live-poll.ts`). PRICING.md is untouched (the Questions).
- **Red first**, on today's code: `_scratch/album-calm/red-before.log`, 33 failing (the batch clock, the doorbell's
  hidden silence and its return, the poll that started under a hidden tab, the delta's links at the route and in the
  album, the hidden-for-hours catch-up); green on the build after: `green-1.log`.
- **Measured** on production builds (`measure-before.log`, `measure-after.log`, `compare.log`, `bodies-after.json` in
  `_scratch/album-calm/`): one guest's 20 uploads through the product's write path, about 4.5 s apart, four albums open
  as four devices (V1 at 375 and V2 at 1440 visible; H at 1440 and L at 375 hidden; L shown after ten minutes):
  - the two visible albums: calls 84 to 26 (syncs 44 to 18: 14 on the 15 s ticks, 4 the minute's net; links calls 40
    to 8, every one a reel tile's re-dealt still, none a new photo), bytes 68 to 51-56 KB each;
  - the two hidden ones: calls 81 to 1 (L's return: one sync carrying all 20 links, 35.7 KB, no links call); pings
    heard 40 to 0;
  - Realtime messages 100 to 60 (20 sends, deliveries 80 to 40); quiet minutes unchanged (one 304 a minute a visible
    album); function invocations, twice the calls with the proxy, 330 to 54.
- **Captured** (`_scratch/album-calm/captures/after/`): `batch-375.mp4` and `batch-1440.mp4` (five photos landing
  together on the tick, the sixth one tick later), `return-375.mp4` and `return-1440.mp4` (a minute hidden, then one
  sync and six arrivals through the album's push), contact sheets `*-sheet.png`, the 375 landing at 30 fps
  `return-375-landing30.png`.
- **Items:**
  - The batch clock (`refresh-coalescer.ts`, `ALBUM_BATCH_MS` 15 s, named once): every ping waits for the device's
    next tick at a phase it draws, one sync a tick, nothing for a quiet album; hers, a host's write and a return never
    wait.
  - The doorbell (`use-gallery-doorbell.ts`): a hidden tab leaves the channel and syncs nothing; a join waits for any
    leave of its topic (a blink, a `key={access}` remount, React's dev double mount: each would have sat deaf); Live
    holds 3 s while it rejoins.
  - The poll (`use-live-poll.ts`): starts nothing in a tab that opens hidden, restarts nothing under a hidden tab; the
    host album runs on it (its own copy gone), and the stage's hidden guard went with its reason.
  - One call a batch: a delta carries its newest 48 upserts' links (`album-wire-carry.ts` `carriedIds`, the sync
    route), minted by the links route's own `mintGuestAlbumLinks` (`album-wire-links.server.ts`, the reads' gate: a
    held, sealed or removed id gets none); the guest album's transport answers the link store's ask for them itself
    (`carryingTransport`: dated exactly, once, never past its re-mint time); a failed carry is reported and costs the
    delta nothing.
- **Disposable data**: the event "album-calm probe" (`c8a79523-3a0e-4e3b-bdbb-a7075142e86a`, willg97's, name-only,
  live, open; its token only in `_scratch/album-calm/probe.json`) with about 90 numbered photos and eight name-only
  "Calm" guests, all through the product's write path: ready for the alias walk with two phones, and to delete after
  (the host's Settings, Delete).
- **Assets requested from Will**: none.
- **Board ideas:**
  - How a batch lands: at 375 a batch of six opens the whole head at once, and for about 150 ms of the 400 ms push the
    head is mostly ground, each tile revealing from its left edge (`return-375-landing30.png`); `arrival=push` was drawn
    for one arrival: a push together, a stagger or one fade for a batch.
  - At 1440 one arrival at the head re-flowed the rows on screen from 6-5-5 to 3-5-3 (`b1440-stack.png`): batching
    makes that once a batch, but whether a head arrival should keep the rows below it is a question of its own.
  - The marketing's "Uploads appear the moment guests take them" (`review-modes.tsx`, `album-copy.ts`) now means
    within about 15 s on another phone (hers at once): the voice's call whether the words move.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule**: the clock with no leading edge; the leave the instant a tab hides, with Live held 3 s on a
  return; 48 links carried a delta; PRICING.md left to `cost-atlas` with the measurement and a drafted diff
  (`_scratch/album-calm/pricing-lever1-proposed.diff`). Each is in the Questions.
- **Look at first**: `return-375.mp4` and `batch-375.mp4`; then `use-gallery-doorbell.ts`'s `settle` and `leave` (the
  join that waits for any leave of its topic); then the sync route's `carriedLinks`; the alias walk: two phones on the
  probe, one locked a minute while the other uploads, then unlocked.
