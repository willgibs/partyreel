---
track: orchestrator
status: open
cut: "18491027"          # the launch-prep SHA this state was written at
owns:                    # the standing claims no lane touches
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
| `settings-wiring` | every event-settings pick: settings as four sentences, the doors end to end, the Guests room, the hub | running (agent `aefdc4b3cecd92f74`) | Opus, 3131 | |
| `locked-door` | r2, the door family (open, waiting, shut, the previous guest's line) | running (agent `a5d27bd296c7b917e`) | Opus, 3132 | |
| `disposable-mode` | r2: the camera, the waiting room, the room's screen, Create's step, video | running (agent `a1dbe1bf5ccc5042e`) | Opus, 3133 | |
| `crumbs-12` | the hub row's order and fades, the thin headings | running (agent `af78ae264f313bb7e`) | Opus, 3134 | |

Batch 8 (2026-09-29) answers Will's sitting on build 19, the desk whole (transcribed at `31de6aa0`: 41 answers on ten
boards). Wave A: `settings-wiring` (all nine event-settings picks, the doors end to end), `locked-door` r2 (the door
family), `disposable-mode` r2, `crumbs-12`. Batch 7 is merged whole; its records carry the rest.

## Next, in order

1. **Build 20 is live** (`18491027`, alias-ensure green, Vercel pruned, the desk served): crumbs-10 and crumbs-11. Its red-team (agent `a4f105c9a26336597`) runs from
   `../partyreel-wt/_scratch/redteam-20/brief.md` in Will's Chrome (about an hour; his own alias checks wait for it or
   use a private window); its findings go to the next crumbs lane.
2. **Integrate each lane as it hands off**, each migration by protocol, one at a time: drift check, apply verbatim, the
   rolled-back refusals, advisors, types. `negative.sh` runs once before the first (the kit changed with
   merge-lane.sh's id-less sweep). `settings-wiring` owns every guest-path function replacement this batch; no other
   lane replaces one. Large files go through a helper that transcribes, `cmp`s, applies and proves.
3. **Wave B into each free seat, app first** (Will's note, a fuller one to come: app work first, so marketing and admin
   stop reshaping off trickle-down changes). Drafted specs wait in this session's scratchpad (`specs/<track>.json`); a
   new session writes them from these lines.
   - `triage-r2-wiring` (Opus): admin-triage r2's `grid`, `kinds`, `confirm`; a phone gets both Take it down and Hold
     (his note is the board's `hold` option), each one press, the hold's reason the report's reference; the per-photo
     report gap; a reporter's confirmed address kept only until the report closes; Ask for proof is a new mail, built
     behind a switch left off for his yes (his emails rule); no guest-path function replaced; retires admin-triage.
   - The lab revamp (step 7), once `locked-door` r2 and `disposable-mode` r2 merge; a board cut meanwhile is converted at
     its sync, since lab work never delays a board.
   - `event-ready` r1 (Opus), once `settings-wiring` merges: his event checklist and the settings' mini wizard (and
     whether Create shares it), taking ROADMAP's "what needs you" and "the hub's code as the event's live door" lines
     and the `day-of-checklist-for-hosts` article.
   - Marketing wirings, when no app lane is ready: `loose-ends-wiring` (Sonnet: `faq-look=heading`,
     `review-photo=rings` with an ASSETS row for its slot, `everywhere-pill=corner` plus his easter egg, a small
     lightbox that is clearly a demo and one tap out; the phone keeps 3.2 s; the charts wait for the admin look);
     `contact-wiring` (Sonnet: routed, chapter, required; a note and a link per topic, his `urgency` answer; a
     delightful receipt; the directory with icons, a heavier email link and heavier headings, its Press tile following
     About); `album-motion-wiring` (Opus: push, both streams kept, symmetrical, each drawn in and dissolving while its
     photo pushes into the rows from the left).
   - Marketing rounds: `demo-framing` r2 (a slug in the host's voice, `my-party` or `our-wedding`, against a
     typewriter of slugs; the typewriter sharing the stage with the stream, or leading while the QR and stream move to
     the QR page's hero; a clickable touch in place of the "Try our demo event" eyebrow; an album spanning every kind of
     party; every printed slug reserved; `names` reshaped); `about-press` r1 (the press kit folded into /about, drawn
     with and without a four-fact strip and with no kit; the boilerplate dropped; then /press redirects to /about, the
     nav, footer, sitemap and llms files kept current; press-page's `a-human` reshaped); `privacy-hero` r4 (the veil
     and three variations; the sealed cards out).
   - After their rounds: the disposable wiring (after `disposable-mode` r2's picks and `settings-wiring`'s merge, since
     it rewrites the guest path) and the door family's wiring.
4. **Build 21** once `locked-door` r2 and `disposable-mode` r2 land, with the wiring merged by then; `settings-wiring`'s
   build gets a red-team of its own (every door, both ways through each swap, the Guests room, the pages).
5. **The demo event**, after `demo-framing` r2 (his full permission, 2026-09-29; the r1 board merged at `51db72fc`):
   the demo renamed (or made) to its pick, its slug claimed so the card's printed address opens it (today
   `mia-and-theo`, held by no event, left as is on his word), one home for the slug in `lib/demo.ts` that the card
   prints and the seed sets, `OBJECT_EVENT` and `OBJECT_PRINTS` to match, a demo host account if `host` stands
   (`partyreel-demo` stays refused to anyone else by the brand family, `crumbs-11`), and ASSETS rows 5, 33 and 34
   unparked with the party's subjects.
6. **Milestone 30** on his yes, once his legal wording is in; after it, `kit/`'s screens re-captured from partyreel.com
   (the home's hero, close, teaser and eyebrow, the demo's doors, the pricing page).
7. **The lab revamp**: a board as one self-registering folder, its metadata in its spec, lab checks scoped to the
   lane's own boards, the authoring API trimmed, a fresh agent proving it (the first board cut after it); with
   library-lean's board ideas (a `Surfaces` family of live frames per route with guest entries, the Library's sidebar
   open by default, a plain-text view of Library pages, a retire-or-reuse call on `anonymous-info.tsx` and
   `floating-add-button.tsx`, and the lab's own words renamed with the revamp: the review mechanic's "ruled",
   `touchpoints.ts`'s `RULINGS`/`Ruling`/`getRuling`, and "ratified").

## Waiting on Will

- **His desk: zero** after build 19's sitting. Two asks wait on the rounds that replace their boards: demo-framing's
  `names` (behind `story=?`) and press-page's `a-human` (the About round).
- **His stacked to-dos, in leverage order** (sent 2026-09-29, once the desk reached zero):
  1. **His legal wording**, which gates milestone 30 (launch-prep carries batches 4 to 8; the runbook's aim is about
     two). The lanes propose; Terms and Privacy are his:
     - the guest list always on and the host's block: `safety-wiring`'s drafts (Terms :123, :417, :422, :428; Privacy
       :165, :305, :311) are its manifest's Questions at `5d8c57c9` (`git show 5d8c57c9:docs/tracks/safety-wiring.md`);
       the real call is that a block keeps a confirmed address after its account is deleted, so a sign-up with it stays
       out;
     - the Terms' plan paragraph (1.8) and clips paragraph, which `pricing-wiring` edited to match his shift (the one
       legal edit a lane has made), his to reword;
     - the reports clause: `triage-wiring`'s drafts (the Terms' summary and moderation lines, the Privacy Policy's
       summary and reports lines: "a report removes nothing by itself, and we act only where a breach is clear") are its
       manifest's Questions at `c6bd5f5f`;
     - the private count: the Terms ("Profiles and social features", `src/lib/constants/legal-terms.tsx:422`) and the
       Privacy Policy (`legal-privacy.tsx:311`) promise nothing you attend appears on a profile until you choose it, and
       an empty page now says "2 private events". The lane's wording, his to change: "A profile with nothing on it may
       say how many events it keeps private, counting only events whose guest lists the visitor can already see."
  2. **A yes on dropping `events.show_guest_list`** and the three `notification_prefs` columns for mail nothing sends
     (destructive): launch-prep reads none of them; partyreel.com's build selects them until milestone 30 ships.
  3. **The hold doctrine** (`triage-wiring`'s three, recommended and NOT built, since holds are his): a host's soft
     remove passing through a hold (her Deleted takes it; restore still refused, every purge still skips it), so a held
     item no longer stays up beside the rest leaving, a tell; the host's read of `profiles.storage_used_bytes` taken
     away (it shows a hold's bytes staying); `purge_media_now` skipping an item an open report names, as it skips a
     hold. Each yes is a small lane with a migration.
  4. **The claims review's live walk**: it needs claimable rows staged for a test account (`update public.guests set
     pending_email = '<address>', pending_email_at = now() where id in (...)` on name-only rows with live uploads), a
     write the permission classifier refused the red-team; Will stages them (or walks it himself as partyr33l), and the
     restore puts `pending_email`, `email`, `user_id`, `verified_at` and `display_name` back (a claim writes `email` and
     nulls the name). The pointer's row rides it: with claimable rows at two or more other events, one photo uploaded
     signed out at a names-mode album, then Confirm your email through the chooser, the moment card says "N more events
     have photos waiting on your dashboard, whenever you like." with nothing to press, and the banner counts the same.
  5. **Q1**: on a phone the code card fills the screen, but Back leaves the album (a look, not a place, by design);
     should Back close it like the other full-screen popups?
  6. **A 2-minute real-upload check on the alias**: a first photo, landscape, as a signed-out guest at a held-uploads
     event (the keep; her uploads' "Waiting for approval" and the tracker's badge, with no held tile at the album's
     head), then Confirm your email (the one beat, the told name's Change). Its stored size (`media.file_size_bytes`)
     also checks the photo estimate (3.5 MB).
  7. **A 10-second iPhone check on partyreel.com**: one tap on Save opens the system sheet, and a shared photo arrives
     as a photograph; and Settings > Camera > Record Video's size for 1080p at 30 fps (the estimate uses 65 MB a minute).
- **Asks that come due later**: the proof mail's yes (when `triage-r2-wiring` lands), Libraries.dev access for a lane
  (when the help chat is cut), and any F1 frames he loves (when the admin look is cut).
