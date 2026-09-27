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

Batch 3 closed at milestone 29 (`ab30a7f8`, 2026-09-26): 49 lanes since milestone 28, their merge commits carrying
the rest.

Merged in batch 4 (their records carry the rest): mine-none, claims-r2, profile-setup, story-r3, reel-marketing, door-r3, popups, guest-door, crumbs-3.

## Next, in order

1. **Build 11 is live** (`eff5b3f0`, both aliases; the desk's boards load clean) and Will's sitting is on it,
   `popups` first. Its red-team reported: seven journeys of eight pass, the eighth's console 404s older than the build
   (the lab dock's prefetch, in `crumbs-3`), no blocker or major, the 100-minute soak clean; its other minors: the
   lamp's fallback on colourless previews (`crumbs-3`) and the setup's "Showing on your page" over an event whose host
   keeps the list off (Will's copy call; ROADMAP's picker line). Not driven, Will's: a real first upload (the keep, the
   badge, the one beat, the told name's Change). `crumbs-3` merged and waits for build 12. The scope of
   a full red-team, as builds 10 and 11 walked it (brief `../partyreel-wt/_scratch/redteam-11/brief.md`):
   - the reel on the album's data path: the tile, the view, clips, access, the password event, the demo;
   - `?reel=screen` soaked headless at 1920x1080 for 100 minutes (a hidden pane throttles the page);
   - the door at 375 on the Sheet, now lit, with the keep after a real first upload at a held-uploads event, the
     tracker's count falling as Review approves, one confirm beat and the told name's Change;
   - the album at scale on both surfaces, with no mark on a guest's own tiles, a hide just above a deep guest's view
     moving nothing in it, and the bin's viewer restoring and deleting on a phone as a signed-in host;
   - the owner's own password album, plain, `?reel` and `?reel=screen`, and its Download all;
   - the setup wizard (as partyr33l or hi@willgibs, no handle), the private page's count from a second viewer and
     anonymously, the marketing pages (the 19 bare demo links, the footer's pile, the still twin card, the one
     contained player).
2. **Milestone 30** on his yes, once the count's legal clause (his wording, below) is in the Terms and the Privacy
   Policy; after it, `kit/`'s screens re-captured from partyreel.com (the home's close and teaser and the demo's doors
   changed).
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
