---
track: crumbs-85
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "b5042226"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/
  - src/lib/guest/
  - src/components/app/event-feed/
  - src/components/app/share/as-guest-view.tsx
  - src/components/app/share/as-guest-view.test.tsx
  - src/app/(app)/dashboard/[eventId]/as-guest.server.ts
  - src/app/(app)/dashboard/[eventId]/as-guest.server.test.ts
  - src/lib/shared/album-order.ts
  - src/lib/shared/album-order.test.ts
  - src/lib/event/
  - src/lib/disposable/
  - src/lib/upload/
  - src/app/api/r2/
  - src/app/(guest)/e/
  - src/lib/media/strip-metadata.ts
  - src/lib/media/strip-metadata.test.ts
  - src/app/not-found.tsx
  - src/app/(marketing)/(cinema)/not-found.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/disposable-mode.md
  - docs/systems/uploads-and-r2.md
---

# lp/crumbs-85

**Goal.** Red-team 56's findings fixed before milestone 38 (the MEDIUM: a guest sending from the head of an album in order sees her progress and Stop where she is; the roll of one's counts at the guest's side; the stored MOV's write time, the hub's develop place, the 404's double robots meta), and with them the album's time made whole: the follow-ups event-zone, capture-time and guest-requests left on the guest's album and camera.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version.

**Why now.** Red-team 56 walked everything merged since milestone 37 (the album in order, one moment for every guest, capture time, the hub's doors, Settings' roll, Back a layer at a time) and found no HIGH, one MEDIUM and small findings; milestone 38 waits on this lane, then a short re-walk of the MEDIUM. With them ride the follow-ups event-zone, capture-time and guest-requests left on the same album and its clock, so the album's time is whole before the milestone.

**Red-team 56's findings (each fixed and walked):**
1. **MEDIUM (album-order):** in an album shown in order, a guest who sends from the head sees no progress until it lands, because her stack (the sending progress and its Stop) stands at the album's end (seen at 375 on a throttled send). Her own sending state must be where she is when she sends, whatever the album's order, with Stop in reach (Will's standing rule: immediate, or a clear state and a way to stop it).
2. **LOW, the guest's side (settings-wiring):** at a roll of 1, a guest holding two shots reads "1 shot… 1 of 1" beside both. Settings' half of this finding (its "shots each" and "Removing one frees its frame") is identity-r5-wiring's, in its files.
3. **NITs:** the stored MOV's track header keeps the export's write time (`strip-metadata.ts`: the capture-time lane keeps only the time it was taken); the hub's develop time is unnamed beside Settings' "in Makassar" (the ROADMAP's line: the head cover's "until it develops tomorrow at 9 am" and the cards read her own clock; name the party's place as Settings does, `zone-words.ts`); the 404s carry two robots metas (`app/not-found.tsx` and `(cinema)/not-found.tsx` set `robots: noindex, nofollow` beside the noindex Next injects: one is enough).

**The album's time, from the ROADMAP's Now (each line retired in your Handoff):**
- A develop time taken away while a guest has the album open is still obeyed until she reloads (`event-experience.tsx` hands the turn `liveDevelopsAt ?? event.develops_at`, and `useLiveUploadsWait` answers null both before the sync speaks and for none): tell the two apart.
- `patchForStyle` (`lib/disposable/album-style.ts`) and `defaultDevelopAt` (`reveal.ts`) read the browser's zone, so Create and Settings hand them the party's 9 am as the time to keep (`developToKeep`): take the zone directly and retire that seeding.
- album-order's `GuestAlbumOrder` (a zone) and event-zone's `AlbumOpening` (an instant) are one idea in two types: fold the opening into album-order, its `zone` becoming `morningAfter`.
- A far party's guest page says a develop time in both clocks ("9 am in Bali, 6 pm yours") where the guest's zone is not the party's.
- A zoneless Exif wall clock is read in the party's own zone (`events.time_zone`) rather than the uploader's browser's: the claim carries the bare wall clock for the server to read in the event's zone (`fromZoneInput(bareWallClock, partyZoneOf(zone))`, DST-safe); the complete route gains one read of the zone on the upload's hot path (`readPartyZone`), so say what it costs a burst.
- The album camera's shots (canvas JPEGs, no Exif) carry no capture time, so one sent long after it was taken sorts by its arrival: hand `uploadBurst` its `takenAt` as the claim (`camera-screen.tsx`, a `BurstFile` field).
- A capture time far outside the album's own days (a throwback, a camera a year off) leads the night in order: seat it at the night's edge in the in-order view, the wire keeping the true time.
- The door's camera (`entry-modal.tsx`'s `AlbumCamera`) is handed no word on uploads, so it still asks a closed album again on the calm cadence: hand it `uploadsWord` and `onAskUploadsWord` as the album's own camera has them (`guest-upload.tsx`).
- At the held door the album's camera still says "Every shot goes straight in" and draws its shots sending while they wait for the let-in (`lib/guest/camera/words.ts`'s `cameraSubLine`, `album-camera.tsx`): a held reveal says it ("They go in once you're let in").
- `gallery-empty-state-wait.test.tsx:373` names a capture in the Mac's old scratch (`_scratch/crumbs-61/cap-4-*.jpg`), gone with it: drop the path, keep the mechanism.

Out of scope (other lanes this round): Settings' files (identity-r5-wiring), Drive (drive-crumbs), billing and `/admin` (billing-orphans). The far-from-home chooser opening on her past cities stays a ROADMAP line (it lives in Settings). No migration is expected; if one becomes the right answer, write it as a file and say so under Questions (the Orchestrator applies it through the Advisor).

**Starts from.** CLAUDE.md's working loop, `docs/systems/guest-flow.md`, `disposable-mode.md`, `uploads-and-r2.md` and `host-app.md` (their ★ lines first), and production as it is; the tests say what has to keep working.

**Verify on.** The whole gate on the synced tree, each step on its own exit code, and `pnpm lab:smoke`; then live on your own production build at :3000 (CLAUDE.md, "Local dev vs. live testing"): the MEDIUM as red-team 56 saw it (a guest's join on a disposable album of yours in order, at 375, a throttled send from the head: her progress and Stop in sight), one instant from two zones, a camera shot's capture time kept, a far party's guest page in both clocks. Test data only, named "(disposable)", listed in your Handoff.

Model: Opus. Cut 2026-10-06 by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- Q1 (built, Will's to overrule): where her sending state stands when the stack is out of sight. **Recommended and
  built:** the stack keeps the slot her photograph lands in (the end of an album in order), and while that slot is out
  of her sight a glass stand-in pill (her file's thumb, "N to go" or "Sending", the bar, the x) stands above the
  shutter's band, wherever she is in either order (`upload/sending-stand-in.tsx`). The alternative, moving the stack
  to the head in every order, would land her photograph somewhere she then cannot see in an album in order.
- Q2 (built, Will's to overrule): "seat it at the night's edge". **Recommended and built:** the END edge (after the
  night, in their own order), since the start edge is exactly "leads the night". "The night" is derived from the
  entries alone (the run of times ending at the newest, neighbours within three days) so the server's first paint
  (`album-window-plan.ts`, not this lane's) and the browser lay one order; only a minority before that run is seated,
  so an album made after its trip keeps its true order. The alternative (by the event's dated days) needs the dates
  threaded into the first paint's plan.
- Q3 (built): a far party's both-clocks phrase is "Sun, Oct 4 at 9 am in Bali, Sat 6 pm yours" (her weekday only where
  her day differs). It rides every develop sentence (the wait, the slot's rule, the sheet, her tracker, the failure
  sheet, the camera); the cover's eyebrow over the name keeps her own short clock ("Disposable · develops tomorrow at
  6 pm"), which is true and fits a single line at 375. Overrule if the eyebrow should name the place too.
- Q4 (built): the party's zone now reaches the guest's browser, for words only (`partyZone`, `party-zone.tsx`), never
  behind a lock (the shell names nothing of where the party is) and never for the turn (still an instant). The
  guest page reads it for an undated album with a develop time too (one more primary-key read, in parallel, for those).
- Q5 (built, Will's to overrule): the held door's camera says "They go in once you're let in" under the name and in
  Your shots, "Waiting to go in" on each shot, and "N shots. They go in once you're let in." at the roll's end.

## System-doc edits (in place, owned facts only)

The lane's `reads` docs are not its to edit; each line below is a proposed in-place refinement for the Orchestrator:

- `guest-flow.md` (album order): the night in order seats a capture time before the night's own run of times
  (neighbours within `NIGHT_GAP_US`, three days, ending at the newest) at the night's END edge, while it is the
  smaller part of the album (`nightKeys`, album-order.ts); one key for the first paint, the live album and the hub.
- `guest-flow.md` (the turn): `GuestAlbumOrder` is `{ morningAfter, own, chosen }` (event-zone's `AlbumOpening` folded
  in); the develop the album turns at is the sync's word once heard, a develop taken away included, else the page's own
  (`useLiveUploadsWait`'s `turnDevelopsAt`).
- `guest-flow.md` (the guest's sending): ★ her stack keeps the slot her photograph lands in; while it is out of her
  sight a stand-in carries its bar and its x in view (`sending-stand-in.tsx`); the x's question is the pick's, never a
  tile's (`StackQuestion`), so the window unmounting the stack's row no longer withdraws a question still meant.
- `guest-flow.md` / `disposable-mode.md` (words): a far party's develop time is said in both clocks
  (`developsWhen(iso, now, zone)`, `bothClocksWhen`); the page hands its zone for words alone (`partyZone`), never
  behind a lock; the hub names a far party's place as Settings does (`hubDevelopWhen`).
- `disposable-mode.md` (the default develop): `defaultDevelopAt` and `patchForStyle` take the party's zone themselves
  (`{ zone }`, through `event/wall-time.ts`, the one wall-clock arithmetic the turn shares); `developToKeep` is a thin
  wrapper until Create and Settings drop it.
- `disposable-mode.md` (the camera): `RollView.held` is her live shots uncapped (past the roll only by the server's own
  count); the counts say "2 on a roll of 1" and `removalFrees` is false there. At the held door the camera's reveal is
  `door` (`heldAtDoor`), and the door's camera hears the album's word on uploads where the album's sync polls.
- `uploads-and-r2.md` (capture time): every header clock of a movie (mvhd, tkhd, mdhd: creation and modification) is
  rewritten in place to the capture instant, or zero where it names none (`stampMovieClocks`). A zoneless Exif wall
  clock rides the complete as `captured_wall` beside the browser's reading, and the GUEST complete reads it in the
  party's zone (`wallInPartyZone`; cost: one primary-key read of `events.time_zone` a burst, only when such a clock is
  carried; the host's route keeps the browser's reading). The album's camera claims its shutter's time
  (`BurstFile.takenAt`, `FileExtra.takenAt`) where the file states none.

## Deferred (ROADMAP one-liners, bucket named)

- Host: Create's add step and Settings' camera still seed `patchForStyle` with `developToKeep`; now `patchForStyle`
  takes `{ zone: hostPartyZone(...) }` itself, so each drops the seeding when its files next move (crumbs-85).
- Uploads: the host's complete route (`api/host/r2/complete-upload`) does not read `captured_wall`, so a host's own
  zoneless Exif clock stays read in her browser's zone; extend its schema as the guest's (crumbs-85).
- Guests: See it as a guest says develop times in the host's own clock: its page (`(as-guest)/.../as-guest/page.tsx`)
  could hand `AsGuestView` the party's zone for words, as the guest page does (crumbs-85).
- Server: at a roll of 1 `create_media` refuses "You've taken all 1 shots on your roll." (the migrations' sentence;
  the camera's counts now say one shot as one) (crumbs-85).
- Guests: the guest link's own 404 (`(guest)/e/[token]/not-found.tsx`) and the other groups' 404s still set their own
  robots metadata; the root's and the cinema's dropped theirs for Next's one noindex (crumbs-85).

## Handoff (replaces the chat report)

- **Head and sync.** Work commits `09ec9049`..`62c01640` and `f4a8a5cc` (a stand-in fix from the walk), with
  `b8f0b6f3` (a pin reshaped by this lane's own change); synced with launch-prep twice, at `55641d0e` and at `dc71e57f`
  (identity-r5-wiring merged; clean, no conflict). All pushed on `lp/crumbs-85`.
- **Gates** on `dc71e57f` (the synced tree), each on its own exit code: `pnpm typecheck` 0 (its first run answered 2
  on a stale `.next/dev/types` entry for a page the merged lane deleted; `rm -rf .next/dev`, then 0), `pnpm lint` 0,
  `pnpm test` 0 (1,053 files, 13,197 passed, 2 skipped), `zsh scripts/build-lock.sh pnpm build` 0,
  `pnpm lab:smoke --base http://localhost:3131` 0 (197 checks, 0 failing). No board, so no `lab:demo`. The Supabase
  connector was not used (no SQL in this lane).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file, with these exceptions:
  `src/app/(app)/dashboard/[eventId]/page.tsx` (one line: the hub's develop facts carry `time_zone`, the hub NIT's only
  way in); `src/app/not-found.site.test.tsx` and `src/app/group-not-found.lazy.test.tsx` (each pinned the robots line
  the NIT removes, reshaped with its scar); `src/lib/media/capture-time.ts` + its test and
  `src/lib/media/strip-metadata-capture.test.ts` (the capture time's one home and the strip's capture pins, which the
  brief's Exif, camera and MOV items live in).
- **Red-team 56's findings:**
  - MEDIUM (album order): `09ec9049`, `3fe330cc`, `f4a8a5cc`; walked locally at 375 on the demo album set to Oldest
    first: eight files sent from the head, the stack below the fold (top 948 to 2056 px in an 812 px view), the
    stand-in in view the whole run ("8 to go" … "3 to go" … "Sending", bar and x), its x asking "Stop this upload?".
  - LOW (roll of one, guest side): `674ca04f` (`roll-view.ts` `held`/`removalFrees`, `rollCount`: "2 on a roll of 1";
    no "Remove a shot to free its frame" where it would not).
  - NIT MOV write time: `69a8fc1d` (`stampMovieClocks`; the iPhone fixture's track header now says the take).
  - NIT 404 robots: `1116d2b5`; walked: `curl` of `/no-such-page` and `/about/no-such` on the dev server each carry one
    `<meta name="robots" content="noindex"/>`.
  - NIT hub develop place: `62c01640` (`hubDevelopWhen`, the cover and Looking early).
- **The album's time (ROADMAP Now lines to retire, each):**
  - develop taken away still obeyed → `9a051560` (`turnDevelopsAt`).
  - `patchForStyle`/`defaultDevelopAt` read the browser's zone → `980295b8` (they take `{ zone }`; the callers'
    seeding is a Deferred line above, outside the lane).
  - `GuestAlbumOrder`/`AlbumOpening` fold → `980295b8`.
  - far party in both clocks → `62c01640`, `b8f0b6f3`.
  - zoneless Exif in the party's zone → `b0d6c4e3` (cost: one PK read a burst, only for a carried wall clock).
  - camera shots' capture time → `b0d6c4e3` (`takenAt`).
  - capture time far outside the days → `e98ede68` (`nightKeys`).
  - the door's camera word → `4adeb167`.
  - the held door's camera words → `4adeb167`.
  - the test's scratch path → `97362072`.
- **Not walked here (the cloud seat has no sign-in kit and no test events of its own; for Will's desk or the
  Orchestrator's walk, test data named "(disposable)"):** a far party's guest page in both clocks (an album with a
  develop time and a zone far from the walker's: the slot's rule, the sheet, the camera), the hub's cover on a far
  party (Settings' "in Makassar" beside it), a camera shot sent late keeping its taken time, a zoneless-Exif photo
  landing on the party's clock, the held door's camera words, and red-team 56's own MEDIUM re-walk on a real
  disposable album at 375 with a throttled send. No test data was created by this lane.
- Assets requested from Will: none.
- Board ideas: the stand-in pill and the shutter's progress ring say the same pick twice when both show (deep in a
  newest-first album); one object could carry both (a board on "her pick in flight, wherever she is").
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: Q1 (the stand-in), Q2 (the end edge), Q3 (the eyebrow keeps her clock), Q5 (the held door's
  words).
- Look at first: `src/components/guest/upload/sending-stand-in.tsx` with `gallery-rows.tsx`'s `useStandIn`, then
  `src/lib/shared/album-order.ts`'s `nightKeys`, then `src/app/api/r2/complete-upload/route.ts`'s party-zone read.
