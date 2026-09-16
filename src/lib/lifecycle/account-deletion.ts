/**
 * Account deletion: the anonymisation shape, and the sweep that finishes the job.
 *
 * THE TWO HALVES (Will's rulings, 2026-09-02: immediate, no undo, an active plan
 * auto-cancelled at the request):
 *
 *   1. THE REQUEST (src/lib/db/mutations/account.ts, driven by the /account card
 *      and the /admin/accounts/[id] operator trigger) cancels the subscription,
 *      stamps `profiles.deletion_requested_at`, soft-deletes every hosted event
 *      into the existing 30-day bin, removes the address from the newsletter,
 *      anonymises the profile, and bans the auth user from signing in. All of it
 *      is immediate and none of it is reversible.
 *
 *   2. THE SWEEP (here, called once from the daily purge cron) hard-deletes what
 *      the request only marked: R2 objects FIRST, then the media rows through
 *      `purge_media_rows`, then the event rows, and finally the auth.users row
 *      once the account has ZERO events left.
 *
 * ★ THE AUTH USER GOES LAST, AND ONLY AT ZERO EVENTS. Deleting auth.users
 * cascades profiles -> events -> media (every FK on that chain is ON DELETE
 * CASCADE), which would destroy the original_key / preview_key rows the R2
 * delete still needs and leave objects nobody can ever reclaim. The zero-events
 * recount before that delete uses `mustCount` on purpose: a FAILED count reads
 * as a confident zero, and a confident zero here is the one bug that silently
 * orphans a whole account's media.
 *
 * ★ A FORENSIC HOLD OUTRANKS THE DELETION REQUEST (trust-safety-forensics.md). An event holding
 * ANY held media is skipped WHOLE (the cascade is all-or-nothing), so a held
 * account never reaches zero events and its auth user survives. It stays
 * anonymised the entire time, which is the ruled behaviour: anonymised at once,
 * deleted when the hold lifts. The account is not told, and the hold columns are
 * not readable by it (database-security.md's column-scoped SELECT).
 *
 * Server-only: R2 + the service-role client. The pure parts are pinned by
 * account-deletion.test.ts, which reads this file as text because a runtime test
 * of a service-role sweep would need a live database.
 */
import "server-only";

import { mustCount, mustQuery } from "@/lib/db/must-query";
import { partitionEventsByHold } from "@/lib/forensics/legal-hold";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import { deleteR2Objects } from "@/lib/r2/delete";
import { reelOutputKey } from "@/lib/r2/keys";
import { createAdminClient } from "@/lib/supabase/admin";
import { removeAvatar } from "@/lib/supabase/avatar-storage";

type AdminClient = ReturnType<typeof createAdminClient>;

type MediaKeyRow = {
  id: string;
  original_key: string;
  preview_key: string | null;
};

/**
 * The columns the anonymisation clears, as one patch so the request path and the
 * sweep's re-assert can never drift apart.
 *
 * ★ NOTHING ENTITLEMENT-SHAPED IS IN HERE. `tier`, `storage_cap_bytes`,
 * `storage_used_bytes`, `stripe_customer_id`, `stripe_subscription_id`,
 * `event_slots`, `tier_expires_at` and `is_admin` are the Stripe webhook's / the
 * service layer's to write (billing-caps.md: the webhook is the SOLE writer).
 * The cancellation makes Stripe deliver `customer.subscription.deleted` and the
 * webhook downgrades the row through its own idempotent path; writing any of
 * them here would race that and break the invariant. The row is deleted whole a
 * few hours later anyway, so there is nothing to gain by touching them.
 *
 * What IS cleared is every piece of the account that a stranger could still see
 * or search: the email (also the recipient of every transactional email, so
 * nulling it silences the lifecycle sweeps by their own `if (p.email)` guards),
 * the public display name, the /u/ handle (freed for reuse the moment it is
 * nulled), and the avatar marker. The avatar OBJECT is removed separately and
 * FIRST, matching the object-then-marker ordering avatar-storage.ts documents.
 */
export const ANONYMISED_PROFILE_PATCH = {
  email: null,
  display_name: null,
  slug: null,
  avatar_updated_at: null,
} as const;

/**
 * PostgREST codes that mean "the deletion column is not in the live database
 * yet" (the orchestrator applies 20260902130000 at integration). Modelled on
 * queries/social.ts' runtime seam: a missing schema degrades to a clean refusal
 * or a skipped sweep, never a half-finished deletion, while real errors still
 * throw. Reads `.code` off either a raw PostgrestError or the QueryFailedError
 * mustQuery wraps it in.
 */
const MISSING_SCHEMA_CODES = new Set([
  "42703",
  "42P01",
  "PGRST202",
  "PGRST204",
  "PGRST205",
]);

export function isDeletionSchemaMissing(error: unknown): boolean {
  const code = (error as { code?: string | null } | null)?.code ?? "";
  return MISSING_SCHEMA_CODES.has(code);
}

/**
 * One invocation's candidate bound. Deletion is not urgent to the minute and the
 * cron is daily, so a backlog drains over consecutive runs rather than pushing
 * one invocation past its 60s budget.
 */
const ACCOUNT_SWEEP_LIMIT = 100;

/** PostgREST caps a response at max_rows; page to exhaustion or lose media keys. */
const MEDIA_PAGE = 1000;

export type AccountDeletionSweepResult = {
  /** Stamped accounts examined this run. */
  accounts: number;
  /** auth.users rows removed (the account is fully gone). */
  accounts_deleted: number;
  /** Accounts left standing because a forensic hold still blocks an event. */
  accounts_held: number;
  events: number;
  hold_blocked_events: number;
  media_rows: number;
  r2_deleted: number;
  r2_errored: number;
  freed_bytes: number;
  /** Present only before migration 20260902130000 is applied. */
  skipped?: "not_provisioned";
};

export type AccountPurgeResult = {
  /** "deleted" once the auth.users row is gone; "held" while anything blocks it. */
  outcome: "deleted" | "held";
  events: number;
  hold_blocked_events: number;
  media_rows: number;
  r2_deleted: number;
  r2_errored: number;
  freed_bytes: number;
};

function emptyResult(): AccountDeletionSweepResult {
  return {
    accounts: 0,
    accounts_deleted: 0,
    accounts_held: 0,
    events: 0,
    hold_blocked_events: 0,
    media_rows: 0,
    r2_deleted: 0,
    r2_errored: 0,
    freed_bytes: 0,
  };
}

function keysOf(rows: MediaKeyRow[]): string[] {
  const keys: string[] = [];
  for (const r of rows) {
    keys.push(r.original_key);
    if (r.preview_key) keys.push(r.preview_key);
  }
  return keys;
}

/**
 * Re-assert the anonymisation. The request path already ran it; this exists
 * because a held account can sit here for months, and because a crash between
 * the request's steps must not leave a name, an address or a claimed handle on
 * a profile whose owner asked to be gone. Idempotent by construction (it writes
 * the same nulls every time).
 *
 * The avatar OBJECT goes first, then the marker, so a throw leaves the marker
 * set and the next run re-deletes rather than stranding a public object behind
 * a cleared pointer.
 */
async function reanonymise(admin: AdminClient, userId: string): Promise<void> {
  await removeAvatar(userId);
  const { error } = await admin
    .from("profiles")
    .update(ANONYMISED_PROFILE_PATCH)
    .eq("id", userId);
  if (error) throw new Error(`re-anonymise ${userId}: ${error.message}`);
}

/** The atomic R2-then-row reclaim + storage_used_bytes decrement (service-role-only). */
async function purgeRows(
  admin: AdminClient,
  mediaIds: string[],
): Promise<number> {
  const { data, error } = await admin.rpc("purge_media_rows", {
    p_media_ids: mediaIds,
  });
  if (error) throw new Error(`purge_media_rows: ${error.message}`);
  return (data ?? []).reduce((sum, r) => sum + Number(r.freed_bytes ?? 0), 0);
}

/**
 * Everything the deletion owes ONE account: R2 objects first, then the media
 * rows, then the event rows, and the auth.users row last of all if nothing is
 * left standing. Exported as its own seam because it is the whole destructive
 * half, and it depends on nothing but a user id, so it can be exercised against
 * a disposable account without the queue marker above it.
 *
 * `handled` is ADD-ONLY. We deliberately do not FILTER by it: a row an earlier
 * sweep purged is already gone from our select, whereas a row it deleted the
 * object for but failed to remove must still be re-processed before the
 * event-row delete cascades it away unreclaimed.
 */
export async function purgeAccount(
  admin: AdminClient,
  userId: string,
  handled?: Set<string>,
): Promise<AccountPurgeResult> {
  const result: AccountPurgeResult = {
    outcome: "held",
    events: 0,
    hold_blocked_events: 0,
    media_rows: 0,
    r2_deleted: 0,
    r2_errored: 0,
    freed_bytes: 0,
  };

  await reanonymise(admin, userId);

  const events =
    (await mustQuery(
      // EVERY event the account hosts, soft-deleted or not: the request already
      // binned them, and the ruling is immediate, so there is no 30-day wait
      // here (that window is for a host who may want their event BACK).
      admin.from("events").select("id").eq("host_id", userId),
      "purgeAccount: events",
    )) ?? [];

  if (events.length > 0) {
    const eventIds = events.map((e) => e.id);
    const heldMedia = await mustQuery(
      // ★ The hold filter runs BEFORE any key list is built. The SQL guard in
      // purge_media_rows would save only the ROW; every R2 delete is R2-first,
      // so a held OBJECT is protected here or nowhere.
      admin
        .from("media")
        .select("event_id")
        .in("event_id", eventIds)
        .filter("legal_hold_at", "not.is", null),
      "purgeAccount: held media",
    );
    const { purgeable, blocked } = partitionEventsByHold(
      eventIds,
      heldMedia ?? [],
    );
    result.hold_blocked_events = blocked.length;

    if (purgeable.length > 0) {
      const rows: MediaKeyRow[] = [];
      // Page to exhaustion, advancing by what the server actually returned and
      // stopping only on an empty page (PostgREST silently clamps to its own
      // max_rows, so a short first page is not proof of the last one). An
      // unbounded select would leave the tail of a large album as permanent
      // orphans once the event-row delete cascades their rows away.
      for (let from = 0; ; ) {
        const page = await mustQuery(
          admin
            .from("media")
            .select("id, original_key, preview_key")
            .in("event_id", purgeable)
            .order("id", { ascending: true })
            .range(from, from + MEDIA_PAGE - 1),
          "purgeAccount: media page",
        );
        const batch = (page ?? []) as MediaKeyRow[];
        if (batch.length === 0) break;
        rows.push(...batch);
        from += batch.length;
      }

      // R2 FIRST, always. The rendered reel .mp4 is a derived artifact with no
      // media row and a non-media-shaped key, so the orphan sweep would never
      // reclaim it; appending its deterministic key is safe whether or not a
      // reel was ever rendered (deleting an absent key is a success).
      const r2 = await deleteR2Objects([
        ...keysOf(rows),
        ...purgeable.map(reelOutputKey),
      ]);
      result.r2_deleted = r2.deleted;
      result.r2_errored = r2.errored.length;
      if (r2.errored.length > 0) {
        // We still reclaim the rows (matching the expired-events sweep): the
        // orphan sweep is the backstop for a stranded media object. Say so
        // loudly, because a reel .mp4 that fails here leaks silently forever.
        captureWarning("cron", "account_deletion_r2_partial", {
          user_id: userId,
          errored: r2.errored.length,
        });
      }

      const mediaIds = rows.map((r) => r.id);
      if (mediaIds.length > 0) {
        result.freed_bytes = await purgeRows(admin, mediaIds);
        result.media_rows = mediaIds.length;
        for (const id of mediaIds) handled?.add(id);
      }

      // Safe now: the media is gone, so the FK cascade has nothing of value
      // left to destroy.
      const { error: delErr } = await admin
        .from("events")
        .delete()
        .in("id", purgeable);
      if (delErr) throw new Error(`delete events: ${delErr.message}`);
      result.events = purgeable.length;
    }
  }

  // ★ mustCount, never a bare count: a failed count resolves as a confident
  // zero, and a confident zero here deletes the auth user (cascading every
  // surviving event and its media rows) while its objects are still in R2.
  const remaining = await mustCount(
    admin
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("host_id", userId),
    "purgeAccount: remaining events",
  );

  if (remaining > 0) {
    // Only a forensic hold can leave events standing here. The account keeps
    // its anonymised profile and stays in the queue for the next run.
    return result;
  }

  const { error: authErr } = await admin.auth.admin.deleteUser(userId);
  if (authErr) {
    // Not fatal to the run: the media is already gone, and the next run retries
    // from a zero-event account. Loud, because a lingering auth row is a person
    // who asked to be forgotten and technically still exists.
    captureError("cron", authErr, {
      sweep: "deleted_accounts",
      step: "delete_auth_user",
      user_id: userId,
    });
    return result;
  }

  result.outcome = "deleted";
  return result;
}

/**
 * Sweep the accounts that asked to be deleted: find them, then hand each to
 * purgeAccount.
 *
 * WIRING: the orchestrator adds ONE line to src/app/api/cron/purge/route.ts,
 * after `removed_media` so `handled` is populated and before the capacity
 * sweeps so they never act on bytes this run is about to reclaim:
 *
 *     await runSweep("deleted_accounts", () =>
 *       sweepDeletedAccounts(admin, now, handled),
 *     );
 *
 * `_now` is accepted for signature symmetry with the sibling sweeps (the cron
 * hands one `now` to all of them). This sweep has no time window: deletion is
 * immediate by ruling, so every stamped account is due on the next run.
 */
export async function sweepDeletedAccounts(
  admin: AdminClient,
  _now: Date,
  handled?: Set<string>,
): Promise<AccountDeletionSweepResult> {
  const result = emptyResult();

  let candidates: { id: string }[];
  try {
    candidates =
      (await mustQuery(
        admin
          .from("profiles")
          .select("id")
          // The untyped `.filter` form, like the purge cron's own legal_hold_at
          // predicate (the column is in the generated types since the apply).
          .filter("deletion_requested_at", "not.is", null)
          .order("deletion_requested_at", { ascending: true })
          .limit(ACCOUNT_SWEEP_LIMIT),
        "sweepDeletedAccounts: candidates",
      )) ?? [];
  } catch (error) {
    // Pre-apply the column does not exist. Report "nothing to do" rather than
    // failing the sweep; the orchestrator applies the migration before wiring
    // the call, so this branch should never fire in production.
    if (isDeletionSchemaMissing(error)) {
      return { ...result, skipped: "not_provisioned" };
    }
    throw error;
  }

  for (const { id: userId } of candidates) {
    result.accounts += 1;
    const one = await purgeAccount(admin, userId, handled);
    result.events += one.events;
    result.hold_blocked_events += one.hold_blocked_events;
    result.media_rows += one.media_rows;
    result.r2_deleted += one.r2_deleted;
    result.r2_errored += one.r2_errored;
    result.freed_bytes += one.freed_bytes;
    if (one.outcome === "deleted") result.accounts_deleted += 1;
    else result.accounts_held += 1;
  }

  return result;
}

export type AccountDeletionState = {
  /** ISO timestamp, or null when the account has not asked to be deleted. */
  requestedAt: string | null;
  /** Events still standing (soft-deleted ones included: the sweep purges both). */
  eventCount: number;
  /** Of those, the ones a forensic hold keeps the sweep from touching. */
  heldEventCount: number;
};

/**
 * The operator-facing read behind the /admin/accounts/[id] card: has this
 * account asked to be deleted, and is anything holding it open? Service-role
 * (there is no cross-host profile read elsewhere) and READ-ONLY. Degrades to
 * "not requested" before the migration lands rather than 500-ing the page.
 */
export async function getAccountDeletionState(
  userId: string,
): Promise<AccountDeletionState> {
  const admin = createAdminClient();

  let requestedAt: string | null = null;
  try {
    const row = await mustQuery(
      // Selected by name; the column is in the generated types since the apply.
      admin
        .from("profiles")
        .select("deletion_requested_at")
        .eq("id", userId)
        .maybeSingle(),
      "getAccountDeletionState: profile",
    );
    requestedAt =
      (row as { deletion_requested_at?: string | null } | null)
        ?.deletion_requested_at ?? null;
  } catch (error) {
    if (!isDeletionSchemaMissing(error)) throw error;
  }

  const events =
    (await mustQuery(
      admin.from("events").select("id").eq("host_id", userId),
      "getAccountDeletionState: events",
    )) ?? [];
  const eventIds = events.map((e) => e.id);
  if (eventIds.length === 0) {
    return { requestedAt, eventCount: 0, heldEventCount: 0 };
  }

  const heldMedia = await mustQuery(
    admin
      .from("media")
      .select("event_id")
      .in("event_id", eventIds)
      .filter("legal_hold_at", "not.is", null),
    "getAccountDeletionState: held media",
  );
  const { blocked } = partitionEventsByHold(eventIds, heldMedia ?? []);

  return {
    requestedAt,
    eventCount: eventIds.length,
    heldEventCount: blocked.length,
  };
}
