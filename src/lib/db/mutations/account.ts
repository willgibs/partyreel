/**
 * Account-level writes: the deletion request, the operator's cancellation of
 * one, and the newsletter removal the privacy policy promises.
 *
 * THE DELETION REQUEST has no undo for the person who asks (Will, 2026-09-02):
 * everything anyone can see goes at once, and the nightly purge erases the rest
 * and the sign-in (`lib/lifecycle/purge-time.ts` says when). It runs in a
 * deliberate order, and the order is the design:
 *
 *   1. read the profile (idempotency + the address the later steps need)
 *   2. IF SHE ASKED, TAKE HER UPLOADS OUT OF OTHER PEOPLE'S ALBUMS (her own
 *      `removeMyUpload`, each one, whole past 1,000), and abort the whole
 *      request if any is left. It comes before the plan so that whichever step
 *      fails, she loses nothing she did not ask for: a refused removal has
 *      touched nothing else, and a plan Stripe then refuses leaves her account
 *      and her plan, with only the photos she asked to remove gone. Never after
 *      the stamp: from there she is locked out and could never retry it.
 *   3. CANCEL EVERY LIVE SUBSCRIPTION OF THE CUSTOMER (two Checkout tabs can
 *      leave two; crumbs-41), and abort the whole request if Stripe refuses.
 *      "Account gone, card still charged" is far worse than "try again", and at
 *      this point nothing has been destroyed.
 *   4. stamp `deletion_requested_at` -- THE POINT OF NO RETURN. From here the
 *      daily sweep (lib/lifecycle/account-deletion.ts) is authoritative and will
 *      finish the job even if this request dies mid-way, which is exactly why
 *      the stamp comes before the destructive steps rather than after them.
 *   5. soft-delete every hosted event into the existing 30-day bin
 *   6. remove the address from the newsletter (BEFORE step 7 nulls it: the sweep
 *      cannot re-derive an address it can no longer read)
 *   7. remove the avatar object, scrub the account's guest rows in other hosts'
 *      events (their addresses and any typed name), then anonymise the profile
 *   8. ban the auth user so nobody can sign back into a half-deleted account
 *
 * THE CANCELLATION (`cancelAccountDeletion`) is the operator's private
 * failsafe, never offered to the person (Will, 2026-10-03): before the purge
 * has run, it lifts the ban and clears the stamp, from /admin with no SQL. What
 * the request already did stays done, and its control says which.
 *
 * ★ NOTHING HERE WRITES AN ENTITLEMENT COLUMN. `tier` / `storage_cap_bytes` /
 * `stripe_*` / `event_slots` / `tier_expires_at` belong to the Stripe webhook
 * (billing-caps.md), which downgrades the row when our cancellation is
 * delivered. See ANONYMISED_PROFILE_PATCH for the exact shape.
 *
 * ★ THE CALLER AUTHORIZES. This module takes a user id and does the work; the
 * /account server action re-verifies the password or an email code first, and
 * the /admin/accounts/[id] actions go through requireAdminAction() (admin +
 * AAL2). Never call it from anywhere that has not done one of those.
 */
import "server-only";

import type { JobId } from "@/app/admin/jobs/catalog";
import { softDeleteEvent } from "@/lib/db/mutations/events";
import { removeMyUpload } from "@/lib/db/mutations/my-uploads";
import { mustCount, mustQuery } from "@/lib/db/must-query";
import { readAllPages } from "@/lib/db/read-all";
import { disconnectDrive } from "@/lib/drive/disconnect.server";
import {
  ANONYMISED_PROFILE_PATCH,
  scrubAccountGuestRows,
} from "@/lib/lifecycle/account-deletion";
import type { AdminClient } from "@/lib/lifecycle/reclaim";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import {
  cancelSubscriptionsForDeletion,
  type SubscriptionCancelResult,
} from "@/lib/stripe/account-cancel";
import { createAdminClient } from "@/lib/supabase/admin";
import { removeAvatar } from "@/lib/supabase/avatar-storage";
import { createClient } from "@/lib/supabase/server";

/**
 * A century, in the `ban_duration` string GoTrue expects. Banning is how the
 * auth user is locked between the request and the sweep: the profile is
 * anonymised and the events are binned, so signing back in would land someone
 * on a wrecked account they could still create events with. The one way back is
 * the operator's `cancelAccountDeletion`, which sends `UNBAN` before the purge.
 *
 * ★ THE BAN IS IMMEDIATE, NOT JUST FOR THE NEXT SIGN-IN, and that is the
 * `getUser()` landmine paying off. Measured against live GoTrue (2026-09-02): a
 * new sign-in is refused ("User is banned"), a refresh is refused, AND an
 * ALREADY-ISSUED access token stops validating, because getUser() re-validates
 * with the auth server on every call. So there is no window in which a stolen
 * or cached session keeps working. Any code that "optimised" an authz check
 * into getSession() would reopen exactly that window (auth-accounts.md).
 */
const DELETION_BAN_DURATION = "876000h";

/**
 * "self" routes the event soft-deletes through the existing RLS mutation
 * (softDeleteEvent), which is the audited host path. "operator" cannot use it
 * (RLS scopes it to the caller's own events), so that arm writes the identical
 * patch with the service-role client. Both fire the same set_event_purge_at
 * BEFORE trigger, so the bin behaves identically either way.
 *
 * `removeUploadsElsewhere` is the self arm's alone: the removal is her own
 * `removeMyUpload`, under her own session, the one way anyone takes an upload
 * back as its uploader, so an operator's request cannot carry it.
 */
export type AccountDeletionRequest =
  | { userId: string; actor: "self"; removeUploadsElsewhere?: boolean }
  | { userId: string; actor: "operator"; removeUploadsElsewhere?: never };

export type AccountDeletionResult =
  | {
      ok: true;
      /** The account was already queued; this call changed nothing. */
      alreadyRequested: boolean;
      /** The stamp (ISO): the purge that finishes the job is the first window after it. */
      requestedAt: string;
      eventsBinned: number;
      newsletterRemoved: number;
      /** Her uploads taken out of other people's albums at her asking (step 2). */
      uploadsRemoved: number;
      subscription: SubscriptionCancelResult;
    }
  | {
      ok: false;
      code: "not_found" | "uploads" | "subscription" | "unknown";
      message: string;
    };

export async function requestAccountDeletion(
  request: AccountDeletionRequest,
): Promise<AccountDeletionResult> {
  const { userId, actor } = request;
  const admin = createAdminClient();

  // 1. Read the profile, with its stamp: a request already queued changes nothing.
  const profile = await mustQuery(
    admin
      .from("profiles")
      .select(
        "id, email, stripe_customer_id, stripe_subscription_id, deletion_requested_at",
      )
      .eq("id", userId)
      .maybeSingle(),
    "requestAccountDeletion: profile",
  );
  if (!profile) {
    return { ok: false, code: "not_found", message: "No such account." };
  }
  if (profile.deletion_requested_at) {
    return {
      ok: true,
      alreadyRequested: true,
      requestedAt: profile.deletion_requested_at,
      eventsBinned: 0,
      newsletterRemoved: 0,
      uploadsRemoved: 0,
      subscription: { status: "none" },
    };
  }

  // 2. Her uploads in other people's albums, when she asked: before anything else is touched, and
  // the whole request refused unless every one is out (the header says why here).
  let uploadsRemoved = 0;
  if (request.actor === "self" && request.removeUploadsElsewhere) {
    const removal = await removeUploadsElsewhere(admin, userId).catch(
      (error: unknown) => {
        captureError("account", error, {
          step: "account_deletion_uploads_elsewhere",
          user_id: userId,
        });
        return null;
      },
    );
    if (!removal?.ok) {
      // A refusal she sees is never a silent one: the calls answered, and something stayed.
      if (removal) {
        captureWarning("account", "account_deletion_uploads_left", {
          user_id: userId,
          left: removal.left,
        });
      }
      return {
        ok: false,
        code: "uploads",
        message:
          "We couldn't take all your photos out of other people's albums just now, so your account wasn't deleted. Please try again.",
      };
    }
    uploadsRemoved = removal.removed;
  }

  // 3. Cancel the plan, every live subscription of the customer and not only the one the profile
  // follows, and refuse the request if Stripe will not play.
  const subscription = await cancelSubscriptionsForDeletion({
    customerId: profile.stripe_customer_id,
    subscriptionId: profile.stripe_subscription_id,
  });
  if (subscription.status === "failed") {
    captureError("billing", new Error(subscription.message), {
      step: "account_deletion_cancel",
      user_id: userId,
      subscription_id: subscription.subscriptionId,
    });
    return {
      ok: false,
      code: "subscription",
      // Accurate either way: with her uploads taken out of other albums first, something was
      // deleted (what she asked for), but never the account.
      message:
        uploadsRemoved > 0
          ? "We couldn't cancel your plan just now, so your account wasn't deleted. Please try again in a few minutes."
          : "We couldn't cancel your plan just now, so nothing was deleted. Please try again in a few minutes.",
    };
  }

  // 4. THE POINT OF NO RETURN. Everything after this is finishable by the sweep,
  // so a failure below is captured and reported as a successful request. The stamp
  // comes back with the write: the purge that finishes the job is the first window
  // after it, which is the time the done screen names.
  const { data: stamped, error: stampError } = await admin
    .from("profiles")
    .update({ deletion_requested_at: new Date().toISOString() })
    .eq("id", userId)
    .select("deletion_requested_at")
    .maybeSingle();
  if (stampError) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't start the deletion. Please try again.",
    };
  }
  const requestedAt =
    stamped?.deletion_requested_at ?? new Date().toISOString();

  let eventsBinned = 0;
  let newsletterRemoved = 0;
  try {
    eventsBinned = await binHostedEvents(userId, actor);
    // Her Google Drive: revoked at Google and its key deleted, her sends stopped (what she sent stays hers). ISOLATED:
    // the purge disconnects again before the auth user goes.
    try {
      await disconnectDrive(userId);
    } catch (error) {
      captureError("account", error, { step: "account_deletion_drive", user_id: userId, actor });
    }
    newsletterRemoved = await deleteNewsletterSignups(profile.email);
    await removeAvatar(userId);
    // The account's rows in other hosts' events lose its addresses (and a typed name) before the
    // profile loses its own. ISOLATED: a failed scrub is captured and costs neither the
    // anonymisation nor the ban below, because the sweep's re-anonymise repeats it and will not
    // reach deleteUser until it succeeds (and the BEFORE DELETE trigger nets that delete anyway).
    try {
      await scrubAccountGuestRows(admin, userId);
    } catch (error) {
      captureError("account", error, {
        step: "account_deletion_scrub",
        user_id: userId,
        actor,
      });
    }
    const { error: anonError } = await admin
      .from("profiles")
      .update(ANONYMISED_PROFILE_PATCH)
      .eq("id", userId);
    if (anonError) throw new Error(anonError.message);
    await banAuthUser(userId);
  } catch (error) {
    // Loud, not fatal: the account is stamped, so the sweep re-asserts the
    // anonymisation and hard-deletes everything on its next run.
    captureError("account", error, {
      step: "account_deletion_finish",
      user_id: userId,
      actor,
    });
  }

  return {
    ok: true,
    alreadyRequested: false,
    requestedAt,
    eventsBinned,
    newsletterRemoved,
    uploadsRemoved,
    subscription,
  };
}

// ── Her uploads in other people's albums (the dialog's choice) ──────────────
//
// What stays in other people's albums when an account goes is her uploads there, nameless (the
// FK sets `media.guest_id` null at the purge, and the request scrubs her rows' names and
// addresses). But a signed-in person can take back any upload of her own, ever (`remove_my_upload`,
// Will's `yours` rule), so the dialog offers to do that for all of them first, off by default
// (Will, 2026-10-03: "a user could delete their uploads to other events at anytime").
//
// ★ ONE PREDICATE, the rows `remove_my_upload`'s guest arm reaches that are still there: her guest
// rows (`guests.user_id`, a claimed anonymous upload included), in a live event she does not host,
// not already removed (pending, approved and hidden all count: each can still be shown). The
// dialog's number and the removal read it alike, so the number she is offered is the set removed.
// Admin reads keyed on her verified id: `media` has no RLS arm for a guest's own rows (her album
// reads are RPCs), and the caller has re-verified who she is.

/** Her uploads in other people's albums, still there. `head` counts instead of reading. */
function uploadsElsewhere(admin: AdminClient, userId: string, head = false) {
  // row-cap: a builder, never awaited as it stands: each reader pages it whole (readAllPages) or counts it (head)
  return admin
    .from("media")
    .select(
      "id, type, guests!media_guest_id_fkey!inner(user_id), events!media_event_id_fkey!inner(host_id, deleted_at)",
      head ? { count: "exact", head: true } : undefined,
    )
    .eq("guests.user_id", userId)
    .neq("events.host_id", userId)
    .is("events.deleted_at", null)
    .neq("status", "removed");
}

export type UploadsElsewhere = { photos: number; videos: number };

/**
 * How many photos and videos the signed-in person added to other people's albums that are still
 * there: the number the deletion dialog's choice names. Counted (rule 2 of read-all.ts), per type,
 * so the words can say "photos and videos" only when there are both.
 */
export async function countMyUploadsElsewhere(): Promise<UploadsElsewhere> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { photos: 0, videos: 0 };
  const admin = createAdminClient();
  const [photos, videos] = await Promise.all([
    mustCount(
      uploadsElsewhere(admin, user.id, true).eq("type", "photo"),
      "countMyUploadsElsewhere: photos",
    ),
    mustCount(
      uploadsElsewhere(admin, user.id, true).eq("type", "video"),
      "countMyUploadsElsewhere: videos",
    ),
  ]);
  return { photos, videos };
}

/** How many of her own removals run at once: enough to hide latency, few enough to spare GoTrue. */
const REMOVE_AT_ONCE = 6;

/**
 * Take every one of her uploads out of other people's albums, through her own `removeMyUpload`
 * (the dashboard's and the album's own Delete: final, and private to the host), read whole past
 * 1,000 by keyset before the first removal so no page shifts under the read.
 *
 * ★ THE END STATE DECIDES, NOT THE CALLS: a removal that answers "no longer available" (the host
 * binned the event a moment ago) is not a failure, and one that failed in transit is, and the
 * calls' answers cannot tell those apart. So after the last one the same predicate is counted
 * again, and the request goes on only at zero. A retry finds only what is left.
 */
async function removeUploadsElsewhere(
  admin: AdminClient,
  userId: string,
): Promise<{ ok: true; removed: number } | { ok: false; left: number }> {
  const { rows } = await readAllPages(
    "removeUploadsElsewhere: her uploads",
    (after: string | null, limit) => {
      let query = uploadsElsewhere(admin, userId)
        .order("id", { ascending: true })
        .limit(limit);
      if (after) query = query.gt("id", after);
      return query;
    },
    (row) => row.id,
  );
  for (let i = 0; i < rows.length; i += REMOVE_AT_ONCE) {
    await Promise.all(
      rows.slice(i, i + REMOVE_AT_ONCE).map((row) => removeMyUpload(row.id)),
    );
  }
  const left = await mustCount(
    uploadsElsewhere(admin, userId, true),
    "removeUploadsElsewhere: left",
  );
  return left === 0 ? { ok: true, removed: rows.length } : { ok: false, left };
}

// ── The operator's cancellation (the private failsafe) ───────────────────────

/** `ban_duration` "none" clears `banned_until` (GoTrue's admin update: a zero duration). */
const UNBAN = "none";

/**
 * How long a purge run counts as running. The route's `maxDuration` is 60 s, and a run that died
 * leaves its row `running` for good, so only a row this recent can be a run under way.
 */
const PURGE_RUN_FRESH_MS = 5 * 60 * 1000;

const PURGE_JOB: JobId = "purge_cron";

export type CancelDeletionResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "not_found"
        | "not_requested"
        | "purge_running"
        | "ban"
        /** The ban lifted, the stamp would not clear, and the ban would not go back. */
        | "half"
        | "unknown";
      message: string;
    };

/**
 * Bring back an account whose deletion was requested, before the purge has run: the operator's
 * Cancel deletion on /admin/accounts/[id] (Will, 2026-10-03: a human operator does the whole
 * recovery from /admin, no SQL). It undoes exactly the two things that make an account "being
 * deleted": the ban (so it can sign in) and the stamp (so the purge passes it by), and puts its own
 * address back on the profile, without which no lifecycle or billing email could reach it. Its
 * binned events sit in Deleted with their own 30 days; everything else the request did stays done
 * (the control lists it).
 *
 * ★ THE BAN LIFTS FIRST AND THE STAMP CLEARS SECOND, and a failed second step puts the ban back:
 * the two halves of "being deleted" move together or not at all. In the other order, a failed
 * unban would leave an account no longer queued that still cannot sign in, and the page (which
 * offers the control only while the stamp is set) could no longer retry it.
 *
 * ★ NEVER DURING A PURGE RUN: the account sweep reads the queue at its start and purges what it
 * read, so a cancellation landing mid-run would read as done and lose the account a moment later.
 * The run's own heartbeat (`job_runs`) says whether one is under way; the operator waits a minute.
 */
export async function cancelAccountDeletion(
  userId: string,
): Promise<CancelDeletionResult> {
  const admin = createAdminClient();

  const profile = await mustQuery(
    admin
      .from("profiles")
      .select("deletion_requested_at")
      .eq("id", userId)
      .maybeSingle(),
    "cancelAccountDeletion: profile",
  );
  if (!profile) {
    return {
      ok: false,
      code: "not_found",
      message: "This account is already gone: the purge has run.",
    };
  }
  if (!profile.deletion_requested_at) {
    return {
      ok: false,
      code: "not_requested",
      message: "This account isn't being deleted.",
    };
  }

  const run = await mustQuery(
    admin
      .from("job_runs")
      .select("status, started_at")
      .eq("job", PURGE_JOB)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    "cancelAccountDeletion: the purge's latest run",
  );
  if (
    run?.status === "running" &&
    Date.now() - Date.parse(run.started_at) < PURGE_RUN_FRESH_MS
  ) {
    return {
      ok: false,
      code: "purge_running",
      message:
        "The nightly purge is running right now. Nothing changed: try again in a few minutes.",
    };
  }

  const { data: authUser, error: readError } =
    await admin.auth.admin.getUserById(userId);
  if (readError || !authUser.user) {
    return {
      ok: false,
      code: "not_found",
      message: "This account's sign-in is already gone. Nothing changed.",
    };
  }

  const { error: unbanError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: UNBAN,
  });
  if (unbanError) {
    return {
      ok: false,
      code: "ban",
      message: "Couldn't restore the sign-in. Nothing changed: try again.",
    };
  }

  // The stamp clears only while it is still set, so a purge that removed the row since the read
  // answers no row rather than a write that silently did nothing.
  const { data: cleared, error: clearError } = await admin
    .from("profiles")
    .update({
      deletion_requested_at: null,
      email: authUser.user.email ?? null,
    })
    .eq("id", userId)
    .not("deletion_requested_at", "is", null)
    .select("id");
  if (clearError || (cleared ?? []).length === 0) {
    // Nothing cleared. Ask the row why before acting on it: a second operator's cancellation that
    // landed first agrees with this one, and a purge that took the row leaves nothing to re-ban.
    const { data: now, error: rereadError } = await admin
      .from("profiles")
      .select("deletion_requested_at")
      .eq("id", userId)
      .maybeSingle();
    if (!rereadError && now && now.deletion_requested_at === null) {
      return { ok: true };
    }
    if (!rereadError && !now) {
      return {
        ok: false,
        code: "not_found",
        message: "This account is already gone: the purge has run.",
      };
    }
    // Still queued: put the ban back, so "can sign in" never stands without "no longer queued".
    const { error: rebanError } = await admin.auth.admin.updateUserById(
      userId,
      { ban_duration: DELETION_BAN_DURATION },
    );
    return rebanError
      ? {
          ok: false,
          code: "half",
          message:
            "The sign-in is back, but the account is still queued for deletion: press Cancel deletion again before the purge runs.",
        }
      : {
          ok: false,
          code: "unknown",
          message: "Couldn't cancel the deletion. Nothing changed: try again.",
        };
  }
  return { ok: true };
}

/**
 * Soft-delete every event this account hosts. The self arm reuses the existing
 * host mutation so the deletion behaves exactly like the one in the event's own
 * danger zone; the operator arm writes the same patch service-role, because RLS
 * scopes softDeleteEvent to the caller. Returns how many rows moved to the bin.
 */
async function binHostedEvents(
  userId: string,
  actor: "self" | "operator",
): Promise<number> {
  if (actor === "operator") {
    const admin = createAdminClient();
    // ONE write for every live event, and its count is the length of what the write returned:
    // PostgREST does not cap a write's returned rows (a PATCH over 1,040 rows returned all 1,040 on
    // the 1,000-row round's probe), so this count is complete however many events the host has.
    const binned = await mustQuery(
      admin
        .from("events")
        .update({ deleted_at: new Date().toISOString() })
        .eq("host_id", userId)
        .is("deleted_at", null)
        .select("id"),
      "binHostedEvents: operator",
    );
    return (binned ?? []).length;
  }

  const supabase = await createClient();
  // Every live event, whole, by keyset (the 1,000-row round): one read stopped at 1,000, and the
  // events past it stayed live on an account that had asked to be deleted until the sweep got there.
  // Read in full BEFORE the first soft-delete, so binning never shifts a page under the read.
  const { rows: live } = await readAllPages(
    "binHostedEvents: self",
    (after: string | null, limit) => {
      let query = supabase
        .from("events")
        .select("id")
        .eq("host_id", userId)
        .is("deleted_at", null)
        .order("id", { ascending: true })
        .limit(limit);
      if (after) query = query.gt("id", after);
      return query;
    },
    (row) => row.id,
  );
  let binned = 0;
  for (const { id } of live) {
    const result = await softDeleteEvent(id);
    if (result.ok) binned += 1;
  }
  return binned;
}

/**
 * Lock the auth user out for good. Best-effort but LOUD: the sweep still deletes
 * the row, so a failure here is a window, not a leak, and refusing an accepted
 * deletion over it would be the worse trade.
 */
async function banAuthUser(userId: string): Promise<void> {
  const { error } = await createAdminClient().auth.admin.updateUserById(
    userId,
    {
      ban_duration: DELETION_BAN_DURATION,
    },
  );
  if (error) {
    captureError("account", error, {
      step: "account_deletion_ban",
      user_id: userId,
    });
  }
}

// ── The /account reads ──────────────────────────────────────────────────────
//
// This is the account surface's ONLY db module, so the few small reads its forms
// need live here beside the writes they pair with rather than in a queries file.
// `newsletter_signups` is a DENY-ALL table (operator/service-role only), so its
// read and its write both go through the admin client, after getUser() has
// established WHOSE address we are allowed to look at.
//
// ★ THE SWITCH REMOVES WHAT IT READS (crumbs-33, from identity-email). The row
// follows the account's address through an email change (the trigger moves it,
// 20261001110000), and both the read and the removal ask for the address in the
// list's own stored form, lower case and trimmed (capture_guest_email writes it
// so), so a profile's address in another case can neither hide its row from the
// switch nor leave it behind.

/** An address as the list stores it. */
function listForm(email: string): string {
  return email.trim().toLowerCase();
}

/** Delete every signup row for an address. Returns how many rows went. */
async function deleteNewsletterSignups(
  email: string | null | undefined,
): Promise<number> {
  if (!email?.trim()) return 0;
  const removed = await mustQuery(
    createAdminClient()
      .from("newsletter_signups")
      .delete()
      .eq("email", listForm(email))
      .select("id"),
    "deleteNewsletterSignups",
  );
  return (removed ?? []).length;
}

/**
 * Is the signed-in account's address on the newsletter list? Drives the
 * /account marketing switch, which reads ON when either this is true or the
 * account's own `marketing_opt_in` flag is set.
 */
export async function isOnNewsletterList(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const profile = await mustQuery(
    supabase.from("profiles").select("email").eq("id", user.id).maybeSingle(),
    "isOnNewsletterList: email",
  );
  if (!profile?.email?.trim()) return false;

  const rows = await mustQuery(
    createAdminClient()
      .from("newsletter_signups")
      .select("id")
      .eq("email", listForm(profile.email))
      .limit(1),
    "isOnNewsletterList: signups",
  );
  return (rows ?? []).length > 0;
}

/**
 * How many live events the signed-in host would lose. Drives the delete card's
 * consequence line, so the dialog names a real number rather than a vague "your
 * events". RLS-scoped: the count can only ever be the caller's own.
 */
export async function countMyLiveEvents(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  return mustCount(
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("host_id", user.id)
      .is("deleted_at", null),
    "countMyLiveEvents",
  );
}

/**
 * Take the signed-in account's address off the newsletter list. This is the
 * self-serve half of the privacy policy's removal promise (the `privacy@` route
 * stays for addresses with no account). Authorized by getUser(); the delete
 * itself is service-role because the table is deny-all.
 */
export async function removeMyNewsletterSignup(): Promise<
  { ok: true; removed: number } | { ok: false; message: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in and try again." };

  const profile = await mustQuery(
    supabase.from("profiles").select("email").eq("id", user.id).maybeSingle(),
    "removeMyNewsletterSignup: email",
  );
  // Own-row RLS gives us the caller's verified address; we never take one from
  // the client, so this can only ever unsubscribe the caller themselves.
  const removed = await deleteNewsletterSignups(profile?.email);
  return { ok: true, removed };
}
