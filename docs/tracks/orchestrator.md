---
track: orchestrator
status: open
cut: "c5ab68d0"          # the launch-prep SHA this state was written at
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

Up to four lanes at once (Will, 2026-09-28: eight ran his Mac out of memory; heavy steps take the lock); every production build, a lane's or the kit's gate, takes turns
through `scripts/build-lock.sh` (the kit's gate takes it itself). The lanes' manifests carry everything they need; an
agent id below lives only in the Orchestrator session that spawned it (another session respawns: the runbook's "Resume
a lane").

| lane | what | state | model, port | at its handoff |
| --- | --- | --- | --- | --- |
| `crumbs-6` | voice-guest's three lines and their mocks, the footer's phone demo door, the reel's approval toast told true, the landscape head slot, a stale comment, two admin fixes, the failure sheet's help articles | running, agent `a8e0fab3d4643e969` | Sonnet, :3133 | |

Batch 6 (cut `1708b049`, 2026-09-28) answers Will's sitting on build 12, part one (transcribed at `e199f43f`: 20
answers on identity-claims, hero-card, voice-guest, host-curation, host-storage). A read-only audit of the other 12
boards found 30 of their 68 asks drawn before his recent picks were built and 5 already answered: wave 1, the eight
lanes that made his next desk, landed whole (build 13); wave 2 (the wiring) runs.

Merged in batch 6 (their records carry the rest): voice-r2, storage-r2, triage-refresh, flow-refresh, safety-refresh, hero-r2, help-refresh, marketing-refresh, pointer-wiring, curation-wiring.

## Next, in order

1. **Build 13 on the alias** (wave 1 whole): `alias-ensure`, prune, the desk headless (a lab-only round, the red-team's
   carve-out, plus two help articles' words); then his sitting in desk order, `hero-card` r2 first. A build-12 paste
   transcribes as it stands (the refreshes kept every round), save one id: `help-center`'s `hub=sheet` is `strip` now.
2. **Wave 2**, integrated as each lands:
   - `curation-wiring` and `crumbs-6` are running (rows above).
   - `storage-wiring` (Opus) cuts once `curation-wiring` merges, so bulk Remove reuses its Undo toast. It builds
     host-storage's `order=flat` with an All / per-event filter, `goal=live`, and `refusal=inline` stacked full width.
     The size list goes in the lists panel, with r1's carried rows, bulk Remove with Undo, Download handing off to
     export-flow, and the Deleted line. The six prices keep today's rows until `prices` r2 picks.
   - Fold in storage-r2's notes:
     - the Pro fit line's "or choose Pro 500 GB" means the yearly price;
     - one account's bytes print two ways in one flow (`formatBytes` nearest, `formatBytesUp` up);
     - a Pro host pressing Change plan is greeted "You are on Pro already".
   - At `curation-wiring`'s record, delete `docs/reviews/host-curation.json` and close ROADMAP's "A guest" line.
3. **His next paste** (build 13's desk, or the 25 build-12 asks) transcribed, and the next wiring cut from it. The
   hero's wiring waits for hero-card r2's pick. voice-guest r2's wiring carries its `keep` pick to her name menu's card,
   which still says "Save this event for later".
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

- **His desk, first** (his aim: zero open questions before the to-dos below, which stay stacked until then): build
  13's, 71 open asks on 13 boards, `hero-card` r2 first.
- **The claims review's live walk**: it needs claimable rows staged for a test account (`update public.guests set
  pending_email = '<address>', pending_email_at = now() where id in (...)` on name-only rows with live uploads), a write
  the permission classifier refused the red-team; Will stages them (or walks it himself as partyr33l), and the restore
  puts `pending_email`, `email`, `user_id`, `verified_at` and `display_name` back (a claim writes `email` and nulls the
  name). The pointer's row rides it (build 14 on): with claimable rows at two or more other events, one photo uploaded
  signed out at a names-mode album, then Confirm your email through the chooser, the moment card says "N more events
  have photos waiting on your dashboard, whenever you like." with nothing to press, and the banner counts the same.
- **Q1**: on a phone the code card fills the screen, but Back leaves the album (a look, not a place, by design); should
  Back close it like the other full-screen popups?
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
