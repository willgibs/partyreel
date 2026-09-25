---
track: orchestrator
status: open
cut: "bf2bc846"          # the launch-prep SHA this state was written at
owns:                    # the standing claims no lane touches
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

Merged tonight (their records carry the rest): reel-guest-wiring, reel-host-wiring, mark-r3, story-r2, door-r2,
album-pages, reel-clip-wiring, identity-email, reel-teardown, album-window, hardening, reel-sweep, door-flow,
retire-reel-boards, crumbs, album-host-wiring, album-guest-wiring, crumbs-2.

## Next, in order

1. **Integrate `album-guest-wiring`** as it lands (told to sync past `album-host-wiring`'s merge). Then build 10
   (`[preview]`), which opens Will's next sitting on the desk; build 9 (`52a19853`) serves the alias until then. Cut
   `save-sheet` after the guest lane's merge (it owns the viewer): on iOS, Save opens the system sheet in one tap in the
   viewer and the clip finish, since the sheet already carries Save Image or Video and Save to Files (Will's iPhone
   check), so the menu's Download file goes; elsewhere Save stays the plain download; the two help articles follow.
2. **Build 10's red-team** (Opus; the pane for a guest, Chrome's account chooser for the host), which also finishes
   build 9's walk (it stopped at the usage limit with its first six journeys passing):
   - the reel on the album's new data path: the tile, the view, clips, access, the password event, the demo;
   - `?reel=screen` soaked headless at 1920x1080 for 100 minutes (a hidden pane throttles the page);
   - the door at 375 on the Sheet (build 9's vaul sheet scrolled three times its height, and the password step opened
     past its heading);
   - the album at scale on both surfaces;
   - re-checks: the count's "1 photo & videos", one stalled owner `?reel` in a hidden tab, Settings saving the default
     look and hold as values rather than NULL.

   Afterwards the 15-photo probe's `reel_style_id` and `reel_hold_sec` go back to NULL. Journey 9's page checks passed
   on build 9 (both legal pages at 1.7, the retired help slugs 308, no stale reel claim on the marketing pages,
   `/admin/reels` a 404). The stored reel is gone whole: the drop applied, both buckets swept, its last code removed
   (`crumbs-2`).
   Then **milestone 29** (Will's yes, given): the full gate on `launch-prep`, merge to `main`, tag, verify partyreel.com
   (the host dashboard stops erroring), back-merge.
3. **Retire `album-columns`** once the surface lanes merge (the five reel boards retired at `0cbd5634`), atomically across
   `touchpoints.ts`, `registry.ts` and `boards.ts`, its ledger with it.
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
- **A 10-second iPhone check**: a shared photo arrives as a photograph (Save opens the system sheet, his check).
