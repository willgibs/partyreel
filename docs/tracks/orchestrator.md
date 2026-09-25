---
track: orchestrator
status: open
cut: "bf2bc846"          # the launch-prep SHA this state was written at
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
| `album-guest-wiring` | the guest album, viewer, reel and profile feeds onto the paged, windowed rows with r2's picks; `planTake` sub-quadratic; the perf harness's `--page` mode; build 9's two reel findings in its files (the view's scroll lock, the tile's hit area) | building (agent `a4f93b6854568e16f`) | Opus, :3131 | its `guest-flow.md` lines through the Handoff |
| `crumbs-2` | the stored reel's last code after the drop and the sweep (`reelOutputKey`, its two appends, the sweep script, stale comments and fixtures); the `voice-guest` board's door stylesheet | building (agent `af596085cbe6e2577`) | Sonnet, :3135 | rides the build after its merge; build 10 never waits for it |

Merged tonight (their records carry the rest): reel-guest-wiring, reel-host-wiring, mark-r3, story-r2, door-r2,
album-pages, reel-clip-wiring, identity-email, reel-teardown, album-window, hardening, reel-sweep, door-flow,
retire-reel-boards, crumbs, album-host-wiring.

## Next, in order

1. **Integrate `album-guest-wiring`** as it lands (told to sync past `album-host-wiring`'s merge). Then build 10
   (`[preview]`), which opens Will's next sitting; build 9 (`52a19853`) serves the alias until then.
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
   `/admin/reels` a 404). The drop migration is applied and the stored files are swept from both buckets; the stored
   reel's last code (`reelOutputKey`, its two appends, the stale comments) is a ROADMAP line for a small lane.
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
- **Milestone 29's yes**, after build 10's red-team: since the drop, partyreel.com's host dashboard errors (milestone
  28's `/dashboard` reads `highlight_reels`), and the milestone ships the code that no longer does.
- **One dashboard minute** (no management token here): Supabase, Authentication, Templates, Change Email Address, add
  `{{ .Token }}` beside `{{ .ConfirmationURL }}` (the wording is in lp/identity-email's Handoff, merged at `3248a785`);
  until then an email change confirms by the link at both addresses.
- **A 10-second iPhone check**: Save to Photos lands in Photos, and a shared photo arrives as a photograph.
