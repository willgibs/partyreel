---
track: orchestrator
status: open
cut: "ab30a7f8"          # the launch-prep SHA this state was written at
owns:                    # the standing claims no lane touches
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
  - "album-guest-wiring merged at a474d130 (2026-09-25): every album is the windowed rows; the viewer takes `onNeedLinks` (an item with `url: \"\"` is a placeholder); `MasonryColumns`/`AlbumRows` take `firstPaintWidth` and `onBoxWidth`; `album-window-plan.ts` holds the first paint (`firstPaintIds`, `ALBUM_WIDTH_COOKIE`, the served plan); `/api/guests/gallery` is gone; `yours-filter` lives in `src/lib/guest/`."
  - "album-host-wiring merged at 7130d26d (2026-09-25): `HostAlbumLinksBody` (the host's links answer plus `likes`) in `@/lib/events/album-wire`; `likes-provider.tsx` seeds likes per window and bulk-likes through `like_many`; `lib/events/host-fingerprint.ts` and `/api/events/[eventId]/live` are gone; the bin is `/api/events/<id>/bin` and `bin/media`."
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
through `scripts/build-lock.sh` (the kit's gate takes it itself). The lanes' manifests carry everything they need; an
agent id below lives only in the Orchestrator session that spawned it (another session respawns: the runbook's "Resume
a lane").

| lane | what | state | model, port | at its handoff |
| --- | --- | --- | --- | --- |

Batch 3 closed at milestone 29 (`ab30a7f8`, 2026-09-26): 49 lanes since milestone 28, their merge commits carrying
the rest; `launch-prep` equals `main`, and no lane, worktree or dev server is open.

## Next, in order

1. **Will's sitting on build 10** (the alias, `43b82591`, the desk's 21 boards): his paste goes through
   `pnpm lab:review` on STDIN (`--dry` first), then the verdicts become lanes: `reel-marketing` (his `reel-story` r2),
   the door's look (his `identity-door` r2) over `door-flow`, the mark's wiring (his `media-viewer` r3). The alias
   stays on build 10 until his sitting ends; build 11 carries those lanes.
2. **Build 11's red-team**, once they land. The scope of a full red-team, as build 10's walked it:
   - the reel on the album's data path: the tile, the view, clips, access, the password event, the demo;
   - `?reel=screen` soaked headless at 1920x1080 for 100 minutes (a hidden pane throttles the page);
   - the door at 375 on the Sheet;
   - the album at scale on both surfaces, and album-fixes' live walks it never had: a hide just above a deep guest's
     view moves nothing in it, and the bin's viewer restores and deletes on a phone as a signed-in host;
   - the owner's own password album, plain, `?reel` and `?reel=screen`, and its Download all.
3. **The lab revamp**, once the desk's open boards close and before new explorations open: a board as one
   self-registering folder, its metadata in its spec, lab checks scoped to the lane's own boards, the authoring API
   trimmed, a fresh agent proving it; with library-lean's board ideas (a `Surfaces` family of live frames per route
   with guest entries, the Library's sidebar open by default, a plain-text view of Library pages, a
   retire-or-reuse call on `anonymous-info.tsx` and `floating-add-button.tsx`, and the lab's own words renamed with the
   revamp: the review mechanic's "ruled", `touchpoints.ts`'s `RULINGS`/`Ruling`/`getRuling`, and "ratified").

## Waiting on Will

- **His sitting on build 10**: `identity-door` r2 first, then `reel-story` r2 and `media-viewer` r3.
- **A 10-second iPhone check on partyreel.com**: one tap on Save opens the system sheet (a photo, a video, a finished
  clip), and a shared photo arrives as a photograph.
- **The calls his to overrule** from the last lanes, relayed in chat on 2026-09-26: reel-and-copy's screens following
  a new default at the next hold; owner-album's Download all fix and a failed read staying a failure; album-fixes'
  three (the viewer closes on the bin's verbs, a sliver of a row counts as in view, the hold below the view too).
