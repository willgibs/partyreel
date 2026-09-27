---
track: orchestrator
status: open
cut: "1a455e5f"          # the launch-prep SHA this state was written at
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
  - "profile-setup merged at 853093a6 (2026-09-27): the profile setup is `/account/profile` (`PROFILE_SETUP_PATH` in `src/app/(app)/account/profile/invite.ts`); an account that already has a page is sent to `/account#public-profile`, so a \"Claim a handle\" row can point at the setup unconditionally. `get_public_profile` carries `private_event_count` (applied; null unless the page shows nothing)."
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
| `guest-door` | lit's own pieces on every door screen; `guest-capture`'s five (the keep ask as the door's last screen, the told name with Change, one confirm beat, the tracker and its count); retires `guest-capture` | building (agent a2cd842994c0d4f98) | Opus, 3131 | |

Batch 3 closed at milestone 29 (`ab30a7f8`, 2026-09-26): 49 lanes since milestone 28, their merge commits carrying
the rest.

Merged in batch 4 (their records carry the rest): mine-none, claims-r2, profile-setup, story-r3, reel-marketing, door-r3, popups.

## Next, in order

1. **Batch 4 lands** (cut `1a455e5f` from Will's sitting on build 10, his ledgers at `0b2af407`; his chat calls
   2026-09-27: `popups` first on the desk, the demo link bare everywhere while `story-r3` explores, the door's other
   icons and copy through `door-r3` first). Integrate each as it hands off. The records carry: the three retirements'
   ledgers deleted (`guest-capture`, `media-viewer`, `identity-profile`: each lane retires its own board's folder and
   lines); `DESK_ORDER` as `popups`, `identity-door`, `identity-claims`, `reel-story`, then the 15 unchanged boards;
   `reel-marketing`'s asset slots into `docs/ASSETS.md` and row 1 no longer "made from the demo album";
   `profile-setup`'s migration by the protocol if it brings one; and, once the four boards land, their new asks read
   side by side (`board-card.mjs --desk`), any two that ask one decision merged.
2. **Build 11** once all eight land: `[preview]`, `alias-ensure`, `page-console` on the desk's boards, then tell Will
   the desk is ready, `popups` first. Its red-team walks the scope of a full red-team, as build 10's walked it:
   - the reel on the album's data path: the tile, the view, clips, access, the password event, the demo;
   - `?reel=screen` soaked headless at 1920x1080 for 100 minutes (a hidden pane throttles the page);
   - the door at 375 on the Sheet, now lit, with the keep screen after the first upload and the told name;
   - the album at scale on both surfaces, with no mark on a guest's own tiles, a hide just above a deep guest's view
     moving nothing in it, and the bin's viewer restoring and deleting on a phone as a signed-in host;
   - the owner's own password album, plain, `?reel` and `?reel=screen`, and its Download all;
   - the tracker's count, the setup wizard, the private page's count from a second viewer and anonymously, the
     marketing pages (the 19 bare demo links, the footer's stack, the still twin card, the contained player).
3. **After his sitting on build 11**: the wiring of his picks on `popups`, `identity-door` r3, `identity-claims` r2 and
   `reel-story` r3.
4. **The lab revamp**, once the desk's open boards close and before new explorations open: a board as one
   self-registering folder, its metadata in its spec, lab checks scoped to the lane's own boards, the authoring API
   trimmed, a fresh agent proving it; with library-lean's board ideas (a `Surfaces` family of live frames per route
   with guest entries, the Library's sidebar open by default, a plain-text view of Library pages, a
   retire-or-reuse call on `anonymous-info.tsx` and `floating-add-button.tsx`, and the lab's own words renamed with the
   revamp: the review mechanic's "ruled", `touchpoints.ts`'s `RULINGS`/`Ruling`/`getRuling`, and "ratified").

## Waiting on Will

- **The private count's legal clause** (before a milestone ships it): the Terms ("Profiles and social features",
  `src/lib/constants/legal-terms.tsx:422`) and the Privacy Policy (`legal-privacy.tsx:311`) promise nothing you attend
  appears on a profile until you choose it, and an empty page now says "2 private events". The lane's wording, his to
  change: "A profile with nothing on it may say how many events it keeps private, counting only events whose guest
  lists the visitor can already see."
- **His next sitting, on build 11** once batch 4 lands: `popups` first, then `identity-door` r3, `identity-claims` r2
  and `reel-story` r3, then the 15 boards build 10's sitting did not reach.
- **A 10-second iPhone check on partyreel.com**: one tap on Save opens the system sheet (a photo, a video, a finished
  clip), and a shared photo arrives as a photograph.
- **The calls his to overrule** from the last lanes, relayed in chat on 2026-09-26: reel-and-copy's screens following
  a new default at the next hold; owner-album's Download all fix and a failed read staying a failure; album-fixes'
  three (the viewer closes on the bin's verbs, a sliver of a row counts as in view, the hold below the view too).
