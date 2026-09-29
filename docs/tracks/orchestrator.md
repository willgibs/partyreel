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
| `emails-wiring` | emails r1 on the ten mails that already send: one shell, the wordmark, light only, tagged operator subjects, the foot with no address and the renewal nudge's unsubscribe (a migration), a plain-text twin; the three dead switches leave; nothing new sends; emails retires | running, agent `adc42bfa207564886` | Opus, :3133 | |
| `demo-framing` | a new board, round one: the story the demo tells (`story`, `names`, `demo`) on the home hero's link card and the album it opens; registered after `disposable-mode` | running, agent `ad22c252b4ce52c45` | Opus, :3132 | |
| `export-wiring` | export-flow's six: the Yours row filtered on the server, the toast that stays with a subtle cancel, the one-line empty refusal, parts in plain words, a phone's Download all to Files; the Worker backward compatible (I deploy it after the merge); export-flow retires | running, agent `aa10025fff8b6ba0e` | Opus, :3131 | |
| `triage-wiring` | admin-triage r1's six: the marked reason, the verdict's note, the window, the escalation door, the shape idiom, a reported removal purged from the host's view (a migration; legal hold and preservation kept); the reports clause drafted | running, agent `a347eb3bf09ed556f` | Opus, :3132 | |
| `help-wiring` | help-center's seven: host first, the strip with quick questions in the focused search, illustrated steps, contextual links and a Help row in the menus, the feedback beacon (a migration) with its admin view, the rung, Search in the header and footer; help-center retires | running, agent `a6ca95d7a7aab7b4b` | Opus, :3134 | |

Batch 7 (cut `35601390`, 2026-09-28) answers Will's sitting on build 15 (transcribed at `69afdbc5`: 21 answers on
hero-card, voice-guest, host-storage, event-safety, export-flow). Wave A, four lanes: three new boards and the block.
Wave B follows as seats free. Batch 6 (sixteen lanes) is merged whole; its records carry the rest.

Merged in batch 7 (their records carry the rest): locked-door, disposable-mode, event-settings, voice-wiring, pricing-wiring, triage-r2, safety-wiring, hero-wiring.

## Next, in order

1. **Integrate each running lane as it hands off** (rows above), each migration by protocol, one at a time: drift
   check, apply verbatim, the rolled-back refusals, advisors, types.
   - Applied 2026-09-29: `event_blocks` (recorded `20260929002900`, the file's md5 `f0c3ff6d`; 23 bodies as the header
     says, the rolled-back proof 10/10 after the apply, advisors 0029 at 29, 0028 at 4, no-policy at 16) and
     `free_shift` (`20260929004003`, md5 `58e7f00a`; four bodies, grants unchanged, Free at 100 MB, no Free account
     over it). Large files go through a helper that transcribes, `cmp`s, applies and proves; the recorded md5 is the
     check.
2. **Wave B into each free seat**, in this order (his answers are in the ledgers; each brief carries his notes).
   - After his `demo-framing` pick (his full permission, 2026-09-29): the demo event made or renamed to the story, its
     slug claimed so the card's printed address opens it, `hero-stream.ts`' `OBJECT_EVENT` to match, and ASSETS rows
     33 and 34 unparked.
3. **Build 17 is live** (`1407daf6`, both migrations applied; pruned; the desk, admin-triage and event-settings boards
   and the Library clean headless; 42 open asks). Its red-team is running (agent `a21c3c40aeb5e59ff`) (`../partyreel-wt/_scratch/redteam-17/`, from `redteam-15/brief.md`):
   - the block, live: partyr33l blocked at a willg97 test event from one of the three roads meets the private door and
     can neither upload, like nor claim; the Blocked foot; let back in without, then with, the restore;
   - the free/pro shift: /pricing and the plan sheet (the toggle, the tag, each estimate's basis), and a Free account
     setting a password and a custom link, then clearing both;
   - the review room's host note and her uploads' words; the guest list always on; the settings card's "Profile";
   - the standing scope.

   **Build 18** carries export, hero, triage-wiring, help and emails; its red-team walks the export flow short of any
   download. `emails-wiring`'s drafted spec is in this session's scratchpad (`specs/emails-wiring.json`); a new session
   writes it from the lines above.
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
  - the private count's clause (below); `triage-wiring` will add the reports clause.
- **A yes on dropping `events.show_guest_list`** and, after `emails-wiring`, the three `notification_prefs` columns for
  mail nothing sends (destructive), once no build reads them.
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
