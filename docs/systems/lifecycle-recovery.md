# Lifecycle, recovery & email

Open this before you:
- add or change a sweep in the daily purge cron;
- touch deleting or restoring: the 30-day window, Deleted counting in storage and making room from it, the Deleted
  filters;
- change what happens when a host goes over the cap, a pass lapses or a Free event goes idle;
- send an email.

Elsewhere: the orphan sweep's breaker and the backups ([durability-backups.md](durability-backups.md)), the cap model
and the three counters ([billing-caps.md](billing-caps.md)), how a sweep reports its health
([admin-observability.md](admin-observability.md) "Backend jobs"), legal holds
([trust-safety-forensics.md](trust-safety-forensics.md)).

## The daily purge cron

`/api/cron/purge` (registered in `vercel.json`, authorized by `CRON_SECRET`, run on the app surface only:
[admin-observability.md](admin-observability.md)) runs every sweep, each independently try/caught, so one failing
never stops the rest. The bodies live in `lib/lifecycle/sweeps/` and `account-deletion.ts`, each tested on the clamping
PostgREST fake.

- ★ **Every sweep is whole and budgeted.** The run is one invocation (`maxDuration` 60), so every sweep works in keyset
  batches (`readAllPages`, id lists through `inChunks`) and checks a deadline before each batch, never mid-batch. The
  sweeps share one window as they start, each taking an equal share of what is left (`sweep-budget.ts`), so a
  backlog in one never starves the rest nor runs the invocation into Vercel's kill. A sweep the deadline stops
  returns `stopped_early` with a counted `remaining` where it can take one, and its run reads "Needs a look".
- **A sweep that deletes drains:** the next run starts at what is left. `expired_events` reclaims each batch's media
  before its event rows go (a batch the deadline interrupts keeps its event rows), finding them index-only through
  `events_deleted_idx` (the soft-deleted events by id, carrying `purge_at` and `deleted_at`, the filter's two
  columns); `removed_media` goes oldest `purge_at` first, then every row asked to leave for good; `deleted_accounts`
  leaves an account caught mid-purge with its events and auth user.
- **A sweep that examines rotates:** `expired_passes`, `over_capacity`, `renewal_nudges` and
  `inactive_free_events` (accounts) and `album_log` (albums) store `resume_after` on their run row when the deadline
  stops them, and the next run starts after it, so a list longer than a night still has every candidate examined in
  turn (an unreadable cursor starts over, with a warning). `orphans` rotates by position: at most 20 R2 pages a night,
  then the key it stopped at rides the purge run's row under its name, and the next run lists after it.
- **A sweep that loops over accounts and emails someone or deletes bytes is a job of its own** (its own run row,
  switch and card, through `createSweepRunner`; its loop under `forEachIsolated`:
  [admin-observability.md](admin-observability.md)), so an operator can stop it alone. So is `album_log`, though it
  deletes rows only: it writes in the album's live core.
- **`develop_rolls` runs first of the budgeted sweeps** (`develop_due_sweep`): it develops every album whose sealed
  rows disagree with its event (a develop time passed with nobody reading), a batch of albums a call, and deletes
  nothing; its own job and switch, since it reveals photographs ([disposable-mode.md](disposable-mode.md)).
- ★ **`album_log` prunes the paged album's change log under a watermark** (`album_prune_tombstones`): a purged item's
  change row (its tombstone) goes, and the album's watermark rises to its versions in the same transaction, so a
  client below the watermark is sent its album whole ([guest-flow.md](guest-flow.md)). It walks the log album by
  album (each call the albums the next `ALBUM_LOG_WINDOW` rows touch, whole), last of the budgeted sweeps, after every
  sweep that purges.
- **Reclaiming is R2 first, then rows**, since a row's delete (or its event's cascade) destroys the keys the object
  delete needs: every sweep and account deletion deletes through `reclaimMedia`, and the host's Delete permanently
  (`purge_media_now`) through its own wrapper. The rows go through `purge_media_rows` (service role only; it never
  deletes a held row and decrements `storage_used_bytes` atomically), at most `MAX_ROWS` ids a call and one call at a
  time (`reclaim.ts` says why).
- ★ **Held media is excluded from every hard-delete path;** the rule and how each sweep keeps it are in
  [trust-safety-forensics.md](trust-safety-forensics.md).

## The 30-day window, and Deleted in storage

- **One 30-day window** (`RECENTLY_DELETED_WINDOW_DAYS`). `purge_at` is trigger-derived on both tables
  (`set_event_purge_at`: `deleted_at` + 30 days; `set_media_purge_at`: `removed_at` + 30 days) across every removal
  path, so it cannot be spoofed and no host holds a grant on it. The window's clock is `media.removed_at`, never
  `updated_at`, which every touch bumps. Inside is from the window's start on (`>=`), in every list, figure and
  restore. One exception: a guest's own withdrawal purges that night, in every album (`purge_at = removed_at`): it sits
  in no Deleted and counts in no plan, so nothing waits on it; a hold, an open report and `kept_media_ids` keep it as
  any row.
- ★ **Deleted counts in storage.** Her plan's cap holds her albums and her Deleted together, so a delete frees
  nothing: an item frees room only when it leaves Deleted for good (her Delete permanently, Empty Deleted, the 30-day
  purge, or room made for an upload), which is also the anti-abuse bound: nothing parked in Deleted outgrows the plan.
  Deleted is defined once, `host_deleted_media(uuid)` (SECURITY INVOKER, the owner's alone, so no role PostgREST serves
  can page it): exactly what her two Deleted lists show, her removals and the system's and a deleted event's own
  media, each inside its window (an item never outlives its event's), never a guest's withdrawal, an operator's
  removal or an asked row, with `binned_at` (when each entered Deleted) and `by_system`. `host_storage_summary` sums
  it (`standby_bytes`, a name the deployed build still reads, and `system_bytes`), and every figure and cap check
  reads that ([billing-caps.md](billing-caps.md)). A system removal and a held row count while they are listed and
  never after, since a figure outliving its list would tell her a hold exists.
- ★ **Leaving Deleted for good is `leave_deleted`** (service role): her Deleted, oldest first by `binned_at` (a
  deleted event's items, which entered together, largest first, so the fewest go), until the bytes asked for have
  left or `p_limit` items have, answering `more` when the limit stopped it; the system's removals only when asked to
  (`p_system`). A call without a byte bound takes a batch (`LEAVE_DELETED_BATCH`), because PostgREST runs every call
  under the `authenticator` role's 8 s statement_timeout, the service role's too, and one unbounded statement rolls
  back somewhere past 8,000 items. Each item is ASKED (`purge_asked_at`; a deleted event's live item removed in the
  same write, as the CHECK requires), which takes it out of every host read, every figure and her meter at once
  (`media_release_meter`), and the `removed_media` sweep's asked pass deletes it that night, R2 first, or the night
  its keeper lets go. A deleted event it empties leaves with its last item: its `deleted_at` moves a minute past the
  window's start, so the list, the bell, every figure and `restore_event` read it gone at once and `expired_events`
  takes it that night. It locks the host's profiles row first ([database-security.md](database-security.md)), then
  only the media rows it can take at once (`FOR UPDATE SKIP LOCKED`), since `purge_media_rows` locks media before
  profiles.
- **Making room from Deleted** (`profiles.make_room_from_deleted`, on by default and hers to write): when an upload's
  complete would pass the cap and its 10% and the file fits beside her albums, `create_media*` call `leave_deleted`
  for exactly what the file needs, under the lock they already hold; a refusal rolls the eviction back with it. Never
  at the presign, whose size is the client's word: a phantom presign would empty her Deleted for nothing.
  **Empty Deleted** (`empty_deleted(p_limit)`, her own act on `auth.uid()`) takes a batch a call, the system's
  removals included, and the action calls again while `more`, within a time budget; every deleted event inside its
  window leaves with the last batch, never before what is still in it. A row back in her album (`restore_media`, Let
  back in) loses the reduce's flag (`removed_by_system`), and Deleted reads that flag on a removed row alone, so a
  later removal of hers reads as hers.
- ★ **A guest's own delete is final, for the host too.** Deleting an upload to someone else's event sets
  `media.removed_by_uploader = true`: `listRecentlyDeletedMedia`'s own `removed_by_uploader = false` predicate keeps it
  out of the host's bin (RLS does NOT filter it, so dropping that line shows the host a Restore the RPC always
  refuses), and `restore_media` refuses it (every re-creation keeps that guard; `forensics/migration-guards.test.ts`
  pins it). Only the two delete-own RPCs and `disown_guest_rows_by_email` (the dashboard's "Not mine") set the marker;
  a host deleting their own event's upload leaves it `false`, restorable like the gallery's Remove.
- **Delete-own:** a signed-in uploader goes through `remove_my_upload(uuid)` (it re-checks ownership with
  `get_my_uploads`' predicates, then soft-removes, idempotently); a name-only guest through `POST /api/guests/remove`
  and the service-role `remove_my_upload_by_session`.

## Restoring

- ★ **`restore_media`, `restore_event` and `purge_media_now` are the only doors,** ownership-gated authenticated RPCs:
  a direct PATCH that un-removes media or un-deletes an event is refused by a BEFORE trigger, so every restore
  inherits their guards ([database-security.md](database-security.md)). Each returns `{ ok, reason, … }`: an expected
  refusal does not raise.
- ★ **Restore always fits:** what she deleted already counts in what she stores, so `restore_media`, `restore_event`
  and Let back in move nothing her cap holds and carry no capacity gate. The one exception is the over-capacity
  reduce's own removals: one comes back only while what she keeps by choice plus it fits the BASE cap
  (`insufficient_space` with `needed_bytes`), so an over-cap account cannot restore its way back over and wait out a
  fresh grace. Past its 30 days an item or event is no longer hers to restore (`not_found`), even before the night's
  purge, so what she can restore is exactly what she is counted for. `restore_event` re-checks the event slot and
  restores all or nothing; media removed on their own stay in the bin, and the RPC reports how many her Deleted still
  shows (`media_still_removed`) for the restore's toast, so what did not come back never reads as lost.
- ★ **A restore returns an item to the status it HELD,** not to `approved`, so a hidden or held item never comes back
  into guests' view: `media_derive_removal_provenance` stamps `status_before_removed` on every removal path, and
  `restore_media` answers that `status` for the bin's words (`restoredWords`).
- ★ **An operator's removal leaves the host's view entirely.** Both admin paths set `removed_by_admin` (a report's
  Remove also marks an item someone else had already removed, keeping its `removed_at`), and `media_host_all` hides
  the row from every host read (her album, her Deleted and its links, the bell's nudge, every count), so she never
  meets a Restore to fail and nothing tells a takedown from a guest's own delete. `restore_media` refuses it
  (`admin_removed`, a hold's discreet copy), `purge_media_now` refuses it, it counts in no storage figure and no room
  is ever made from it, and it purges on its own `purge_at` (the operator's Undo and the runbook's window,
  [trust-safety-forensics.md](trust-safety-forensics.md)).
- The product says "Deleted" everywhere (the app, its mails, help and marketing); the identifiers say "recently
  deleted" (`listRecentlyDeleted*`).

## Over the cap, lapsed passes, idle events

- **Over-capacity** (`sweeps/over-capacity.ts`) takes every account whose KEPT bytes, what she keeps by choice
  (everything stored less the reduce's own removals waiting in Deleted, `host_storage_summary`), pass its write line:
  a lapse, a change made in the Stripe dashboard, or growth between the storage guard's check and Stripe's confirm
  ([billing-caps.md](billing-caps.md)); a Free host is blocked before it can get there. Her own Deleted counts, so a
  move to Deleted clears no grace; the system's removals do not, so a reduced account never re-triggers while they
  wait out their window. Over, it sets `storage_grace_until` (`OVER_CAP_GRACE_DAYS`, 45) and emails; near the
  deadline, a reminder; past it, what she already deleted leaves for good first (`leave_deleted` without `p_system`,
  whatever her Make room from Deleted says, since the reduce is not an upload: nothing she kept is touched while her
  own Deleted covers the overage), then her largest files move to Deleted (`removed_by_system`, recoverable for the
  window unless an upload needs their room first), with an email saying which happened; back under, the grace clears.
  A reduce the deadline stops part way keeps its grace, sends no mail and is the next run's first account, and a due
  grace finishes to the real cap even inside the headroom, so no reduce is cleared half done.
- **Renewal:** an Event Pass holder is nudged ahead of expiry (`RENEWAL_NUDGE_DAYS`, shared with the bell), unless
  they turned Event Pass reminders off (`notification_prefs.notify_pass_renewal`, read through
  `resolveNotificationPrefs` before any send; a failed read stops the sweep rather than guess); its button opens
  `/account/renew`, which posts the Plan card's own renewal to the checkout route. `expired_passes` recomputes every
  holder from the ledger ([billing-caps.md](billing-caps.md)).
- **Free-tier inactivity** (Pro and Event Pass are exempt): an event idle for six months is warned about two weeks out,
  then soft-deleted into the recoverable window. The clock is the newest of `profiles.last_active_at`, the event's own
  dates and its newest media, so a used or still-collecting event never trips it; `touchHostActive` bumps
  `last_active_at` from the `(app)` layout (throttled), so any host use counts.
- **A system removal's email** (over-cap reduced, inactivity removed) names the concrete 30-day window and points to
  the in-app restore, never to a reply (host mail comes from a noreply sender). A host's own delete is never emailed;
  the bell covers it. The grace mails say the deadline's order: what is in Deleted first, then her largest files.

## Sending email

- **`sendOnce({ kind, dedupeKey, to, subject, html, text })` is the one send path** (`email/send.ts`). It claims a
  `sent_emails` row (unique on `(kind, dedupe_key)`) BEFORE sending, so the daily cron can call it every run and
  Resend is hit at most once per state, which keeps inside the free tier's 3,000 a month; while lifecycle mail is
  paused (the spend watch's switch), the mail a sweep re-sends is held before the claim and goes the first night after
  ([admin-observability.md](admin-observability.md) "The spend watch"). A failed send releases the claim and never
  double-sends, so a mail its sweep re-sends while the state lasts retries next run, but a one-time notice
  (`STATE_NOTICES`), sent after its sweep has moved the state, is lost. A failed claim or send records into the
  `email_delivery` signal (a Sentry event and one throttled `job_runs` row `/admin/jobs` reads) before it throws, so a
  refused address never looks like a healthy night.
- ★ **Every fallible call sits above the claim** (`assertResendEnv()`, `getResend()`): only a Resend send error
  releases the row, so a throw between the claim and the send burns that `(kind, dedupe_key)` for good, one
  permanently unsendable warning per host, fixable only by a manual DELETE.
- **Every mail is one shell** (`composeMail` in `email/templates.ts`, whose header gives each part its reason): the
  HTML and its plain-text twin render from the same parts, and `text` is required, since Resend would otherwise write
  its own from the table layout. No mail carries a postal address, which US CAN-SPAM asks only of marketing mail, so a
  marketing send would need one; the renewal nudge alone carries an unsubscribe, to its switch.
