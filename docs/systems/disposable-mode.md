# The develop and the camera (disposable mode)

Open this before you:
- read or write an album's media where a guest could see it (any SQL home, any guest-path PostgREST read, a count, a
  cover, a link, an export, a profile line): the seal's predicate is yours to carry;
- touch `develops_at`, `capture`, `roll_size` or `sealed_from` on `events`, or `sealed_until` on `media`;
- change the paged album's guest scope, its validator or the doorbell;
- change how guests add (the roll, its ceiling, a camera video's bounds) or her own withdrawal of a shot;
- change the album's camera (`components/guest/camera/`, `lib/guest/camera/`), or build the waiting room, the reveal or
  the host's cover (the design boards after this foundation).

Elsewhere: the paged album and the doorbell ([guest-flow.md](guest-flow.md)), the upload pipeline
([uploads-and-r2.md](uploads-and-r2.md)), the grants and the RPC inventory ([database-security.md](database-security.md)),
the purge and its guards ([lifecycle-recovery.md](lifecycle-recovery.md)), the caps and the ingress meter
([billing-caps.md](billing-caps.md)). The migration is `20261002200000_disposable_foundation.sql`; its header is the
design record (the lock analysis, the stress numbers, the calls taken).

## The model: two answers, and a preset

- **How guests add** is `events.capture`: `upload` (free uploads) or `camera` (the album's camera: a roll of
  `roll_size` shots each, 24 unless a host names fewer, at most 24). A text under a CHECK, never an enum.
- **When everyone sees what's added** is one three-way answer over two columns: right away (`moderation_mode = live`,
  `develops_at` NULL), once the host approves each (`hold_for_approval`, NULL), or at a develop time (`develops_at`
  set; a time ahead waits, a time reached has developed). `lib/disposable/reveal.ts` reads the pair as one answer.
- "Disposable" is the camera plus a develop time: a preset, never a column. Approve plus develop is legal in the
  schema (a row shows once approved AND past its time); Settings offers the three answers.
- `sealed_from` is the current period's start, stamped by `events_reveal_stamp` (a develop time coming ahead, from none
  or from one reached; the camera beginning) and cleared when neither remains. Never a client's to write.

## The seal: one predicate, per row

`media.sealed_until` (NULL is unsealed) is set by `create_media*` to the develop time while it is ahead, whatever the
capture and whatever the status. A viewer may see a row when:

```
m.status = 'approved' and (m.sealed_until is null or m.sealed_until <= now() or e.host_id = (select auth.uid()))
```

- ★ **Every SQL home a guest's view reaches carries it** (`get_event_media_by_qr_token`, `event_covers`, `event_stills`,
  `event_card_stats`, `like_media`, `create_report`, `get_public_profile`'s two attended arms, `album_changes_since`),
  pinned by `src/lib/disposable/migration-guards.test.ts`. A new home takes it too, in one of the three spellings
  that test accepts.
- ★ **Every guest-path PostgREST read carries its app half**, `.or(unsealedFilter(nowIso()))`
  (`lib/disposable/seal.ts`): the manifest page and the links read (`album-guest.ts`), the unlocked album, the teaser,
  the album's size, the uploader credits and the photo card (`guest-events-admin.ts`), the Guests list and the attended
  covers (`social.ts`). The leak matrix (`src/lib/disposable/leak-matrix.test.ts`, and the Guests list's own cell in
  `social.test.ts`) runs them on the fake PostgREST and fails if one forgets. Those reads run on the service role, so
  they read as a guest whoever asks.
- ★ **The guest's page is the guests' view, its host's included**: no guest-path read takes the owner's exemption (the
  open album RPC is asked with no session, `createAnonClient`), so two viewers of one page never hold two albums under
  one validator. The host's exemption is her dashboard's (her own session's INVOKER reads).
- **Never a NOT of the visible predicate**: it is not null-safe. Where the sealed rows themselves are asked, write
  `m.sealed_until > now() and e.host_id is distinct from (select auth.uid())`, as `album_changes_since` does.
- ★ **No writer seals a row a guest may have seen.** Every write of `sealed_until` clears it, moves a row already
  sealed (opening one already past), or seals a held row (no guest has seen one). The guard test holds every
  `update ... set sealed_until` in the migration set to that.

## No waiting id leaves the server

- `album_bits` (mirrored by `AlbumSim`) splits a row's move into the host's scope (1), what a guest sees (2: approved
  and unsealed, the only bit that stamps an `album_version`) and **what waits** (4: held, or approved and sealed). Bit 4
  moves `album_max` and stamps nothing, so no waiting id rides the guest's log, nor its tombstone.
- `album_changes_since` (scope `album`) answers `waiting: {count, minutes}` in its one snapshot; the sync's full answer
  carries it as `GuestFullSync.waiting` with the develop time (`waitingFor`), only at full access (never the teaser,
  `require_upload_to_view` or a blocked viewer, which answer before it), and only when something waits or a develop
  time is set, so an album using neither answers byte for byte what it did. The validator hashes the develop time
  (`guestAlbumEtag`'s `developsAt`); every change to what waits moves `album_max`.
- ★ **A held upload moves `album_max` and rings**: what waits is the guest's to count. A hold album's open pages answer
  one 200 carrying no change where they answered a 304; that is the design, not a leak.
- The doorbell rings on the album's own bits (`album_bits & 6`), so it and the versions never disagree.
- Her OWN held and sealed rows ride her tracker's read (`/api/guests/mine`: `sealed: true`, and a picture presigned for
  her alone), and her own download (`readOwnSealedMedia`, the ids the server found hers); never the album's reads.

## Develop is a write

A lazy predicate alone reaches nobody: the guest poll's quiet path reads one row. So time passing becomes a write:
- `develop_due(event)` (service role) asks `seal_disagrees` (two index probes) and, when a sealed row disagrees with
  the event's answer, runs the one pass, `develop_rows`, and rings once. The album's first read that needs it runs it
  (`get_event_by_qr_token` answers `develop_due`; `developIfDue` in the sync route and the page's seed, once per event
  object, best effort: a failed develop is reported and the read goes on). The purge cron's `develop_rolls` sub-sweep
  (`develop_due_sweep`, its own switch `develop_rolls_enabled` and card) catches an album nobody opens.
- ★ **A host's save of `develops_at` rewrites the rows in that same save** (`events_develops_rewrite`, AFTER UPDATE):
  right away and Develop now open every sealed row, a time ahead moves them and seals the held ones. The app makes no
  call after a save. Develop now is `develops_at = now()`: anything within a minute of the database's clock, or before
  it, is stored as its own now.
- ★ **Nothing waits on a media row while it holds the event row.** The save's rewrite runs inside the host's UPDATE,
  which holds the event row, so it takes only the rows it can lock at once (SKIP LOCKED); no upload and no develop
  takes the event row. A lock there closed deadlock cycles with a restore (profiles, then the event) and a purge or a
  takedown (a media row, then profiles), measured; the migration header has the numbers.
- **A straggler heals on the next read.** An upload that read the event an instant before a save committed lands on
  the old answer; `seal_disagrees` sees it and the next read's develop brings it to the event's. The narrow leak: a
  straggler sealed to an earlier time that no read reaches before that time shows then, once.
- **What a develop touches besides the seal.** Every row `develop_rows` moves is stamped by `media_set_updated_at`, so
  a develop reads as activity on every developed row to anything keyed on `media.updated_at`; and a held row sealed by
  a save and then approved while still sealed moves only the host's scope (`album_bits` 1), so the guest's waiting
  count rightly stands still while `let_in_at` is stamped (her tracker's read leaves it out of her news).

## The roll, its ceiling and the withdrawn shot

- `create_media` counts her LIVE shots since `sealed_from` (held, approved or hidden; her ticket's rows and her
  account's here) against `roll_size`, under the host's profiles lock and the roll's advisory lock, and refuses the shot
  past it in its own words ("You've taken all 24 shots on your roll."). A shot she withdraws, or the host removes, gives
  its frame back (Will, 2026-10-02); a host's hide keeps it taken. `get_upload_context` and `get_upload_gate` answer
  `roll: {used, cap, taken, ceiling}`, so the presign refuses first (`cameraShotRefusal`).
- ★ **The ceiling outlives the purge.** At most `roll_size * 3` shots a period, removed or not, counted in the ledger
  `camera_rolls` (written by `create_media` alone), because the purge deletes the very rows a count of media would
  read.
- ★ **A camera shot she withdraws purges that night**: `set_media_purge_at` writes `purge_at = removed_at` for her own
  removal (`removed_by_uploader`) of a row taken in the camera's period; every other removal keeps the bin's 30 days,
  and a legal hold, an open report and `kept_media_ids` keep it as they keep any row.
- The churn a freed frame opens is bounded three ways: the storage cap reads active bytes (a withdrawn shot leaves it
  at once), the monthly ingress meter counts every upload and never gives one back, the ceiling bounds the rows.
- A camera video is one shot of up to 10 s (with half a second's grace) and 128 MB, since its length is the client's
  word (`media/limits.ts`, mirrored in `create_media` under `roll.test.ts`). The host's own uploads are exempt from the
  roll, the ceiling and the video bounds, and seal with everyone's.

## The guest's camera

On an album whose `capture` is `camera`, `GuestUpload`'s one Add (the cover's and the shutter's) opens the album's own
camera ([`album-camera.tsx`](../../src/components/guest/camera/album-camera.tsx), a lazy chunk fetched as such an album
mounts) in place of the add sheet; a free-upload album never loads it.
- **Every shot rides the page's one queue as it is taken** (`addFiles`, a video's first frame as its `poster`), so the
  join, the retry and the failure sheet are any upload's; the sheet waits while the camera is open. ★ **A landing the
  album keeps sealed is told `sealed`** by the server's own word (`create_media` answers `sealed`, the complete passes
  it, the uploader carries it, the queue's `landedAs`), on any album with a develop time ahead, whichever surface sent
  it: nothing draws it, so no tile stands in the album for her alone, and her tracker lists it as "Waiting to
  develop" from the moment it lands, counted and removable.
- **The count is the server's roll** (`roll-view.ts`): `/api/guests/mine` with `statuses` (★ never `tell`, which would
  mark her approval news told), read at the opening, after she takes a shot back and after a roll refusal, ★ and only
  while nothing of hers is in the air, so the shots taken since the read began are added and none is counted twice.
  The host's own camera keeps no roll (`isOwner`) and asks nothing.
- **Full size**: a photo is the stream's own frame cropped to the box she framed (3:4 upright, 4:3 on its side), JPEG
  0.92, unless `ImageCapture` offers half again the pixels in the same orientation (`frame-math.ts`). A video is the
  picture redrawn at 1080 on its short side and recorded (MP4 where the browser can, else WebM), ending itself at the
  ten seconds; the microphone is asked only on a hold (★ Permissions-Policy grants the site `camera` and `microphone`)
  and a hold it keeps waiting past 1.5 s films without sound. A hold under a second takes the photo meant.
- ★ **The page's half** (`event-experience.tsx`): the door's keep, which a signed-out guest's first landed shot makes
  due, is held while the camera is open (`onCameraOpenChange`) and comes when she closes it; a `sealed` landing is kept
  in `inFlightUploads` as a held one is (her tracker's picture of it, and the cover says Add photos once she has shot);
  `GuestUpload` is handed `isOwner && !isDemo` (the host's camera keeps no roll) and `onOwnRemoved` (a shot taken back
  inside the camera is the page's removal, so a require-an-upload album re-asks its door); and where the Add opens the
  camera the cover's Add and the shutter say Take photos with the camera glyph.
- The camera is let go whenever the page hides or the camera closes, and Back, Escape and its close close it. Her shots
  (this visit's from the frames they froze on, an earlier visit's from her read's presigned pictures) open from the reel
  and the roll's end; a shot the album cannot show yet (sealed or held) is hers to remove there, freeing its frame.

## The host's control

`camera-settings.tsx` is one mountable control (`CaptureAndReveal`, bound to Settings by `CameraSettings`) on the
adds page: how guests add, and the three-way when-everyone-sees (today's Review switch moved into it). Each answer is
one save of both columns. A change that would show held or waiting photos asks first (`ConsequenceLine`); nothing else
asks. Leaving "approve each" approves what is held (`updateEventAction` runs `approveAllPending` on a live save); into a
develop time, the save sealed them first, so they wait for the develop. The waiting experience's words and drawings,
whether approve plus develop is offered, and the preset's name are the design boards' after this foundation.

## Verifying it

The migration's rolled-back check (its foot) runs every body the way its callers do, red without the file and green
with it, on the local stand-in and live. `migration-guards.test.ts` pins the SQL; `leak-matrix.test.ts` the app's
reads; `seal-model.test.ts` runs thousands of seeded schedules through the real planner and client store
(`AlbumSim`) and fails if a sealed id ever reaches a guest; `roll.test.ts` holds each constant to its SQL mirror.
★ Prod and the alias share the database: until the build that carries the app's half deploys, a sealed TEST album is
readable through the older build's guest reads (they carry no column filter).
