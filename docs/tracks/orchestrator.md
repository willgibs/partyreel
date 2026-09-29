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
| `crumbs-9` | eight small ROADMAP items: the untyped `article_feedback` seams, the help's ⌘K chip on a phone and `report-a-problem-as-a-guest`'s screens, the hero's headline fold at 470 to 767, two stale notes, the portal's Library specimens, a restore losing its custom link in silence | running, agent `ae2f802a7cf6d56e9` | Sonnet, :3134 | |

Batch 7 (cut `35601390`, 2026-09-28) answers Will's sitting on build 15 (transcribed at `69afdbc5`: 21 answers on
hero-card, voice-guest, host-storage, event-safety, export-flow). Wave A, four lanes: three new boards and the block.
Wave B follows as seats free. Batch 6 (sixteen lanes) is merged whole; its records carry the rest.

Merged in batch 7 (their records carry the rest): locked-door, disposable-mode, event-settings, voice-wiring, pricing-wiring, triage-r2, safety-wiring, hero-wiring, triage-wiring, export-wiring, help-wiring, emails-wiring, demo-framing, crumbs-8.

## Next, in order

1. **Integrate each running lane as it hands off** (rows above), each migration by protocol, one at a time: drift
   check, apply verbatim, the rolled-back refusals, advisors, types.
   - Applied 2026-09-29: `pass_renewal_pref` (`20260929025049`, md5 `a2b8a3c8`; the column on by default, authenticated's
     insert and update on it alone, anon nothing; types regenerated).
   - Applied 2026-09-29: `article_feedback` (`20260929021217`, md5 `e4ef348c`; RLS on with no policy, no client
     privilege on the table or its summary, the summary INVOKER; types regenerated).
   - The export Worker deployed 2026-09-29 (`partyreel-export` version `a76241a2`, after `export-wiring`: `/check`
     additive, milestone 29's requests replayed unchanged; its own typecheck and 34 tests first).
   - Applied 2026-09-29: `operator_removal_purge` (`20260929015847`, md5 `8ece437e`; five bodies, ACLs unchanged,
     the policy's removal conjunct, the rolled-back check held, advisors unchanged, types unchanged); `event_blocks` (recorded `20260929002900`, the file's md5 `f0c3ff6d`; 23 bodies as the header
     says, the rolled-back proof 10/10 after the apply, advisors 0029 at 29, 0028 at 4, no-policy at 16) and
     `free_shift` (`20260929004003`, md5 `58e7f00a`; four bodies, grants unchanged, Free at 100 MB, no Free account
     over it). Large files go through a helper that transcribes, `cmp`s, applies and proves; the recorded md5 is the
     check.
2. **Wave B into each free seat**, in this order (his answers are in the ledgers; each brief carries his notes).
   - After his `demo-framing` pick (his full permission, 2026-09-29; the board merged at `51db72fc`): the demo event
     renamed (or made) to the story, its slug claimed so the card's printed address opens it (today `mia-and-theo`,
     held by no event, left as is on his word), one home for the slug in `lib/demo.ts` that the card prints and the
     seed sets, `OBJECT_EVENT` and `OBJECT_PRINTS` to match, a demo host account if `host` stands, `partyreel-demo`
     reserved with the `partyreel` family (ROADMAP's Security line, a `set_event_slug` migration), and ASSETS rows 5,
     33 and 34 unparked with the party's subjects (the board lists them per party).
3. **Build 17 is live and red-teamed** (`1407daf6`; every journey PASS, the block walked live on all three roads and
   restored through the UI; the ledger is `../partyreel-wt/_scratch/redteam-17/ledger.txt`). Its two majors (the share
   card shared across viewers by the edge; Event Settings' last three cards crushed) and three minors go to
   `crumbs-8`. **Build 18** (deployed 2026-09-29 for his desk: wave B whole and `demo-framing`'s board, 45 open asks).
   **Build 19** adds `crumbs-8` and `crumbs-9`; its red-team walks the new hero, the export flow short of any download, the triage portal on staged reports
   (`triage-wiring`'s Handoff names the rows), the help, the two majors re-checked, and the standing scope. Drafted
   specs wait in this session's scratchpad (`specs/<track>.json`); a new session writes them from these lines.
4. **His next paste** (build 16's 38 open asks; emails r1 is transcribed at `1b394476`) transcribed; the join doors
   (`newcomer=same`, `unlisted=ask`) are built after `event-settings` picks how "who can join" is set.
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
  16's 38 open asks (privacy-hero, album-motion, loose-ends, contact-page, press-page; new: event-settings,
  locked-door, disposable-mode); admin-triage r2 follows.
- **His legal wording, before milestone 30** (the lanes propose; Terms and Privacy are his):
  - the guest list always on and the host's block: `safety-wiring`'s drafts (Terms :123, :417, :422, :428; Privacy
    :165, :305, :311) are its manifest's Questions at `5d8c57c9` (`git show 5d8c57c9:docs/tracks/safety-wiring.md`);
    the real call is that a block keeps a confirmed address after its account is deleted, so a sign-up with it stays out;
  - the Terms' plan paragraph (1.8) and clips paragraph, which `pricing-wiring` edited to match his shift (the one
    legal edit a lane has made), his to reword;
  - the reports clause: `triage-wiring`'s drafts (the Terms' summary and moderation lines, the Privacy Policy's
    summary and reports lines: "a report removes nothing by itself, and we act only where a breach is clear") are its
    manifest's Questions at `c6bd5f5f`;
  - the private count's clause (below).
- **The hold doctrine** (`triage-wiring`'s three, recommended and NOT built, since holds are his): a host's soft
  remove passing through a hold (her Deleted takes it; restore still refused, every purge still skips it), so a held
  item no longer stays up beside the rest leaving, a tell; the host's read of `profiles.storage_used_bytes` taken
  away (it shows a hold's bytes staying); `purge_media_now` skipping an item an open report names, as it skips a hold.
  Each yes is a small lane with a migration.
- **A yes on dropping `events.show_guest_list`** and the three `notification_prefs` columns for mail nothing sends
  (destructive): launch-prep reads none of them now; partyreel.com's build still selects them until milestone 30 ships.
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
  event (the keep; her uploads' "Waiting for approval" and the tracker's badge, with no held tile at the album's head),
  then Confirm your email (the one beat, the told name's Change). Its stored size (`media.file_size_bytes`) also
  checks the photo estimate (3.5 MB).
- **A 10-second iPhone check on partyreel.com**: one tap on Save opens the system sheet, and a shared photo arrives as
  a photograph; and Settings > Camera > Record Video's size for 1080p at 30 fps (the estimate uses 65 MB a minute).
