/**
 * Account deletion: the anonymisation shape, and the sweep that finishes the job.
 *
 * THE TWO HALVES (immediate, no undo, an active plan
 * auto-cancelled at the request):
 *
 *   1. THE REQUEST (src/lib/db/mutations/account.ts, driven by the /account card
 *      and the /admin/accounts/[id] operator trigger) cancels the subscription,
 *      stamps `profiles.deletion_requested_at`, soft-deletes every hosted event
 *      into the existing 30-day bin, removes the address from the newsletter,
 *      scrubs the account's guest rows in other hosts' events, anonymises the
 *      profile, and bans the auth user from signing in. All of it is immediate
 *      and none of it is reversible.
 *
 *   2. THE SWEEP (here, called once from the daily purge cron) hard-deletes what
 *      the request only marked: R2 objects FIRST, then the media rows through
 *      `purge_media_rows` (both through `reclaimMedia`), then the event rows, and
 *      finally the auth.users row once the account has ZERO events left.
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
 * anonymised the entire time, which is the intended behaviour: anonymised at once,
 * deleted when the hold lifts. The account is not told, and the hold columns are
 * not readable by it (database-security.md's column-scoped SELECT).
 *
 * ★ WHOLE, AND WITHIN THE CRON'S BUDGET (the 1,000-row round, 2026-09-23). Every read here is
 * complete: the account's events and the deletion queue by keyset (`readAllPages`), the hold
 * question as ONE `held_event_ids` answer (`readHeldEventIds`; a row list of held photos stopped at
 * 1,000 and could read a held event as purgeable), each event batch's media in keyset pages of
 * `MAX_ROWS` reclaimed page by page, and every id list chunked (`inChunks`). A large account can take
 * more than one night: the sweep stops at its deadline, an account caught mid-purge keeps its event
 * rows and its auth user for the next run (`outcome: "unfinished"`), and the run says what it left.
 *
 * Server-only: R2 + the service-role client. `account-deletion.test.ts` pins the orders as text and
 * runs the sweep against the clamping PostgREST fake (`src/lib/db/testing/fake-postgrest.ts`).
 */
import "server-only";

import { mustCount, mustQuery, QueryFailedError } from "@/lib/db/must-query";
import {
  IN_CHUNK,
  inChunks,
  MAX_ROWS,
  readAllPages,
  type AllPages,
} from "@/lib/db/read-all";
import { partitionEventsByHold } from "@/lib/forensics/legal-hold";
import {
  emptyTally,
  forEachIsolated,
  tallyNote,
  type IsolatedTally,
} from "@/lib/jobs/isolate";
import {
  readHeldEventIds,
  reclaimMedia,
  type AdminClient,
  type MediaKeyRow,
} from "@/lib/lifecycle/reclaim";
import {
  NO_DEADLINE,
  stoppedEarly,
  type Deadline,
  type StoppedEarly,
} from "@/lib/lifecycle/sweep-budget";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";
import { removeAvatar } from "@/lib/supabase/avatar-storage";

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
 * What the account's guest rows lose, in every event it added photographs to (lp/identity-email;
 * Will, identity-door r1 `remove`: "Account deletion is always an option too", and it takes the
 * address with it). The rows themselves stay, as the FK and `/privacy` promise, and so do their
 * uploads and each upload's `upload_forensics` record, which is the abuse trail by design.
 *
 *   - `email`: the confirmed address a host sees under the name. Left behind, the host's viewer kept
 *     printing it beside a nameless photograph after the account was gone.
 *   - `pending_email` + `pending_email_at`: an address typed and never proved (inert, but the
 *     person's).
 *   - `display_name`: a typed name, which only an unconfirmed account's row carries (a verified row's
 *     name is the profile's, anonymised above).
 *
 * ★ `verified_at` STAYS, and so does the row's link until the FK takes it: a confirmed row whose
 * account was deleted writes for nobody precisely because it keeps its proof (guest-flow.md). The
 * same four columns are cleared by `scrub_account_guest_rows`, the BEFORE DELETE trigger on
 * `profiles` (20260926200000_identity.sql), so a deletion that never passes through this code still
 * takes them.
 */
export const SCRUBBED_GUEST_PATCH = {
  email: null,
  pending_email: null,
  pending_email_at: null,
  display_name: null,
} as const;

/**
 * Take the account's identity off its guest rows. ONE write, keyed on the account (no id list rides
 * the URL, however many events it joined) and narrowed to the rows still carrying something, so the
 * count is what actually changed and a re-run is a quiet zero. THROWS on failure: the sweep's
 * re-anonymise must stop before `deleteUser` rather than purge an account whose rows still name it.
 */
export async function scrubAccountGuestRows(
  admin: AdminClient,
  userId: string,
): Promise<number> {
  const { count, error } = await admin
    .from("guests")
    .update(SCRUBBED_GUEST_PATCH, { count: "exact" })
    .eq("user_id", userId)
    .or(
      "email.not.is.null,pending_email.not.is.null,pending_email_at.not.is.null,display_name.not.is.null",
    );
  if (error) throw new QueryFailedError("scrubAccountGuestRows", error);
  return count ?? 0;
}

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
 * The deletion queue's page size. Not a per-run cap any more: the sweep reads the queue page by page,
 * oldest request first, until its deadline, so a queue held at its head by forensic holds (a held
 * account never leaves it) can never starve the requests behind it.
 */
const QUEUE_PAGE = 100;

export type AccountDeletionSweepResult = {
  /** Stamped accounts examined this run. */
  accounts: number;
  /** auth.users rows removed (the account is fully gone). */
  accounts_deleted: number;
  /** Accounts left standing because a forensic hold still blocks an event. */
  accounts_held: number;
  /** Accounts the deadline caught mid-purge: they finish on a later run. */
  accounts_unfinished: number;
  /** Guest rows in other hosts' events that lost an account's address or typed name this run. */
  guest_rows_scrubbed: number;
  events: number;
  hold_blocked_events: number;
  media_rows: number;
  r2_deleted: number;
  r2_errored: number;
  freed_bytes: number;
  /** Present only before migration 20260902130000 is applied. */
  skipped?: "not_provisioned";
  /** Accounts this run isolated and failed on, so its heartbeat closes as an error (QA #27). */
  rows_failed?: number;
  rows_not_attempted?: number;
  rows_note?: string;
} & Partial<StoppedEarly>;

export type AccountPurgeResult = {
  /**
   * "deleted" once the auth.users row is gone; "held" while a hold blocks it; "unfinished" when the
   * deadline stopped the purge before its event rows could go.
   */
  outcome: "deleted" | "held" | "unfinished";
  /** The account's guest rows the re-anonymise scrubbed (0 once an earlier pass cleared them). */
  guest_rows_scrubbed: number;
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
    accounts_unfinished: 0,
    guest_rows_scrubbed: 0,
    events: 0,
    hold_blocked_events: 0,
    media_rows: 0,
    r2_deleted: 0,
    r2_errored: 0,
    freed_bytes: 0,
  };
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
 *
 * ★ THE GUEST ROWS ARE SCRUBBED HERE, BEFORE THE PROFILE, AND A FAILED SCRUB
 * THROWS: purgeAccount then stops before it deletes anything, `deleteUser`
 * included, and the next run tries again. This pass is the one that reaches a
 * HELD account, which never gets to `deleteUser` (and so never fires the
 * BEFORE DELETE trigger that is the net under all of this). Returns the rows
 * it scrubbed.
 */
async function reanonymise(
  admin: AdminClient,
  userId: string,
): Promise<number> {
  await removeAvatar(userId);
  const scrubbed = await scrubAccountGuestRows(admin, userId);
  const { error } = await admin
    .from("profiles")
    .update(ANONYMISED_PROFILE_PATCH)
    .eq("id", userId);
  if (error) throw new Error(`re-anonymise ${userId}: ${error.message}`);
  return scrubbed;
}

/** EVERY event the account hosts, soft-deleted or not, whole, by keyset on id. */
export async function readHostedEventIds(
  admin: AdminClient,
  userId: string,
): Promise<string[]> {
  const { rows } = await readAllPages(
    "account deletion: hosted events",
    (after: string | null, limit) => {
      let query = admin
        .from("events")
        .select("id")
        .eq("host_id", userId)
        .order("id", { ascending: true })
        .limit(limit);
      if (after) query = query.gt("id", after);
      return query;
    },
    (row) => row.id,
  );
  return rows.map((row) => row.id);
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
  deadline: Deadline = NO_DEADLINE,
): Promise<AccountPurgeResult> {
  const result: AccountPurgeResult = {
    outcome: "held",
    guest_rows_scrubbed: 0,
    events: 0,
    hold_blocked_events: 0,
    media_rows: 0,
    r2_deleted: 0,
    r2_errored: 0,
    freed_bytes: 0,
  };

  result.guest_rows_scrubbed = await reanonymise(admin, userId);

  // EVERY event, soft-deleted or not: the request already binned them, and the
  // the request is immediate, so there is no 30-day wait here (that window is for a
  // host who may want their event BACK).
  const eventIds = await readHostedEventIds(admin, userId);

  if (eventIds.length > 0) {
    // ★ The hold check runs BEFORE any key list is built, and the media read below
    // leaves held rows out too. The SQL guard in purge_media_rows would save only
    // the ROW; every R2 delete is R2-first, so a held OBJECT is protected here or
    // nowhere.
    const { purgeable, blocked } = partitionEventsByHold(
      eventIds,
      await readHeldEventIds(admin, eventIds),
    );
    result.hold_blocked_events = blocked.length;

    const outcomes = await inChunks(
      "account deletion: media",
      purgeable,
      async (chunk) => {
        let after: string | null = null;
        for (;;) {
          if (deadline.passed()) return [false];
          // Annotated: the loop feeds `page.after` back in, which TypeScript cannot infer through.
          const page: AllPages<MediaKeyRow, string> = await readAllPages(
            "account deletion: media page",
            (cursor: string | null, limit) => {
              let query = admin
                .from("media")
                .select("id, original_key, preview_key")
                .in("event_id", chunk)
                .filter("legal_hold_at", "is", null)
                .order("id", { ascending: true })
                .limit(limit);
              if (cursor) query = query.gt("id", cursor);
              return query;
            },
            (media) => media.id,
            { budget: MAX_ROWS, after },
          );
          if (page.rows.length > 0) {
            // R2 FIRST, then the rows (reclaimMedia does both, in that order).
            const reclaimed = await reclaimMedia(admin, page.rows);
            result.media_rows += reclaimed.media_rows;
            result.r2_deleted += reclaimed.r2_deleted;
            result.r2_errored += reclaimed.r2_errored;
            result.freed_bytes += reclaimed.freed_bytes;
            for (const media of page.rows) handled?.add(media.id);
          }
          if (!page.more) break;
          after = page.after;
        }

        // Every unheld media row is gone. Ask the holds again: an event held since the partition
        // keeps its row and its held media.
        const stillHeld = new Set(await readHeldEventIds(admin, chunk));
        const doomed = chunk.filter((id) => !stillHeld.has(id));
        result.hold_blocked_events += chunk.length - doomed.length;
        if (doomed.length === 0) return [true];

        // Safe now: the media is gone, so the FK cascade has nothing of value
        // left to destroy.
        const { error: delErr } = await admin
          .from("events")
          .delete()
          .in(
            "id",
            chunk.filter((id) => !stillHeld.has(id)),
          );
        if (delErr) {
          throw new QueryFailedError("account deletion: delete events", delErr);
        }
        result.events += doomed.length;
        return [true];
      },
      // One chunk at a time, `IN_CHUNK` events each: the deletes are R2-first and ordered, and the
      // deadline is checked between pages.
      { size: IN_CHUNK, concurrency: 1 },
    );

    if (result.r2_errored > 0) {
      // We still reclaim the rows (matching the expired-events sweep): the orphan sweep is the
      // backstop for a stranded media object. Said loudly, because a leak here would otherwise be
      // silent forever.
      captureWarning("cron", "account_deletion_r2_partial", {
        user_id: userId,
        errored: result.r2_errored,
      });
    }

    if (!outcomes.every(Boolean)) {
      // The deadline caught it mid-purge: its remaining events (and the auth user) wait for the
      // next run, which re-reads them from scratch.
      result.outcome = "unfinished";
      return result;
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

/** A position in the deletion queue: the raw `deletion_requested_at` string and the id. */
type QueueCursor = { at: string; id: string };
type QueueRow = { id: string; deletion_requested_at: string | null };

/** One page of the deletion queue, oldest request first. */
export function deletionQueuePage(
  admin: AdminClient,
  after: QueueCursor | null,
  limit: number,
) {
  let query = admin
    .from("profiles")
    .select("id, deletion_requested_at")
    // The untyped `.filter` form, like the purge cron's own legal_hold_at
    // predicate (the column is in the generated types since the apply).
    .filter("deletion_requested_at", "not.is", null)
    .order("deletion_requested_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(limit);
  if (after) {
    query = query.or(
      `deletion_requested_at.gt.${after.at},and(deletion_requested_at.eq.${after.at},id.gt.${after.id})`,
    );
  }
  return query;
}

/** How many stamped accounts stand in the queue past `after` (all of them from null). */
async function countQueueAfter(
  admin: AdminClient,
  after: QueueCursor | null,
): Promise<number> {
  let query = admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .filter("deletion_requested_at", "not.is", null);
  if (after) {
    query = query.or(
      `deletion_requested_at.gt.${after.at},and(deletion_requested_at.eq.${after.at},id.gt.${after.id})`,
    );
  }
  return mustCount(query, "sweepDeletedAccounts: queue left");
}

/**
 * Sweep the accounts that asked to be deleted: page through the queue, oldest
 * request first, and hand each to purgeAccount until the deadline. Wired in
 * src/app/api/cron/purge/route.ts after `removed_media` (so `handled` is
 * populated) and before the capacity sweeps (so they never act on bytes this run
 * is about to reclaim).
 *
 * `_now` is accepted for signature symmetry with the sibling sweeps (the cron
 * hands one `now` to all of them). This sweep has no time window: deletion is
 * immediate by design, so every stamped account is due on the next run.
 */
export async function sweepDeletedAccounts(
  admin: AdminClient,
  _now: Date,
  handled?: Set<string>,
  opts: { deadline?: Deadline } = {},
): Promise<AccountDeletionSweepResult> {
  const deadline = opts.deadline ?? NO_DEADLINE;
  const result = emptyResult();
  const total: IsolatedTally = emptyTally();

  let after: QueueCursor | null = null;
  // Where the run stopped in the queue, when the deadline stopped it.
  let stoppedAt: QueueCursor | null | undefined;
  for (;;) {
    if (deadline.passed()) {
      stoppedAt = after;
      break;
    }
    let page: AllPages<QueueRow, QueueCursor>;
    try {
      page = await readAllPages(
        "sweepDeletedAccounts: candidates",
        (cursor: QueueCursor | null, limit) =>
          deletionQueuePage(admin, cursor, limit),
        // `deletion_requested_at` is never null here: the page filters `not.is.null`.
        (row) => ({ at: row.deletion_requested_at as string, id: row.id }),
        { budget: QUEUE_PAGE, after },
      );
    } catch (error) {
      // Pre-apply the column does not exist. Report "nothing to do" rather than
      // failing the sweep; the orchestrator applies the migration before wiring
      // the call, so this branch should never fire in production.
      if (isDeletionSchemaMissing(error)) {
        return { ...result, skipped: "not_provisioned" };
      }
      throw error;
    }
    if (page.rows.length === 0) break;

    // ★ PER-ROW ISOLATION (QA #27). One account whose R2 delete or auth delete threw used to abort
    // the whole sweep, so every account BEHIND it waited another day, for a deletion that is
    // immediate by design. Each account is isolated; `rows_failed` travels with the tally so the
    // sweep's own run still closes RED (src/lib/jobs/purge-sweeps.ts reads it), and the next run
    // retries the failed ones.
    const tally = await forEachIsolated(
      page.rows,
      async ({ id: userId }) => {
        result.accounts += 1;
        const one = await purgeAccount(admin, userId, handled, deadline);
        result.guest_rows_scrubbed += one.guest_rows_scrubbed;
        result.events += one.events;
        result.hold_blocked_events += one.hold_blocked_events;
        result.media_rows += one.media_rows;
        result.r2_deleted += one.r2_deleted;
        result.r2_errored += one.r2_errored;
        result.freed_bytes += one.freed_bytes;
        if (one.outcome === "deleted") result.accounts_deleted += 1;
        else if (one.outcome === "held") result.accounts_held += 1;
        else result.accounts_unfinished += 1;
      },
      {
        onError: (row, e) =>
          captureError("cron", e, {
            sweep: "deleted_accounts",
            user_id: row.id,
          }),
        stopWhen: () => deadline.passed(),
      },
    );
    total.processed += tally.processed;
    total.failed += tally.failed;
    total.skipped += tally.skipped;
    total.aborted ||= tally.aborted;
    total.firstError ??= tally.firstError;

    const attempted = tally.processed + tally.failed;
    if (tally.unreached > 0) {
      const last = attempted > 0 ? page.rows[attempted - 1] : null;
      stoppedAt = last
        ? { at: last.deletion_requested_at as string, id: last.id }
        : after;
      break;
    }
    if (tally.skipped > 0) break; // aborted: a failure, reported as one
    if (!page.more) break;
    after = page.after;
  }

  result.rows_failed = total.failed;
  result.rows_not_attempted = total.skipped;
  result.rows_note = tallyNote("accounts", total) ?? undefined;

  // Work left: the accounts the deadline never reached, plus any it caught mid-purge.
  if (stoppedAt !== undefined || result.accounts_unfinished > 0) {
    const unreached =
      stoppedAt === undefined ? 0 : await countQueueAfter(admin, stoppedAt);
    return {
      ...result,
      ...stoppedEarly(unreached + result.accounts_unfinished),
    };
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
 * The event count is COUNTED (a head count, never a list's length), and the held
 * count is `held_event_ids`' answer over the account's events read whole.
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

  const eventCount = await mustCount(
    admin
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("host_id", userId),
    "getAccountDeletionState: events",
  );
  if (eventCount === 0) {
    return { requestedAt, eventCount: 0, heldEventCount: 0 };
  }

  const eventIds = await readHostedEventIds(admin, userId);
  const { blocked } = partitionEventsByHold(
    eventIds,
    await readHeldEventIds(admin, eventIds),
  );

  return { requestedAt, eventCount, heldEventCount: blocked.length };
}
