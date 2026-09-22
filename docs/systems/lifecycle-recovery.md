# Lifecycle cron, recovery & transactional email

> ROLE: the daily lifecycle job, the "Recently deleted" recovery model, and how lifecycle emails are sent once.
> BELONGS HERE: the purge cron's sweeps, the recovery window + standby budget, the restore/purge RPCs + bin UI, `sendOnce`/Resend + templates, over-cap/renewal/inactivity. · NOT HERE: the orphan-sweep circuit-breaker + backups (→ [durability-backups.md](durability-backups.md)), the cap model itself (→ [billing-caps.md](billing-caps.md)), R2 object internals (→ [uploads-and-r2.md](uploads-and-r2.md)).
> GROWS BY: integrate-in-place.

## The daily cron

[`/api/cron/purge`](../../src/app/api/cron/purge/route.ts) runs daily (`0 4 * * *`, registered in
`vercel.json`; Vercel Cron injects the bearer), authorized by a timing-safe compare of `Authorization`
against `Bearer ${CRON_SECRET}`. `CRON_SECRET` is `.optional()` in [`env.ts`](../../src/lib/env.ts) and
`assertCronEnv()` asserts it lazily, failing closed. It runs on the app surface only (→ [architecture.md](architecture.md)).

**12 sweeps, each independently try/caught:** `expired_events`, `removed_media`, `deleted_accounts`,
`orphans`, `expired_passes`, `over_capacity`, `renewal_nudges`, `inactive_free_events`,
`standby_budget`, `unlock_attempts`, `action_attempts`, and last `job_health` (the platform freshness
scan, → [admin-observability.md](admin-observability.md)). The `orphans` sweep is guarded by the
circuit-breaker (→ [durability-backups.md](durability-backups.md)).

**FOUR of them are jobs of their own** (`orphans`, `deleted_accounts`, `inactive_free_events`,
`over_capacity`, the ones that loop over ACCOUNTS and email somebody or delete bytes): each opens its own
`job_runs` row inside the parent invocation, with its own `ops_flags` switch and card, through
`createSweepRunner` ([`jobs/purge-sweeps.ts`](../../src/lib/jobs/purge-sweeps.ts)), which the route's
`runSweep` delegates to. So one sweep pauses, or fails for a week, visibly and without touching the
others. → [admin-observability.md](admin-observability.md).

★ **Isolation is per-ROW inside those loops.** `forEachIsolated`
([`jobs/isolate.ts`](../../src/lib/jobs/isolate.ts)) wraps the per-account bodies of `over_capacity`,
`inactive_free_events`, `renewal_nudges` and `deleted_accounts`, so one bounced address never costs
every account behind it. It never buys silence: the tally travels with the sweep's result, any
`rows_failed` closes that sub-sweep's run as an ERROR, and five consecutive failures abort the loop (a
dead dependency, not a bad row).

`purge_media_rows` deletes the rows (never a held one) and decrements `storage_used_bytes` atomically;
every caller deletes the R2 objects FIRST. It is **service-role-only** and stays REVOKED from
anon/authenticated. [`r2/delete.ts`](../../src/lib/r2/delete.ts):
`deleteR2Objects()` chunks to ≤1000 keys per `DeleteObjectsCommand` (the S3 cap) and treats an absent key
as deleted (re-runs are idempotent); `listR2Objects()` paginates.

## The unified recovery window + standby budget

- **One 30-day window** = `RECENTLY_DELETED_WINDOW_DAYS`. **`purge_at` is TRIGGER-derived on both
  tables**: `set_event_purge_at` = `deleted_at + 30d`, `set_media_purge_at` = `removed_at + 30d` across
  every removal path. Un-spoofable, NO host grant on either; never grant `update(purge_at)`.
- **`standby_budget`** caps total deleted-but-stored bytes per account to
  `RECENTLY_DELETED_BUDGET_MULTIPLIER × effective cap` (the multiplier is 1), evicting oldest-first: the
  anti-abuse backstop (size is the bound, not the clock). `profiles.storage_grace_until` is
  service-role-write-only.
- **Delete-own** reuses this window: a signed-in uploader through the authenticated SECURITY DEFINER
  `remove_my_upload(uuid)` RPC ("Your uploads" on their own `/u/[slug]`, and the guest album's delete;
  re-checks ownership via the `get_my_uploads` host-arm/guest-arm predicates, then soft-removes;
  idempotent), a name-only guest through `POST /api/guests/remove` → the service-role
  `remove_my_upload_by_session`. ★ A guest's self-deletion of an upload to SOMEONE ELSE's event is marked
  **`media.removed_by_uploader=true` = PRIVATE to that host**: excluded from the host's bin by
  `listRecentlyDeletedMedia`'s own `removed_by_uploader = false` predicate (RLS does NOT filter it, so
  dropping that line shows the host a Restore the RPC always refuses) AND refused by `restore_media` (the
  uploader's deletion wins; it still auto-purges and counts in that host's standby meter). A host deleting
  their OWN event's upload leaves it `false` (host-restorable, like the gallery's Remove). The marker is
  write-locked: set only by those two delete-own RPCs and by `disown_guest_rows_by_email` (the dashboard's
  "Not mine"), never in the `authenticated (status, removed_at)` grant.

## Invariants (don't break)

- ★ **Legal-hold media is excluded from EVERY hard-delete path.** `media.legal_hold_at`
  set → the removed-media sweep, standby eviction, and `purgeMediaNow` filter it BEFORE their
  R2-first delete; an expired event containing ANY held media is skipped WHOLE (the FK cascade is
  all-or-nothing); `purge_media_rows`/`purge_media_now`/`restore_media` guard it at the SQL boundary.
  Full model + the runbook: [trust-safety-forensics.md](trust-safety-forensics.md).
- **`media.removed_at` is the purge grace clock; NEVER use `updated_at`.** The `set_updated_at` trigger
  bumps `updated_at` on every touch, so the 30-day grace must read the stable `removed_at` stamp.
- **The three counters are deliberately different; do NOT reconcile them:** the per-event slot counts
  non-removed; the monthly `storage_ledger` NEVER decrements (churn defense); `storage_used_bytes` is the
  PHYSICAL meter and drops only at hard-delete. The cap reads ACTIVE bytes via `host_active_bytes()`, so
  deleting frees cap room immediately. → [billing-caps.md](billing-caps.md).
- **`sendOnce` is the only send path.** Always `sendOnce({ kind, dedupeKey, to, subject, html })`
  ([`email/send.ts`](../../src/lib/email/send.ts)): it CLAIMS a `sent_emails` row (unique `(kind,
  dedupe_key)`) BEFORE sending, so the daily cron can call it every run and Resend is hit AT MOST once per
  state (the 3,000/mo free-tier guard). On send failure it releases the claim (retries next run; never
  double-sends). Templates: [`email/templates.ts`](../../src/lib/email/templates.ts). Needs
  `RESEND_API_KEY` + `EMAIL_FROM` via lazy `assertResendEnv()`.
- ★ **Every fallible call sits ABOVE the claim**: `assertResendEnv()` and `getResend()` both. ONLY a
  Resend `sendError` releases the row, so anything that throws between the claim and the send burns
  that `(kind, dedupe_key)` forever: one over-cap warning per host, permanently un-sendable, fixable
  only by a manual DELETE. The window holds exactly one fallible call, the send itself.
- ★ **A failed send is never silent.** Both failure branches record into the `email_delivery` signal
  (a Sentry event plus one throttled `job_runs` error row), which `/admin/jobs` reads as "N sent, N
  failed or refused in the last 24 hours", and the send still throws after releasing its claim. Without
  the signal a refused address retries every night looking exactly like a healthy night.
  → [admin-observability.md](admin-observability.md).

## The sweeps that nudge / enforce (decisions key off ACTIVE bytes)

- **Over-capacity** targets ONLY lapsed paid accounts (Free is upload-blocked before it can exceed cap),
  and keys off ACTIVE bytes (not `storage_used_bytes`, which only drops at hard-delete). Over → set
  `storage_grace_until` (`OVER_CAP_GRACE_DAYS`=45) + email; near the deadline → reminder; past grace →
  auto-reduce (`selectForAutoReduce`, largest-first → the removed path reclaims after the window) + email;
  back under → clear grace.
- **Renewal** = a 14-day pre-expiry nudge for Event Pass; `RENEWAL_NUDGE_DAYS` is single-sourced in
  [`lifecycle/renewal.ts`](../../src/lib/lifecycle/renewal.ts) (shared with the notification bell).
  `expired_passes` downgrades lapsed passes to Free. → [billing-caps.md](billing-caps.md).
- **Free-tier inactivity removal** (`sweepInactiveFreeEvents`; Pro and Event Pass are exempt): an event
  with no activity for 6 months is warned ~14 d out, then soft-deleted into the recoverable tail (the admin
  client stamps `deleted_at`, the column `softDeleteEvent` writes; the trigger derives `purge_at`). The freshness clock is `max(profiles.last_active_at, event.created_at/updated_at,
  newest media.created_at)`, so a used or still-collecting event never trips it; the pure decision is
  `inactivityAction` ([`lifecycle/inactivity.ts`](../../src/lib/lifecycle/inactivity.ts), `INACTIVE_DAYS`=180,
  `WARN_BEFORE_DAYS`=14). `touchHostActive` bumps `profiles.last_active_at` (throttled to 12 h, best-effort,
  service-role) in an `after()` callback in the `(app)` layout, so ANY host use counts.
- **SYSTEM-removal emails** (over-cap reduced, inactivity removed) state the concrete 30-day window and point
  to the in-app self-serve restore (NOT "reply to this email"); voluntary deletes are never emailed (the bell
  nudge covers them in-app → [notifications-analytics-growth.md](notifications-analytics-growth.md)).

## Host-facing recovery (the "Trash" tab)

> The product's filters say **"Deleted"** (on the dashboard's events list and in the album's View menu;
> never a tab), while the delete confirmation and the marketing copy still say "Trash"; the model's
> identifiers (`recently-deleted.ts`, `listRecentlyDeleted*`) say "recently deleted".

- **RPCs** (`restore_media` / `restore_event` / `purge_media_now`): authenticated, ownership-gated SECURITY
  DEFINER (0029-only; explicit `revoke … from anon`). Restore is **capacity-gated against the BASE cap** (no
  +10% buffer; refuses `insufficient_space` + `needed_bytes`); `restore_event` also re-checks the event slot
  (`event_limit`) and is all-or-nothing (clearing `deleted_at` re-activates the whole non-removed set;
  independently-removed media stay binned → `media_still_removed`). `purge_media_now` (skip the 30-day wait)
  deletes R2-FIRST in the wrapper, then the RPC calls the service-role `purge_media_rows`. All RETURN jsonb
  `{ok,reason,…}` (expected refusals don't raise; the wrapper maps `data.reason`). Wrappers in
  [`db/mutations/media.ts`](../../src/lib/db/mutations/media.ts); actions in `dashboard/[eventId]/actions.ts`.
- ★ **The RPCs are the ONLY door.** A direct PATCH that un-removes media or un-deletes an event is refused
  by a BEFORE trigger, so every restore inherits the guards above rather than the grant.
  → [database-security.md](database-security.md).
- ★ **Restore returns an item to the status it HELD, not to `approved`.** `media.status_before_removed`
  is stamped on every removal path by the `media_derive_removal_provenance` trigger, and both the host RPC
  and the operator restore land on it: a HIDDEN item comes back hidden, a PENDING item comes back pending
  (a row with no stamp restores to `approved`). **And an operator takedown is not host-reversible:**
  `media.removed_by_admin` is set by both admin paths (`removalUpdate()`), and `restore_media` refuses it
  with reason `admin_removed`, mapped to the same discreet copy as `legal_hold`.
- **UI:** two bins on one model. Soft-deleted EVENTS are rows of kind `deleted` in the dashboard's events
  list, shown only under its Deleted filter ([`dashboard/events-view.ts`](../../src/lib/dashboard/events-view.ts)):
  an `EventCard` with `href=null` (a deleted event's page 404s), a "Deletes in N days" countdown and a
  `RestoreEventButton`. Removed MEDIA are the event album's Deleted filter (`RecentlyDeletedGrid`). Both
  read through RLS (`listRecentlyDeletedEvents`/`listRecentlyDeletedMedia`, windowed to 30d; the countdown
  is computed in the QUERY so the RSC stays render-pure). The storage meter reads ACTIVE bytes
  (`getHostStorageSummary`, [`db/queries/storage.ts`](../../src/lib/db/queries/storage.ts)) plus a
  "+ X in Deleted (frees automatically)" line and an over-budget note. The lightbox hides Save when an
  item has no `downloadUrl` (no download from the bin).

## See also

[durability-backups.md](durability-backups.md) (the orphan sweep's safety + backups) · [billing-caps.md](billing-caps.md) (caps, passes) · [uploads-and-r2.md](uploads-and-r2.md) (R2 reclaim helpers).
