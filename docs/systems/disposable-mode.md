# The develop and the camera (disposable mode)

Open this before you:
- read or write an album's media where a guest could see it (any SQL home, any guest-path PostgREST read, a count, a
  cover, a link, an export, a profile line): the seal's predicate is yours to carry;
- touch `develops_at`, `capture`, `roll_size` or `sealed_from` on `events`, or `sealed_until` on `media`;
- change the paged album's guest scope, its validator or the doorbell;
- change how guests add (the roll, its ceiling, a camera video's bounds) or her own withdrawal of a shot;
- change the album's camera (`components/guest/camera/`, `lib/guest/camera/`), the host's cover, Settings' album
  styles or the wait's clock, or build what a guest meets when an album develops.

Elsewhere: the paged album, the doorbell and the album's wait as a guest sees it ([guest-flow.md](guest-flow.md)), the
upload pipeline ([uploads-and-r2.md](uploads-and-r2.md)), the grants, the RPC inventory and the lock order
([database-security.md](database-security.md)), the purge and its guards
([lifecycle-recovery.md](lifecycle-recovery.md)), the caps and the uploads allowance ([billing-caps.md](billing-caps.md)).
The foundation migration's header (`20261002200000_disposable_foundation.sql`) holds the lock analysis and its
measurements.

## The model: two answers, and a preset

- **How guests add** is `events.capture`: `upload` (free uploads) or `camera` (the album's camera: a roll of
  `roll_size` shots each, 24 unless a host names fewer, at most 24). A text under a CHECK rather than an enum, so a
  third way to add is a constraint swap (an enum value cannot be used in the transaction that adds it).
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
  one validator. The host's exemption is her dashboard's (her own session's INVOKER reads).
- **Never a NOT of the visible predicate**: it is not null-safe. Where the sealed rows themselves are asked, write
  `m.sealed_until > now() and e.host_id is distinct from (select auth.uid())`, as `album_changes_since` does.
- ★ **No writer seals a row a guest may have seen**, so a photo a guest has seen never goes back into the wait: every
  write of `sealed_until` clears it, moves a row already sealed (opening one already past) or seals a held row (no
  guest has seen one), and the guard test holds every `update ... set sealed_until` in the migration set to that.

## No waiting id leaves the server

- `album_bits` (mirrored by `AlbumSim`) splits a row's move into the host's scope (1), what a guest sees (2: approved
  and unsealed, the only bit that stamps an `album_version`) and **what waits** (4: held, or approved and sealed). Bit 4
  moves `album_max` and stamps nothing, so no waiting id rides the guest's log, nor its tombstone.
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
  `get_upload_gate` answer `roll: {used, cap, taken, ceiling}`, so the presign refuses first (`cameraShotRefusal`).
- ★ **The ceiling outlives the purge.** At most `roll_size * 3` shots a period, removed or not, counted in the ledger
  `camera_rolls` (written by `create_media` alone), because the purge deletes the very rows a count of media would
  read.
- A shot she withdraws purges that night, as every guest's own withdrawal does in any album
  ([lifecycle-recovery.md](lifecycle-recovery.md)). So the churn a freed frame opens is bounded: the storage cap reads
  what the host stores and a withdrawn shot leaves it at once (a withdrawal sits in no Deleted), the uploads
  allowance's meter counts every upload and never gives one back, and the ceiling bounds the rows.
- A camera video is one shot of up to 10 s (with half a second's grace) and 128 MB, since its length is the client's
  word (`media/limits.ts`, mirrored in `create_media` under `roll.test.ts`). The host's own uploads are exempt from the
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
  spend her approval news), read only while nothing of hers is in the air, so no shot is counted twice. The host's own
  camera keeps no roll (`isOwner`) and asks nothing.
- The camera's page half is `event-experience.tsx`'s: the door's keep waits while she shoots (`onCameraOpenChange`),
  and a shot taken back inside the camera is the page's removal (`onOwnRemoved`), so a require-an-upload album re-asks
  its door.

## The host's control, and her cover

`camera-settings.tsx` asks it as **album styles**, each one save of all three columns (`patchForStyle`) so no
half-state is ever stored, with the develop time and Develop now in one row where the album has one, and Customize,
where `CaptureAndReveal` asks the two answers apart. A change that would show waiting photos or release held ones asks
before it saves (`ConsequenceLine`, `styleSwitchConsequence`), as a develop time that would develop the album does
(below).

★ **The develop time is sent only when it is plainly meant** (`DevelopTimeControl`, judged by
`camera-settings-develop-time.ts`), because a save of a time at or before the database's now is Develop now (above),
and a year left half typed is such a time (Chrome fires a whole value at each digit as 2027 is typed into a year: 0002,
0020, 0202). What she types is a draft judged once, when she leaves the field or presses Return, never on a keystroke
and never as the panel closes (a close cannot ask); what cannot be meant is refused in words under the field, and a
time the database would store as now asks Develop now's own question, whose answer writes now. The guard is the app's
alone: the schema accepts a past `develops_at` (Develop now writes through it), so an older build or a crafted request
develops without asking.

**The host's cover** (`event-hub-head-cover.tsx`, mounted by `event-gallery.tsx`): while a develop time is ahead, her
hub's album is the contact sheet her guests meet, counted from her own manifest (`lib/disposable/host-cover.ts`), until
Look lifts it for the visit. Her hub's head, its band and the Reel card wear only what her guests can see meanwhile
(`useHubCoverStills`, `reel-card.tsx`), following the develop, never Look. What waits on it is read by the seal, the
period only its floor: the held photos a switch put in the roll (and a camera's shots between a develop time and its
restamped period) are sealed yet created before `sealed_from`, so the page reads them off the rows
(`host-cover.server.ts`'s `readJoinedIds`) and hands them down as `joined`; `waitsOf` is the one test the count and the
head share.

**The wait's clock** (`lib/disposable/use-wait-clock.ts`): every line that says when an album develops is said from now,
in the reader's own clock and only after hydration (`wait-words.ts`, `lib/guest/camera/words.ts`), and every reader
decides ahead or reached on `useWaitClock`, one shared store that turns at the develop itself. A reader with a clock of
its own (a `Date.now()` in a render, an interval of its own) keeps a cover standing after its develop.

## Verifying it

`migration-guards.test.ts` pins the SQL and `leak-matrix.test.ts` the app's reads; `seal-model.test.ts` runs thousands
of seeded schedules through the real planner and client store (`AlbumSim`) and fails if a sealed id ever reaches a
guest; `roll.test.ts` holds each roll constant to its SQL mirror. The foundation's rolled-back check (its foot) runs
every body the way its callers do, the model for a migration that touches the seal.
