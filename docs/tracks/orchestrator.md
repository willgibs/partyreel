---
track: orchestrator
status: open
cut: "e30aaada"          # the launch-prep SHA this state was written at
owns:                    # the standing claims no lane touches
  - src/app/globals.css
  - src/app/theme.css
  - src/app/(marketing)/marketing.css
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/rules/bible.test.ts
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/lib/design-gate/
  - src/app/api/design-gate/
  - scripts/vercel-ignore-build.mjs
  - .github/workflows/ci.yml
reads:
  - CLAUDE.md
  - docs/PROGRAM.md
announces:
  - "reel-defaults-migration merged at 71cfea65 (2026-09-25), its migration applied: `events.reel_hold_sec` (NULL = the default hold; read it with `resolveHoldSec(row.reel_hold_sec)`, since the generated type says `number`), returned last by `get_event_by_qr_token`; `HOLD_STEPS_SEC`, `DEFAULT_HOLD_SEC`, `nearestHoldStep`, `REEL_MOOD_IDS` in `@/lib/reel/defaults` (their one home: the guest lane drops its copies); `setReelDefaults({ eventId, showReel?, styleId?, holdSec? })` in `@/lib/reel/defaults-action` for the view's Set for everyone and Settings; `event_stills(uuid[], int)` (authenticated, one jsonb of preview keys an event, presigned server-side like `readCoverUrls`). reel-guest-wiring and reel-host-wiring merge origin/launch-prep past it."
  - "media-viewer-wiring merged at 7eb190de (2026-09-24): `MediaLightbox`/`MediaLightboxLazy` take `origin={{ kind: \"reel\", rect }}` (rect null fades in; omit `returnTo` so the way out lands in the frame) and `startAt` (a clip's seconds); `ViewerOrigin` is exported from `@/components/shared/media-lightbox`; the photo parameter is `PHOTO_PARAM` with `readPhotoParam` in `@/lib/media/share-save`, whose Save follows the platform (the clip's finish reuses it)."
---

# The Orchestrator's state

The pickup: read this first at every session start, compaction or restart, then `docs/STATUS.md`. It holds only what
is true now: what runs, what comes next, what waits on Will. How to cut, integrate, deploy and recover is the runbook,
[`usher/kit/README.md`](../../usher/kit/README.md). Rewritten in place, never a log. The Orchestrator is whichever
model Will seats (Fable or Opus); nothing here depends on which.

## In flight

Up to eight lanes at once (Will, 2026-09-24); every production build, a lane's or the kit's gate, takes turns
through `scripts/build-lock.sh` (the kit's gate takes it itself). Batch 3 runs overnight on 2026-09-25 with Will asleep
in auto mode ("work through the night on all of this until fully complete"); the live plan is
`~/.claude/plans/great-work-however-1-dapper-twilight.md`, and the lanes' manifests carry everything they need.

| lane | what | state | model, port | at its handoff |
| --- | --- | --- | --- | --- |
| `reel-clip-wiring` | the creator with his tabs, the finish, the Studio out, the client adds, the seam flip, `reel-front` on the tile | building (agent `abac01a6bfea16cbd`) | Opus, :3131 | integrate first of the stretch's last three |
| `reel-teardown` | the stored reel's server side out, `reel_clip_add`, the lever's admin switch and the host reading it, the R2 sweep script | building (agent `a17875c8c12aa4276`) | Sonnet, :3132 | integrate after the clip lane, synced |
| `reel-sweep` | the words everywhere but round 2's four, help, legal, docs, `reel.md` born | building (agent `a5e526adcff700214`) | Opus, :3133 | integrate last, synced; then build 9 |
| `story-r2` | `reel-story` round 2: `close`, `card`, `wall`, `play` | drawing (agent `abb0868fcf15e30d4`) | Opus, :3134 | rides build 9 |
| `mark-r3` | `media-viewer` round 3 on rows with bursts | drawing (agent `aa6d3323c6beb4bae`) | Opus, :3135 | rides build 9 |
| `door-r2` | `identity-door` round 2, the door's look; `identity-claims.pointer`, `identity-profile.prompt`, `guest-capture.tracker` adapted in round 1 | drawing (agent `ac8b8637fa91b86b8`) | Opus, :3138 | rides build 9 |
| `album-window` | windowed rows, the memo'd tile, no off-screen animation, three steps, the push arrival, the density control, the perf harness | building (agent `a14670e17b0a7ffc3`) | Opus, :3136 | its masonry fixes ship at its merge |
| `album-pages` | the manifest, links by id, the version and change-log migration, the store and routes | building (agent `ad4b8ad9c6a69ad06`) | Opus, :3137 | ends a turn with "migration ready at <sha>" for the rolled-back check and apply |

Queued for the next free seats: `door-flow` (his chooser, the identify and log-in steps, the keyboard-safe responsive Sheet replacing vaul, the focus rules, the menu card, the pending email's change or remove) and `identity-email` (the account's email change confirmed at both addresses with the copies following, the typed name surviving the magic link, the deletion scrub going forward with its safety nets; the backfill waits for Will).

## Next, in order

1. **Merge the two held reel lanes** (guest, then host), then cut from the new tip: `reel-clip-wiring` (the creator
   with his tabs, the finish, the Studio out, the client adds, the seam flip, `reel-front` on the tile),
   `reel-teardown`, `reel-sweep` (all but the four copy asks `reel-story` r2 holds), the lab rounds `door-r2`,
   `story-r2` and `mark-r3`, and the paged album's engine lanes `album-window` (windowed rows, the memo'd tile, three
   steps, the push arrival, the density control, the perf harness) and `album-pages` (the manifest, links by id, the
   version and change-log migration, the store and routes).
2. **The stretch integrates** clip, teardown, sweep, synced; the three boards land; one `[preview]` (build 9); the
   red-team walks the reel's journeys. The drop migration and the one-shot R2 sweep wait for Will's yes.
3. **Then**: `album-guest-wiring` and `album-host-wiring` (every album surface onto the paged, windowed rows with
   `album-columns` r2's picks; `planTake` sub-quadratic on the manifest), `door-flow` (his chooser, the keyboard-safe
   phone sheet, the menu card), `identity-email` (the deletion scrub going forward, the account's email change),
   `reel-marketing` after his `reel-story` r2, the mark's wiring after his `media-viewer` r3.
4. **The lab revamp**, once the desk's open boards close and before new explorations open: a board as one
   self-registering folder, its metadata in its spec, lab checks scoped to the lane's own boards, the authoring API
   trimmed, a fresh agent proving it; with library-lean's board ideas (a `Surfaces` family of live frames per route
   with guest entries, the Library's sidebar open by default, a plain-text view of Library pages, a
   retire-or-reuse call on `anonymous-info.tsx` and `floating-add-button.tsx`, and the lab's own words renamed with the
   revamp: the review mechanic's "ruled", `touchpoints.ts`'s `RULINGS`/`Ruling`/`getRuling`, and "ratified").

## Waiting on Will

- **His sitting on build 9**: `identity-door` r2 first, then `reel-story` r2 and `media-viewer` r3.
- **Two yeses**: the reel drop after build 9's red-team; clearing past deleted accounts' addresses from guest rows.
- **A 10-second iPhone check**: Save to Photos lands in Photos, and a shared photo arrives as a photograph.
