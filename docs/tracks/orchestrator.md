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
| `album-guest-wiring` | the guest album, viewer, reel and profile feeds onto the paged, windowed rows with r2's picks; `planTake` sub-quadratic; the perf harness's `--page` mode | building (agent `a29a00be06c5e3b16`) | Opus, :3131 | its `guest-flow.md` lines through the Handoff |
| `album-host-wiring` | the hub's album onto the paged rows, select mode on the one grid, the bin on a manifest, Sort live, `like_many` | building (agent `a54c6daada060d103`) | Opus, :3134 | ends a turn with "migration ready at <sha>" for `like_many`; `host-app.md` lines through the Handoff |

Merged tonight (their records carry the rest): reel-guest-wiring, reel-host-wiring, mark-r3, story-r2, door-r2,
album-pages, reel-clip-wiring, identity-email, reel-teardown, album-window, hardening, reel-sweep, door-flow.

## Next, in order

1. **Build 9** (`[preview]` at the sweep's record): the alias checks, then the red-team walks the reel's journeys (the
   plan file's list). Its drop migration (`20260924110000_live_reel_drop.sql`) and then `node
   scripts/sweep-reel-files.mjs --apply` wait for Will's yes.
2. **Integrate as they land**: `album-host-wiring` (its `like_many` migration first), `album-guest-wiring`, `door-flow`
   (synced past both). Then build 10.
3. **Retire the built boards** (`reel-cut`, `reel-front`, `reel-screen`, `reel-host`, `reel-view` now; `album-columns`
   after the surface lanes), atomically across `touchpoints.ts`, `registry.ts` and `boards.ts`, their ledgers with
   them.
4. **After his sitting on build 9**: `reel-marketing` (his `reel-story` r2), the door's look (his `identity-door` r2)
   over `door-flow`, the mark's wiring (his `media-viewer` r3).
5. **The lab revamp**, once the desk's open boards close and before new explorations open: a board as one
   self-registering folder, its metadata in its spec, lab checks scoped to the lane's own boards, the authoring API
   trimmed, a fresh agent proving it; with library-lean's board ideas (a `Surfaces` family of live frames per route
   with guest entries, the Library's sidebar open by default, a plain-text view of Library pages, a
   retire-or-reuse call on `anonymous-info.tsx` and `floating-add-button.tsx`, and the lab's own words renamed with the
   revamp: the review mechanic's "ruled", `touchpoints.ts`'s `RULINGS`/`Ruling`/`getRuling`, and "ratified").

## Waiting on Will

- **His sitting on build 9**: `identity-door` r2 first, then `reel-story` r2 and `media-viewer` r3.
- **Two yeses**: the reel drop after build 9's red-team; clearing past deleted accounts' addresses from guest rows
  (`20260926210000_identity_backfill.sql`, written, never applied).
- **One dashboard minute** (no management token here): Supabase, Authentication, Templates, Change Email Address, add
  `{{ .Token }}` beside `{{ .ConfirmationURL }}` (the wording is in lp/identity-email's Handoff, merged at `3248a785`);
  until then an email change confirms by the link at both addresses.
- **A 10-second iPhone check**: Save to Photos lands in Photos, and a shared photo arrives as a photograph.
