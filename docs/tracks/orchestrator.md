---
track: orchestrator
status: open
cut: "35601390"          # the launch-prep SHA this state was written at
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
| `safety-wiring` | event-safety's answers: the per-event block (a migration to apply), soft in every look, the private door, the Guests room's Blocked list, Let back in with a restore toggle; the guest list always on; event-safety retires | running, agent `a976ee6de796172b4` | Opus, :3134 | |
| `pricing-wiring` | host-storage `prices=sizes` on a monthly/yearly toggle with a yearly tag, iPhone-default estimates, his free/pro shift (Free 100 MB, 300 MB meter; password, custom link with a squatting guard, 60 s reels to Free); `tier_limits()` migration to apply; host-storage retires | running, agent `ad560f85ada04d064` | Opus, :3132 | |
| `triage-r2` | admin-triage r2: a fast, batch-first reports queue with each report's whole context, asking a reporter for proof, `phone` reworded | running, agent `aa87a69da46b9875a` | Opus, :3131 | |
| `voice-wiring` | voice-guest r2: held photos only in her uploads, "Waiting for approval" / "Not approved", "Keep this event" (the name menu's card too), his host note in Review; the review room's `known` bug; voice-guest retires | running, agent `a835a78fe41672676` | Opus, :3133 | |

Batch 7 (cut `35601390`, 2026-09-28) answers Will's sitting on build 15 (transcribed at `69afdbc5`: 21 answers on
hero-card, voice-guest, host-storage, event-safety, export-flow). Wave A, four lanes: three new boards and the block.
Wave B follows as seats free. Batch 6 (sixteen lanes) is merged whole; its records carry the rest.

Merged in batch 7 (their records carry the rest): locked-door, disposable-mode, event-settings.

## Next, in order

1. **Wave A lands** (rows above), each integrated as it hands off.
   - `safety-wiring`'s migration by protocol: drift check, apply verbatim, the rolled-back refusals, advisors, types.
   - At its record, delete `docs/reviews/event-safety.json`.
   - New boards go into `DESK_ORDER` after the standing ones (help-center, emails, contact-page are their neighbours).
2. **Wave B into each free seat**, in this order (his answers are in the ledgers; each brief carries his notes):
   - `pricing-wiring` (Opus):
     - host-storage `prices=sizes` with a monthly/yearly toggle and a discount tag on yearly, each card only its size;
     - estimates from iPhone's default photo and video settings, said as such (`tiers.ts`' constants feed /pricing, the
       plan sheet and the blog);
     - his free/pro shift: Free 2 GB to 100 MB and its monthly upload meter 3× the cap (300 MB); Free gains the
       password, the custom link (guard slug squatting) and 60 s reels; Pro keeps videos, storage, unlimited events and
       no reel watermark; Event Pass keeps its reason;
     - `tier_limits()` alone in its migration; every "2 GB" swept; `PRICING.md` and `billing-caps.md` refined; the
       over-cap grace path checked at 100 MB.

     Retires host-storage.
   - `export-wiring` (Opus):
     - `means=mine`: the Yours row, filtered on the server;
     - `wait=toast`: it stays until ready, with a subtle cancel × (`stuck`);
     - `hollow=refuse`: one line;
     - `cap=split`: parts walked through in plain words, never "in 2 zips", saying when every part is saved;
     - a phone's Download all to Files.

     The export Worker (`partyreel-export`, shared with partyreel.com) stays backward compatible with milestone 29's
     app, proved by a test; I deploy it after the merge (`wrangler whoami` first). Retires export-flow.
   - `hero-wiring` (Opus): the `guests` card with `partyreel.com/` quieter so the slug leads, the bloom light, the
     tablet table; `ASSETS.md` row 34 becomes four portraits. Retires hero-card.
   - `triage-wiring` (Opus), from his admin-triage r1 (`docs/reviews/admin-triage.json`):
     - `reason=marked` (one muted line for both arms);
     - `verdict=note` (Remove through the one confirm with an optional note, Dismiss's note, `resolution_note` written);
     - `closed=window`;
     - `escalate=door`;
     - `idiom=shape`;
     - `notice=deleted` built as his note refines it: a reported removal leaves the host's album and Deleted at once,
       with nothing said; the event's copy purged on a sweep, never while a legal hold stands; the preservation copy
       and the CSAM runbook's order kept;
     - the admin confirm's "already says" line in voice-wiring's new words;
     - report wording for the Terms and Privacy drafted under Questions (his "legal terms shouldn't imply every report
       leads to takedown").

     Its spec was drafted this session: owns `src/components/admin/`, `report-review`, `recently-deleted-grid`, the
     report help, and a migration.
3. **Build 16** once wave A's boards land. Its red-team:
   - the block, live (partyr33l blocked at a willg97 test event, then let back in with and without restore);
   - the pricing, if it has landed;
   - the export flow, short of any download;
   - the standing scope.
4. **His paste** (build 15's 38 open, then build 16's new boards) transcribed; the join doors (`newcomer=same`,
   `unlisted=ask`) are built after `event-settings` picks how "who can join" is set.
5. **Milestone 30** on his yes, once his legal wording is in (the private count; the guest list always on); after it,
   `kit/`'s screens re-captured from partyreel.com (the home's hero, close, teaser and eyebrow, the demo's doors, the
   pricing page).
6. **The lab revamp**, once the desk's open boards close and before new explorations open: a board as one
   self-registering folder, its metadata in its spec, lab checks scoped to the lane's own boards, the authoring API
   trimmed, a fresh agent proving it; with library-lean's board ideas (a `Surfaces` family of live frames per route
   with guest entries, the Library's sidebar open by default, a plain-text view of Library pages, a
   retire-or-reuse call on `anonymous-info.tsx` and `floating-add-button.tsx`, and the lab's own words renamed with the
   revamp: the review mechanic's "ruled", `touchpoints.ts`'s `RULINGS`/`Ruling`/`getRuling`, and "ratified").

## Waiting on Will

- **His desk, first** (his aim: zero open questions before the to-dos below, which stay stacked until then): build
  15's 38 open asks (help-center, emails, privacy-hero, album-motion, loose-ends, contact-page, press-page), then
  build 16's new boards.
- **His legal wording for the guest list, always on** (with the private count's, before milestone 30): `safety-wiring`
  drafts it under its Questions.
- **A yes on dropping `events.show_guest_list`** (destructive), once no build reads it.
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
- **A 2-minute real-upload check on the alias**: a first photo, landscape, as a signed-out guest at a held-uploads
  event (the keep, "waiting for the host" on a head slot the photo now covers, the tracker's badge), then Confirm your
  email (the one beat, the told name's Change).
- **A 10-second iPhone check on partyreel.com**: one tap on Save opens the system sheet, and a shared photo arrives as
  a photograph.
- **A copy call**: the setup's "Showing on your page" over an event whose host keeps the guest list off (ROADMAP's
  picker line).
