/**
 * Account-level writes: the deletion request, and the newsletter removal the
 * privacy policy promises.
 *
 * THE DELETION REQUEST is immediate and has no undo (Will, 2026-09-02). It runs
 * in a deliberate order, and the order is the design:
 *
 *   1. read the profile (idempotency + the address the later steps need)
 *   2. CANCEL THE SUBSCRIPTION, and abort the whole request if Stripe refuses.
 *      "Account gone, card still charged" is far worse than "try again", and at
 *      this point nothing has been destroyed.
 *   3. stamp `deletion_requested_at` -- THE POINT OF NO RETURN. From here the
 *      daily sweep (lib/lifecycle/account-deletion.ts) is authoritative and will
 *      finish the job even if this request dies mid-way, which is exactly why
 *      the stamp comes before the destructive steps rather than after them.
 *   4. soft-delete every hosted event into the existing 30-day bin
 *   5. remove the address from the newsletter (BEFORE step 6 nulls it: the sweep
 *      cannot re-derive an address it can no longer read)
 *   6. remove the avatar object, then anonymise the profile
 *   7. ban the auth user so nobody can sign back into a half-deleted account
 *
 * ★ NOTHING HERE WRITES AN ENTITLEMENT COLUMN. `tier` / `storage_cap_bytes` /
 * `stripe_*` / `event_slots` / `tier_expires_at` belong to the Stripe webhook
 * (billing-caps.md), which downgrades the row when our cancellation is
 * delivered. See ANONYMISED_PROFILE_PATCH for the exact shape.
 *
 * ★ THE CALLER AUTHORIZES. This module takes a user id and does the work; the
 * /account server action re-verifies the password or an email code first, and
 * the /admin/accounts/[id] action goes through requireAdminAction() (admin +
 * AAL2). Never call it from anywhere that has not done one of those.
 */
import "server-only";

import { softDeleteEvent } from "@/lib/db/mutations/events";
import { mustQuery } from "@/lib/db/must-query";
import {
  ANONYMISED_PROFILE_PATCH,
  isDeletionSchemaMissing,
} from "@/lib/lifecycle/account-deletion";
import { captureError } from "@/lib/observability/sentry";
import {
  cancelSubscriptionForDeletion,
  type SubscriptionCancelResult,
} from "@/lib/stripe/account-cancel";
import { createAdminClient } from "@/lib/supabase/admin";
import { removeAvatar } from "@/lib/supabase/avatar-storage";
import { createClient } from "@/lib/supabase/server";

/**
 * A century, in the `ban_duration` string GoTrue expects. Banning is how the
 * auth user is locked between the request and the sweep: the profile is
 * anonymised and the events are binned, so signing back in would land someone
 * on a wrecked account they could still create events with. There is no unban
 * path in the product, by ruling.
 */
const DELETION_BAN_DURATION = "876000h";

export type AccountDeletionRequest = {
  userId: string;
  /**
   * "self" routes the event soft-deletes through the existing RLS mutation
   * (softDeleteEvent), which is the audited host path. "operator" cannot use it
   * (RLS scopes it to the caller's own events), so that arm writes the identical
   * patch with the service-role client. Both fire the same set_event_purge_at
   * BEFORE trigger, so the bin behaves identically either way.
   */
  actor: "self" | "operator";
};

export type AccountDeletionResult =
  | {
      ok: true;
      /** The account was already queued; this call changed nothing. */
      alreadyRequested: boolean;
      eventsBinned: number;
      newsletterRemoved: number;
      subscription: SubscriptionCancelResult;
    }
  | {
      ok: false;
      code: "not_found" | "not_provisioned" | "subscription" | "unknown";
      message: string;
    };

type DeletionProfileRow = {
  id: string;
  email: string | null;
  stripe_subscription_id: string | null;
  deletion_requested_at?: string | null;
};

export async function requestAccountDeletion({
  userId,
  actor,
}: AccountDeletionRequest): Promise<AccountDeletionResult> {
  const admin = createAdminClient();

  // 1. Read the profile. Selecting deletion_requested_at is also the migration
  // pre-flight: if the column is not live yet this fails HERE, before Stripe is
  // touched, so a pre-apply attempt destroys nothing.
  let profile: DeletionProfileRow | null;
  try {
    profile = (await mustQuery(
      admin
        .from("profiles")
        .select("id, email, stripe_subscription_id, deletion_requested_at")
        .eq("id", userId)
        .maybeSingle(),
      "requestAccountDeletion: profile",
    )) as DeletionProfileRow | null;
  } catch (error) {
    if (isDeletionSchemaMissing(error)) {
      return {
        ok: false,
        code: "not_provisioned",
        message: "Account deletion isn't available yet. Please try again later.",
      };
    }
    throw error;
  }
  if (!profile) {
    return { ok: false, code: "not_found", message: "No such account." };
  }
  if (profile.deletion_requested_at) {
    return {
      ok: true,
      alreadyRequested: true,
      eventsBinned: 0,
      newsletterRemoved: 0,
      subscription: { status: "none" },
    };
  }

  // 2. Cancel the plan FIRST and refuse the request if Stripe will not play.
  const subscription = await cancelSubscriptionForDeletion(
    profile.stripe_subscription_id,
  );
  if (subscription.status === "failed") {
    captureError("billing", new Error(subscription.message), {
      step: "account_deletion_cancel",
      user_id: userId,
      subscription_id: subscription.subscriptionId,
    });
    return {
      ok: false,
      code: "subscription",
      message:
        "We couldn't cancel your plan just now, so nothing was deleted. Please try again in a few minutes.",
    };
  }

  // 3. THE POINT OF NO RETURN. Everything after this is finishable by the sweep,
  // so a failure below is captured and reported as a successful request.
  const { error: stampError } = await admin
    .from("profiles")
    // The typing seam: deletion_requested_at is absent from the generated types
    // until the orchestrator regenerates them post-apply.
    .update({ deletion_requested_at: new Date().toISOString() } as never)
    .eq("id", userId);
  if (stampError) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't start the deletion. Please try again.",
    };
  }

  let eventsBinned = 0;
  let newsletterRemoved = 0;
  try {
    eventsBinned = await binHostedEvents(userId, actor);
    newsletterRemoved = await deleteNewsletterSignups(profile.email);
    await removeAvatar(userId);
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
    eventsBinned,
    newsletterRemoved,
    subscription,
  };
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
  const live = await mustQuery(
    supabase.from("events").select("id").eq("host_id", userId).is("deleted_at", null),
    "binHostedEvents: self",
  );
  let binned = 0;
  for (const { id } of live ?? []) {
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
  const { error } = await createAdminClient().auth.admin.updateUserById(userId, {
    ban_duration: DELETION_BAN_DURATION,
  });
  if (error) {
    captureError("account", error, {
      step: "account_deletion_ban",
      user_id: userId,
    });
  }
}

// ── The newsletter removal ──────────────────────────────────────────────────
//
// `newsletter_signups` is a DENY-ALL table (operator/service-role only), so both
// the read and the write below go through the admin client after the caller has
// been authorized. The read lives here rather than in db/queries because this
// track owns exactly one db module; keeping the pair together beats splitting a
// two-function feature across a file the track does not own.

/** Delete every signup row for an address. Returns how many rows went. */
async function deleteNewsletterSignups(
  email: string | null | undefined,
): Promise<number> {
  if (!email) return 0;
  const removed = await mustQuery(
    createAdminClient()
      .from("newsletter_signups")
      .delete()
      .eq("email", email)
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
  if (!profile?.email) return false;

  const rows = await mustQuery(
    createAdminClient()
      .from("newsletter_signups")
      .select("id")
      .eq("email", profile.email)
      .limit(1),
    "isOnNewsletterList: signups",
  );
  return (rows ?? []).length > 0;
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
