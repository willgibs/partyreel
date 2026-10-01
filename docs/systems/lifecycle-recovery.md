# Lifecycle, recovery & email

Open this before you:
- add or change a sweep in the daily purge cron;
- touch deleting or restoring: the 30-day window, the standby budget, the Deleted filters;
- change what happens when a host goes over the cap, a pass lapses or a Free event goes idle;
- send an email.

Elsewhere: the orphan sweep's breaker and the backups ([durability-backups.md](durability-backups.md)), the cap model and the three counters
([billing-caps.md](billing-caps.md)), how a sweep reports its health ([admin-observability.md](admin-observability.md) "Backend jobs"), legal holds
([trust-safety-forensics.md](trust-safety-forensics.md)).

## The daily purge cron

`/api/cron/purge` (registered in `vercel.json`, authorized by `CRON_SECRET`, run on the app surface only:
[admin-observability.md](admin-observability.md)) runs every sweep, each independently try/caught, so one failing never stops the rest. The
bodies live in `lib/lifecycle/sweeps/` and `account-deletion.ts`, each tested on the clamping PostgREST fake.

- ★ **Every sweep is whole and budgeted.** The run is one invocation (`maxDuration` 60), so every sweep works in keyset
  batches (`readAllPages`, id lists through `inChunks`) and checks a deadline before each batch, never mid-batch. The
  sweeps share one window as they start, each taking an equal share of what is left (`sweep-budget.ts`), so a
  backlog in one never starves the rest nor runs the invocation into Vercel's kill. A sweep the deadline stops
  returns `stopped_early` with a counted `remaining` where it can take one, and its run reads "Needs a look".
- **A sweep that deletes drains:** the next run starts at what is left. `expired_events` reclaims each batch's media
  before its event rows go (a batch the deadline interrupts keeps its event rows); `removed_media` goes oldest
  `purge_at` first; `deleted_accounts` leaves an account caught mid-purge with its events and auth user; and
  `standby_budget`.
- **A sweep that examines rotates:** `expired_passes`, `over_capacity`, `renewal_nudges` and
  `inactive_free_events` (accounts) and `album_log` (albums) store `resume_after` on their run row when the deadline
  stops them, and the next run starts after it, so a list longer than a night still has every candidate examined in
  turn (an unreadable cursor starts over, with a warning). `orphans` does neither: at most 20 R2 pages from the top
  each night, saying so when it stops.
- **A sweep that loops over accounts and emails someone or deletes bytes is a job of its own** (its own run row,
  switch and card, through `createSweepRunner`), and its per-account body runs under `forEachIsolated`, so one bad
  row never costs the rest ([admin-observability.md](admin-observability.md)). So is `album_log`, though it deletes
  rows only: it writes in the album's live core.
- ★ **`album_log` prunes the paged album's change log under a watermark** (`album_prune_tombstones`, 20261001150000):
  a purged item's change row (its tombstone) goes, and the album's watermark rises to its versions in the same
  transaction, so a client below the watermark is sent its album whole ([guest-flow.md](guest-flow.md)). It walks
  the log album by album (each call the albums the next 5,000 rows touch, whole), last of the budgeted sweeps, after
  every sweep that purges.
- **Reclaiming is R2 first, then rows.** Every caller deletes the objects through `reclaimMedia`, which hands
  `purge_media_rows` (service role only; it never deletes a held row and decrements `storage_used_bytes` atomically) at
  most `MAX_ROWS` ids a call, one call at a time: its one row per host can never outgrow its input, so the freed
  bytes are never clipped, and concurrent calls could deadlock on the hosts' profile rows.
- ★ **Held media is excluded from every hard-delete path;** the rule and how each sweep keeps it are in
  [trust-safety-forensics.md](trust-safety-forensics.md).

## The 30-day window and the standby budget

- **One 30-day window** (`RECENTLY_DELETED_WINDOW_DAYS`). `purge_at` is trigger-derived on both tables
  (`deleted_at` + 30 days, `removed_at` + 30 days) across every removal path, so it cannot be spoofed and no host
  holds a grant on it. The grace clock is `media.removed_at`, never `updated_at`, which every touch bumps.
- **The standby budget caps what a host keeps in Deleted:** at most the effective cap in deleted-but-stored bytes,
  evicted oldest-first, so size is the anti-abuse bound, not the clock. A move to a smaller cap shrinks Deleted too
  and purges its oldest items early; the plan sheet says so before such a switch. The sweep finds its hosts through
  `standby_hosts()`, whose bytes are exactly the bin: the host's removals less the system's, a guest's own
  withdrawal and an operator's removal, plus a soft-deleted event's live media, never a held row. It reads the bin's
  two halves by index, never media whole: the removed rows through `media_removed_idx` (`where status =
  'removed'`, keyed in the `removed_media` sweep's own `(purge_at, id)` order, which that sweep reads too), and each
  deleted event's live media by event id (20261001151000). Only a host over
  budget has its bin read, and read whole, so eviction is oldest-first across all of it. The meter's Deleted figure
  (`host_storage_summary`) is exactly what her two Deleted lists show, inside the window: system removals and a held
  row count while they are listed and never after, since a figure outliving its list would tell her a hold exists.
- ★ **A guest's own delete is final, for the host too.** Deleting an upload to someone else's event sets
  `media.removed_by_uploader = true`: `listRecentlyDeletedMedia`'s own `removed_by_uploader = false` predicate keeps it
  out of the host's bin (RLS does NOT filter it, so dropping that line shows the host a Restore the RPC always
  refuses), `restore_media` refuses it (every re-creation keeps that guard; `forensics/migration-guards.test.ts` pins
  it), it counts in neither storage figure nor the standby budget, and it purges on its own window. Only the two
  delete-own RPCs and `disown_guest_rows_by_email` (the dashboard's "Not mine") set the marker; a host deleting their
  own event's upload leaves it `false`, restorable like the gallery's Remove.
- **Delete-own:** a signed-in uploader goes through `remove_my_upload(uuid)` (it re-checks ownership with
  `get_my_uploads`' predicates, then soft-removes, idempotently); a name-only guest through `POST /api/guests/remove`
  and the service-role `remove_my_upload_by_session`.

## Restoring

- ★ **`restore_media`, `restore_event` and `purge_media_now` are the only doors,** ownership-gated authenticated RPCs:
  a direct PATCH that un-removes media or un-deletes an event is refused by a BEFORE trigger, so every restore
  inherits their guards ([database-security.md](database-security.md)). Each returns `{ ok, reason, … }` (an expected refusal does not raise).
- **A restore is capacity-gated against the BASE cap,** never the 10% headroom (`insufficient_space` with
  `needed_bytes`), so the size list's Undo (one `restore_media` per item) can put back only part of a removal on a
  full plan; the rest stays in Deleted and the toast says so. `restore_event` re-checks the event slot and restores all or nothing; media removed on their own
  stay in the bin, and the RPC reports how many her Deleted still shows (`media_still_removed`), which the restore's
  toast says ("are still in its album's Deleted"), so what did not come back never reads as lost. `purge_media_now`
  deletes the R2 objects first in its wrapper, then the rows.
- ★ **A restore returns an item to the status it HELD,** not to `approved`: `media_derive_removal_provenance` stamps
  `status_before_removed` on every removal path, so a hidden item comes back hidden and a pending one pending.
  `restore_media` answers that `status`, and the bin's toast says it (`restoredWords`), never "back in the album"
  for an item that came back hidden.
- ★ **An operator's removal leaves the host's view entirely** (Will, admin-triage r1: "fully purged from the event, not
  moved to deleted"). Both admin paths set `removed_by_admin` (a report's Remove also marks an item someone else had
  already removed, keeping its `removed_at`), and `media_host_all` hides the row from every host read (her album, her
  Deleted and its links, the bell's nudge, every count), so she never meets a Restore to fail and nothing tells a
  takedown from a guest's own delete. `restore_media` refuses it (`admin_removed`, a hold's discreet copy),
  `purge_media_now` refuses it, it counts in neither storage figure nor the standby budget, and it purges on its own
  `purge_at` (the operator's Undo and the runbook's window, [trust-safety-forensics.md](trust-safety-forensics.md)).
- The product's filters say "Deleted" (the dashboard's events list and the album's View menu), the delete
  confirmation and the marketing say "Trash", and the identifiers say "recently deleted" (`listRecentlyDeleted*`).

## Over the cap, lapsed passes, idle events

- **Over-capacity** takes every account whose ACTIVE bytes (`host_storage_summary`) exceed its current effective cap:
  a lapse, a change made in the Stripe dashboard, or growth between the storage guard's check and Stripe's confirm
  ([billing-caps.md](billing-caps.md)); a Free host is blocked before it can get there. Over, it sets `storage_grace_until`
  (`OVER_CAP_GRACE_DAYS`, 45) and emails; near the deadline, a reminder; past it, the host's active set is reduced
  largest-first (marked `removed_by_system`, recoverable for the window) with an email; back under, the grace clears.
  The reduce reads the set largest first a page at a time under the sweep's deadline (`reduceToCap`), stopping once
  what is left fits; one the deadline stops part way keeps its grace and sends no mail, counts as left, and is the
  next run's first account.
  ★ Its candidates are every profile past the SMALLEST cap any plan grants, read from `tiers.ts` (Free's 100 MB),
  never a typed floor: a literal left at an old Free cap skips every lapsed host storing between the two, for good.
- **Renewal:** an Event Pass holder is nudged 14 days before expiry (`RENEWAL_NUDGE_DAYS`, shared with the bell),
  unless they turned Event Pass reminders off (`notification_prefs.notify_pass_renewal`, read through
  `resolveNotificationPrefs` before any send; a failed read stops the sweep rather than guess); its button opens
  `/account/renew`, which posts the Plan card's own renewal to the checkout route. `expired_passes` recomputes every
  holder from the ledger ([billing-caps.md](billing-caps.md)).
- **Free-tier inactivity** (Pro and Event Pass are exempt): an event idle for six months is warned about two weeks out,
  then soft-deleted into the recoverable window. The clock is the newest of `profiles.last_active_at`, the event's own
  dates and its newest media, so a used or still-collecting event never trips it; `touchHostActive` bumps
  `last_active_at` from the `(app)` layout (throttled to 12 hours), so any host use counts.
- **A system removal's email** (over-cap reduced, inactivity removed) names the concrete 30-day window and points to
  the in-app restore, never "reply to this email". A host's own delete is never emailed; the bell covers it.

## Sending email

- **`sendOnce({ kind, dedupeKey, to, subject, html, text })` is the one send path.** It claims a `sent_emails` row
  (unique on `(kind, dedupe_key)`) BEFORE sending, so the daily cron can call it every run and Resend is hit at most
  once per state, which keeps inside the free tier's 3,000 a month; a failed send releases the claim, so it retries
  next run and never double-sends.
- **Every mail is one shell** (`composeMail` in `email/templates.ts`): the HTML and its plain-text twin render from the
  same parts, and `text` is required, since Resend would otherwise write its own from the table layout. The shell
  declares light only on a white card, heads it with the wordmark as a hosted PNG on its own white plate (a forced
  invert never touches an image; `scripts/build-email-wordmark.mjs` rebuilds it, and a new mark ships as a new file),
  and ends on a divider and one line: a host mail's "You're receiving this because...", an operator alert's own. No
  mail carries a postal address (all ten are account or service mail); the renewal nudge alone carries an
  unsubscribe, to its switch. Every operator subject starts `[Partyreel]`.
- ★ **Every fallible call sits above the claim** (`assertResendEnv()`, `getResend()`): only a Resend send error
  releases the row, so a throw between the claim and the send burns that `(kind, dedupe_key)` for good, one
  permanently unsendable warning per host, fixable only by a manual DELETE.
- ★ **A failed send is never silent:** both failure branches record into the `email_delivery` signal (a Sentry event
  and one throttled `job_runs` row that `/admin/jobs` reads), and the send still throws after releasing its claim.
  Without it a refused address would retry every night looking exactly like a healthy night.
