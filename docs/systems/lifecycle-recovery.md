# Lifecycle cron, recovery & transactional email

> ROLE: the daily lifecycle job, the "Recently deleted" recovery model, and how lifecycle emails are sent once.
> BELONGS HERE: the purge cron's sweeps, the recovery window + standby budget, the restore/purge RPCs + bin UI, `sendOnce`/Resend + templates, over-cap/renewal/inactivity. · NOT HERE: the orphan-sweep circuit-breaker + backups (→ [durability-backups.md](durability-backups.md)), the cap model itself (→ [billing-caps.md](billing-caps.md)), R2 object internals (→ [uploads-and-r2.md](uploads-and-r2.md)).
> GROWS BY: integrate-in-place.

## The daily cron

[`/api/cron/purge`](../../src/app/api/cron/purge/route.ts) — daily (`0 4 * * *`), authorized by
timing-safe-comparing `Authorization` against `Bearer ${CRON_SECRET}` (Vercel Cron auto-injects the
bearer; `vercel.json` registers the schedule — you don't wire the header). `CRON_SECRET` is `.optional()`
in [`env.ts`](../../src/lib/env.ts); `assertCronEnv()` asserts it lazily at request time.

**11 sweeps, each independently try/caught:** `expired_events`, `removed_media`, `orphans`,
`expired_passes`, `over_capacity`, `renewal_nudges`, `inactive_free_events`, `standby_budget`,
`unlock_attempts`, `action_attempts`. (The `orphans` sweep is guarded by the circuit-breaker → [durability-backups.md](durability-backups.md).)
Isolation is per-SWEEP, not per-row: inside each sweep's per-account loop a single throw (a bad row, a
failed email) still aborts the rest of that sweep's accounts — QA #27, queued for the jobs round.

`purge_media_rows` does the atomic R2-then-row reclaim + the `storage_used_bytes` decrement — it is
**service-role-only** and must stay REVOKED from anon/authenticated (never in the advisor lists). R2 bulk
helpers in [`r2/delete.ts`](../../src/lib/r2/delete.ts): `deleteR2Objects()` chunks to ≤1000 keys per
`DeleteObjectsCommand` (the S3 cap) and treats deleting an absent key as success (re-run idempotent);
`listR2Objects()` paginates.

## The unified recovery window + standby budget

- **One 30-day window** = `RECENTLY_DELETED_WINDOW_DAYS`. Events stamp `purge_at = deleted_at + 30d` on
  soft-delete; **media's `purge_at` is TRIGGER-derived** (`set_media_purge_at` = `removed_at + 30d` across
  every removal path — un-spoofable, NO host grant; do not grant `update(purge_at)`).
- **`standby_budget`** caps total deleted-but-stored bytes per account to
  `RECENTLY_DELETED_BUDGET_MULTIPLIER × effective cap`, evicting oldest-first — the anti-abuse backstop
  (size is the bound, not the clock). `profiles.storage_grace_until` is service-role-write-only.
- **Delete-own from the Uploads tab** reuses this window via the authenticated SECURITY DEFINER
  `remove_my_upload(uuid)` RPC (re-checks the caller owns the row via the `get_my_uploads` host-arm/guest-arm
  predicates, then soft-removes; idempotent). ★ A guest's self-deletion of an upload they made to SOMEONE
  ELSE's event is marked **`media.removed_by_uploader=true` = PRIVATE to that host**: excluded from the
  host's bin by `listRecentlyDeletedMedia`'s own `removed_by_uploader = false` predicate (the RLS policy
  does NOT filter it, so dropping that line un-hides the rows — it was missing until 2026-09-02, and the
  bin offered a Restore the RPC always refused) AND refused by `restore_media` (the uploader's deletion
  wins; it still auto-purges + counts in that host's standby meter). A host deleting their OWN event's upload leaves
  it `false` (host-restorable, identical to the event-gallery Remove). The marker is write-locked — set only
  by the owner-context RPC, deliberately NOT in the `authenticated (status, removed_at)` grant.

## Invariants (don't break)

- ★ **Legal-hold media is excluded from EVERY hard-delete path (ADR-0020).** `media.legal_hold_at`
  set → the removed-media sweep, standby eviction, and `purgeMediaNow` filter it BEFORE their
  R2-first delete; an expired event containing ANY held media is skipped WHOLE (the FK cascade is
  all-or-nothing); `purge_media_rows`/`purge_media_now`/`restore_media` guard it at the SQL boundary.
  Full model + the runbook: [trust-safety-forensics.md](trust-safety-forensics.md).
- **`media.removed_at` is the purge grace clock — NEVER use `updated_at`.** The `set_updated_at` trigger
  bumps `updated_at` on every touch, so the 30-day grace must read the stable `removed_at` stamp.
- **The three counters are deliberately different — do NOT reconcile:** per-event slot counts non-removed;
  the monthly `storage_ledger` NEVER decrements (churn defense); `storage_used_bytes` is the PHYSICAL meter,
  drops only at hard-delete. The cap reads ACTIVE bytes via `host_active_bytes()`, so deleting frees cap
  room immediately. → [billing-caps.md](billing-caps.md).
- **`sendOnce` is the only send path.** Always `sendOnce({ kind, dedupeKey, to, subject, html })`
  ([`email/send.ts`](../../src/lib/email/send.ts)) — it CLAIMS a `sent_emails` row (unique `(kind,
  dedupe_key)`) BEFORE sending, so the daily cron can call it every run and Resend is hit AT MOST once per
  state (the 3,000/mo free-tier guard). On send failure it releases the claim (retries next run; never
  double-sends). Templates: [`email/templates.ts`](../../src/lib/email/templates.ts). Needs
  `RESEND_API_KEY` + `EMAIL_FROM` via lazy `assertResendEnv()`.

## The sweeps that nudge / enforce (decisions key off ACTIVE bytes)

- **Over-capacity** targets ONLY lapsed paid accounts (Free is upload-blocked before it can exceed cap),
  and keys off ACTIVE bytes (not `storage_used_bytes`, which only drops at hard-delete). over → set
  `storage_grace_until` (`OVER_CAP_GRACE_DAYS`=45) + email; near the deadline → reminder; past grace →
  auto-reduce (`selectForAutoReduce`, largest-first → the removed path reclaims after the window) + email;
  back under → clear grace.
- **Renewal** = a 14-day pre-expiry nudge for Event Pass; `RENEWAL_NUDGE_DAYS` is single-sourced in
  [`lifecycle/renewal.ts`](../../src/lib/lifecycle/renewal.ts) (shared with the notification bell).
  `expired_passes` downgrades lapsed passes to Free. → [billing-caps.md](billing-caps.md).
- **Free-tier inactivity removal** (`sweepInactiveFreeEvents`): free-account events with no activity for 6
  months get warned (~14 d out) then soft-deleted into the existing recoverable tail (reuses
  `softDeleteEvent`'s `deleted_at`/`purge_at`). The freshness clock is `max(profiles.last_active_at,
  event.created_at/updated_at, newest media.created_at)` so a recently-used or still-collecting event never
  trips it; the pure, unit-tested decision is `inactivityAction`
  ([`lifecycle/inactivity.ts`](../../src/lib/lifecycle/inactivity.ts), `INACTIVE_DAYS`=180 /
  `WARN_BEFORE_DAYS`=14). `profiles.last_active_at` is bumped (throttled ~12 h, best-effort, service-role)
  by `touchHostActive` in an `after()` callback in the `(app)` layout — so sign-in or ANY host use counts.
  Pro/Event-Pass events are exempt (free-tier only).
- **SYSTEM-removal emails** (over-cap reduced, inactivity removed) state the concrete 30-day window + point
  to the in-app self-serve Recently-deleted restore (NOT "reply to this email"); voluntary deletes are
  never emailed (the bell nudge covers them in-app → [notifications-analytics-growth.md](notifications-analytics-growth.md)).

## Host-facing recovery (the "Trash" tab)

> User-facing label is **"Trash"** (Phase 4 rename); the model + the internal identifiers
> (`recently-deleted.ts`, `listRecentlyDeleted*`, the `value="deleted"` tab key) keep the "recently deleted" name.

- **RPCs** (`restore_media` / `restore_event` / `purge_media_now`): authenticated, ownership-gated SECURITY
  DEFINER (0029-only; explicit `revoke … from anon`). Restore is **capacity-gated against the BASE cap** (no
  +10% buffer; refuse `insufficient_space` + `needed_bytes`); `restore_event` also re-checks the event slot
  (`event_limit`) and is all-or-nothing (clearing `deleted_at` re-actives the whole non-removed set;
  independently-removed media stay binned → `media_still_removed`). `purge_media_now` (skip the 30-day wait)
  deletes R2-FIRST in the wrapper, then the RPC calls the service-role `purge_media_rows`. All RETURN jsonb
  `{ok,reason,…}` (expected refusals don't raise → the wrapper maps `data.reason`). Wrappers in
  [`db/mutations/media.ts`](../../src/lib/db/mutations/media.ts); actions in `dashboard/[eventId]/actions.ts`.
- ★ **The RPCs are the ONLY door** (QA #7/#10, `20260729180000`) — a direct PATCH that un-removes media or
  un-deletes an event is refused by a BEFORE trigger, so every restore inherits the guards above rather
  than the grant. → [database-security.md](database-security.md).
- ★ **Restore returns an item to the status it HELD, not to `approved`** (QA #24). `media.status_before_removed`
  is stamped on every removal path by the `media_derive_removal_provenance` trigger, and both the host RPC
  and the operator restore land on it: a HIDDEN item comes back hidden, a PENDING item comes back pending.
  Pre-Q3 rows carry no stamp → `approved`, the historical behavior. **And an operator takedown is not
  host-reversible** (QA #8): `media.removed_by_admin` is set by both admin paths (`removalUpdate()`), and
  `restore_media` refuses it with reason `admin_removed`, mapped to the same discreet copy as `legal_hold`.
- **UI:** two host bins on one model — a dashboard **tab of soft-deleted EVENTS** (reused `EventCard` with
  `href=null` since a deleted event's detail page 404s + a "Deletes in N days" chip + a `RestoreEventButton`)
  and a per-event **section of removed MEDIA** (`RecentlyDeletedGrid`). RLS reads
  (`listRecentlyDeletedEvents`/`listRecentlyDeletedMedia`, windowed to 30d; the countdown is computed in the
  QUERY so the RSC stays render-pure). The dashboard storage meter reads ACTIVE bytes
  (`getHostStorageSummary`, [`db/queries/storage.ts`](../../src/lib/db/queries/storage.ts)) + a "+X in
  Trash (frees automatically)" line + an over-standby-budget note. The lightbox hides Save when an
  item has no `downloadUrl` (no download from the bin).

## See also

[durability-backups.md](durability-backups.md) (the orphan sweep's safety + backups) · [billing-caps.md](billing-caps.md) (caps, passes) · [uploads-and-r2.md](uploads-and-r2.md) (R2 reclaim helpers) · [ADR-0013](../adr/0013-media-durability-orphan-sweep-safety-and-backup.md).
