---
track: orchestrator
status: open
cut: "ebfb1581"          # the launch-prep SHA this state was written at
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

Batch 3 closed at milestone 29 (`ab30a7f8`, 2026-09-26); batch 4 (nine lanes with `crumbs-3`) is on build 11.

Merged in batch 5 (their records carry the rest): hero-card, claims-r3, demo-doors, popups-wiring, door-r3-wiring, desk-trim, claims-wiring, crumbs-4.

## Next, in order

1. **Batch 5 landed whole** (cut `ebfb1581`; eight lanes merged green, `claims-wiring`'s migration applied with the
   types): the popups' kinds, the door's r3, the demo's doors, the claims review, the boards `hero-card` r1 and
   `identity-claims` r3.
2. **The pointer's wiring** after Will's `identity-claims` r3 pick, folding the moment card's other-events lines
   (ROADMAP's Identity line), and `hero-card`'s pick into the hero.
3. **Build 12**, going out now: `[preview]`, `alias-ensure`, the desk checked, its red-team
   (`../partyreel-wt/_scratch/redteam-12/brief.md`), then Will's sitting: `identity-claims` r3, `hero-card`, then the
   15.
4. **Milestone 30** on his yes, once the count's legal clause (his wording, below) is in the Terms and the Privacy
   Policy; after it, `kit/`'s screens re-captured from partyreel.com (the home's close, teaser, eyebrow and the demo's
   doors changed).
5. **The lab revamp**, once the desk's open boards close and before new explorations open: a board as one
   self-registering folder, its metadata in its spec, lab checks scoped to the lane's own boards, the authoring API
   trimmed, a fresh agent proving it; with library-lean's board ideas (a `Surfaces` family of live frames per route
   with guest entries, the Library's sidebar open by default, a plain-text view of Library pages, a
   retire-or-reuse call on `anonymous-info.tsx` and `floating-add-button.tsx`, and the lab's own words renamed with the
   revamp: the review mechanic's "ruled", `touchpoints.ts`'s `RULINGS`/`Ruling`/`getRuling`, and "ratified").

## Waiting on Will

- **The private count's legal clause** (before milestone 30): the Terms ("Profiles and social features",
  `src/lib/constants/legal-terms.tsx:422`) and the Privacy Policy (`legal-privacy.tsx:311`) promise nothing you attend
  appears on a profile until you choose it, and an empty page now says "2 private events". The lane's wording, his to
  change: "A profile with nothing on it may say how many events it keeps private, counting only events whose guest
  lists the visitor can already see."
- **A 2-minute real-upload check on the alias**: a first photo as a signed-out guest at a held-uploads event (the
  keep, "waiting for the host", the tracker's badge), then Confirm your email (the one beat, the told name's Change).
- **A 10-second iPhone check on partyreel.com**: one tap on Save opens the system sheet, and a shared photo arrives as
  a photograph.
- **A copy call**: the setup's "Showing on your page" over an event whose host keeps the guest list off (ROADMAP's
  picker line).
- **His next sitting, on build 12**, once batch 5 lands.
