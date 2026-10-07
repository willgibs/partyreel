# The develop and the camera (disposable mode)

Open this before you:
- read or write an album's media where a guest could see it (any SQL home, any guest-path PostgREST read, a count, a
  cover, a link, an export, a profile line): the seal's predicate is yours to carry;
- touch `develops_at`, `capture`, `roll_size` or `sealed_from` on `events`, or `sealed_until` on `media`;
- change the paged album's guest scope, its validator or the doorbell;
- change how guests add (the roll, its ceiling, a camera video's bounds) or her own withdrawal of a shot;
- change the album's camera (`components/guest/camera/`, `lib/guest/camera/`), the host's cover and her hub's develop,
  Settings' album styles or the wait's clock, or what a guest meets when an album develops.

Elsewhere: the paged album, the doorbell, the album's wait as a guest sees it and its develop
([guest-flow.md](guest-flow.md)), the upload pipeline ([uploads-and-r2.md](uploads-and-r2.md)), the grants, the RPC
inventory and the lock order ([database-security.md](database-security.md)), the purge and its guards
([lifecycle-recovery.md](lifecycle-recovery.md)), the caps and the uploads allowance ([billing-caps.md](billing-caps.md)).
The foundation migration's header (`20261002200000_disposable_foundation.sql`) holds the lock analysis and its
measurements.

## The model: two answers, and a preset

- **How guests add** is `events.capture`: `upload` (free uploads) or `camera` (the album's camera: a roll of
  `roll_size` shots each, 1 to 99, 24 unless a host names another). A text under a CHECK rather than an enum, so a
  third way to add is a constraint swap (an enum value cannot be used in the transaction that adds it).
- ★ **Her roll outlives the camera** (20261005190000): free uploads keep the last roll she named, so a style switch or
  the camera off and on comes back to it (the stamp only fills a camera's unnamed roll with 24). A free-upload album's
  `roll_size` is therefore no sign of a camera: every reader asks `capture` first (the SQL's `v_event.capture =
  'camera'`, the app's `developFactsOf`), and only Settings reads the kept size (`rollSizeOf`).
- **When everyone sees what's added** is one three-way answer over two columns: right away (`moderation_mode = live`,
  `develops_at` NULL), once the host approves each (`hold_for_approval`, NULL), or at a develop time (`develops_at`
  set; a time ahead waits, a time reached has developed). `lib/disposable/reveal.ts` reads the pair as one answer.
- "Disposable" is the camera plus a develop time: a preset over the columns, not a column of its own; Settings asks it
  as one of three album styles (`lib/disposable/album-style.ts`: Live, Reviewed, Disposable; a mix outside them stands
  under Customize).
- **Approval never stands with a develop**, since a host who keeps approval on as a safety net forgets to approve
  everything before the album develops: the CHECK `events_approval_never_develops` refuses `hold_for_approval` with any
  `develops_at`, a time reached included (an album that developed takes approval only by clearing it, one save of both
  columns). The host's write says it in words first (`updateEvent`, `approvalWithADevelop`) and reads the CHECK's
  refusal by its name. A disposable is checked under the host's cover before it develops, and its develop time moves
  whenever she needs longer.
- `sealed_from` is the current period's start, stamped by `events_reveal_stamp` (a develop time coming ahead, from none
  or from one reached; the camera beginning) and cleared when neither remains. No client role may write it.

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
  covers (`social.ts`). Those reads run on the service role, past RLS and with no session, so the filter is their only
  seal and they read as a guest whoever asks. The leak matrix (`src/lib/disposable/leak-matrix.test.ts`, and the
  Guests list's own cell in `social.test.ts`) runs them on the fake PostgREST and fails if one forgets.
- ★ **The guest's page is the guests' view, its host's included**: no guest-path read takes the owner's exemption (the
  open album RPC is asked with no session, `createAnonClient`), so two viewers of one page never hold two albums under
  one validator. The host's exemption is her dashboard's (her own session's INVOKER reads), so a dashboard surface
  that draws a photograph a guest could be shown carries the filter itself: the stage's wall does
  (`getStagePhotos`, [dashboard.md](dashboard.md)); a tile's cover and still and the stage's counts stay hers.
- **Never a NOT of the visible predicate**: it is not null-safe. Where the sealed rows themselves are asked, write
  `m.sealed_until > now() and e.host_id is distinct from (select auth.uid())`, as `album_changes_since` does.
- ★ **No writer seals a row a guest may have seen**, so a photo a guest has seen never goes back into the wait: every
  write of `sealed_until` clears it, moves a row already sealed (opening one already past) or seals a held row (no
  guest has seen one), and the guard test holds every `update ... set sealed_until` in the migration set to that.

## No waiting id leaves the server

- `album_bits` (mirrored by `AlbumSim`) splits a row's move into the host's scope (1), what a guest sees (2: approved
  and unsealed, the only bit that stamps an `album_version`) and **what waits** (4: held, or approved and sealed). Bit 4
  moves `album_max` and stamps nothing, so no waiting id rides the guest's log, nor its tombstone.
- The host's Guests room asks what waits as one number too, `countWaitingGuestShots` (`social.ts`: approved guest shots
  under their seal, a head count on `media_sealed_idx`, never an id), to say "N shots are developing" where its list,
  which a guest joins at the develop, is empty ([host-app.md](host-app.md)).
- `album_changes_since` (scope `album`) answers what waits as numbers, `waiting: {count, minutes}`, in its one
  snapshot; the sync's full answer carries it as `GuestFullSync.waiting` with the develop time (`waitingFor`), only at
  full access (never the teaser, `require_upload_to_view` or a blocked viewer, which answer before it), and only when
  something waits or a develop time is set. The validator hashes the develop time (`guestAlbumEtag`'s `developsAt`), so
  a host's new time reaches an open page on its next poll. How the page draws what waits is
  [guest-flow.md](guest-flow.md)'s (the album's wait).
- **A held upload moves `album_max` and rings**, since what waits is the guest's to count: a hold album's open pages
  answer it with a 200 that shows nothing new. That is the design, not a leak.
- The doorbell rings on the album's own bits (`album_bits & 6`), so it and the versions never disagree.
- Her OWN held and sealed rows ride her tracker's read (`/api/guests/mine`: `sealed: true`, and a picture presigned for
  her alone) and her own download (`readOwnSealedMedia`, the ids the server found hers); never the album's reads.

## Develop is a write

A lazy predicate alone reaches nobody: the guest poll's quiet path reads one row. So time passing becomes a write:
- `develop_due(event)` (service role) asks `seal_disagrees` (two index probes) and, when a sealed row disagrees with
  the event's answer, runs the one pass, `develop_rows`, and rings once. The album's first read that needs it runs it
  (`get_event_by_qr_token` answers `develop_due`; `developIfDue` in the sync route and the page's seed, once per event
  object, best effort: a failed develop is reported and the read goes on). The purge cron's `develop_rolls` sub-sweep
  (`develop_due_sweep`, its own switch `develop_rolls_enabled` and card) catches an album nobody opens.
- ★ **A host's save of `develops_at` rewrites the rows in that same save** (`events_develops_rewrite`, AFTER UPDATE):
  right away and Develop now open every sealed row, a time ahead moves them and seals the held ones, so the app makes
  no call after a save. Develop now is `develops_at = now()`, and the database stores any time within a minute of its
  clock, or before it, as its own now: a save of such a time develops the album for every guest, and no write takes a
  develop back. The rewrite runs inside the host's UPDATE, which holds the event row, so it takes only the media rows
  it can lock at once (SKIP LOCKED), and no upload or develop takes the event row (the lock order is
  [database-security.md](database-security.md)'s).
- **A straggler heals on the next read.** An upload that read the event an instant before a save committed, or a
  sealed row the rewrite skipped, stands on the old answer; `seal_disagrees` sees it and the next read's develop
  brings it to the event's. The narrow leak: a straggler sealed to an earlier time that no read reaches before that
  time shows then, once.
- **Leaving approval releases what is held, in the same save** (`events_hold_released`, AFTER UPDATE OF
  moderation_mode): every held row the save can lock at once is approved (SKIP LOCKED, as the rewrite), with one ring;
  into a develop time they join the roll (approved and sealed, developing with everyone's), to right away they show.
  The app's `approveAllPending` after a live save heals a row the pass skipped.
- ★ **An approval under a develop time ahead seals the row with it** (`media_seal_on_approval`, BEFORE UPDATE OF
  status, a row leaving `pending` for `approved` unsealed: it takes its event's `develops_at` while that is ahead),
  whoever approves it, so a held row a save skipped is never approved into view before the develop. No guest has seen
  a held row, so it hides nothing anyone saw. The one seal written in a trigger, pinned in
  `approval-never-develops.test.ts`.
- **What a develop touches besides the seal.** Every row `develop_rows` moves is stamped by `media_set_updated_at`, so
  a develop reads as activity on every developed row to anything keyed on `media.updated_at`; and a held row sealed by
  a save and then approved while still sealed moves only the host's scope (`album_bits` 1), so the guest's waiting
  count rightly stands still while `let_in_at` is stamped (her tracker's read leaves it out of her news).

## The roll, its ceiling and the withdrawn shot

- `create_media` counts her LIVE shots since `sealed_from` (held, approved or hidden; her ticket's rows and her
  account's here) against `roll_size`, under the host's profiles lock and then the roll's advisory lock, so two
  completes never both take the last frame, and refuses the shot past it in the words `roll.ts` mirrors. A shot she
  withdraws, or the host removes, gives its frame back; a host's hide keeps it taken. `get_upload_context` and
  `get_upload_gate` answer `roll: {used, cap, taken, ceiling}`, so the presign refuses first (`cameraShotRefusal`), and
  the gate's also names the period it counts in (`period`, `sealed_from` in epoch ms: the fresh roll's key, below).
- ★ **The ceiling outlives the purge.** At most `roll_size + 3` shots a period (her 3 re-shoots at any roll size,
  `ROLL_RESHOOTS`: a roll of 24 takes 27 in all), removed or not, counted in the ledger `camera_rolls` (written by
  `create_media` alone), because the purge deletes the very rows a count of media would read. Past it a shot meets
  "You've used all 3 re-shoots on your roll.", formatted from `c_roll_reshoots`.
- A shot she withdraws purges that night, as every guest's own withdrawal does in any album
  ([lifecycle-recovery.md](lifecycle-recovery.md)). So the churn a freed frame opens is bounded: the storage cap reads
  what the host stores and a withdrawn shot leaves it at once (a withdrawal sits in no Deleted), the uploads
  allowance's meter counts every upload and never gives one back, and the ceiling bounds the rows.
- A hold films up to 30 seconds at about 5 Mbps (about 19 MB), with half a second's grace, and a clip may weigh 384 MB
  at most, since its length is the client's word. `media/limits.ts` is the one home (the recorder's `maxMs`, the ring,
  the "0:30"); `create_media` mirrors it in three `c_camera_video_*` constants and formats both refusals from them,
  under `roll.test.ts`. The host's own uploads are exempt from the
  roll, the ceiling and the video bounds, and seal with everyone's.

## The guest's camera

On an album whose `capture` is `camera`, `GuestUpload`'s one Add (the cover's and the shutter's) opens the album's own
camera ([`album-camera.tsx`](../../src/components/guest/camera/album-camera.tsx), a lazy chunk fetched as such an album
mounts) in place of the add sheet; a free-upload album never loads it. The capture itself (the crop, the photo's
quality, a video's size and sound, a tap against a hold) is `lib/guest/camera/` and `use-shutter-press.ts`, and the
phone's camera is let go whenever the page hides or the camera closes (`use-camera-stream.ts`).
- **Every shot rides the page's one queue as it is taken** (`addFiles`, a video's first frame as its `poster`), so the
  join, the retry and the failure sheet are any upload's. A landing the album keeps sealed is told `sealed` by the
  server's own word (`create_media` answers it, the complete passes it, the queue's `landedAs`), on any album with a
  develop time ahead, whichever surface sent it, and no album surface draws it, so no tile stands in the album for her
  alone: her tracker lists it as developing and removable, and the album's wait counts it
  ([guest-flow.md](guest-flow.md)).
- **The count is the server's roll** (`roll-view.ts`): `/api/guests/mine` with `statuses` (never `tell`, which would
  spend her approval news), read only while nothing of hers is in the air, so no shot is counted twice. Her live shots
  count uncapped (`RollView.held`, past the roll only by the server's own count), so the counts say "2 on a roll of 1"
  and never promise a freed frame where removing one frees none (`removalFrees`). Her count is what she can still take
  (the frames left, or the room under the ceiling where that ends first: a frame the host freed past it stays empty),
  and her re-shoots are the room under the ceiling past the frames her roll has left (`reshoots`): each take-back
  spends one, a shot taken since the read and taken back since included (`taken`, the ledger keeps it). They are said
  where she takes one back (the sheet's line, her list's head, the camera's line after) and at the roll's end once
  spent. The host's own camera keeps no roll (`isOwner`) and asks nothing.
- **Two doors take a shot back** (guest-moments r1's `where=reel`): a press on the reel's newest frame (this visit's
  newest shot, on an album that keeps it out of sight) lays it over the picture with Take it back and Keep it
  (`TakeBackPanel`; two keys, since a mis-press on the reel must not delete), waiting for a shot still on its way;
  Your shots keeps its X with no question. Both are `removeOwnShot`, the page's own removal. On an album that shows
  each shot the reel is one door: a shot in the album is taken back from the album.
- **A fresh roll is said once** (host-moments r1's `fresh-roll=panel`): the device keeps the period she last held shots
  on (`pr_roll:<qrToken>`, `fresh-roll.ts`), and a roll read on another period lays `FreshRollPanel` over the finder,
  the shutter waiting for Start shooting; the kept period moves as it shows, so it is never said twice, and her first
  roll here is never called fresh. The camera reads her roll again when its album turns to a develop, so a develop
  time added under an open camera is said then.
- **The camera over a refusal of the album** (`album-camera.tsx`): a refusal the host can lift (uploads closed, the
  album full) stops the shutter in the server's words. Closed, it hears the album's own word (`uploadsWord`: the
  sync's `accepting`, each word the page hears counted) and asks again once, on the first word heard after the refusal
  that says open, never by itself; a refusal over a word that said open asks the album afresh (`askUploadsWord`, one
  sync with no validator, since that word's validator says open too). Full, and closed where no word comes (the door's
  camera hears the album's word wherever the album's sync polls), it asks again by itself, calmly: after 10 s, then 20, 40 and every minute, never while the page is
  hidden, at once as it comes back (never closer than 10 s to the last ask, so flicking between apps is no presign a
  return) and when the connection does, and only for those two refusals (a lock, a gone event or a ticket that is not
  hers are never asked again). The ask is the shots' own Retry through
  the queue, and a shot being asked stands as the refusal it was until the album answers, so the banner, the stopped
  shutter and the reel's caption never flicker for it; the answer is the file going up (a refusal comes before a byte
  moves), and a yes takes the banner and the stopped shutter away with the refusal while the shot is still on its way.
- ★ **At the door the first photograph is taken with the album's camera, never chosen from the library** (`camera`,
  the page's `{rollSize}` for a camera album; never the demo's): the album's own Add offers no library, so the door's
  upload step offers one Take a photo, no picker, no terms line, in the camera's verb ("Take your photos", "Take
  another photo"). The door holds that camera itself (`AlbumCamera`, its own lazy chunk fetched as the step shows),
  beside the sheet and never inside a step: at A photo first the album's own slot, which carries a camera, is not
  mounted yet (it stands only at `full`), and the step drops the moment her first shot lands while she goes on
  shooting. The held door's wait chooser (`door/wait-picks.tsx`) still offers the library. At the held door the
  camera's reveal is `door` (`heldAtDoor`): its line says "They go in once you're let in", each shot "Waiting to go in",
  and the roll's end "N shots. They go in once you're let in."
- The camera's page half is `event-experience.tsx`'s, the door's camera included: while one is open the keep waits
  (`keepDue && !cameraOpen`) and the page holds the album's failure sheet for as long (`onCameraOpenChange`, said by the
  door's camera as by the slot's own; `onUploadStepActive` is the step's alone, since the page folds the queue's live
  progress while a step that draws a bar shows, which a camera reading standings must not pay for), and a shot she
  takes back in its Your shots goes through the page's own removal (`removedIds`, `onOwnRemoved`), so the keep stops
  counting it and a require-an-upload door asks the server whether her upload still stands. The door's camera is
  handed the queue only as a shot's standing moves, never for a tick of a bar (the door's queue ticks about once a
  frame while a file goes up), and what it reads of the album comes from what the door already holds (`CameraEvent`).

## The host's control, and her cover

`camera-settings.tsx` asks it as **album styles**, each one save of all three columns (`patchForStyle`) so no
half-state is ever stored, with the develop time and Develop now in one row where the album has one, Shots each while
guests add with the camera (`roll-control.tsx`: film's 12, 24 and 36, or Other's stepper to 99; a box saves at once,
a run of steps once she rests, `RollSetting`; Create's Disposable pick draws the same control), and Customize, where
`CaptureAndReveal` asks the two answers apart. A change that would show waiting photos or release held ones asks
before it saves (`ConsequenceLine`, `styleSwitchConsequence`), as a develop time that would develop the album does
(below), and so does a develop time onto a running camera (from none, or from one reached: a new period), Start fresh
rolls or Keep it as it is (`camera-settings-fresh-rolls.ts`), wherever she adds one: Customize, the Disposable style
from a mix, a new time for a camera that has developed (a close, which cannot ask, writes nothing of it).

★ **The default develop is the party's 9 am** (`developToKeep`, `lib/event/zone-morning.ts`): 9 am the morning after
the party's last day (or after today, once that has passed) in the event's own zone (`events.time_zone`), so a
destination wedding set up from home develops in the party's morning, not hers, one moment for every guest; and the
develop is what turns its album into the night's order (album-order, AY1: her close or her develop, never a date).
Create offers it in the zone it captures (her browser's); Settings in the party's stored zone, else hers.
`patchForStyle` and `defaultDevelopAt` take the party's zone themselves (`{ zone }`, through `event/wall-time.ts`, the
one wall-clock arithmetic); `developToKeep` is Customize's "At a develop time" (a time still ahead kept, else that
morning). Where the party's zone is not the host's own (`farZone`), the
develop time is her party's clock throughout Settings: the field takes it both ways (`toZoneInput`/`fromZoneInput`, the
judge reads it), and every line says its place ("Develops Sun, Oct 4, 9:00 AM in Mexico City", `zone-words.ts`). An
instant is never moved by a zone: a develop set before she picks another city keeps its moment and is said in the new
one's clock.

★ **The develop time is sent only when it is plainly meant** (`DevelopTimeControl`, judged by
`camera-settings-develop-time.ts`), because a save of a time at or before the database's now is Develop now (above),
and a year left half typed is such a time (Chrome fires a whole value at each digit as 2027 is typed into a year: 0002,
0020, 0202). What she types is a draft judged once, never on a keystroke: when she leaves the field, presses Return,
a picker's choice has rested a beat (a phone's picker may never blur it), or the panel closes (Escape or Back must not
drop a time; the date's own beat and close-save, `useFinishedFields` in `camera-settings-finish.ts`). A close cannot
ask, so it writes only what a blur would write unasked, a time plainly meant; what cannot be meant is refused in words
under the field, and a time the database would store as now asks Develop now's own question, whose answer writes now.
The field's state lives in `AlbumStyles` and `CaptureAndReveal`, which stay mounted while the time comes and goes, and a
write that changes when everyone sees drops the draft first, so a style switch that clears the time is never answered by
a late write of a typed one. The guard is the app's alone: the schema accepts a past `develops_at` (Develop now writes through it), so an older build or a crafted request
develops without asking.

**The host's cover** (`event-hub-head-cover.tsx`, mounted by `event-gallery.tsx`): while a develop time is ahead, her
hub's album is the contact sheet her guests meet, counted from her own manifest (`lib/disposable/host-cover.ts`), until
Look lifts it for the visit. Her hub's head and its band wear only what her guests can see meanwhile
(`useHubCoverStills`), following the develop, never Look; the Reel card is the one door that is hers: a press plays her
own scope over the hub, sealed shots included (the card draws none of them) ([reel.md](reel.md)). What waits on it is
read by the seal, the period only its floor: the held photos a switch put in the roll (and a camera's shots between a
develop time and its restamped period) are sealed yet created before `sealed_from`, so the page reads them off the rows
(`host-cover.server.ts`'s `readJoinedIds`) and hands them down as `joined`; `waitsOf` is the one test the count and the
head share.

**The hub develops too** (`hub-develop.tsx`, wrapping the rows in `event-gallery.tsx`'s box): her first open after the
develop plays the guests' `DevelopSheet` in her album's place, on the guests' tokens, stylesheet and
`pr_develop:<eventId>` mark (so a phone plays one develop once, whichever page met it first, and a develop she moves
later plays again; [guest-flow.md](guest-flow.md)). It is decided once, as the box mounts: a cover that gives way to her
rows at the develop (the clock, or Develop now) plays it, and a time that comes while she is looking early is owed her
next open. Her manifest holds the roll (`hub-develop-roll.ts`: the guests' `rollOfEntries` less her hidden and held
photographs, so both sides count the same ones), so nothing waits to land.
- ★ Her album stands below the head, the cards and the checklist, so the sheet (held over the rows from the first byte
  by the guests' gate script) plays once it has been in view a beat: a scroll never ends it, and a press or key ends it
  anywhere while it plays but only inside her album while it waits.
- `?reel` spends it unplayed; reduced motion lands developed at once (nothing held, the mark written).
- ★ The rows' box (`[data-develop-album]`, `[data-develop-rows]`) is one tree whether or not a develop is owed, so no
  develop remounts the grid.

**The wait's clock** (`lib/disposable/use-wait-clock.ts`): every line that says when an album develops is said from now,
in the reader's own clock and only after hydration (`wait-words.ts`, `lib/guest/camera/words.ts`), and every reader
decides ahead or reached on `useWaitClock`, one shared store that turns at the develop itself. A far party's develop
is said in both clocks ("Sun, Oct 4 at 9 am in Bali, Sat 6 pm yours", her weekday only where her day differs:
`developsWhen(iso, now, zone)`, `bothClocksWhen`), the page handing its zone for words alone (`partyZone`, never behind a
lock); the cover's eyebrow keeps her own short clock, the hub's line names a far party's place as Settings does
(`hubDevelopWhen`) and the held card under it (`ContactSheet`'s develop clock, handed the same zone) says both clocks as
the guests' sheet does, never her own alone, unlabelled, beneath a line in the party's. A reader with a clock of
its own (a `Date.now()` in a render, an interval of its own) keeps a cover standing after its develop.

## Verifying it

`migration-guards.test.ts` pins the SQL and `leak-matrix.test.ts` the app's reads; `seal-model.test.ts` runs thousands
of seeded schedules through the real planner and client store (`AlbumSim`) and fails if a sealed id ever reaches a
guest; `roll.test.ts` holds each roll constant to its SQL mirror. The foundation's rolled-back check (its foot) runs
every body the way its callers do, the model for a migration that touches the seal.
